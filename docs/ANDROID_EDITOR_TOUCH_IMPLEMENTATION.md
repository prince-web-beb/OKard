# OKard Android Touch Editor — Implementation / Verification Handoff

**Date:** 21 October 2026  
**Scope:** Track 04, partial. Live user trials and complete monorepo build are still pending.

## What is implemented in source

The `/lab` route is now an interactive canvas, not merely a static SVG:

- **Tap/select:** the shared SVG renderer optionally adds safe layer IDs to editable shapes, text and photos. Locked/background layers do not initiate drag.
- **One-finger or mouse dragging:** an artboard pointer capture maps CSS pixels to physical mm and moves selected layers while preserving the offset between finger and layer origin. A single copy-on-write command is committed at gesture end, rather than filling undo history with every frame.
- **Snap and boundaries:** gesture math snaps at a 0.25 mm grid, clamps movement within current artboard bounds and rejects invalid coordinates.
- **Two-finger gestures:** pinch-zoom and pan with bounded 65–300% zoom and pan extents, plus accessible Zoom In/Out/Reset buttons.
- **Selected-layer outline:** a cyan selection rectangle and four control-point indicators display during interactive preview only. They are **not** included in exported SVGs.
- **Per-side authoring:** Add Text / Add Shape, editable text, position, size, rotation, color, opacity, lock/unlock, duplicate, stacking reorder, delete. All commands go through canonical runtime validation and in-memory undo/redo.
- **Local-only drafts:** a user can explicitly save/restore/erase a structured card scene in this browser's localStorage. The current JPEG/PNG/WebP portrait remains session-local and **is not copied to localStorage**, JSON drafts, GitHub or the backend.
- **Portable SVG export:** front and back art as real SVG with physical dimensions and embedded raster asset where explicitly uploaded. Editor hit markers and selection overlays are not in printable export.
- **Data integrity:** safe cloning of Svelte reactive proxies, schema input sanitization, mm metadata, revision tracking and real timestamp updates.

## Reusable modules

`packages/editor-engine/src/index.ts`
- `screenToMillimetres(point, rect, size)`
- `movedLayerPosition(initial, pointerDown, pointerMove, artboardSize)`
- `snapMillimetres(value, step)`
- `distance(a, b)` and `center(a, b)`
- `clampZoom(value)` and `nextPinchTransform(...)`

`packages/design-schema/src/index.ts`
- Validated authoring commands: insert, replace-text, set-opacity, set-image, move, **resize, rotate, set-color, set-locked, reorder, duplicate**, remove, set-title.
- Edits return a new revision; invalid changes leave the original scene unchanged.

`packages/render-engine/src/index.ts`
- `renderCardSvg(doc, side, options)`, now supporting `interactive` and `selectedLayerId` for editor-only markup.
- Portable SVG always calls renderer with defaults (no editor elements).

## Verification performed

**Verified in local isolated environment:** A matching `@okard/editor-engine` TypeScript file successfully compiled with TypeScript 5.8.3 on Node 22.16.0 and four unit tests **passed**, covering pixel→millimetre geometry, snapping/bounds, pinch zoom/pan and bad input rejection.

**Source/contract tests committed but not yet run:** design-schema test additions for duplicate, resize, rotation, locking, color and invalid commands; render-engine tests for editor-only selection attributes; Svelte lab integration test. Full project `pnpm` builds, Svelte TypeScript checks, actual Android device gestures and downloadable SVG visual QA have NOT been verified. GitHub Actions is still failing at workflow startup before runner allocation.

## Android QA matrix before marking verified

Test on real Android Chrome **and** Samsung Internet; inspect at 320, 360, 390, 412 px portrait widths, landscape and split-screen.

1. Select a text element by touching it; test moving with a finger and confirm coordinates update only on pointer up.
2. Undo and redo exact movement; switch to back and return; no leaked moves across sides.
3. Pinch from 100% to 200%, two-finger pan, reset; test pointer cancellation with back/home gesture.
4. Zoomed artboard must map pointer positions accurately despite CSS transforms.
5. Add text and shapes, resize/rotate/change fill and opacity, duplicate, reorder and delete; verify undo for every mutation.
6. Lock a layer, try to drag; should not move until unlocked.
7. Save local draft, refresh, restore; confirm words and geometry return and **photo does not persist**.
8. Export both SVG sides and compare preview to file (selection overlay must not appear in export).
9. Test keyboard-accessible numeric position controls and buttons; confirm screen reader labels.
10. Check long text, colors, wide images, large font settings and malformed JSON input.
11. Profile pointer move performance under 100 layers on a mid-range Android device; tune rerender/debounce if p95 exceeds interaction budget.
12. Ensure no government credentials, live issuer verification, payment functions or fabricated security credentials are implied.

## Open release blockers

- GitHub Actions pre-job `startup_failure`. Manual runner probe and support diagnostic: `docs/CI_RECOVERY.md`.
- No committed package lockfile, no full dependency resolution/build/tests.
- No linked Replit app or deployed Netlify/Google Cloud Run backend.
- No authenticated server persistence, real file storage, collaboration, print-vendor/PDF-X certification or production AI quota-gated routes.
- Mobile screen-reader, screen keyboard and real-device touch reliability not yet tested.
- Browser-localStorage is a **user-opt-in draft aid**, not a replacement for server-backed project storage or encrypted offline production workspace.

**Next work:** Resolve Track 00 build verification; then implement precise text metrics, drag-to-resize/rotate handles, artboard pan/zoom accessibility, persistent authenticated projects, full card families and region-safe templates. Continue writing implementation status in `docs/IMPLEMENTATION_PROGRESS.md`, never mark unverified tasks complete.
