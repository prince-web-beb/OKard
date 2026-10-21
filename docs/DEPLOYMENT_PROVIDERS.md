# OKard — Replit / Netlify / Google provider topology

**Status: Source configuration added; live resources and deployments NOT provisioned or verified.**
**Decision:** Replit primary full-stack; Netlify alternate frontend; Google Cloud secondary backend. **OpenRouter is the primary AI gateway; Google Gemini is the secondary AI fallback.**

## Deployment roles (keep these separate)

| Layer | Primary | Secondary / alternative | What currently exists |
|---|---|---|---|
| Android-first SvelteKit frontend | **Replit** Node SSR | **Netlify** SvelteKit SSR | Source adapters and build config, NOT deployed |
| Hono API | **Replit** local backend on 3001 behind web proxy | **Google Cloud Run** standalone API | Hono base endpoints and Dockerfile, NOT deployed |
| Website API routing | Replit SSR `/api/*` -> localhost:3001 | Netlify SSR `/api/*` -> configured `OKARD_API_URL` (Google Cloud Run or separate public Replit API) | Source proxy exists, integration NOT live-verified |
| Background jobs | Replit workspace / separate reserved compute later | Google Cloud task/worker service later | Worker entry point ONLY; no BullMQ queue connected |
| Persistent database | PostgreSQL service chosen after procurement | Cloud SQL PostgreSQL option | NOT CONNECTED; do not save user files/projects yet |
| Files | Private S3-compatible storage adapter | Google Cloud Storage adapter later | NOT CONNECTED |
| AI assistant | **OpenRouter primary gateway** (server-only source added) | **Google Gemini secondary** (transient fallback) | Gateway library exists with mock tests; no live AI endpoints, keys or paid calls |
| Backups / DR | Dedicated backup strategy and provider | Cross-provider copies only after legal/data residency review | NOT IMPLEMENTED |

`DEPLOY_TARGET` selects the **web adapter**, not user identity or cloud failover. `OKARD_API_URL` selects the backend for SSR. Never hard-code actual API hostnames or keys into the shipped client bundle.

## Authenticated cloud design service — staged source (still disabled)

The codebase now includes a **PostgreSQL project service with owner-scoped RLS**, atomic read/write quotas, audited mutations and optimistic ETag versioning. The Hono endpoints are feature-gated by `OKARD_CLOUD_PROJECTS_ENABLED=false` plus trusted issuer/audience/JWKS/DATABASE_URL secrets. The browser has an OIDC-PKCE account route and explicit local-to-cloud backup/download controls; **none are connected to a real issuer or database yet**.

These are **not** deployed authentication, registered clients, working project synchronization or persistent image storage. Real issuer provisioning, Postgres migration, separate app role, TLS, WAF protection, migration/rollback, backup/restore and browser/Android verification are required before enabling. See `docs/CLOUD_AUTH_SYNC_IMPLEMENTATION.md`.

## Replit — primary full-stack

1. Import/sync the private GitHub repository into Replit **as the user intended to do personally**. The agent must not overwrite other Replit apps.
2. Choose Node.js 22+ compatible environment. `corepack enable` then `corepack pnpm install --no-frozen-lockfile`. As soon as an online environment can generate the lockfile, **commit the lockfile and use --frozen-lockfile everywhere**.
3. Replit dev command: `corepack pnpm dev`; production: `corepack pnpm build && corepack pnpm start`.
4. The orchestrator runs SvelteKit on public `PORT` (default 3000) and Hono on private `API_PORT=3001`. Never expose port 3001 to the world without complete authorization/rate limits. Only the frontend web port is forwarded in `.replit`.
5. `/api/v1/meta` and `/api/v1/card-families` are real read-only metadata. Health endpoints: API `/health/live` and `/health/ready`; readiness intentionally reports **foundation-only**, not full production readiness.
6. Add domain only after HTTPS, privacy checks, authentication and session/CSRF policy. Avoid unsafe temporary production with personal photo storage.
7. Bind actual Replit secrets in Replit Secrets; never embed them in `.replit` or GitHub files.

**Replit deployment verification required:** install, build, server binds, same-origin proxy, reload routes, Android browser, logs, restart/recovery. Not claimed complete.

## Netlify — alternative SSR web deployment

1. Connect the same GitHub repo in Netlify (do not fork into a separate codebase). Root `netlify.toml` sets `DEPLOY_TARGET=netlify`, build command, and publish folder.
2. **Set site environment variable `OKARD_API_URL` to a reachable HTTPS Hono API** in the Netlify UI before deployment. A private Replit port 3001 **cannot** be called from Netlify; deploy a separate public secured API or use Google Cloud Run.
3. Keep secrets in Netlify's environment settings; never `PUBLIC_`, `VITE_` or TOML for confidential credentials.
4. Netlify SvelteKit adapter renders server-side routes; don't add an SPA catch-all redirect or attempt to invoke Replit-only file paths.
5. SSR API proxy blocks malformed paths, external redirects, non-HTTPS remote API URLs, oversized bodies, and returns 503 when unconfigured.
6. Add deploy previews after setting safe non-production API URL; don't test against live personal member records.
7. Route cookies/auth/session design through consistent trusted domains and backend policies **before enabling login**. Current proxy does not imply authentication is finished.

