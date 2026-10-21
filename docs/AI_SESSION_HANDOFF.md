# OKard Creator — AI Session Handoff & Execution Protocol

**Last refreshed:** 2026-10-21
**Source repository:** prince-web-beb/OKard
**Default branch:** main
**Current phase:** DESIGN/ARCHITECTURE DOCUMENTATION ONLY — no implementation has started.
**Implementation next item:** Track 00.1 in docs/IMPLEMENTATION_PROGRESS.md
**Architecture authority:** docs/OKARD_MASTER_IMPLEMENTATION_PLAN.md

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

**Do not tell the owner that the product, website, designs or deployment have been completed.** Only repository documentation exists at handoff.

## Must-read order for future agent

1. README.md.
2. docs/OKARD_MASTER_IMPLEMENTATION_PLAN.md — extensive architecture, card families, tech choices, data schema, front/back renderer, worldwide reference model, security, accessibility, print, AI, launch gates.
3. docs/IMPLEMENTATION_PROGRESS.md — 19 tracks and granular checkbox ledger. Unchecked means not verified.
4. docs/AI_SESSION_HANDOFF.md — current continuation status.
5. Actual repository commits/tree/CI/workflows, then any ADRs, before editing.

## Architecture locked unless an ADR is approved

- SvelteKit 2 + Svelte 5 + TypeScript + Vite, Tailwind v4 design system. Not Next.js.
- Hono TypeScript API and separate TypeScript background workers.
- PostgreSQL/Drizzle, Redis/BullMQ, secure S3-compatible asset storage.
- Canonical versioned JSON scene graph, measurement in mm, SVG-first editable cards and server-authoritative rendering/export.
- Realistic mockups are previews; the print artwork is flat and precise.
- Auth, data governance, brands, card families and countries are server-configurable.
- AI provider gateway recommends user-approved scene edits, not opaque flattened card images.
- Automated tests and actual Android browsing must validate every claimed feature.

## Work instruction for the NEXT session

Begin **Track 00.1** without re-planning the product:

1. Verify repo, main branch, current files and latest commits.
2. Validate compatible stable package versions and licenses before pinning.
3. Implement monorepo configuration, scripts, SvelteKit shell, Hono API and worker foundations, shared strict TS configuration, package boundaries, lint/typecheck, basic automated tests, and initial CI.
4. Add genuinely useful Android-first landing/design shell *only after* foundation scaffolding and design token groundwork; do not count unfinished UI as complete.
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
| SvelteKit app | Not started |
| Hono API and worker | Not started |
| Editor / card templates | Not started |
| Country references | Not started |
| AI tools | Not started |
| Billing / verification / export | Not started |
| Android testing | Not started |
| Production deployment | Not started |

**First responsible action in any future session: read the actual repo, then execute the next unchecked task.**
