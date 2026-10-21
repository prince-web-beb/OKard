# OKard Scene Graph and SVG Lab — Implementation Notes

**Status:** Source implemented, package/build/E2E checks **NOT YET VERIFIED**.
**Date:** 21 October 2026
**Repository:** prince-web-beb/OKard

## What changed

The initial HAMAD lab was a hand-coded SVG card mockup. The latest code replaces the one-off geometry with **independent reusable TypeScript packages**:

- `@okard/design-schema` — canonical v1 `CardDocument`, front/back artboards, typed layer nodes, real physical millimetre dimensions, runtime parser/validator, save/load JSON, copy-on-write edit commands and original HAMAD theme factories.
- `@okard/render-engine` — safe deterministic SVG composition from the canonical schema, portrait asset resolution, no external network asset loading, SVG escaping, guarded browser-only blob preview, embedded raster export, image/text preflight warnings.
- `apps/web/src/routes/lab/+page.svelte` — scene-powered mobile lab with three theme switchers, front/back toggle, original portrait + secondary faded portrait, text/position/opacity inspector, undo/redo, front/back SVG export and versioned JSON download/import.

### Versioned document schema

The canonical unit is **millimetres**. The starter physical dimensions are 85.60 × 53.98 mm (size only; not payment functionality or government authority), with 3 mm configurable document bleed metadata. A `CardDocument` includes schema version, private-brand family, locale and country code, document revision, modified timestamp, physical format and two separate side artboards.

Layer types in **v1**:
- Rectangle: position, size, radius, fill, optional stroke, rotation, opacity, visibility, lock status.
- Text: editable content, font family, font size/weight, letter spacing, alignment and bounding box.
- Image: out-of-document asset reference, fit/crop placement, radius, opacity and transforms.

Commands implemented: text replacement, opacity change, image reference replacement, position change, layer insertion/removal and title editing. Every edit produces a new validated revision so the user can undo/redo it. Groups, freehand paths, live dragging and collaborative CRDT are future tracks, **not claimed implemented**.

### Safety controls

- JSON parse uses strict runtime shape, field, type and bounds checks. Unknown/untrusted SVG strings cannot be inserted as layer kinds.
- No arbitrary CSS fill or remote URL: supported fill is validated hex only.
- Text is HTML/XML-escaped before rendering; fonts are limited to a short safe list.
- Images must be user-selected JPEG/PNG/WebP. Preview accepts only browser-local `blob:` references, export only inline raster `data:image/...;base64`. No external image loading.
- The HAMAD sample design explicitly says private-brand concept and not government-issued. This design does not claim legal identity verification, issuer status or financial-card capabilities.
- Browser-local portraits are never sent to the API and are not included in exported scene JSON; a user can choose a local, portable SVG containing the portrait on export.
- Uploaded photos are not stored in GitHub, not read by OpenRouter/Gemini and never persisted to an OKard backend.
- JSON file import rejects oversized files, unsafe scene data, non-private-brand documents, and non-HAMAD template identifiers. A later complete editor will implement generic family-safe importing.

### Manual acceptance steps for the Replit team

1. `corepack enable && corepack pnpm install --no-frozen-lockfile` with online npm registry. Generate **and commit** `pnpm-lock.yaml` after resolving install compatibility. Switch to frozen lockfile in CI.
2. `corepack pnpm build && corepack pnpm check && corepack pnpm test`; resolve all real build errors and run the test suites.
3. Start Replit preview; open `/lab` on Android Chrome/Samsung Internet at 320/360/390/412px viewports and desktop.
4. Switch Royal/Future/Imperial. Confirm two sides differ and changing theme does not lose currently loaded portrait.
5. Upload a privately owned photo; confirm full foreground and faded background both update but photo stays local.
6. Change display name, choose a text layer, adjust its coordinates, modify secondary opacity; verify undo/redo, flip side and change theme.
7. Download both front/back SVG. Open downloaded files in a browser: no blank images, correct mm attributes and selectable text. Read explicit preflight warnings.
8. Download the editable JSON; refresh the page, then import the JSON. Confirm scene geometry and text return. **Reupload portrait** because image bytes are intentionally excluded from JSON.
9. Upload a malformed JSON, oversized image and unsupported SVG photo. Confirm user-friendly errors without crashing.
10. Run unit tests and inspect edge cases (long names, diacritics, RTL typography, image rotations, clipping, export data size).
11. Verify API health/meta and cross-host Netlify proxy only on actual configured deployments.
12. Do not claim production print-ready, persistent editor or full card-family catalog until those independent release gates pass.

### Known limitations (not shortcuts, these are unfinished milestones)

- No authenticated project saves, database, multi-device asset library or undo across reload.
- No real drag handles, resize inspector, freeform drawing, teams/collaboration or screen-reader layer keyboard transformations yet.
- No true print vendor/PDF/ICC profile pipeline; SVG exports are real vector artwork, **not print preflight certification**.
- Approximate text width warning is conservative; accurate shaping requires browser/server glyph metrics integration.
- Image crop behavior is currently SVG cover/contain; interactive crop/focal point and file-size optimization are next.
- JSON import/export is scoped to the initial HAMAD private-brand lab and does not package photographic assets.
- Live OpenRouter/Gemini AI is not linked to the editor; AI paid endpoints remain disabled while authentication, consent, budget and rate limiting are built.
- GitHub Actions currently returns synthetic `startup_failure` with zero jobs. No test results from Actions can be claimed.
- Replit app was not found under exact name OKard when checked. Sync is being performed by the owner.

## Tests committed

`packages/design-schema/tests/document.test.mjs` covers multiple themes, schema/document validation, JSON roundtrip with diacritics, copy-on-write edits, revision counters, invalid layers and bad input.

`packages/render-engine/tests/renderer.test.mjs` covers front/back physical SVG output, XML escaping/injection protection, rejection of external image URLs, safe embedded raster, missing image/overflow warnings and preview-only blob support.

**Status:** tests are checked into source, but npm access is unavailable in the assistant's container and GitHub Actions fails before runner allocation. Do not represent these tests as passing until execution evidence is provided.

## Next work

**Track 00.1 remains open:** resolve CI startup failure and run actual online install/build/check/tests on Replit; generate lockfile; fix runtime/syntax issues; perform Android device checks. After the foundation passes, continue Track 03 full schema (groups and migration coverage), Track 04 touch editing, Track 05 precise render and print parity, Track 06 asset library and secure storage.

**Related:** `docs/IMPLEMENTATION_PROGRESS.md` and `docs/AI_SESSION_HANDOFF.md`.
