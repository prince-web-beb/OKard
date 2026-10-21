# OKard Creator — AI Session Handoff & Execution Protocol

**Last refreshed:** 2026-10-21
**Source repository:** prince-web-beb/OKard
**Default branch:** main
**Current phase:** Track 00.1 SOURCE IMPLEMENTED; package installation/build/tests and deployments NOT VERIFIED.
**Implementation next item:** Complete Track 00.1 verification: lockfile, CI startup_failure, Replit build and real Android checks.
**Architecture authority:** docs/OKARD_MASTER_IMPLEMENTATION_PLAN.md
**Deployment authority:** docs/DEPLOYMENT_PROVIDERS.md and ADR 0001

## 2026-10-21 — OPENROUTER PRIMARY MODEL DIRECTIVE AND IMPLEMENTATION

- **OpenRouter is primary for every OKard AI design call; Google Gemini is secondary fallback.** Replit remains primary frontend/backend host, Netlify alternative frontend, Google Cloud Run alternative API hosting.
- Implemented `packages/ai-gateway/src/index.ts`: server-only configurable OpenRouter POST chat completions, direct Gemini generateContent secondary, typed normalized text/token result, bounded prompts/output/timeouts, fallback on retryable network/408/429/5xx/invalid response only, no fallback on 400/401/403/unconfigured primary.
- Added `packages/ai-gateway/tests/gateway.test.mjs` (8 cases), package config, API factory `apps/api/src/ai.ts`, Hono read-only safe provider metadata (no key exposure), root dev build dependency and Google Cloud API Docker support. No public AI endpoint and no paid AI calls without authentication/quotas/consent/audit.
- Added `docs/AI_PROVIDER_ROUTING.md` + ADR 0002 and server-only `OPENROUTER_API_KEY`/`OPENROUTER_MODEL` + `GOOGLE_GENERATIVE_AI_API_KEY`/`GOOGLE_MODEL` example vars.
- Local self-contained gateway compiled with TypeScript 5.8.3 and passed 8 synthetic Node 22 tests. GitHub CI remains `startup_failure`; **committed full monorepo build not verified**; no live provider secrets or cloud deployment tested.
- Replit exact app-name lookup `OKard` found no connected Replit application at this checkpoint; the owner intends to sync GitHub into Replit themselves.
- **Next task:** online dependency install and lockfile, full typecheck/build/test, investigate GitHub Actions workflow startup failure, run authenticated/quota architecture before any real billable AI endpoint. Do not mark Track 00 or Track 10 complete yet.
- **Mandatory:** inspect actual current repository commits, progress checklist and provider docs before new edits; don't confuse Google hosting with Google as second model provider.

## 2026-10-21 — SCENE GRAPH AND EDITOR IMPLEMENTATION HANDOFF

**Current source checkpoint:** `packages/design-schema/src/index.ts` and `packages/render-engine/src/index.ts` are now committed. `apps/web/src/routes/lab/+page.svelte` uses these packages instead of its old hard-coded SVG design; `apps/web/src/app.css` supplies Android controls. The lab supports editable front/back `CardDocument` revisions, HAMAD three original styles, local photo for main+faded background, switch side, select/change text and numeric coordinates, undo/redo, portable SVG export and JSON save/restore of scene structure. Uploaded photos are excluded from JSON and remain browser-only.

**Additional files:** `packages/design-schema/tests/document.test.mjs`, `packages/render-engine/tests/renderer.test.mjs`, two package manifests/tsconfigs, `docs/SCENE_GRAPH_IMPLEMENTATION.md`. Web package now references both workspace libraries.

**Not yet verified:** No npm registry access from assistant runtime and GitHub Actions produces `startup_failure` before jobs. No full `pnpm install/build/check/test`, no current browser/Android test and no Replit deployment. Do not claim templates/rendering production ready. No real authenticated persistence or printing/issuing/payment code; no public paid AI endpoint.

