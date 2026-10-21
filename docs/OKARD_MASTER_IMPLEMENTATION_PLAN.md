# OKard Creator — Enterprise Master Product, Architecture & Execution Plan

**Status:** SPECIFICATION APPROVED FOR IMPLEMENTATION PLANNING; code not yet built.
**Plan version:** 1.0 | **Plan authored:** 21 October 2026
**Repository:** prince-web-beb/OKard
**Single source of truth for scope:** this document.
**Progress source of truth:** docs/IMPLEMENTATION_PROGRESS.md
**Session continuity:** docs/AI_SESSION_HANDOFF.md

---

## 0. Non-negotiable instructions for every engineer and AI agent

1. Build OKard as its own original platform. No Next.js and no copying a government ID interface or credential design.
2. Build for Android/mobile browsers *first*, with tablet, Windows, macOS and large desktop layouts as fully supported peers.
3. Nothing is considered delivered simply because the UI exists: every control, workflow, mutation, export, payment, notification, permission, error and cancellation must work end-to-end.
4. Avoid developer text and fake/demo success states in customer-facing UI. Preview/mock data is clearly tagged as sample.
5. The editor must be deterministic and editable. User designs live as a structured versioned scene graph, not an opaque AI-generated picture.
6. The same canonical card design must support editing, thumbnailing, proofing, print/export and reopening without geometry drift.
7. Photos must not be silently changed: original is retained; crop/mask/filter/retouch are reversible and consent controlled.
8. Keep all card families and every country reference in configuration/data, **not hard-coded per route**.
9. Security, licensing, data protection, privacy, accessibility, audit history, localization and disaster recovery are release blockers.
10. Never mark checkboxes done without code, passing automated tests, a reviewer-visible demo, and an evidence link in the progress tracker.
11. Complete each track to its acceptance criteria before checking it off. "Planned" and "implemented" are different statuses.
12. Keep the product compatible with future safe AI models/providers via interfaces; core editing remains fully functional without any AI service.
13. Do not invent organizations, signatures, cardholder data, contact details, QR destinations, government authority, or card verification status.
14. No photos from conversations, generated cards, personal data, or credentials are to be committed to source control.

## 1. Mission and user experience

OKard Creator is a production-grade browser workspace to create, edit, preview, verify (only where the issuer operates its own legitimate verification service), produce, share and manage **original private-brand cards**. A beginner starts from a beautifully finished template and completes a card from Android in minutes. A professional designer gets fine-grained vector tooling, reusable component libraries, multi-card batches, print manufacturing controls and collaborative review.

The visual benchmark: exceptional luxury physical-card realism, tightly constructed typography, premium restrained materials, elegant shadow and reflectance, clear information architecture, exquisite UI motion, sharp responsive artboards and sophisticated previews. An animation must communicate system state or delight, never impair editing precision.

### Definition of success

- Any legitimate organization can configure a brand, reusable card templates and front/back issues.
- A person can build the quality of the previously discussed high-end portrait-and-background membership card without asking an image model to generate a finished card.
- A HAMAD private-brand card can show the same supplied portrait prominently and as a tasteful low-opacity background layer, with no face/clothing alteration.
- Administrators can offer templates in multiple categories, sizes and country-localized formats without developer intervention.
- Every project can be reopened and edited pixel-perfectly, exported as a proof, and printed with documented limitations and accurate dimensions.
- Android usage is first-class for design, cropping, touch adjustments, keyboard inputs, asset upload and preview.

### Explicitly excluded from the platform

- Reproducing, altering or purporting to issue passports, visas, national IDs, resident IDs, driving licences or other government documents.
- Real bank/payment card replication, live EMV or contactless payment credentials, magnetic-stripe encoding, or card payment-network impersonation.
- Fake proof of identity, marital status, business affiliation, accreditation, authority, eligibility or access.
- Fake verification URLs, invented real companies, unverifiable issuer endorsements, or facsimiles of real government seals.
- Forged signatures or unverifiable certification statements.
- Anti-fraud bypass workflows (e.g. cloning existing credentials from a photograph).

A private-brand card may be titled “HAMAD Identity Card” if branding clearly conveys **PRIVATE BRAND CARD — NOT GOVERNMENT ID / NOT LEGAL ID**. Users control their branding but cannot use the system to impersonate official credentials.

## 2. Product areas / site map

**Public:** Home, Discover, card family/category landing pages, template gallery, featured collections, How It Works, Pricing, Showcase, localization picker, Help, FAQ, legal/privacy/terms, Contact, Account sign-in/sign-up.

**Authenticated:** Welcome/onboarding, My Workspace, Recent Projects, New Card flow, Template Library, Saved Templates, Card Editor, Front/Back Review, Brand Kits, Asset Library, Project Collections, Contacts/Data Sources (consented), Batch Generation, Exports, Print Orders, Orders & Billing, Collaboration/Approvals, Notifications, Account, Privacy/Export/Delete.

