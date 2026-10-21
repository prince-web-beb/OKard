# OKard Creator

**OKard Creator** is an Android-first, original, code-rendered card design platform in active development. One tool will eventually handle front/back design, private-brand cards, corporate cards, keepsakes, events, loyalty, and other legally issued private card families.

**Deployment architecture:** Replit **primary** for web and backend; Netlify **alternative** web hosting; Google Cloud Run **secondary** API hosting; Google Gemini planned as a **secondary** AI provider. No provider is claimed deployed by these source files. **Not Next.js.**

## Latest checkpoint — 21 October 2026

**Source code is now present**, beyond the initial planning documents:

- SvelteKit 2 + Svelte 5 + TypeScript + Vite + Tailwind 4 public site shell.
- Responsive original OKard home with a CSS-based front/back concept and live flip.
- Android-first **/lab** route: three original HAMAD-style editions, SVG code-rendered front/back artwork, editable display name, and **local-only photo upload** creating a foreground portrait and faded background portrait. Neither uploads nor persists the photo.
- Separate TypeScript Hono API containing **real read-only metadata endpoints**, with liveness and an honest `foundation-only` readiness response. No invented member issuance is exposed.
- Same-origin `/api/v1/*` SSR proxy. Netlify can point to a secured external backend using server-only `OKARD_API_URL`.
- Shared TypeScript contracts, separate worker shell, package manifests, unit-test source, CI workflow and sample provider deployment files.
- **No database, persistent editor, card export, customer login, production AI, issuance, verification, payments or deployment yet.** Do not represent this preview as those features.

**Verification status:** Source files and JSON configs were checked for presence/parseability. Actual `pnpm install/build/check/test` and real Android/browser E2E were **not executed** because this environment cannot reach npm; the GitHub Actions runs are showing **startup_failure**, with zero jobs. Track 00.1 therefore stays **unfinished** until a trusted online CI/Replit runner passes build and tests and a lockfile is committed.

## Quick start (Node 22+, internet for initial install)

```bash
corepack enable
corepack pnpm install --no-frozen-lockfile
corepack pnpm build
corepack pnpm check
corepack pnpm test
corepack pnpm dev
```

Open **http://localhost:3000/** for the homepage, **http://localhost:3000/lab** for the functional design study, **http://localhost:3000/api/v1/meta** for API metadata.

**Production builds:** `corepack pnpm build && corepack pnpm start`. The front-end runs on port 3000 and the internal API on port 3001 in a Replit workspace. To run the secondary site on Netlify, the deployment target must be `netlify` and `OKARD_API_URL` must point to an accessible HTTPS backend. See deployment document for caveats.

## Authoritative project documents

1. [Enterprise master plan](docs/OKARD_MASTER_IMPLEMENTATION_PLAN.md) — functionality, quality contract, international standards and execution tracks.
2. [Implementation progress](docs/IMPLEMENTATION_PROGRESS.md) — granular checklist and verified progress gate. Never mark without evidence.
3. [AI session handoff](docs/AI_SESSION_HANDOFF.md) — where each new ChatGPT session continues.
4. [Provider deployment](docs/DEPLOYMENT_PROVIDERS.md) — Replit / Netlify / Google architecture, secrets and deployment steps.
5. [Provider ADR](docs/adr/0001-replit-primary-netlify-google-secondary.md) — architectural decision and tradeoffs.

## Product safety and privacy

OKard focuses on **original private-brand cards** and authorized organizational uses. It is not an identity verification authority, government credential issuer, or payment-card processor. The code-rendered HAMAD design preview explicitly states it is **not issued and not legal ID**. The user's photo stays local to that preview, is not committed, and disappears when the session is closed. Real asset storage and authentication will undergo separate security work before becoming available.

## Next implementation ticket

Finish **Track 00.1**: validate runtime and package peer compatibility using Replit or an online CI runner, generate and commit `pnpm-lock.yaml`, fix any real compile/tests failures, investigate GitHub Actions `startup_failure`, then record tested behavior and Android checks. After that, proceed to 00.2–00.7 and the remaining tracks. See the tracker, not a chat transcript, for acceptance decisions.