**Next exact tasks:** On a network-enabled Replit workspace (owner syncs), install, generate committed `pnpm-lock.yaml`, run build/check/tests, fix errors, test `/lab` at Android widths and inspect SVG export. Then continue Track 03 missing node primitives/canonical migration, Track 04 touch handling, Track 05 text and export parity, while keeping provider order **OpenRouter primary / Google Gemini secondary**. Update this handoff and tracker after each verified step.

## 2026-10-21 — VALIDATION AND SVELTE PROXY FIXES

- New schema command layer was corrected to **JSON-roundtrip clone** validated scene documents instead of `structuredClone` on Svelte 5 reactive Proxy objects (which would throw `DataCloneError`). A regression test was added for proxy-based edits.
- SVG XML escaping was corrected for TypeScript strict indexing. Browser integration tests now cover rendered front/back, scene roundtrip and escaped input. The lab also validates/imports local design JSON (images intentionally excluded).
- Added `.github/workflows/dispatcher-probe.yml` and `docs/CI_RECOVERY.md` to diagnose GitHub's **synthetic BuildFailed/startup_failure, zero-job** behavior. Running it requires a manual Action trigger by the owner/team; no Actions job was successfully allocated as of this handoff.
- Runtime tests and Android checks **still not verified**. **Do not mark Track 00.1, 03, 04 or 05 verified.**
- Next: Replit sync by owner, online pnpm install and lockfile, build/check/test, fix failures, screenshot and Android interaction checks, then progress ledger. OpenRouter primary and Google Gemini secondary remain unchanged.

## 2026-10-21 — TOUCH INTERACTION AND LOCAL DRAFT CHECKPOINT

**Latest new source:** `packages/editor-engine` contains pure verified gesture math (screen-to-mm, grid snapping, bounds, pinch pan/zoom); `packages/render-engine` adds interactive-only SVG hit attributes/selection outline; `packages/design-schema` now supports rectangle/text insert, resize, rotate, color, lock, reorder, duplicate and remove. `apps/web/src/routes/lab/+page.svelte` now has actual one-finger or mouse drag, two-finger pinch/pan, keyboard-friendly numeric property inspector, add text/shape, undo/redo, and explicit local-only save/restore/delete. Browser portrait assets remain session-only. The `apps/web` package and root dev script declare/build the new editor package.

**Evidence:** Standalone matching editor-engine TypeScript compiled with local `tsc 5.8.3` and four Node 22 mock/unit tests passed. Full SvelteKit/monorepo build, real Android E2E, CI and provider deployments are still **unverified**. All track-level progress boxes remain open. Files `docs/ANDROID_EDITOR_TOUCH_IMPLEMENTATION.md` and `docs/CI_RECOVERY.md` contain QA steps.

**Exact next:** Replit sync (no editable OKard app found on connected Replit), install packages with network, generate `pnpm-lock.yaml`, run `pnpm build && pnpm check && pnpm test`, fix any compile issues, verify touch/zoom/export and local drafts on actual Android, and document observed results. Then build authenticated project persistence, asset library, advanced touch handles and all card families. Preserve OpenRouter PRIMARY and Google Gemini secondary model routing, Replit primary hosting, Netlify alternative frontend and Google Cloud Run secondary API.

## 2026-10-21 — CI STATUS UPDATE AFTER TOUCH-EDITOR COMMITS

**GitHub Actions state changed:** later OKard pushes now instantiate a named `typecheck-build-tests` job and end with `conclusion: failure` rather than solely synthetic `startup_failure`. Attempt to retrieve steps returned an empty array and GitHub job-log retrieval returned `BlobNotFound`. We **cannot identify the failing command or claim tests ran**. Representative run: https://github.com/prince-web-beb/OKard/actions/runs/39638284240. Keep CI and full monorepo verification **BLOCKED** until logs or a Replit online build are available; see `docs/CI_RECOVERY.md`.

## User intent, in plain language