**Organization/workspace:** Members & permissions, Organization profile, issuer information, template publishing, issue registry, private verification, brand approvals, usage analytics, billing, data retention, audit log.

**Admin:** Dashboard, moderation review queue, card family taxonomy, country reference datasets, brand asset library, reusable components, theme tokens, templates/editor presets, content studio, translation management, plans/entitlements, AI features/provider health, print integrations, system health, abuse reports, users/orgs, support tickets, compliance audit, feature flags, release controls.

**Customer support:** contextual guides inside Editor, search, support messaging, issue evidence upload with consent, ticket status, SLA/escalation, announcements and service status.

Every mobile major page receives its own navigable screen; never cram settings, listings and full canvas into an unscrollable multi-column phone layout.

## 3. Card families — independent schemas and workflows

Every template declares card_family, intended_use, legal_disclaimer, dimensions, side_count, country applicability, base layers, field definitions, export restrictions and print constraints.

| Family | Common uses | Specialized fields/components |
|---|---|---|
| Private Brand Identity | HAMAD and other branded personal cards | Name/display name, brand identity, private-card statement, portrait |
| Employee / Staff | Valid organization-issued employee badges | Employer-verified issuer, job title, org asset, internal ID |
| Membership | Associations, clubs, communities | Tier, member reference, start/end dates, benefits |
| Couple / Family | Private commemorative or member cards | Two portraits, relationships as supplied, anniversary |
| Anniversary / Keepsake | Commemorative keepsake cards | Date, message, photo compositions |
| Event / Conference | Legitimate venue passes and badges | Event, zone, attendee, expiration, issuer-managed QR |
| Access (Private Venue) | Org-managed venue access | Scope, validity, revocation, access service integration |
| Loyalty / Rewards | Coffee shops, salons, retail | Points/tier, benefit rules, customer reference |
| Gift / Voucher | Business-issued gift card designs | Value and balance only when backed by a real merchant system |
| Hospitality | Hotels, resorts, guest programs | Stay/benefit details; access only via approved integration |
| Education / Campus | **Institution-authorized** campus clubs/programs | School-approved branding, role, valid year |
| Emergency Contact | Personal emergency information | Contacts, allergies/medical data only if voluntarily supplied |
| Business / VIP | Corporate relationship cards | Account manager, service tier, business branding |
| Visitor / Contractor | Authorized organization temporary passes | Host, arrival/exit date, revocation |
| Volunteer / Donor | Charities and events | Verified sponsoring organization, role, recognition |
| Partner / Affiliate | Authorized partners | Company/partner identity, issuer relationship |
| Digital Pass | Wallet-compatible branded pass | Validity, pass type, platform constraints |
| Collectible / Creator | Fan club, art, gaming, personal brand | Artist series, collection, edition numbering |

All cards share the editor, compositing engine and export. Card-family-specific business logic is modular, not a set of separate custom implementations.

## 4. Global country references — worldwide, not country-government replicas

Seed all **ISO 3166-1 countries/territories**, with ISO alpha-2/alpha-3 codes; support ISO 639 language metadata, BCP 47 locale tags, ISO 4217 currencies, and IANA zones. Use maintained datasets with pinned versions and update scripts, not hand-typed lists or implicit assumptions.

Per-country **country profile**:
- Native name, localized labels, flag, country calling code metadata, writing direction, date conventions, phone/address formatting, relevant locales and currencies.
- Common non-government physical card sizes or printing defaults, paper/lamination constraints and vendor options, with sourced descriptions and last-reviewed metadata.
- Safe visual inspiration (regional craft, color palettes, architecture, type pairing), never an official emblem, official layout or national credential features.
- Accessibility, character sets, diacritic preserving fonts, right-to-left, CJK and complex scripts.
- Template region availability with compliance rules, and per-country availability settings.
- Country fields are presentation data, not proof of nationality or residency.
- For jurisdiction-specific privacy/commercial requirements, store legal review status; unreviewed obligations are not silently asserted.

Provide a country browser, search/filter, locale preview, side-by-side typography demo, date/number locale formats, and a country reference editor with change history. Show relevant countries only where cards genuinely support issuance/production.

Country safety tests must reject “copy national ID/passport/driver licence” template requests even if a country reference is selected.

## 5. Technology baseline — modern, stable, not Next.js

**Front end / full-stack web:** SvelteKit 2, Svelte 5 (runes), TypeScript (latest stable compatible release), Vite (latest stable compatible release). SSR public pages and app shell; isolate large editor modules behind route-level lazy loading.

**Styling/design:** Tailwind CSS 4, typed CSS design tokens, CSS variables, modern container queries, responsive typography; Bits UI or similarly accessible primitives; motion.dev / CSS Web Animations for purposeful motion; reduced-motion fallback; no giant UI dependency bundle.

