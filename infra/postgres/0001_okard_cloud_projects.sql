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

-- Database role used by the web API should have SELECT/INSERT/UPDATE on
-- okard_cloud_projects, SELECT/INSERT on audit, USAGE on audit sequence,
-- and NO table-level DDL/DROP/DELETE grants.
-- Additional database role RLS for future organization/tenant contexts
-- is a pre-release requirement; all v1 app queries include BOTH issuer and
-- subject and tests confirm no cross-owner data disclosure.

COMMIT;
