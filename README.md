# OKard Creator

**OKard Creator** is an Android-first, browser-based platform for designing, managing, rendering, reviewing, and producing high-quality private-brand cards of many kinds.

> Project status: **PLANNING — implementation not started.** This repository currently contains the handoff specification, not a functioning website. No design renderer, back end, or deployment has yet been tested.

## Start here

1. [Master implementation plan](docs/OKARD_MASTER_IMPLEMENTATION_PLAN.md) — authoritative vision, stack, system architecture, requirements, security, acceptance criteria, implementation tracks.
2. [Implementation progress](docs/IMPLEMENTATION_PROGRESS.md) — completion checklist; leave tasks unchecked until verified.
3. [Next-session handoff](docs/AI_SESSION_HANDOFF.md) — exact instructions for future AI/developer sessions to pick up where the last one stopped.

## Product principles

- **No Next.js.** The architecture uses SvelteKit + Svelte 5 + TypeScript, with separate TypeScript services and a server-authoritative renderer.
- **Android-first from day one**, not retrofitted from desktop.
- **Design with code:** deterministic, editable, reusable design documents—not dependent on generated pictures.
- **Front and back on every supported card**, with production preview and exports.
- **Many distinct card families:** private brand identity, corporate staff, membership, events, loyalty, gift, invitations, educational and hospitality access, emergency contact, and more.
- **Worldwide country references** for localization and format conventions, never replication of government identity documents.
- **AI as an optional enhancement to manual editing**, not a prerequisite for using the core design platform.
- **Premium, original, cinematic design quality** with reduced-motion and lower-performance fallbacks.
- **No shortcuts, mock success, or falsely marked completion.** Build, test, secure, measure and document each feature.

## Ownership and status

Repository: prince-web-beb/OKard (private). Development work starts after this documentation handoff. This README does not imply that any feature is implemented.

## Existing visual direction

The project was inspired by high-detail luxury card mockups featuring carefully composed portraits, secondary faded imagery, restrained metallic accents, signature areas, micro-patterns, and matching front/back designs. These are *references for aesthetic quality only*, not authority credentials, and no uploaded photographs or sample credentials are committed to the repo.

For HAMAD, the working title is **HAMAD Identity Card**, explicitly a *private brand card*, not a government-issued identity document or legal proof of identity.

## Build gate

Do not claim a release is ready until the applicable checklists in the master plan and the progress document have been passed in CI and verified manually on actual Android devices.