**Editor/core:** custom TypeScript typed scene graph with an SVG-first renderer for precision/print consistency. Use high-performance Web Workers, OffscreenCanvas selectively for thumbnails/raster effects, Pointer Events for tools, DOM/SVG hit testing and spatial indexing. Do not make Fabric/Konva JSON the canonical project format.

**Rendering and export:** one schema and one font/layout library used in interactive preview and server render. SVG composition and resvg-based raster output where compatible, Sharp/libvips for image processing, PDF production via pdf-lib or dedicated PDF renderer, optional isolated Rust rendering service once reproducibility testing justifies it. For CMYK and PDF/X deliveries, integrate validated print processing with ICC assets and real print-provider proof tests; do not label files PDF/X or CMYK if not verified.

**API:** Hono on current supported Node.js LTS, TypeScript, OpenAPI 3.1 contract (generated client types), strict Zod validators. Use a separate API when business capabilities need multi-channel consumers; keep SSR strictly within SvelteKit.

**Database:** PostgreSQL, Drizzle ORM with reviewed migrations and row-level organization isolation mechanisms. Redis for queues/rate-limit/cache; BullMQ for long-running exports, AI calls, print jobs and asset conversions.

**Storage:** private S3-compatible object storage (e.g., R2/S3/Azure Blob via adapters) with short-lived uploads, lifecycle policies, malware/image checks, tenant-scoped access. No public object URLs for sensitive user artwork.

**Auth:** Better Auth or a vetted maintained equivalent with passkeys/WebAuthn, email verification, password reset, social SSO for eligible users, organization sessions and secure revocation. Server-authoritative RBAC+ABAC; no fake front-end-only permissions.

**Testing:** Vitest, Testing Library for Svelte, Playwright E2E/device profiles, axe accessibility checks, property tests for scene transformations, visual regression at exact exported dimensions, load tests (k6 or equivalent).

**Quality/security:** pnpm monorepo, ESLint, Prettier, strict TS, commit hooks, GitHub Actions CI, SAST/dependency scanning, SBOM, secret scanner, migration checks, OpenTelemetry, structured logs, Sentry-equivalent error reporting.

**AI:** provider-independent gateway with typed tools, human approval before modifying artwork, quota metering and consent. Support multiple vision/design models, prompt generation, layout assistance and brand-rule suggestions without becoming dependent on them.

**Important:** package choices here are architectural targets; verify live compatible versions, maintenance, licensing and security before writing lockfiles. “Latest” does not mean an untested nightly runtime.

### Monorepo target

    apps/
      web/                    SvelteKit website + Android-first editor UI
      api/                    Hono application/API
      worker/                 BullMQ jobs, renders and exports
    packages/
      design-schema/          Canonical versioned scene graph and migrations
      editor-engine/          Commands, constraints, history and composition
      render-engine/          Shared layout, transforms, typography, vector output
      ui/                     Accessible components, tokens and animations
      card-families/          Data-driven family fields/rules
      country-data/           ISO/localization and reference catalogs
      templates/              Template manifests and component library
      ai-gateway/             Providers, policy, budget and user-controlled tools
      authorization/          Roles, permissions and policy tests
      export-print/           File generation and preflight
      shared/                 Strict contracts, validators and domain utilities
    infra/                    IaC, deploy, observability, secrets templates
    docs/                     This master plan, progress, API, ADRs and runbooks
    tests/                    Cross-package end-to-end, screenshot, fuzz and fixtures
    .github/workflows/        CI/security/staging release pipelines

Avoid placeholder folders represented as “complete” features.

## 6. Canonical design schema and reusable editor architecture

### Card project entity

A Project has version, owner/workspace, card family, country/locale, label, tags, visibility, profile/brand references, created/updated timestamps, schema_version, dimensions and one or more **Sides**. Each side is an independent layered artboard with shared design tokens/components. A normal physical card has Front and Back, with optional print-specific layers and preview overlays.

### Document model

- Units: millimeters as authoring canonical measurement; mm-to-pixel conversion via explicit export DPI; no CSS pixel implicit print scaling.
- Geometry: x/y, width/height, z-index, rotation, scale, normalized anchors, transforms, corner radii, masking/clipping, bleed/safe areas.
- Layers: group, path, shape, gradient, pattern, image, text, rich text, symbol, logo, barcode/QR (issuer-backed when live), vector illustration, decorative chip-like motif (nonfunctional), metadata/field binding, reusable component instance.
- Text: font family + licensing reference, weight, features, tracking, leading, auto-fit modes, line wrapping, fallback stack, locale shaping, alignment, paragraph styles, text-on-path only if supported in both renderers.
- Images: source asset immutable, reversible crop/focal point, opacity, blending, masking, adjustment pipeline, DPI detection, original/derivative hashes and consent.
- Reusability: design tokens, global brand kit, synced symbols/components, per-side overrides, and named layer constraints.
- Binding: user-entered typed data fields with validation, field accessibility descriptions, localized display formats, data redaction settings.
- Versioning: explicit schema migrations; autosaves with immutable history snapshots and edit command log.
- Dependencies: every reference points to a versioned asset or template revision; export records retain the exact asset/font revisions used.
- Crop marks / printable bleed / safe areas are non-printing overlays until preflight/export.
- No executable user JavaScript or injected SVG script in template/project payloads.

