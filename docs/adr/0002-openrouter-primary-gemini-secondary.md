# ADR 0002 — OpenRouter primary model gateway, Google Gemini secondary

**Date:** 2026-10-21
**Status:** Accepted by explicit owner directive; initial gateway source added, not production-enabled.

## Owner requirement

"Start but note OpenRouter as primary model"

This supersedes the earlier master plan's unspecified AI primary and clarifies that Google's secondary role includes Gemini model fallback. It does not replace Replit as the primary application hosting provider.

## Decision

- **AI primary: OpenRouter**. Every server-side OKard AI design request routes through OpenRouter first. Model slug and credential are secret/config-driven. Do not use direct OpenAI/other provider calls outside this gateway.
- **AI secondary: Google Gemini**, direct Google REST endpoint with a separately stored key and explicitly selected model, usable for transient provider errors when fallback is enabled.
- **Application primary hosting: Replit** frontend and Hono backend; **Netlify** alternate frontend and **Google Cloud Run** alternate compute. AI provider priority is independent of hosting.
- A typed, testable `@okard/ai-gateway` module owns request shaping, response normalization, allowed fallback, bounds, timeout, error typing, redacted status and usage extraction.
- All billable customer AI endpoints remain **disabled** until authentication, consent, quotas, rate limiting, audit, abuse controls and human approval of design edits are implemented.
- Never leak credentials through SvelteKit public environment variables or GitHub, and never silently change primary to Google just because OpenRouter is unconfigured.
- Legitimate private brand design assistance is supported; no government-issued identity document imitation or unsupported proof of legal status.

## Rationale and tradeoffs

OpenRouter provides a provider/model routing abstraction for evolving text/vision capability selection. Google Gemini is an independently accessible secondary provider, enabling resilience when OpenRouter has transient failures. The service must be explicit about fallback costs, privacy transfer, differing model outputs, and no automatic multiple-provider fanout.

No direct browser-to-provider communication, and no paid UI with only client-side rate limiting.

## Verification gates

1. Compile and pass gateway tests with synthetic keys and mocked provider responses.
2. Replit build and Hono dependency graph from workspace lockfile.
3. Stage both provider requests with real, secret-stored credentials, one provider at a time.
4. Prove transient fallback plus no fallback on authorization/policy errors.
5. Implement and test tenant quotas, cost budgeting, rate limiting, privacy consent and approval-before-scene-mutation.
6. Track p95 latency/errors/cost, redact keys and user content in logs, incident response and disable switches.
7. Validate Android AI UX and deterministic manual editor fallback before production enablement.

**Reference:** docs/AI_PROVIDER_ROUTING.md.
