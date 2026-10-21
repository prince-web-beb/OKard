# OKard Worldwide Reference System — Implementation Checkpoint

**Date:** 21 October 2026  
**Status:** Source committed, isolated data checks performed; full monorepo build and actual Android UX NOT yet verified.  
**Ownership:** Shared package `@okard/country-data` and SvelteKit country atlas.

## Scope now implemented

1. **All 249 ISO 3166-1 alpha-2 assignments**, including countries and territories, stored as a unique version-pinned code list. This is the globally recognized *country-code dataset*, **not** a database of official identity documents.
2. Locale-aware country names via `Intl.DisplayNames`. Names are resolved in the requested language with English reference names, and accent-folded case-insensitive search across both.
3. Emoji flag references derived deterministically from ISO alpha-2 codes, without downloading copyrighted icons or embedding external trackers.
4. Canonical BCP 47 locale support via `Intl.getCanonicalLocales`. Script-aware LTR/RTL handling; explicit script overrides language defaults (e.g. `ar-Latn` renders LTR, `ar` and `en-Arab` render RTL).
5. Localized sample dates and numbers using `Intl.DateTimeFormat` and `Intl.NumberFormat`, fixed UTC sample to avoid user-location assumptions. No timezone is guessed from selected country.
6. Hono public read-only `GET /api/v1/countries` (query `locale`, `search`, `limit`) and `GET /api/v1/countries/:code`; bounded list sizes and 400 for invalid limit, 404 for unknown country.
7. `/countries` **Android-first worldwide atlas**: searchable reference cards, display-language control, selected reference details, localized date/number/direction preview and deep link into the existing card lab.
8. `/lab?country=BE&locale=fr` reads safe query metadata into the editable `CardDocument`. The editor has real country and locale dropdowns, preserves them on HAMAD theme switches, and carries them through JSON draft save/restore/export.
9. Scene graph validates country codes against the actual 249-entry ISO list rather than accepting any two letters; `set-country` and `set-locale` edit commands create new validated, undoable revisions.
10. Country package is part of Replit dev, Netlify web, and Google Cloud Run API dependency/build wiring. The website homepage links to the new atlas.

## New/changed source of truth

- `packages/country-data/src/index.ts` — country + locale metadata rules.
- `packages/country-data/package.json`, `tsconfig.json`, `tests/countries.test.mjs`.
- `packages/design-schema/src/index.ts` — ISO validation and metadata edit commands.
- `packages/design-schema/tests/document.test.mjs` — invalid code rejection, country/locale JSON roundtrips.
- `apps/api/src/app.ts`, `apps/api/src/app.test.ts` — country endpoints and tests.
- `apps/web/src/routes/countries/+page.svelte` — actual atlas.
- `apps/web/src/routes/lab/+page.svelte` — country and locale editor controls, query seed.
- `apps/web/src/routes/lab/lab.test.ts`, `apps/web/src/routes/+page.svelte`, `apps/web/src/app.css` — integration checks and responsive UI.
- Root/app/package manifests, `apps/api/Dockerfile`, `netlify.toml`.

## Verification evidence

**Direct, isolated runtime checks performed:**
- A pinned pycountry ISO dataset supplied **249** alpha-2 codes; committed list was re-read from GitHub: **249 codes, 249 unique**.
- Node.js 22.16.0 `Intl.DisplayNames` returned English `Belgium`, French `Belgique`, Arabic `الإمارات العربية المتحدة` for AE, and `Intl.getCanonicalLocales` preserved `zh-Hant-TW-u-ca-gregory`.
- GitHub repository confirmed source files and commits exist.

**NOT YET VERIFIED:**
- Full repository `pnpm install`, `pnpm build`, `pnpm check`, `pnpm test`. The current assistant environment cannot access npm.
- GitHub Actions still reports failed jobs and logs/steps were not retrievable at earlier checkpoint. See `docs/CI_RECOVERY.md`.
- Actual SvelteKit rendering/SSR hydration and Android browser interaction in the country atlas.
- Replit sync/deployment and Netlify/Google Cloud Run live hosting.
- Source test suites are committed but have not yet produced trusted CI results.

**Track 08 is PARTIALLY IMPLEMENTED, NOT VERIFIED or RELEASED.** Checklists remain unchecked until actual acceptance gates pass. This does not promise every country's government ID templates or address/postal/phone/duty rules.

## Safety and feature boundaries

Country code means a **reference locale for design presentation**, not the nationality, residency, citizenship, employer, access rights or legal identity of the cardholder. Neither country selector nor QR implies a government-recognized credential. No government logos, national identity document layouts or official seals are copied. This platform issues original private-brand cards only through the eventual authorized private issuer service.

## Next work in order

1. **Track 00 verification remains blocking:** sync OKard into Replit, install and lock dependencies, run all tests, capture actual GitHub Actions failure logs, verify Android Chrome/Samsung Internet screens at 320, 360, 390 and 412 px.
2. Add real template family registry and safe front/back starter documents across 18 families (not 18 cosmetic relabels), with a gallery and real Edit action.
3. Extend country profiles with well-sourced BCP 47 language, phone/address formatting and print-vendor conventions where verified; do **not** claim unverified official standards.
4. Implement user authentication + tenancy and server-backed projects/assets before enabling multi-device save or personal-photo storage.
5. Continue OpenRouter primary / Google Gemini fallback architecture under API-side consent, model budgets, rate limits and audited user-approved changes. No consumer AI endpoint until protections exist.

All progress is tracked in `docs/IMPLEMENTATION_PROGRESS.md` and `docs/AI_SESSION_HANDOFF.md`. The new chat must read repository files before implementing the next unchecked task.