**Netlify verification required:** no auth leakage, actual SSR deployment, API upstream setting, test HTTP headers, mobile navigation, performance, route refresh, API outage UI. Not claimed complete.

## Google — secondary compute and future Gemini fallback

### Google Cloud Run Hono API
- Deploy the **same apps/api** package, not a different fork. `apps/api/Dockerfile` builds the shared package and API from monorepo root.
- The container accepts `PORT` from Cloud Run (e.g. 8080), while Replit uses `API_PORT=3001`.
- Build sample: `docker build -f apps/api/Dockerfile -t okard-api .`.
- The sample `infra/google/cloudrun-api.example.yaml` is a reference: set a real immutable image digest, runtime identity, HTTPS ingress, IAM, WAF/rate limits, private database/storage connectivity, logging, alerting and quotas before deploy.
- **No deployed Cloud Run URL or project is assumed.** Ask owner/team for actual destination when starting deployment.
- For public browser-facing domains, place an authenticated/gated edge in front of the API. Metadata routes alone do not justify exposing future member mutations.

### AI routing: OpenRouter primary, Google Gemini secondary
- **OpenRouter is the first AI provider.** The server-only `@okard/ai-gateway` package posts to OpenRouter chat completions using `OPENROUTER_API_KEY` and explicitly selected `OPENROUTER_MODEL`.
- **Google Gemini is the second AI provider**, used only on permitted transient OpenRouter failures when `AI_FALLBACK_ENABLED=true`, `GOOGLE_GENERATIVE_AI_API_KEY` and `GOOGLE_MODEL` are configured.
- The provider gateway is **implemented in source** but exposed to no public AI route, since authorization, quota and audit have not yet shipped.
- Do not ship Google's secret to the client. User must approve any structured scene-graph edits. AI failure must never break manual editing.
- Secondary provider is **not automatically live** until configured, validated, rate-limited and billed safely.

## No accidental failover

DNS, database replication and cross-cloud object storage are **not** automatically handled by a secondary deployment. Explicitly define health gates, read/write ownership, replication lag, recovery point objectives and reconfiguration playbooks before calling any provider a production failover. Avoid writing projects concurrently to unrelated databases.

## Developer quick start

    corepack enable
    corepack pnpm install --no-frozen-lockfile
    corepack pnpm build
    corepack pnpm check
    corepack pnpm test
    corepack pnpm dev

Open `http://localhost:3000` (Replit externally maps its web port). Visit `/lab` for local code-rendered design study; supply your own photo at runtime (browser only). API read-only metadata: `http://localhost:3000/api/v1/meta`.

## Required env vars and trust boundaries

| Variable | Set in | Purpose |
|---|---|---|
| `DEPLOY_TARGET` | Server build | `replit`, `netlify`, `google-cloud` |
| `PORT` | Node web or Cloud Run API | Public web port; Cloud Run service sets server port |
| `API_PORT` | Replit server | Internal API listener |
| `OKARD_API_URL` | SSR runtime only | Fixed API origin for trusted reverse proxy |
| `DATABASE_URL` | API/worker secrets only, once built | Persistent storage |
| `REDIS_URL` | API/worker secrets only, once built | Queue/cache |
| `GOOGLE_CLOUD_PROJECT` | Google service identity or CI | Secondary cloud account |
| `OPENROUTER_API_KEY` + `OPENROUTER_MODEL` | AI server secrets only | PRIMARY AI model gateway, no default model slug |
| `GOOGLE_GENERATIVE_AI_API_KEY` + `GOOGLE_MODEL` | AI server secrets only | SECONDARY Gemini AI gateway on transient failure |
| `AI_FALLBACK_ENABLED` | AI server settings | Explicit fallback switch, disabled until budgets/auth ready |
| `AI_REQUEST_TIMEOUT_MS` / `AI_MAX_OUTPUT_TOKENS` | AI server settings | Per-call bounded provider time and output |

## Outstanding release blockers

- [ ] Generate and commit pnpm-lock.yaml; switch all installs to frozen.
- [ ] Validate the Replit `.replit` config and deploy in an actual Replit app.
- [ ] Validate SvelteKit SSR Netlify adapter, host and proxy in an actual Netlify preview.
- [ ] Build and validate Dockerfile and Cloud Run endpoint in a Google project.
- [ ] Add proper authentication, DB, asset storage, background queue and compliant issuer rules.
- [ ] Finish AI integration: typed OpenRouter/Gemini adapter exists with mock tests; authenticating endpoints, policies, quotas, live model calls and scene edit approvals are NOT live. See `docs/AI_PROVIDER_ROUTING.md`.
- [ ] Test on real Android devices and check actual bundle/performance.
- [ ] Establish DNS, data custody, security and backup policy before production.