The owner wants **OKard Creator**, an original billion-dollar-quality **card creator website**, not an AI image-making chat and not just a HAMAD card. It must create, edit, save, reuse, preview and export many kinds of **front-and-back physical and digital private-brand cards** with high-end luxury design. A specific inspiration is previous portrait-heavy metallic marriage-member card front/back artwork; the actual platform must reproduce this quality through **code-based editable designs**. The owner studies visual designs first before implementing new kinds of card features. The owner specifically said **NO Next.js** and **Android must be first-class from day one**. Modern, stable programming tech, animation, professional layout, international references, AI tools in the roadmap, admin controls, no shortcuts, no fake workflows or unimplemented buttons.

The previous design concept, “HAMAD Identity Card”, is a **private HAMAD brand identity product, not a government ID, and not a normal membership card**. The owner supplied a man's photo during prior conversation; **do not commit that photo to GitHub or assume it exists in the repo**. The required composition has a visibly clear foreground photograph and a second controlled-opacity version inside the background without retouching the face/clothing. Three initial thematic types: Royal Signature (black-gold), Future Identity (obsidian/silver-blue), Imperial Edition (ivory/navy-gold); each requires front and back.

Important: the owner asked to **stop using ChatGPT image output** and build a reusable creator **in code**. Do not generate random card images as a substitute for implementation. Design previews should eventually come from the real editor renderer.

## Current verified repo actions and history

1. User created new **private** repo: prince-web-beb/OKard.
2. Assistant confirmed it was empty and created README.md on main (commit 8545d77c8ea42a3fa1bb3c09ee08566734ed3904).
3. Assistant created docs/OKARD_MASTER_IMPLEMENTATION_PLAN.md (commit f70de0b87b36edc37a1ac938595121e40708ae14).
4. Assistant created docs/IMPLEMENTATION_PROGRESS.md (commit c458abdcac5f14a133d6a1e24b396ea9b299f013).
5. This handoff file is then committed.

**Do not tell the owner that the product, full editor, or deployment is complete.** Foundation source and an interactive preview now exist, but build/install/browser checks have not been executed.

## Must-read order for future agent

1. README.md.
2. docs/OKARD_MASTER_IMPLEMENTATION_PLAN.md — extensive architecture, card families, tech choices, data schema, front/back renderer, worldwide reference model, security, accessibility, print, AI, launch gates.
3. docs/IMPLEMENTATION_PROGRESS.md — 19 tracks and granular checkbox ledger. Unchecked means not verified.
4. docs/AI_SESSION_HANDOFF.md — current continuation status.
5. Actual repository commits/tree/CI/workflows, then any ADRs, before editing.

## Architecture locked unless an ADR is approved

- SvelteKit 2 + Svelte 5 + TypeScript + Vite, Tailwind v4 design system. Not Next.js. **Replit primary full stack, Netlify alternative SSR frontend, Google Cloud Run secondary API, Gemini future AI secondary**; see provider ADR.
- Hono TypeScript API and separate TypeScript background workers.
- PostgreSQL/Drizzle, Redis/BullMQ, secure S3-compatible asset storage.
- Canonical versioned JSON scene graph, measurement in mm, SVG-first editable cards and server-authoritative rendering/export.
- Realistic mockups are previews; the print artwork is flat and precise.
- Auth, data governance, brands, card families and countries are server-configurable.
- AI provider gateway recommends user-approved scene edits, not opaque flattened card images.
- Automated tests and actual Android browsing must validate every claimed feature.

## Work instruction for the NEXT session

**Continue and verify Track 00.1** without re-planning the product:

1. Verify repo, main branch, current files and latest commits.
2. Validate compatible stable package versions and licenses before pinning.
3. The initial monorepo, SvelteKit shell, Hono API, worker entry point, shared TS contracts, source tests and initial CI are now committed. **First run** `pnpm install` in a network-enabled Replit/CI environment, generate+commit lockfile, then build/check/test and fix actual errors.
4. Source includes an Android-first landing shell and `/lab` SVG front/back photo preview. Verify all browser states, fix defects; this is **not a persisted editor**.
5. Implement no user-facing deceptive credential replication or mock financial-card functions.
6. Test install/build/typecheck/test. Run available browser/device checks; if unavailable, explicitly say NOT TESTED.
7. Update tracker with evidence/commits and this handoff with accurate exact next steps.
8. Provide user an honest concise implementation report linking the repo commits/files and any blockers.