### Editor tools (all must be real)

Select/multiselect; marquee selection; zoom/pan; hand tool; snap-to-grid and guides; smart alignment; ruler/measure; draggable resize handles; rotate; crop/mask and focal editing; reorder/lock/hide; opacity; gradient and stroke; corner styling; shadows/glows; blur where print/render supports; fill/pattern; text editing/typography; shape/pen paths; curved text if reproducible; image replacement; duplicate/copy/paste; groups/components; symbols; layer search; history undo/redo; keyboard shortcuts; touch-specific alternatives; front/back swap; compare; version restore; field/form bind; component presets; z-index and safe-zone indicators.

### Non-destructive portrait workflow

- Upload source portrait(s). Show all people distinctly; never assume spouse, relationship or identity from image.
- Auto-detect visual subjects only with consent; provide explicit subject selection and crop.
- One original asset may be placed multiple times: main foreground portrait and optional desaturated/faded/blurred *secondary background reference*.
- Changes to secondary styling do not affect the original or main portrait.
- Face-aware crop is a suggestion, with manual confirmation. Never silently change facial geometry, clothing or age.
- Background removal/beautification must be *user-initiated*, previewable, reversible, and labeled.
- Keep original profile accessible and privately stored.

### Template system

Template = family + one or more sides + layer tree + field schema + brands/themes + country/locale requirements + validation + physical format + generated previews + licensing + versions + moderation state. Supports fork, save-as-template, remix, private/team/public gallery, protected brand-only templates, bulk generation, A/B design variants, migration, preview while preserving edits, and staged release/rollback.

Require excellent starter templates for every family, **not** one generic rectangle with new labels.

## 7. Card size, material and production system

- Presets: ISO/IEC 7810 ID-1 physical dimensions (85.60 × 53.98 mm) as *size only*, badge portrait/landscape, square collectible, wallet mini, folded keepsake, postcard, custom mm/inches. Using card dimensions does not confer official status or payment functionality.
- Manufacturer profiles: surface material, thickness, print area, finish, lamination, foil, emboss/deboss, spot UV, rounded-corner radius, substrate, duplex alignment and tolerance.
- Bleed and safe zone parameterized per vendor, no fixed numbers asserted across vendors.
- Realistic presentation mockups with flat front, flat back, flip, edge/detail, angled product scene and device preview. 3D perspective is **preview-only**; never baked into print artwork.
- Export options: PNG/JPEG/WebP proofs, SVG where licensed/compatible, raster TIFF, high-res PDF, printer-specific approved formats, separated sides, combined multi-page, crop/bleed variants and print-spec JSON.
- Resolution preflight at 300 DPI defaults where appropriate, with configurable provider specs and warnings when photos are too small.
- Check exact bounding boxes, text overflow, unsupported glyphs, font embed/outline policies, missing links, asset licenses, unsupported filters/transparency, DPI, bleed and safe area.
- Files are generated by asynchronous jobs with progress, cancellation, retries, signed downloads and clear errors. Never show “ready” until object exists and passes validation.
- Printing: production proof, customer approval, vendor quote, purchase/fulfillment via configured provider, order tracking and cancellation/refund policy. No invented partnerships or vendors.
- Metallic/holographic/emboss effects must distinguish on-screen *simulations* from physically printable special finishes; export spot-process layers only for vendors that support them.
- QR/barcodes are real and scan-tested if enabled; no decorative QR that claims actual verification.

## 8. Template collections to ship

Create meaningful distinct visual families, not a repetitive grid:
- Royal / Obsidian Gold, Imperial Ivory, Future Glass, Platinum Minimal, Bronze Heritage, Luxe Burgundy, Architectural Navy, Corporate Clean, Monochrome Editorial, Botanical, Ceremonial, Bold Creator, Modern Event, Eco Paper, Neon Tech, Premium Hospitality, High-Contrast Accessibility.
- HAMAD: Royal Signature, Future Identity, Imperial Edition. Each has front and back and separate portrait treatment.
- Existing artistic reference: a black/gold/silver image-rich marriage/membership mockup with strong foreground portrait, low-opacity supporting portrait, signature band, micro-patterns, date cells and city accent. **Do not copy its unverified issuer or fake hotline/address**.

Every collection: realistic thumbnail, live card preview, real edit route, colorways, font substitution rules, media-license status, print spec, accessibility contrast review, Android usability check.

## 9. Complete Android-first interaction design

