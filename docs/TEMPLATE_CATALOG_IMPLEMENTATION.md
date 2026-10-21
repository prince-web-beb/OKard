# OKard Creator — Reusable Template Catalog & Studio Integration

**Owner directive:** complete many reusable card types, all front-and-back, Android-first, no Next.js, no shortcuts.  
**Implementation checkpoint:** 21 October 2026  
**Code status:** Source committed on GitHub `main`, **full repository build and Android E2E NOT YET VERIFIED**.  
**Tracks:** 07 (template system) partial; 03/04/05 (schema/editor/render) partial; 00 (build verification) still blocked.

## What's actually in source

### 18 different editable card-family designs

The `@okard/templates` package defines a typed registry with **one distinct composition per registered family**. Designs are built using the existing canonical `CardDocument` scene graph, so they are real, editable vector-layer designs, not flattened AI-generated pictures.

| Family | Seed concept | Visual structure | Portrait |
|---|---|---|---|
| Private Brand | Obsidian Signature | Dark editorial portrait-left panel | Yes |
| Staff | Company Atelier | Bright right portrait / corporate detail rail | Yes |
| Membership | Heritage Circle | Engraved editorial split with ornaments | No |
| Family | Family Stories | Warm split-photo composition | Yes |
| Keepsake | Golden Anniversary | Cinematic full-width top panorama | Yes |
| Events | Summit Passage | Ticket-style perforation-inspired rail | No |
| Private Access | Venue Studio | Multi-bar geometric private venue panel | Yes |
| Loyalty | Rewards Orbit | Overlapping geometric orbit | No |
| Gift | Ribbon & Glow | Crossing decorative ribbon shapes | No |
| Hospitality | The Guest Experience | Boutique door/entry-inspired minimalism | No |
| Education | Campus Collective | Amber campus strip + authorized program portrait | Yes |
| Emergency | Care First | High-contrast urgent contact column | No |
| Corporate | Corporate Nexus | Executive profile + navy/gold business panel | Yes |
| Visitor | A Warm Welcome | Rounded welcome panel and accent tab | No |
| Volunteer | We Move Together | Human-centered banner / diagonal accent | No |
| Partner | Aligned Futures | Layered diagonal partnership bands | No |
| Digital Pass | Signal Pass | Signal bars and futuristic asymmetric panel | No |
| Collectible | Creator Edition No. 01 | Expressive rotated art panel + image overlay | Yes |

**HAMAD retained:** Royal Signature, Future Identity, Imperial Edition are additionally shown in a separate gallery showcase. Each has its existing front/back scene and the same editor.

Each of the 18 manifests declares: family, original artwork name, descriptor, category, search tags, typed unique composition, original palette, editable primary and secondary field labels, issuer requirement and design-only state.

### Real routes (source)

- **`/templates`** — SvelteKit mobile-first searchable and category-filtered template gallery, with 18 vector card previews, front/back flip, issuer warning, and **Customize design** linking directly to the shared editor.
- **`/lab?template=studio-identity`** — shared editor loaded with an editable private-brand design.
- **`/lab?template=summit-event`** — same editor working on a different events scene graph.
- **`/lab?template=hamad-royal`**, `hamad-future`, `hamad-imperial` — existing HAMAD themes.
- **`/api/v1/templates`** — read-only Hono catalog metadata with family/search filtering and family-coverage indicator.
- **`/api/v1/templates/:id`** — read-only manifest lookup, 404 on unknown IDs.

The homepage navigation now directs customers to the gallery, with the worldwide country atlas remaining available.

### Shared editor behavior

The existing `/lab` is **not forked** into 18 implementations. It loads `createTemplateDocument(templateId)` and uses the same renderer, layer inspector, mobile pointer gestures, undo/redo, locale and country metadata, local-only SVG/JSON export and explicit local device drafts. Full general-creator UI is not complete, but each built-in template opens as a valid editable scene design rather than a picture.

For a selected family:
- Show its original name and category, description and issuer-authorization note.
- Edit its primary name field directly, respecting original letter case, with specialized label.
- Edit secondary family field and reverse-side inscription from a clear inspector.
- Upload portrait **only when its scene includes a portrait layer**; no unsupported photo UI for nonportrait layouts.
- Keep generic scene import restricted to matching registered template IDs and family metadata.
- Save/restore local-only drafts for each template ID; photo bytes remain browser-session-only and are intentionally excluded.
- HAMAD theme switching remains available only when a HAMAD edition is active.

