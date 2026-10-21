# OKard Creator — Authenticated Cloud Projects & OIDC Integration

**Implementation date:** 21 October 2026  
**Scope:** Cloud persistence foundation + configurable OIDC login + explicit user-directed sync  
**State:** **SOURCE IMPLEMENTED; NOT DEPLOYED, NOT END-TO-END VERIFIED, NOT PRODUCTION ENABLED.**  
**Defaults:** `OKARD_CLOUD_PROJECTS_ENABLED=false`; no real identity provider, database or JWKS has been configured in the connected environment.

## What is now written to the repository

### API: `apps/api/src/cloud-projects.ts`

A fail-closed Hono router under `/api/v1/cloud/projects`:

| Method | Path | Behavior |
|---|---|---|
| GET | `/` | Owner-scoped metadata list, limit 1–50, offset <=10,000. No design scene in list response. |
| GET | `/:id` | Get one private editable project with ETag. |
| POST | `/` | Create a project from a registered source; exact UUID, name, schema validation. |
| PUT | `/:id` | Replace editable scene with exact `If-Match: "<version>"`; rejects stale data. |
| PATCH | `/:id` | Rename with exact `If-Match`. |
| POST | `/:id/duplicate` | Create independent owner-scoped scene copy with new UUID. |
| DELETE | `/:id` | Soft-delete with exact `If-Match` and audit entry. |

Every endpoint requires **Bearer access token**, verified with `jose` using explicitly configured trusted HTTPS JWKS, signature, `iss`, `aud`, `sub`, `iat`, `exp`, max age 1 h, RS256/ES256 and clock skew bounded to five seconds. No password database, unsigned JWT, fake browser session or shared API key.

Backend client-supplied source family must match registered card template ID and exact scene family. Server additionally validates the complete CardDocument before persistence, blocks unsupported image asset IDs, restricts payload to 512,000 bytes and enforces the registered card families. Issuer and subject are derived ONLY from signed access-token claims; a request cannot choose another account's owner.

### Owner-level RLS and distributed quotas — source added

The SQL migration also **enables and FORCEs PostgreSQL row-level security (RLS)** on three tables: projects, audit records, and per-owner quota counters. Every repository method now creates a transaction and supplies verified issuer/subject through transaction-local PostgreSQL configuration keys. They are cleared at COMMIT/ROLLBACK. Owner filters remain in the SQL as a second control. The app role must not have `BYPASSRLS`.

A database-backed per-owner, per-minute quota now runs for every successfully authenticated API request, using an atomic UPSERT guarded by the owner RLS policy: **120 reads/minute or 30 writes/minute per principal**. Quota exhaustion returns **429 + Retry-After: 60**; this is shared between Replit/Cloud Run instances that use the same Postgres DB. Unauthorized-token flood control still requires **separate edge rate limiting**. A restricted scheduled maintenance role must purge expired quota buckets; no such job is deployed.

**These RLS policies and quotas are committed but have NOT been executed against a live PostgreSQL instance or penetration-tested.** Explicit cloud enable remains OFF.

### PostgreSQL: `apps/api/src/cloud-project-store.ts`

- Parameterized SQL for all operations; **owner_issuer AND owner_subject** in every read and mutation condition.
- Transactionally audited changes in `okard_cloud_project_audit`.
- Atomic compare-and-swap versioning for design overwrite, rename and deletion.
- Transactional per-user advisory lock on create/duplicate to enforce the **200 active-project cap** across multiple Cloud Run or Replit instances.
- Soft deletion retains data for controlled future lifecycle handling; does not currently implement full legal erasure workflow.
- Non-local Postgres connections require real TLS certificate verification. Remote `sslmode=disable/prefer/require` settings are deliberately refused; use verified TLS or trusted CA.
- PostgreSQL SQL migration lives at `infra/postgres/0001_okard_cloud_projects.sql`. **Run it with migration credentials, not from public HTTP.**
- Frontend browsing never queries DB directly.

### Server configuration and readiness: `apps/api/src/app.ts`

Cloud API exists only when ALL four conditions are met:

1. `OKARD_CLOUD_PROJECTS_ENABLED=true` in the server environment (defaults to false).
2. `OKARD_OIDC_ISSUER` is a real trusted HTTPS issuer.
3. `OKARD_OIDC_AUDIENCE` and `OKARD_OIDC_JWKS_URL` are explicitly configured.
4. `DATABASE_URL` is provisioned and migrations have run.

Otherwise the full cloud API **returns 503 `CLOUD_NOT_CONFIGURED`** instead of serving anonymous or demo data. The health/readiness route checks schema availability only when opted in; it reports not-ready when DB is unreachable. A working database does not imply identity/provider security review has passed.

### Frontend account: `/account`, `/auth/callback`

- Configurable OIDC Authorization Code + **PKCE** via `oidc-client-ts`.
- Provider secrets, if any, stay server-side. Client obtains an *API access token* from the configured issuer rather than using an ID token belonging to another client.
- Default session storage is browser `sessionStorage` and automatic silent token renew is disabled. A page reload can reuse session only in the same browsing session; signed-out users cannot access cloud.
- Secure authorization callback validates state, nonce and PKCE through the OIDC library. No home-grown password entry or fabricated sign-in status.
- Without public `PUBLIC_OKARD_OIDC_*` settings, account UI clearly says secure sign-in is not configured and still offers local projects.

### Frontend cloud sync: `apps/web/src/lib/cloud-projects.ts` + `/projects`

