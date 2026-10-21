# AI Model Routing — OpenRouter Primary, Google Gemini Secondary

**Owner decision:** 21 October 2026  
**Implementation stage:** Provider SDK gateway and mock-backed offline tests are committed; **NO public or paid AI feature is enabled**.

## The provider order is non-negotiable

1. **OpenRouter is the primary AI gateway** for every OKard AI-assisted editing request. Configure the exact OpenRouter model slug in `OPENROUTER_MODEL`; no arbitrary model is hard-coded.
2. **Google Gemini is the secondary AI provider**, reached through Google's own Generative Language REST API only when OpenRouter experiences an eligible *transient* error and explicitly enabled fallback is configured.
3. **Replit is the primary application host**, not an AI model provider. **Netlify** is an alternate frontend host and **Google Cloud Run** is an alternate API compute host. These four roles must not be confused.
4. Core card design and all deterministic edits must remain usable even if **both AI providers are down**.

## Source locations

- `packages/ai-gateway/src/index.ts`: typed, server-only, fetch-injected provider adapter, guards, timeouts, parsing, usage, fallback logic.
- `packages/ai-gateway/tests/gateway.test.mjs`: 8 test cases; no actual API calls or keys required.
- `apps/api/src/ai.ts`: constructs the server gateway from environment. **Not connected to any public request handler.**
- `.env.example`: variable names and safe defaults.
- `docs/adr/0002-openrouter-primary-gemini-secondary.md`: decision record.

## Configuration

All API keys must be stored in Replit Secrets, API host secret manager, or other **server-side** environment store.

| Variable | Role | Example format |
|---|---|---|
| `OPENROUTER_API_KEY` | Primary provider secret | **Do not write real value to GitHub** |
| `OPENROUTER_MODEL` | Primary model | `vendor/model-slug` from OpenRouter model directory |
| `OPENROUTER_APP_URL` | Optional referral/app URL | Actual HTTPS product URL when available |
| `GOOGLE_GENERATIVE_AI_API_KEY` | Gemini secondary secret | **Do not write real value to GitHub** |
| `GOOGLE_MODEL` | Secondary model | Real supported Gemini model ID from Google docs |
| `AI_FALLBACK_ENABLED` | Enable failover on eligible transient errors | `false` until budgets/policy approved |
| `AI_REQUEST_TIMEOUT_MS` | Per-provider timeout | `20000`, internally limited to 3–90 seconds |
| `AI_MAX_OUTPUT_TOKENS` | Per-request maximum | `768`, internally limited to 128–2048 |

Model names are deliberately **not preset** because cost, capacity, availability, data terms, and model quality change. Select models and budgets during operational rollout.

## API routing behavior

**OpenRouter first:**
- POST `https://openrouter.ai/api/v1/chat/completions`
- `Authorization: Bearer <server key>`; `Content-Type: application/json`; optional `HTTP-Referer` and `X-OpenRouter-Title`.
- User brief and context are bounded, put in the **user message**; stable product policy is put in the **system message**.
- Non-streaming response parsed from `choices[0].message.content`; token usage recorded when provided.

**Google Gemini backup:**
- POST `https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent`
- `x-goog-api-key: <server key>`; JSON `systemInstruction`, `contents` and `generationConfig`.
- Model output normalized from `candidates[0].content.parts[].text`.

**Fallback only if all conditions are satisfied:**
- OpenRouter was **actually configured** and initially selected.
- `AI_FALLBACK_ENABLED=true`, a valid Gemini key + model exist.
- OpenRouter returned 408, 429, a 5xx status, a network timeout/error, or unusable response data.

**Do not fallback on:** OpenRouter 400, 401, 403, other nontransient rejection, client validation error, or missing OpenRouter configuration. This prevents bypassing policy failures, concealing invalid credentials, or unexpectedly paying another provider.

No automatic retries within a provider are enabled: multiple expensive generations are worse than a clear error. Future budgets must incorporate the potential cost of a primary attempt + backup attempt.

## Safety, privacy and launch gate

**This is currently a server-only library, not a functional consumer AI agent.** Public AI endpoints would be dangerous without authentication, quota/cost governance, consent, audit and abuse protections, and the card editor's human-in-the-loop review flow. Do NOT expose an unauthenticated `/ai/suggest` route.

Before the first paid public request:
- [ ] Authenticate active user/session, verify workspace access.
- [ ] Validate and meter per-user/org feature entitlements and budgets before model calls.
- [ ] Add durable distributed rate limit, spend ceiling, concurrency limit and non-sensitive audit trail.
- [ ] Explicit consent for sending uploaded user photo, personal data or document context to any external provider; don't send it implicitly.
- [ ] Safe prompt and output handling, no fictional issuer claims or government credential mimicry.
- [ ] Structured proposals with user preview, approve/reject and undo; never direct scene edits.
- [ ] Instrument provider timeout/failure/latency/spend, keys rotated, secret access controlled.
- [ ] Deterministic manual editor when AI disabled, rate-limited, missing or down.
- [ ] Provider contract tests plus successful live requests in a secured staging deployment.
- [ ] Confirm model policy/licensing and local data protection rules for target regions.

## Testing

A pure TypeScript version of the gateway was compiled locally with TypeScript 5.x and tested with Node 22's test runner: **8 mock scenarios passed** (OpenRouter success, Google fallback, invalid credentials stop, absent primary stop, invalid briefs, 400 stop, malformed response fallback, status redaction). **Caveat:** full repository install/build/check/tests and live provider calls are **not verified** in the current GitHub environment; GitHub Actions continues to report `startup_failure` with no jobs.

For a fully installed worktree run:

```sh
corepack pnpm install --no-frozen-lockfile
corepack pnpm --filter @okard/ai-gateway build
corepack pnpm --filter @okard/ai-gateway test
corepack pnpm build
corepack pnpm check
corepack pnpm test
```

## Trusted references

- OpenRouter authentication and chat completions: https://openrouter.ai/docs/api/api-reference/chat/send-chat-completion-request
- OpenRouter model catalog: https://openrouter.ai/models
- Gemini generateContent REST: https://ai.google.dev/api/generate-content

## Future AI tools

Card design briefs, editable vector-layer suggestions, layout critique, typography hierarchy, material suggestions, region-aware language help, background layering recommendations, preflight reports, version diffs and brand-coherence checks. These must all use the same provider gateway; do not implement a second one-off client or expose raw credentials.
