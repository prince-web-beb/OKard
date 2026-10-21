-- OKard Creator PostgreSQL project storage v1
-- Run once against a dedicated DB role; do not run DDL from HTTP requests.
-- Only signed-in owner access; never expose this table directly to browser clients.

BEGIN;

CREATE TABLE IF NOT EXISTS okard_cloud_projects (
  id UUID PRIMARY KEY,
  owner_issuer TEXT NOT NULL CHECK(length(owner_issuer) BETWEEN 8 AND 500),
  owner_subject TEXT NOT NULL CHECK(length(owner_subject) BETWEEN 1 AND 200),
  name VARCHAR(90) NOT NULL CHECK(length(btrim(name)) BETWEEN 1 AND 90),
  source_template VARCHAR(100) NOT NULL,
  family VARCHAR(80) NOT NULL,
  design JSONB NOT NULL,
  version INTEGER NOT NULL DEFAULT 0 CHECK(version >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS okard_cloud_owner_idx
  ON okard_cloud_projects(owner_issuer, owner_subject, updated_at DESC, id DESC)
  WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS okard_cloud_project_audit (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  project_id UUID NOT NULL,
  owner_issuer TEXT NOT NULL,
  owner_subject TEXT NOT NULL,
  event VARCHAR(24) NOT NULL CHECK(event IN ('create','save','rename','duplicate','delete')),
  project_version INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS okard_project_audit_owner_idx
  ON okard_cloud_project_audit(owner_issuer, owner_subject, created_at DESC);

-- Distributed per-owner quotas with an atomic time bucket.
CREATE TABLE IF NOT EXISTS okard_cloud_rate_limits (
  owner_issuer TEXT NOT NULL,
  owner_subject TEXT NOT NULL,
  window_start TIMESTAMPTZ NOT NULL,
  kind VARCHAR(8) NOT NULL CHECK(kind IN ('read','write')),
  used INTEGER NOT NULL DEFAULT 0 CHECK(used >= 0),
  PRIMARY KEY (owner_issuer,owner_subject,window_start,kind)
);
CREATE INDEX IF NOT EXISTS okard_cloud_rate_cleanup_idx
  ON okard_cloud_rate_limits(window_start);

-- Defense in depth: even an accidentally unscoped SQL query cannot read or
-- mutate another user's scenes. The API sets both claims using SET LOCAL in
-- each transaction, after validating a signed issuer/audience access token.
ALTER TABLE okard_cloud_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE okard_cloud_projects FORCE ROW LEVEL SECURITY;
ALTER TABLE okard_cloud_project_audit ENABLE ROW LEVEL SECURITY;
ALTER TABLE okard_cloud_project_audit FORCE ROW LEVEL SECURITY;
ALTER TABLE okard_cloud_rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE okard_cloud_rate_limits FORCE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = current_schema()
      AND tablename = 'okard_cloud_projects'
      AND policyname = 'okard_projects_owner_v1'
  ) THEN
    CREATE POLICY okard_projects_owner_v1 ON okard_cloud_projects
      FOR ALL
      USING (
        owner_issuer = current_setting('okard.owner_issuer', true)
        AND owner_subject = current_setting('okard.owner_subject', true)
      )
      WITH CHECK (
        owner_issuer = current_setting('okard.owner_issuer', true)
        AND owner_subject = current_setting('okard.owner_subject', true)
      );
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = current_schema()
      AND tablename = 'okard_cloud_project_audit'
      AND policyname = 'okard_audit_owner_v1'
  ) THEN
    CREATE POLICY okard_audit_owner_v1 ON okard_cloud_project_audit
      FOR ALL
      USING (
        owner_issuer = current_setting('okard.owner_issuer', true)
        AND owner_subject = current_setting('okard.owner_subject', true)
      )
      WITH CHECK (
        owner_issuer = current_setting('okard.owner_issuer', true)
        AND owner_subject = current_setting('okard.owner_subject', true)
      );
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = current_schema()
      AND tablename = 'okard_cloud_rate_limits'
      AND policyname = 'okard_rate_limit_owner_v1'
  ) THEN
    CREATE POLICY okard_rate_limit_owner_v1 ON okard_cloud_rate_limits
      FOR ALL
      USING (
        owner_issuer = current_setting('okard.owner_issuer', true)
        AND owner_subject = current_setting('okard.owner_subject', true)
      )
      WITH CHECK (
        owner_issuer = current_setting('okard.owner_issuer', true)
        AND owner_subject = current_setting('okard.owner_subject', true)
      );
  END IF;
END
$$;

-- Runtime DB role should have SELECT/INSERT/UPDATE on owner-scoped
-- projects and rate_limits, SELECT/INSERT on audit, USAGE on audit sequence,
-- and NO DDL/DROP/table-DELETE or BYPASSRLS privileges.
-- Every app query sets OIDC owner_issuer + owner_subject using transaction-
-- local variables AND explicitly filters by those columns. RLS enforces a
-- second owner boundary even if a future query accidentally drops its filter.
-- Real PostgreSQL multi-user/RLS tests and separate org-tenant roles are
-- mandatory before enabling in production.
-- Purge expired rate-limit buckets only via a separate restricted maintenance
-- role/job, e.g. DELETE FROM okard_cloud_rate_limits
-- WHERE window_start < now() - interval '2 days'; Never grant DELETE to app role.

COMMIT;
