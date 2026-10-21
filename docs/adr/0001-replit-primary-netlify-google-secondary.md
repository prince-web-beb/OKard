# ADR 0001 — Replit first, Netlify web alternative, Google secondary provider

**Date:** 2026-10-21
**Decision status:** Accepted as an implementation target; no live infra deployment verified.
**Context:** Owner explicitly requested OKard use Replit resources for frontend and backend, Google as a second provider, and Netlify too; no Next.js. A single portable TypeScript codebase is preferred over platform-specific forks.

## Decision

- Primary application host: Replit Node environment running SvelteKit SSR on the public port and Hono behind the same-origin SSR API proxy.
- Alternate frontend: Netlify using the official SvelteKit Netlify adapter. Same GitHub source; API points to a **separately accessible HTTPS** backend.
- Secondary API compute provider: Google Cloud Run, built from the Hono source package and Dockerfile.
- Secondary AI provider: Google Gemini through a **future** safe provider gateway, not a browser API key.
- Project saves, collaboration and issuance will rely on one authoritative data plane until failover/replication is actually built and tested.
- Replit import/sync, Netlify project connection and Cloud Run provisioning are separate owner/team actions; no deployment assumed.

## Consequences

Positive: no Next.js, Replit continuity, same code on all hosts, switchable SSR adapters, clear trust boundary, independently deployed API and web.

Tradeoffs: two production surfaces increase maintenance and session-cookie complexity; separate Cloud Run hosting costs; Replit may have runtime/port limitations; Netlify cannot access internal-only Replit API port. Shared data plane and reverse proxy hardening are required before user accounts/data.

## Validation and revision gate

Proof by Replit preview + Netlify preview + Cloud Run staging, Android E2E, security test and failover manual runbook. If Google means an alternate Google product rather than Cloud Run/Gemini, revisit scope with the owner without discarding provider-neutral adapters.