### Site shell

- Phone-first typographic scale, tactile motion, readable spacing and premium surfaces; clean white or warm light workspace, selectable dark theme, vibrant deliberate accent color.
- Compact floating primary header that responds to scroll intent; stable back navigation and visible route titles.
- Bottom navigation for main app areas with animated but accessible selected state and true safe-area support.
- Editor: artboard occupies the focus, lower dock with Select, Text, Images, Elements, Layers, Brand, AI, and Export; deep controls in searchable full-screen or bottom-sheet panels as appropriate.
- Never allow tiny desktop drag handles on mobile. Touch targets at least 44 CSS px and no critical hover-only actions.
- Pinch zoom centered on fingers, two-finger pan, one-finger move after selection, precise numeric edit, lock canvas to prevent accidental movement, auto-scroll near edges, haptic feedback only where available.
- Mobile typography keyboard should not cover selected text or action bar; handle Android browser address bar changes, IME resizing, cutouts, landscape and split-screen.
- Quick compare front/back, swipe/flip with “instant switch” accessible button, clear unsaved state.
- Undo/redo in reach on phone; export is a distinct review stage, not a cluttered editor toolbar.
- Skeletons, progressive image loading, failure retry and offline/poor-network messaging designed from day one.

### Desktop/tablet

Use multi-panel left tools/right inspector/timeline or layers only when width permits. Desktop keyboard shortcuts, pointer fine-tune, drag-and-drop, multiple selected objects, multi-window preview and advanced ruler behavior.

### Visual motion specification

Cinematic home hero and template reveals; tactile button press spring; elegant card flip 3D; parallax/tilt restrained; loading shimmer; mini-card morph from library to editor; insert element entrance; export pipeline animation reflecting actual state; tab/side transitions; sidebar/drawer choreography; smooth magnetic snapping with reduced-motion variant. Animation budgets: maintain 60 fps on target Android during interactions; never render filters or 3D effects at the expense of input latency. Respect prefers-reduced-motion, reduced-data and battery/performance settings.

## 10. Accessibility and internationalization

WCAG 2.2 AA target across editor controls, navigation and non-artwork UI. Semantic labels, screen reader accessible layer tree and tools, visible focus, complete keyboard action equivalents, contrast, touch sizing and understandable form errors. Canvas operation must have a structured alternate object editor with numeric fields.

Full i18n with namespace-based translations, translation QA, plural rules, locale date/number/address formats, RTL mirrored chrome where appropriate without mirroring artwork, font fallback coverage and non-Latin rendering tests. Start English + Arabic + French localization to exercise LTR/RTL/accents, then expand by dataset and translation workflow.

## 11. Identity, collaboration, organizations, access

Roles: Platform Owner, Platform Admin (separated support/system privileges), Organization Owner, Organization Admin, Brand Manager, Designer, Editor, Reviewer, Print Manager, Issuer, Viewer, Customer. Explicit least-privilege permission matrix per resource (project, template, brand, artwork, export, user data, print job, verification token, billing).

Team workspace invite, project share, per-project permissions, presence, comments anchored to layers, approval requests, approval/denial, version diff, activity log and lock/conflict-resolution. Autosave supports eventual offline input queue with clear conflict strategy; no silent overwrite. For collaborative live editing consider CRDT/Yjs after proving single-editor atomic command semantics; if CRDT adopted, server validates and persists trusted reconciled revisions.

Passkeys and optional MFA; owner/admin mandatory stronger login controls; email verified before sensitive issuance, sharing or public publishing; session management and login alerts.

## 12. Legitimate issuer workflows and card verification

Organizations may issue **only their own authorized private cards**, with claim of issuer verified using domain/email or approved business evidence as needed. Distinguish:
- **Design preview** (non-issued mockup).
- **Approved template** (issuer approved art, no live credential).
- **Issued private-brand card** (tracked in OKard registry, revocable by issuer).
- **Revoked/expired** (not represented as active).

Any verification QR must point to OKard's real authenticated/controlled verification service (or an audited issuer-owned endpoint) with privacy-minimal data and explicit status. The service verifies **only the legitimacy/status of the private issuer's OKard-issued card**, **not civil identity, marriage, citizenship, immigration, or governmental authority**. Non-indexable public status pages avoid leaking DOB, addresses or full private portrait.

Temporary passes have expiry rules and revocation. Authentication/verification endpoints rate-limited, logged, subject to abuse protection. Serial formats generated from cryptographically random IDs, not predictable dates/birthdays.

## 13. Anti-abuse and card safety rules

Block templates/artworks that reproduce official government document layout, seals, police/military badges, national IDs, driving licences, visas, passports or payment cards; likewise prevent misleading claimed affiliations, fake certification, invented institutions and unauthorized real-brand mimicry.

