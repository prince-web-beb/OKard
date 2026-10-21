# OKard Creator — Device Project Library Implementation & Handoff

**Date:** 21 October 2026  
**Scope:** Track 06/09 client project library, editor integration and Android UX.  
**Status:** Source implemented and GitHub-committed; package installation, build/check/tests, real Android device tests and cloud deployment are **NOT VERIFIED**.  
**Primary objective:** Move beyond one local draft per template to multiple separately editable card projects, without claiming cloud sync.

## Routes / user experience

### `/projects`

- Android-first **My Projects** dashboard using the existing premium OKard design language.
- Create from any of the 18 original card families or any of the 3 HAMAD editions.
- Each new design receives its **own cryptographically random UUID**, distinct from its source template ID.
- Read-only front/back SVG previews from the actual saved `CardDocument`; flip each independently.
- Search **all local project metadata** while lazily loading only the visible designs (12 at a time, 200 total limit) to protect mobile memory.
- Open/edit via `/lab?project=<uuid>`.
- Rename project in an inline editable form, duplicate as an independent project, confirm deletion through a clear inline warning.
- Unavailable local storage generates an explicit error. **The app does not silently pretend an in-memory cache is persistent.**

### `/lab`

- When opened with `?project=<uuid>`, browser `onMount` reads the IndexedDB project, restores its exact front/back scene, selects the matching category, and preserves all normal drag/edit/undo/redo/export tools.
- **Save project on device** writes the active document back to its own record.
- From an unsaved gallery design, **Create a saved project** creates a new record and updates the client URL using SvelteKit shallow routing without discarding an in-memory portrait.
- An optimistic **etag** check rejects stale saves rather than overwriting changes made in another browser tab. Reopen the project to resolve conflicts.
- Switching HAMAD edition or importing an unrelated scene detaches the editor from the prior project, preventing an accidental cross-family overwrite.
- Existing legacy single-slot `localStorage` draft buttons remain separate and are explicitly labeled as such. They are **not** the multi-project database.

## Package: `@okard/project-library`

Source: `packages/project-library/src/index.ts`

Published internal contracts:
- `LocalProject`: document version (1), independent UUID, display name, original built-in template ID, validated `CardDocument`, created/updated timestamps, local etag counter.
- `ProjectListItem`: lightweight metadata for efficient browse/search.
- `ProjectRepository`: `list, get, create, saveDesign, rename, duplicate, remove`.
- `createBrowserProjectRepository()`: IndexedDB `okard-projects` database, v1 schema, `projects` object store keyed by UUID, `updatedAt` index.
- `createMemoryProjectRepository()`: deterministic test adapter; deliberately **not represented as persistent**.
- `createLocalProject()`: creates a validated gallery or HAMAD scene from its registered source.
- `ProjectLibraryError`: typed conflict, not-found, limit, invalid data and storage errors.

### Consistency, security and privacy

- Every saved design passes the original scene schema validation; source-template ID must match the document ID/family, preventing relabeling a staff scene as a private-brand project or vice versa.
- Project identifier is a UUID v4-style secure browser-generated ID; duplicate IDs are rejected.
- Hard cap **200 projects** per browser database; **500 KiB** per scene document; **90-character** project names. These are genuine implemented limits, not marketing copy.
- `etag` compare-and-swap occurs **inside the same IndexedDB readwrite transaction** as the update: concurrent open tabs cannot both overwrite a prior version without a conflict.
- All editor operations use structured, serialized scene JSON and copy-on-write validation. Photos remain session-local object URLs; the repository stores only safe image `assetId` placeholders, **never photo bytes** or external API keys.
- IndexedDB errors are not silently replaced with localStorage; request transaction failures surface to the user.
- SVG rendering now accepts a validated instance-specific ID namespace, so multiple local projects based on the same template cannot collide in browser clip paths.
- No government-issued credentials, simulated live issuer validation, payments, functional QR/access keys or cloud storage/identity checks.
- Browser site data may be evicted or cleared by users/OS. **JSON export remains the only backup** until future encrypted authenticated cloud project storage exists.