## Session template to append after every change

### YYYY-MM-DD — session worklog
- Goal / tracker items:
- Actual repo branch and SHA:
- New/edited/deleted files:
- Behavior working:
- Tests run and precise output:
- Android verification (device/resolution/browser):
- Security/accessibility checks:
- Deployment state:
- Limitations and unimplemented screens:
- Open defects:
- Next tracker item:
- Decision records updated:

## Watch-outs from earlier conversations

- The owner dislikes “jam-packed” admin/mobile UIs: one full-screen Android work area per major editor task, predictable back navigation and reachable controls.
- Do not reintroduce unwanted Next.js.
- The owner wants realistic enterprise visual quality: dark ornamental textures, metallic foil simulation, cinematic transitions *without* harming performance/accessibility.
- Keep frontend motion reusable through design tokens and animation primitives; do not sprinkle bespoke long blocking CSS animations everywhere.
- Country “reference type” means localization and original design inspirations for global audiences; never generate official document replicas or imply card is a legally accepted credential.
- Never invent QR, phone, email, website, payment status or live verification from a decorative mockup. Bind to actual issuer-controlled flows when implemented.
- No personal biometric images in seed data, source control or publicly shared preview URLs.
- Keep audit/mark-done/checkpoint discipline. New chats must be able to continue from files alone.

## Release truth table

| Item | Reality at this handoff |
|---|---|
| GitHub repository | Created by user, available to integration |
| Master plan | Written and committed |
| Full progress checklist | Written and committed |
| AI handoff document | Written and committed |
| SvelteKit app | Source added; not runtime-verified |
| Hono API and worker | Hono metadata routes and worker placeholder source added; not runtime-verified |
| Editor / card templates | Nonpersistent `/lab` HTML/SVG design study only; real editor not started |
| Country references | Not started |
| AI tools | Not started |
| Billing / verification / export | Not started |
| Android testing | Not performed |
| Production deployment | Not performed; `.replit`, `netlify.toml`, Google Docker/manifests are config samples |

## 2026-10-21 — foundation/source checkpoint

- **GitHub main commits:** `8061eef` scaffold + API + contracts + CI; `279fe7b` Svelte app/lab and deployment files; `cfdb22d` premium CSS; `11f6b41` shared-contract dev build startup; `e3a5230` secure raster-only preview file input.
- **Files of note:** `package.json`, `pnpm-workspace.yaml`, `scripts/orchestrate.mjs`, `apps/web/src/routes/+page.svelte`, `apps/web/src/routes/lab/+page.svelte`, `apps/web/src/app.css`, `apps/web/src/routes/api/[...path]/+server.ts`, `apps/api/src/app.ts`, `packages/shared/src/index.ts`, `.replit`, `netlify.toml`, `apps/api/Dockerfile`, `docs/DEPLOYMENT_PROVIDERS.md`.
- **Static checks done:** GitHub tree listing confirms files; 11 root/package/TS config JSON files parsed successfully.
- **Runtime validation:** NOT DONE. npm registry inaccessible from current assistant execution environment, so dependency install, build, tests, Playwright and Android device verification cannot be claimed.
- **GitHub CI:** three push runs at this checkpoint show `startup_failure` and zero jobs, not test failures. Determine GitHub Actions billing/settings/workflow configuration before relying on CI.
- **Hosting:** Replit app sync/import, Netlify site connection and Google Cloud Run project/deployment are NOT yet done. User said they will sync Replit themselves.
- **Security/privacy:** Only browser-local image preview; no DB, secrets or personal photos committed. Issuance/verification/AI are not enabled.
- **Next exact work:** use online Replit/runner to `corepack pnpm install --no-frozen-lockfile`, commit `pnpm-lock.yaml`, run `corepack pnpm build`, `corepack pnpm check`, `corepack pnpm test`, confirm HTTP services, check Android viewport, fix any errors, and mark Track 00.1 only with evidence.

**First responsible action in any future session: read the actual repo, then execute the next unchecked task.**