Allow:
- original company/club/brand identity designs with honest issuer and not-a-government-ID marking;
- creative graphic motifs, decorative faux chips only if unambiguously ornamental and nonfunctional;
- ordinary personal, event, loyalty, emergency, keepsake and issuer-authentic cards.

Public template publishing moderation, transparent reporting/appeal mechanisms, flagged project private-review workflow with minimization of artwork access, audit trail, publish/revoke powers. Where humans intervene, allow contextual legitimate use review without silently asserting criminality. Production-ready designs that might be mistaken for official ID get a visible private-issuer disclaimer in card layout, not merely in terms.

## 14. AI design tools — real integrations behind a provider gateway

AI is a scoped capability in the editor; it never overrides the user. Tools to implement:

1. Natural-language card brief -> suggested card-family/theme/template components.
2. Content layout planner -> editable scene-graph patch proposal.
3. Typography and hierarchy critique -> constrained suggestions.
4. Palette harmonization and contrast check (deterministic contrast in local code).
5. Template finding/ranking from real metadata.
6. Background treatment and subject cropping suggestions (consented photos, reversible).
7. Brand consistency inspection against uploaded style guide.
8. Content proofreading and multilingual typography suggestions.
9. Layout overflow fixes with measured bounding-box proof.
10. Batch field mapping/data import validation, no auto-invented member data.
11. Image optimization/crop without altering face or clothing unless user explicitly asks.
12. Export/print preflight helper explaining actual validated errors.
13. Chat-based editing with multi-step preview, diff, approve/undo.
14. Optional image generation for decorative *background assets only* using explicitly enabled providers and clearly tracked provenance, not as a requirement to create a card.

AI agent tool policy: all edits are structured proposals, validated against schema, simulated on a shadow document, shown as diff, approved by user and logged; no direct project mutation without affirmative user approval. Support provider retries, timeouts, budgets, quotas, billing, client cancellation, tool permission checks, data redaction and opt-in for external image processing. No facial recognition claims, identity inference, forged signatures or counterfeit credential generation.

Admin AI controls: enable/disable by organization/region/plan, budget ceilings, provider routing/failover, prompt/version testing, abuse handling, audit trails, usage analytics and privacy settings. Full manual design workflow always remains supported.

## 15. Data model and persistent resources

Core tables/entities:
- users, sessions, auth_methods, organizations, organization_members, roles, permissions, invites, workspaces
- profiles, brand_kits, brand_tokens, fonts, font_licenses, asset_files, asset_variants, consents
- card_families, country_profiles, country_profile_versions, physical_sizes, material_profiles, printer_specs
- templates, template_versions, template_components, template_tags, template_reviews, template_publications
- projects, project_sides, project_versions, scene_nodes (or embedded jsonb), edit_events, project_tags, collections
- data_sources, data_source_fields, data_records, batch_jobs, import_audits
- exports, export_artifacts, preflight_reports, print_proofs, print_orders, payment_records, refunds, fulfillment_events
- card_issues, card_status_events, verification_links, revocations
- collaborators, comments, review_requests, approvals, notifications, support_cases, support_messages
- ai_jobs, ai_tool_actions, ai_cost_ledger, ai_policy_versions
- moderation_cases, abuse_reports, audit_events, feature_flags, subscription_plans, entitlements, usage_records, outbox_events.

Every organization-owned row enforces organization isolation in application and database. GDPR-style data subject export/delete process accounts for retained statutory billing logs without leaking portrait assets. Migrations are forward/backward reviewed and tested with seeded realistic data.

### API modules (illustrative)

- /auth, /me, /organizations, /workspaces, /roles
- /card-families, /countries, /sizes, /templates, /template-versions
- /projects, /projects/:id/sides, /projects/:id/versions, /projects/:id/assets
- /assets, /brand-kits, /fonts, /preview, /exports, /preflight
- /batch-jobs, /issues, /verify/:publicToken, /revoke
- /collaboration, /approvals, /notifications, /print-orders
- /ai/suggestions, /ai/edit-proposals, /ai/jobs
- /admin/moderation, /admin/catalog, /admin/ai, /admin/flags
- /health/live, /health/ready, /metrics (protected).

Use idempotency keys for mutations, cursor pagination, strict schema validation, conditional writes/version etags for concurrent edits, and async job status events via SSE with polling fallback.

## 16. Export, printing, billing and commercial paths

Tiered entitlements without breaking project ownership: Free, Creator, Pro, Team, Enterprise. Exact price/currency is business-admin-configurable and not specified in code. Correctly show watermarks/limits before exporting; no surprise downgrade after payment. Stripe/Flutterwave or another supported gateway only after provider-region/legal approval, with server-verified webhooks and ledger-backed entitlements. Multi-currency display is distinct from settlement authorization.

Purchase flows: price preview, tax/VAT consideration per region, payment authorization, receipt, order state machine, print quote, proofs, customer acceptance, vendor submission, tracking, refunds/support, accounting exports.