## Tests added in source

`packages/project-library/tests/projects.test.mjs` covers:
1. Creating HAMAD and an additional registered family without personal images.
2. Defensive copying and listings.
3. Etag collision/stale tab rejection.
4. Rename, duplicate independent scenes, remove and not-found.
5. Tampered family/source metadata and invalid name/size handling.
6. Browser IndexedDB unsupported errors in Node (without a DOM).

**Testing status:** These tests are **committed but NOT executed in the full pnpm workspace**. An IndexedDB browser integration test or fake-indexeddb adapter is not yet included. We have **not** observed successful device persistence, Android browser rendering, SSR hydration or a deployed application.

## Android QA gate for actual verification

- [ ] Open `/projects` on real Android Chrome and Samsung Internet at 320, 360, 390, 412px, portrait and landscape.
- [ ] Create two projects from the **same template**; both show distinct project IDs and independent card text.
- [ ] Create a HAMAD and an events project. Reopen each in `/lab?project=<uuid>`.
- [ ] Rename in one tab and attempt stale save in a second tab; confirm conflict error instead of silent overwrite.
- [ ] Edit both sides, Save, reload and verify both sides survive.
- [ ] Duplicate, edit duplicate, confirm original unchanged; flip both previews without artboard clip leakage.
- [ ] Search beyond first 12 projects, load more progressively without rendering all 200 scenes.
- [ ] Delete with confirmation, then attempt to open removed project; show not-found rather than a fake blank project.
- [ ] Disable IndexedDB / private browsing data: user sees storage error, not false success.
- [ ] Upload an owned photo; confirm preview and on-demand exported SVG; leave/reopen and verify **the photo is not persisted**.
- [ ] Import/export a saved scene JSON independently of local project storage.
- [ ] Verify keyboard and screen-reader flows; all touch controls at least 44px.
- [ ] Check storage quotas, Android app background/kill, browser site-data eviction and multi-tab navigation.
- [ ] Browser performance profile with 50–200 projects and long names; check list/search and preview loads.

## Known unfinished work (do not mark as complete)

- Real authenticated user account, organizations, permissions and tenant isolation.
- Server-based database/object storage and encrypted cross-device sync; user profile ownership and consent.
- Version history/snapshots, collaborative editing/conflict merge and automatic recovery.
- Cloud template authoring, publication, moderation, workflow approval and brand kits.
- Persistent user photo assets, consent and export packaging; preview photos remain ephemeral.
- Live OpenRouter/Gemini product AI under cost controls, quotas, audit and provider policy; the AI package remains server-only.
- Tested Replit deployments and working CI, Android E2E, real vendor print pipeline and complete access rules.

## Exact next work

1. Owner/team syncs private `prince-web-beb/OKard` into Replit. Current connector lookup has **not found a connected OKard app**.
2. In network-enabled Replit workspace run `corepack enable`, `corepack pnpm install --no-frozen-lockfile`, then `pnpm build && pnpm check && pnpm test`. Commit generated `pnpm-lock.yaml` after successful resolution.
3. Get an actual failing-step log from GitHub Actions `OKard Foundation CI` and fix real errors. Runs are failing with steps/logs unavailable to this connector; see `docs/CI_RECOVERY.md`.
4. Validate `/projects`, `/templates`, `/lab`, `/countries` on Android device and desktop; capture evidence and update progress.
5. Move to **authenticated project service** with server ownership controls, migrations, secure upload/policy engine and data lifecycle; no anonymous public write APIs.
6. Complete template lifecycle and remaining mobile editing improvements, print preflight, and future optional AI editor actions through already-selected **OpenRouter PRIMARY / Google Gemini SECONDARY** gateway (only after quota/auth).

**Hosting invariant:** Replit full-stack PRIMARY, Netlify alternative frontend, Google Cloud Run alternative Hono API. No Next.js.