- Typed cloud requests through **same-origin API proxy**. The proxy strips unrelated web session cookies and forwarded-origin headers, passing only explicit OAuth Authorization.
- **No automatic upload** when signing in. User explicitly chooses **Back up this design to cloud** for an existing device project.
- When matching cloud UUID already exists and scenes/names differ, user sees the server version and must explicitly confirm **Replace cloud version**. The API's ETag CAS still rejects intervening updates. No automatic overwrite of remote changes.
- User chooses **Save to this device** from cloud metadata. If the UUID already exists locally, a **fresh UUID** is generated and the downloaded design becomes a separate local copy rather than overwriting a possible unsaved edit.
- Photos remain session-local and are never uploaded to cloud; only validated text/vector scene documents are sent.
- Signed-in client may request cloud metadata; server still requires configured JWT verification and a database. Cloud UI displays actual 503/409 errors (no simulated success).

## Configuration — provisioned deployments only

```dotenv
OKARD_CLOUD_PROJECTS_ENABLED=false
DATABASE_URL=postgresql://...  # Secret. TLS verify-full remote.
OKARD_DATABASE_CA_CERT=         # Secret PEM when private CA used.
OKARD_OIDC_ISSUER=https://trusted-issuer.example/
OKARD_OIDC_AUDIENCE=https://api.okard.example
OKARD_OIDC_JWKS_URL=https://trusted-issuer.example/.well-known/jwks.json

# Public SPA configuration; NEVER include a client secret in PUBLIC_
PUBLIC_OKARD_OIDC_ISSUER=https://trusted-issuer.example/
PUBLIC_OKARD_OIDC_CLIENT_ID=real-registered-public-client-id
PUBLIC_OKARD_OIDC_AUDIENCE=https://api.okard.example
```

**Issuer must be a provider that issues short-lived RS256/ES256 JWT ACCESS tokens to the configured API audience.** A typical Google OAuth access token for Google APIs is NOT valid for OKard's audience and is not accepted as an OKard API token. Separate Google Gemini AI fallback configuration remains intact and is unrelated to sign-in. No exact auth provider has been chosen by the owner.

Register HTTPS callback URL `https://<OKARD_HOST>/auth/callback`, post-logout URL `https://<OKARD_HOST>/account`, allowed origins and token audience with the selected OIDC provider. Ensure the API uses the EXACT same issuer/audience that the login provider grants to the browser. No implicit flow, password grant, client secret embedded in frontend, or ID-token impersonation.

## Tests in source (not yet executed end-to-end)

- `apps/api/src/cloud-projects.test.ts`: missing/bad auth rejection, exact issuer+subject isolation, 404 for cross-owner access, non-leaking metadata list, 201 create, 409 stale ETag, 428 missing precondition, duplicate, malformed design/source families, invalid IDs/pagination, insecure OIDC config rejection.
- `apps/web/src/lib/cloud-projects.test.ts`: bearer header, validated scene in POST, exact If-Match, stale conflict surfaced without retries, no API calls without access token, reject malformed server scene response.
- Existing `packages/project-library/tests/projects.test.mjs` continues covering local-only projects and etags.

**No claim of passing tests, migrations, real OIDC login, cloud database connection or deployed sync is made here.** GitHub Actions still fails with no retrievable runner-step logs and the connected Replit lookup does not find OKard.

## Pre-release security gates (ALL REQUIRED)

- [ ] Owner chooses an actual OIDC identity provider and authorizes a registered public PKCE client + real API resource/audience.
- [ ] Configure verified HTTPS issuer/JWKS/API audience; test valid, expired, wrong issuer, wrong audience, revoked and rotated JWT keys.
- [ ] Provision dedicated Postgres and least-privileged app role. Run migration using separate role.
- [ ] Add and test **database-level tenant RLS / isolation** as defense-in-depth; the current owner-filtered app SQL is necessary but not sufficient for enterprise launch.
- [ ] Add distributed rate limiting and API-edge limits, especially on unauthenticated token verification attempts and cloud writes; prevent enumeration and DoS.
- [ ] Configure production CSP, security audit of browser token storage and refresh/logout behavior, CSRF as appropriate, HSTS and deployment restrictions.
- [ ] Implement user-driven account data export and actual erasure/purge with audit retention policy and privacy compliance.
- [ ] Add encrypted, access-controlled portrait storage with authorization, signed uploads, malware checks, image deletion and image-rights consent before sync of uploaded photos.
- [ ] Add backup/restore rehearsals, database migration rollback, disaster recovery and dashboards/alerting.
- [ ] Run PostgreSQL integration tests against a live test DB including concurrent limit/ETag tests, cross-owner isolation and schema upgrade.
- [ ] Run `pnpm install --no-frozen-lockfile`, generate/commit lockfile, `pnpm build && pnpm check && pnpm test`, fix all results.
- [ ] Test actual OIDC account redirect and `/projects` explicit cloud backup/download on real Android Chrome + Samsung Internet and desktop.
- [ ] Real Replit application and Netlify/Cloud Run staging deployments, network policy, DB TLS and HTTPS configured.
- [ ] ONLY after passing above: set `OKARD_CLOUD_PROJECTS_ENABLED=true` and update progress evidence.

## Next engineering ticket

**The immediate release blocker is still full compilation and CI diagnostics, not more features.** Request the owner to connect/sync the private GitHub repository into the Replit workspace so a networked builder can run pnpm and capture the real errors. The current GitHub Actions job presents `conclusion:failure` but step/log objects are not available; do not speculate a TypeScript failure without the terminal output.

After that, choose the real identity provider, implement database-level RLS, rate limits, secure portrait objects, tenant organizations and a reviewed operational launch. Leave both AI endpoints disabled pending their own quota/auth/cost gates.

**Original architecture is unchanged:** SvelteKit 2/Svelte 5 + Hono; OpenRouter PRIMARY / Google Gemini SECONDARY; Replit primary full stack, Netlify alternative web, Google Cloud Run alternative API; **no Next.js**.