Batch creation: secure CSV/XLSX imports, column mapping, schema validation, preview of all rows, duplicates, job queue, partial-failure handling, export manifests, password-protected archives if appropriate, retention and user-controlled delete. Imported DOB and other sensitive attributes should not appear by default in public verification.

## 17. Privacy, security and infrastructure non-negotiables

- OWASP ASVS-inspired web control coverage and threat model (untrusted SVG, font parsing, image decompression bombs, SSRF image URLs, XSS from rich text, authorization leaks, exposed export URLs, session fixation, malicious QR and AI prompt injection).
- Image ingest MIME/magic-byte validation, size and pixel limits, decompression defenses, antivirus where appropriate, safe conversion and EXIF/GPS stripping by default; separate original EXIF handling only if user explicitly retains it.
- Encryption in transit, at rest and sensitive key-management boundaries; rotating short-lived signed URLs.
- Per-tenant access, signed webhooks, job authorization, scoped service credentials, audit of privileged impersonation/support tools, least-privilege admin.
- Rate limiting, upload quotas, storage lifecycle, denial-of-service controls, cost budgets, safe provider egress, secrets in manager not git.
- Backups, point-in-time recovery, restore drills, retention and deletion schedules, incident response, security headers, Content Security Policy, anti-CSRF, secure cookies.
- GDPR and region-appropriate law review, informed consent for portrait/biometric-adjacent AI processing, creator rights, minors/guardian consent, photographer/stock/font licensing and takedown.
- Error messages readable for end users, without exposing storage keys, server traces or private contact data.
- CI enforcement: vulnerable dependencies, secrets, formatting, typecheck, test failures and minimum coverage gates block merge.

## 18. Quality gates and empirical device/performance targets

### Mandatory device matrix

- Low/mid-tier Android Chrome (4 GB RAM class), modern Android flagship Chrome, Samsung Internet, tablet portrait/landscape.
- Desktop Chrome, Firefox, Edge, Safari on macOS/iOS for view/edit workflows where supported.
- Narrow 320/360/390/412 px layouts, split-screen, landscape, desktop 1366/1440+, 200% text zoom and large Android font sizes.
- Offline/weak-network, reduced-motion, keyboard screen readers, touch-only and mixed pointer modes.

### Performance budgets (initial targets subject to profiling)

- Public mobile LCP < 2.5 s p75 on defined test connection; CLS < 0.1, INP < 200 ms.
- Editor meaningful usable shell < 3 s p75 under reference device/network after authentication and optimized cold load; report device-specific baselines.
- Typical drag/resize steady 60 fps on reference Android for a complex 50–100-layer design; never block touch for export.
- Autosave acknowledgement visible; no data loss after app background/restore in explicitly tested reconnect scenarios.
- PNG/SVG/PDF output equivalence within validated bounds; no hidden crop/fallback font changes.
- Accessibility at least WCAG 2.2 AA for UI; high-density content editor alternatives.
- Each deployment exposes errors/latency, job completion rate, cost, storage and export preflight metrics.

### Release acceptance scenarios

A. Android user opens gallery, selects HAMAD Royal Signature, adds supplied portrait, duplicates into faded background, edits text and flips between sides; design survives close/reopen with no drift.
B. Mobile user uploads giant/invalid file; gets human-readable error, remains in editor, no corrupted save.
C. User selects Belgium, Dubai, Arabic/French locale settings; name with diacritics and RTL labels render correctly without loss.
D. Two workspace users simultaneously edit or review; no silent loss/conflict and unauthorized user cannot read assets.
E. PDF/PNG print proof produced using actual dimensions; low resolution and missing fonts are flagged before approval; file download matches backend status.
F. Admin disables AI; editor and exports still work. Enabled AI proposes a layer change; user can reject, approve and undo.
G. Private issued card verification returns only minimum public status; revoked/expired show correct state; QR does not reveal DOB.
H. Attempts to imitate government ID or use fake issuer endorsements are blocked/moderated; honest private-brand design remains available.
I. Template creator submits new template and version, admin reviews/publishes, gallery reflects new version and users can revert.
J. Print order is not marked paid/fulfilled without verified payment and actual provider/administrator state change.

## 19. Execution plan — ordered work tracks, no feature is “optional”

**This table is the backlog of major deliverables, not a claim of implementation.** Separate tracks into reviewed pull requests; preserve the checklist in the progress file. A track is done only after CI, manual Android checks, validation of security rules and evidence entry.