### New package

`packages/templates/src/index.ts`

Public functions:
- `CARD_TEMPLATES` — typed, reviewed, curated 18-family catalog.
- `listTemplates({family, search, limit})` — stable, bounded catalog queries.
- `getTemplate(id)` — safe manifest lookup.
- `getTemplateFamilyCoverage()` — detect a family without templates.
- `createTemplateDocument(id, {displayName, locale, countryCode, now})` — validated front/back `CardDocument`.
- `HAMAD_SHOWCASE` — original three HAMAD editions with safe access.
- `findCatalogDocument(id)` — helper for template/HAMAD retrieval.

All SVGs are rendered using `@okard/render-engine`. No custom HTML or scripts are loaded from manifest contents; markup is generated from validated typed rect/text/image layers.

### Automated test sources committed

`packages/templates/tests/catalog.test.mjs` checks:
1. Exactly 18 unique families/IDs/compositions and design-only catalog status.
2. Every template produces validated front/back artboards with proper required layers, genuine different compositions, issuer requirement matching family.
3. Search, filter, limit and invalid catalog ID behavior.
4. Editable text, version increments and scene JSON restore without mutating original.
5. No fabricated payment/verification functions or raw embedded personal photos in seed data.
6. Portrait references are safe placeholders with no user photo payload.
7. Three HAMAD editions are still retrievable and valid.

`apps/api/src/app.test.ts` checks read-only catalog API and filtering.

**These tests are committed but have NOT run in a successfully installed pnpm workspace.** Do not claim a passing build or Android browser run.

## Android UX delivery & review checklist

- [ ] Gallery at 320/360/390/412 CSS px; one-column comfortable layout, no horizontal overflow, filters keyboard-safe.
- [ ] 18 gallery thumbnails visible with readable title/categorization; tap Flip produces the true reverse of the same card.
- [ ] No blank gallery previews or Svelte hydration errors.
- [ ] Each Customize button opens the matching card family in `/lab`, with correct front/back and original palette/composition.
- [ ] Edit primary/secondary text, back inscription, element geometry/stacking, undo/redo across both sides; no missing-layer crashes.
- [ ] Photo fields appear only when corresponding scene has `assetId:'portrait'`.
- [ ] Download both SVGs, open in browser, and confirm no editor-only selection outline; identify missing photos via preflight.
- [ ] Explicit local draft per template saves and restores layout while excluding portrait binaries.
- [ ] Import allowed registered-family JSON; malformed or mismatched metadata rejected.
- [ ] Launch from `/countries` via `/lab?country=...&locale=...` still defaults to HAMAD, and region/language updates still work for other templates.
- [ ] Run real HTML accessibility and reduced-motion / Samsung Internet checks.
- [ ] Run preflight for every template: text bounds, layer collisions and dimensions; refine each template's measured typography.
- [ ] Never represent these previews as legitimate issuer-approved credentials or real access badges.

## Production gaps not masked by this release

- Full offline/persistent project management with account sync, organizations, server access policy and consent-based asset storage.
- Actual reusable customer-created template publishing/versioning, brand kits, revisions and moderation.
- True manufacturing-grade foil/CMYK/PDF-X/safe-area preflight; the existing SVG export is **not a certified print pipeline**.
- Full batch generation, country-specific print vendors, issuer verification, QR/access/payment functioning.
- Drag-to-resize handles, typography shaping, accessibility object-editor depth, and complete cross-device Android QA.
- Authenticated, quota-protected OpenRouter-first + Google Gemini fallback UI integration; **AI paid endpoints disabled**.
- Reliable GitHub Actions job logs, successful pnpm lockfile installation, complete build/check/tests and live Replit/Netlify/Google deployment.

## Next steps

**First unblock Track 00.1** on a connected Replit workspace or trusted online runner, generate `pnpm-lock.yaml`, fix all build/type errors and run actual tests. The owner previously said they will sync the private GitHub repo into Replit themselves. Only after successful evidence should Track 00 or 07 checkpoints be marked VERIFIED.

Then implement template authoring/publishing/versioning and storage; expand the non-template basic editor into full scene editing and a safe private-issuer validation and review lifecycle. Continue from `docs/IMPLEMENTATION_PROGRESS.md` and `docs/AI_SESSION_HANDOFF.md`.

**Invariant:** OpenRouter primary AI, Google Gemini secondary AI; Replit primary full stack, Netlify alternative frontend, Google Cloud Run secondary API; no Next.js.
