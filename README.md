# OKard Creator

**OKard Creator** is an Android-first, original, code-rendered card design platform in active development. One tool will eventually handle front/back design, private-brand cards, corporate cards, keepsakes, events, loyalty, and other legally issued private card families.

**Deployment architecture:** Replit **primary** for web and backend; Netlify **alternative** web hosting; Google Cloud Run **secondary** API hosting. **OpenRouter is the PRIMARY AI model gateway, Google Gemini is SECONDARY AI fallback** (no paid AI endpoint enabled). No provider is claimed deployed by these source files. **Not Next.js.**

## New: Template Gallery & Shared Studio (source checkpoint)

A new **`/templates`** route now provides **18 original, separate card-family designs**—each with actual front and back derived from the same reusable scene graph. Gallery cards offer vector previews, Flip controls, category/search filtering, and direct **Customize design** links to **`/lab?template=<id>`**. The existing editor opens the selected card, supports family-specific fields, reverse inscription, photo only when applicable, editable layers and local-only drafts. Three original HAMAD editions remain in a dedicated collection.

**Important status:** Source is committed, but gallery build and Android browser checks are not yet proven. These cards are visual concepts, not approved credentials or paid/verified passes. See [Template Catalog Implementation](docs/TEMPLATE_CATALOG_IMPLEMENTATION.md) and [Progress Ledger](docs/IMPLEMENTATION_PROGRESS.md).

## Latest checkpoint — 21 October 2026

**Worldwide phase update:** A reusable `@okard/country-data` package now contains 249 ISO 3166-1 country/territory codes with locale-aware names, BCP 47 formatting and RTL/LTR support. New Android-first `/countries` route provides search and safe design references, with actual `/lab?country=...&locale=...` metadata editing. Country-specific issuer/official ID layouts are **not** replicated. The new country code is committed but full build and Android QA remain unverified. Read `docs/WORLDWIDE_COUNTRY_REFERENCES.md`.


**Source code is now present**, beyond the initial planning documents:

- SvelteKit 2 + Svelte 5 + TypeScript + Vite + Tailwind 4 public site shell.
- Responsive original OKard home with a CSS-based front/back concept and live flip.
- Android-first **/lab** route backed by **@okard/design-schema** (front/back physical-mm document), **@okard/render-engine** (safe SVG) and **@okard/editor-engine** (touch gestures). Three HAMAD editions, one-finger drag, pinch zoom/pan, grid snapping, editable text/shapes, layer size/rotation/color/opacity, locking, duplication, stacking, undo/redo, portrait layers, portable SVG and JSON export/import. Device-only draft save/restore is explicitly user-initiated. No server-side photo upload or account-based persistence.
- Separate TypeScript Hono API containing **real read-only metadata endpoints**, with liveness and an honest `foundation-only` readiness response. No invented member issuance is exposed.
- Same-origin `/api/v1/*` SSR proxy. Netlify can point to a secured external backend using server-only `OKARD_API_URL`.
- Shared TypeScript contracts, separate worker shell, package manifests, unit-test source, CI workflow and sample provider deployment files.
- Server-only **@okard/ai-gateway** with OpenRouter-first chat completions, structured Google Gemini fallback on transient errors, bounded requests, no secret exposure, and eight synthetic/provider-mock test cases; live customer AI endpoints stay disabled.
- **No database, persistent project editor, certified production print export, customer login, production AI, issuance, verification, payments or deployment yet.** The local lab DOES support real SVG and JSON download; do not confuse those with finished production pipelines.

**Verification status:** An isolated, matching touch-engine TypeScript implementation compiled locally and its **four Node tests passed**. Full `pnpm install/build/check/test` and real Android/browser E2E have **not** been executed because this environment cannot reach npm. GitHub Actions now creates a named job but reports failure **without accessible step logs**; see `docs/CI_RECOVERY.md`. Track 00.1 stays **unfinished** until trusted online builds and a lockfile are verified.

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
2a. [GitHub Actions recovery](docs/CI_RECOVERY.md) — changing runner failures, missing job logs, manual diagnostic and Replit build instructions.
2b. [Android touch editor](docs/ANDROID_EDITOR_TOUCH_IMPLEMENTATION.md) — pointer gestures, layer tools, local drafts and real-device verification matrix.
3. [AI session handoff](docs/AI_SESSION_HANDOFF.md) — where each new ChatGPT session continues.
4. [Provider deployment](docs/DEPLOYMENT_PROVIDERS.md) — Replit / Netlify / Google architecture, secrets and deployment steps.
4a. [Reusable scene-engine checkpoint](docs/SCENE_GRAPH_IMPLEMENTATION.md) — code-rendered front/back editing, exports, acceptance tests and honest limitations.
4b. [Worldwide country references](docs/WORLDWIDE_COUNTRY_REFERENCES.md) — 249 ISO records, country atlas, BCP 47 support and QA gates.
5. [Provider ADR](docs/adr/0001-replit-primary-netlify-google-secondary.md) — architectural decision and tradeoffs.
6. [AI provider routing](docs/AI_PROVIDER_ROUTING.md) — OpenRouter primary, Gemini secondary and security controls.
7. [AI routing ADR](docs/adr/0002-openrouter-primary-gemini-secondary.md) — owner provider decision.

## Product safety and privacy

OKard focuses on **original private-brand cards** and authorized organizational uses. It is not an identity verification authority, government credential issuer, or payment-card processor. The code-rendered HAMAD design preview explicitly states it is **not issued and not legal ID**. The user's photo stays local to that preview, is not committed, and disappears when the session is closed. Real asset storage and authentication will undergo separate security work before becoming available.

## Next implementation ticket

Finish **Track 00.1**: validate runtime and package peer compatibility using Replit or an online CI runner, generate and commit `pnpm-lock.yaml`, fix any real compile/tests failures, investigate GitHub Actions `startup_failure`, then record tested behavior and Android checks. After that, proceed to 00.2–00.7 and the remaining tracks. See the tracker, not a chat transcript, for acceptance decisions.