| Track | Build mandate | Exit gate |
|---|---|---|
| 00 — Foundations | Repo, pnpm workspaces, lint/typecheck, CI, env samples, ADRs, stage/prod architecture | Clean CI + secure secrets + documented run |
| 01 — Design System | Tokens, typography, icons, animations, app/public navigation | Responsive Android screen audit |
| 02 — Auth & Tenancy | Identity, passkeys, profiles, organizations, permission service | Auth/authz E2E + access-denial tests |
| 03 — Canonical Schema | Versioned design data, artboards, layers, constraints, migrations | Golden fixtures/property tests |
| 04 — Canvas Editor | Selection, tools, touch, history, crop, typography, layers, side switch | Real Android full edit/reopen |
| 05 — Rendering Engine | SVG previews, asset transformations, consistent fonts/render | Browser/server visual parity tests |
| 06 — Asset/Brand Studio | Upload, fonts, portraits, consent, brand tokens, asset variants | Secure uploader/crop tests |
| 07 — Template System | Families, front/back, creator, library, versions, publishing | Publish -> use -> edit -> remix |
| 08 — Country Reference | ISO dataset, localization, flags, safe country inspiration | Search, RTL and all-code coverage tests |
| 09 — Print & Export | Preflight, raster/vector/PDF, print profiles, queue | Vendor proof samples + DPI checks |
| 10 — AI Studio | 14 capabilities, gateway/policies, review-and-apply | Provider down/manual pass and audit |
| 11 — Collaboration | Roles, comments, approvals, version diff, realtime | Conflict/reconnect and permission tests |
| 12 — Issuer & Verification | Private-issuer registry, QR, expiry, revoke, abuse checks | Authentic-issuer flow and privacy checks |
| 13 — Batch & Data | Secure imports, field binding, jobs, export manifest | 10k-row throttled/restartable job test |
| 14 — Billing & Orders | Plans, verified payment, print quoting, partner fulfillment | Payment webhook/retry/refund E2E |
| 15 — Admin & Support | Moderation, catalog, AI flags, support, audit, analytics | Admin Android flows + RBAC |
| 16 — Accessibility & Globalization | WCAG AA, translation, RTL, locale QA | Audit across matrix |
| 17 — Production Operations | IaC, telemetry, backups, drills, security/privacy review | Load, penetration review, restore drill |
| 18 — Launch & Iteration | Release, rollback, onboarding, usage analytics, incident playbooks | Verified end-to-end launch signoff |

Parallelize isolated work only after design schema and API contracts are stable. Never rush undocumented feature stubs into production.

## 20. First concrete implementation sequence

1. Confirm repository settings, main branch protection, package/version compatibility and legal/licensing reviews.
2. Create monorepo, .env.example, package scripts, CI and staging baseline.
3. Document scene-graph JSON schema, side dimensions, asset model and canonical rendering behavior first.
4. Build responsive UI shell and template gallery with **real, deterministic SVG template previews**, not dead mock cards.
5. Implement HAMAD Royal Signature front/back as first internal end-to-end test case with reference portrait supplied *at runtime* only.
6. Implement authenticated project save/reopen/undo and true portrait layers and text editing on Android.
7. Implement server preview, export, preflight; close visual parity gaps.
8. Expand design engine and catalog for all card families and country reference data.
9. Complete every remaining ordered track and launch gates in section 19.

**Feature completeness rule:** Do not mark a stage complete because an impressive screenshot exists; every listed interaction in the acceptance tests must be operational.

## 21. Governance for all future sessions

At the start of every new AI/developer session:

1. Read README.md, this master plan, docs/IMPLEMENTATION_PROGRESS.md and docs/AI_SESSION_HANDOFF.md.
2. Inspect the actual current repository tree and recent commits before claiming progress.
3. Verify last completed checkpoints against running tests, not just unchecked text.
4. Select the next unfinished scoped ticket from the progress tracker; implement it fully without unrelated rewrites.
5. Add test evidence, screenshots of actual Android/browser tests if possible, commit/PR reference, decisions and blockers in the tracker.
6. Update the handoff file with exact implemented files/modules, migrations, commands, deployment or known errors and next task.
7. Clearly distinguish: Planned / In Progress / Implemented / Verified / Released.
8. Do not use “all done” unless full release acceptance is demonstrated.

### Recommended pull request format

**Purpose / scope**; **screens and routes touched**; **schema/API migrations**; **security/accessibility impact**; **tests executed with outcomes**; **Android browser checks**; **before/after preview links**; **risk and rollback**; **progress checklist changes**.

### Changes to this architecture

Record a Decision (ADR) in docs/adr/, with alternatives, implementation tradeoffs, risk, impact on fidelity/security/mobile and migration plan. No silent switch to Next.js or to flattened-image project storage.

## 22. Definition of genuinely complete

The project is complete **only** when the full publicly promised workflows run on Android and desktop, the server-backed editor operates on real persistent data, all supported card types have working front/back design templates, safe international references function, the renderer supports accurate exports and print preflight, admin/permissions/privacy and billing/issuer security function, AI integrations have fallbacks, successful production deployment is documented, and all critical tests and compliance checks pass.

**No implementation work has been completed as of creation of this document.** This is the build contract and a continuity reference, not a delivery claim.
