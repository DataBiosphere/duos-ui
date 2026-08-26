# AI Chat Implementation Plan — Post-BFF

**Project:** duos-ui
**Date:** August 2026

Parent Ticket: https://broadworkbench.atlassian.net/browse/DT-3069

Add an AI chat window to DUOS. The chat answers user questions about datasets
and data-access requests. A server-side agentic loop drives an LLM (Large
Language Model). The loop executes tool calls against the Consent API as the
authenticated user.

This plan assumes the BFF (Backend For Frontend) migration is **complete**:
Phases 0–6 of [`BFF Migration`](https://broadworkbench.atlassian.net/browse/DT-3604) are live, and the legacy client-side
auth flow is removed. Details stay high level. We will expand each work item
after the plan is approved.

---

## Table of Contents

1. [Baseline: what the completed BFF provides](#1-baseline-what-the-completed-bff-provides)
2. [Target architecture](#2-target-architecture)
3. [Fastify server work](#3-fastify-server-work)
4. [Infrastructure](#4-infrastructure)
5. [Client work](#5-client-work)
6. [Sequencing](#6-sequencing)
7. [Security notes](#7-security-notes)
8. [Open questions](#8-open-questions)

---

## 1. Baseline: what the completed BFF provides

The chat feature is a downstream consumer of the BFF. Every capability below
exists in `develop` (or lands with the tail of Phases 5–6). The chat reuses
them; it does not rebuild them.

| Capability | Where it lives | Chat uses it for |
|---|---|---|
| PostgreSQL session store | `server/src/session/pgStore.ts` | Session access on every chat request |
| `request.session.accessToken` + `tokenExpiry` | `server/src/types/session.ts` | Bearer token for Consent tool calls |
| `refreshAccessToken(request)` + `REFRESH_WINDOW_SECONDS` | `server/src/auth/refresh.ts` | Token refresh before and during a chat turn |
| CSRF protection (`@fastify/csrf-protection`, header-only token) | `server/src/auth/csrf.ts` | Guard on `POST /api/chat` |
| Client CSRF helper | `src/libs/ajax/csrf.ts` | `X-CSRF-Token` header on chat requests |
| Client session state (`/auth/me`) | `src/libs/auth/session.ts` | Show or hide the chat button |
| Upstream proxy pattern at `/duos-api/*` | `server/src/proxy/` | Nothing directly — it frees the `/api/*` path space for the chat route |
| Helmet CSP + rate limits (Phase 5, stories 5-F / 5-G — **not merged yet**) | `server/src/index.ts` | Chat must fit the CSP; chat route gets a rate limit |
| BFF E2E sign-in for Playwright (Phase 6, story 6-D-pre) | `cypress`/Playwright harness | End-to-end chat tests |
| Session `userId` = the B2C email claim | `server/src/auth/callback.ts` | Rate-limit key that matches Consent's own bucket key (§3.4) |
| Per-user Consent API rate limit — [consent#2976](https://github.com/DataBiosphere/consent/pull/2976), merged 2026-07-16 | Consent `RateLimitFilter` | The budget every chat tool call spends (§3.4) |

The Consent API needs **no changes**. `DatasetResource` and
`DarCollectionResource` already exist, and the BFF proves that the session
token is accepted for `/api/*` calls. The chat does share one existing
upstream control, though: the per-user API rate limit — see §3.4.

Two rows above are not live today. Only stories 5-F, 5-G and 6-D-pre are hard
dependencies for the chat. Story 6-J (legacy removal) only simplifies the
feature flag, so chat work does not have to wait for all of Phase 6.

---

## 2. Target architecture

```
Browser (React chat UI)
  │  POST /api/chat  { message, history[] }
  │  Cookie: sessionId (HttpOnly, SameSite=Lax) + X-CSRF-Token header
  ▼
Fastify BFF (same process as the existing server)
  │  csrfProtection onRequest hook rejects forged requests
  │  reads request.session.accessToken; refreshes via refreshAccessToken()
  │  drives the agentic loop against the configured LLM
  │    local:      Ollama  (OLLAMA_URL, OpenAI-compatible tool calling)
  │    production: Vertex AI Gemini (Workload Identity, no key files)
  │  executes each LLM tool call in-process against the Consent API
  │    with Authorization: Bearer <session accessToken>
  │  streams SSE events back to the browser as the loop runs
  ▼
Consent API → tool result → loop continues → final answer → chat panel
```

Tool calls are ordinary server-side functions. The loop runs inside the
request that already carries the authenticated session. A standalone MCP
server stays out of scope.

---

## 3. Fastify Server work

High-level items only. Each becomes a story with full detail after approval.

### 3.1 `POST /api/chat` route

- Register a Fastify plugin after the session and CSRF middleware.
- Guard the route with `fastify.csrfProtection` (same pattern as `POST /auth/logout`).
- Return `401` when `request.session.accessToken` is absent.
- Refresh the token up front when it is inside `REFRESH_WINDOW_SECONDS`.
- Stream SSE (Server-Sent Events): `token`, `status`, `done`, `error` event types.
- Disable the socket timeout for the stream; a turn can take 30–60 seconds.
- Call `reply.hijack()` before any raw write. `@fastify/session` saves in an
  `onSend` hook, and an un-hijacked raw stream re-runs the double-send crash
  fixed in Phase 2 — see the note in `server/src/auth/refresh.ts`.
- Send a heartbeat comment frame every 15 seconds. It defeats idle timeouts in
  the reverse proxy and detects a dead client (open question 2).
- Abort the model call when the client disconnects. A closed tab must not keep
  spending.
- Abort open streams on `SIGTERM`. Fastify `close()` waits for in-flight
  requests, so a held stream delays every rolling deploy.
- The client owns conversation history and sends it with each request. The
  server caps the history it forwards to the model (see open question 3).
- Treat `history[]` as untrusted input. Accept user and assistant text only —
  never tool results — and set an explicit body size limit.
- Register an explicit 404 for unmatched `/api/*`. The SPA fallback in
  `server/src/index.ts` otherwise answers a mistyped chat path with the client
  shell instead of JSON.

### 3.2 Agentic loop

- One module with two backends behind a common interface.
- **Local:** Ollama, selected when `OLLAMA_URL` is set.
- **Production:** Vertex AI Gemini via `@google-cloud/vertexai` (confirm the
  package — see open question 6). Keep the interface provider-neutral; do not
  shape the tool declarations to one vendor's schema.
- Loop: send message + history + tool declarations. If the model returns tool
  calls, execute them, append results, and re-invoke. Stop when the model
  returns a final text answer.
- **Bound every turn:** at most 5 iterations, a 90-second deadline, and a byte
  cap on each tool result. Emit `error` and stop when a bound trips. Without
  these, a model that keeps calling tools runs until the socket dies, and the
  bill runs with it.
- Emit `status` events around tool calls and `token` events for text.
- Record per turn: duration, iteration count, tool-call count, token counts,
  and error type. Follow the Phase 6 metrics pattern (story 6-G).
- Keep a small fixture set of questions with recorded tool results, so a prompt
  edit or a model-version bump has a regression check. One E2E test does not
  cover tool choice.

### 3.3 Consent tool client

- A thin module that calls `DUOS_API_URL` with the session's bearer token.
- Consider a shared helper with `upstreamProxy.ts` for headers and refresh-on-401,
  but do not force the proxy abstraction onto simple JSON calls.
- **v1 tool set — two read-only tools:**

| Tool | Consent endpoint | Purpose |
|---|---|---|
| `list_datasets` | dataset search | Search the DUOS dataset index |
| `list_dar_collections` | user's collections | List the user's DAR collections |

- Every call carries the user's own token. Consent enforces the user's actual
  access. The chat cannot show data the user cannot already see.
- `get_dataset` (single dataset by ID) is the natural v2 tool. Add it when
  usage shows the model needs per-dataset detail.
- **Decide the mid-turn 401 behavior before implementation.** `apiProxy` sets
  `destroySessionOnUpstream401: true`; a tool client that reuses that helper
  destroys the session while the stream is open. Emit `error`, close the
  stream, and let the client redirect to sign-in.
- **Handle 429 from Consent.** Each tool call spends the user's shared API
  budget (§3.4). Honor `Retry-After`, do not retry inside the loop, and report
  the limit to the user as a `status` event.

### 3.4 Rate limits and cost

These are two controls, not one. Do not conflate them.

**Burst control — copy the Consent pattern.**
[consent#2976](https://github.com/DataBiosphere/consent/pull/2976) added a
per-user token bucket and **accepts the multi-pod limitation**: buckets stay
in-process, and each pod enforces `ceil(requestsPerMinute / podCount)`, so the
deployment-wide total stays near the configured number instead of multiplying
by the replica count. `podCount` comes from `.Values.replicas` in
[terra-helmfile#6466](https://github.com/broadinstitute/terra-helmfile/pull/6466),
so the divisor always tracks the real pod count. Apply the same shape to
`/api/chat`:

1. Register `@fastify/rate-limit` with `global: false`. The same Fastify
   instance serves every SPA asset through `@fastify/vite`, so a low global cap
   blocks page loads (Phase 5, story 5-G).
2. Set `max` to `ceil(turnsPerMinute / DUOS_REPLICA_COUNT)`, and deliver the
   divisor from `.Values.replicas` exactly as the Consent chart does.
3. Key on `request.session.userId`, not `request.ip`. `callback.ts` sets
   `userId` to the B2C email claim — the same key Consent's filter uses — so
   one person maps to one bucket on both sides.
4. Choose `turnsPerMinute` as a multiple of the replica count. Chat limits are
   small numbers, so the rounding error is proportionally far larger than it is
   at Consent's 100 per minute.

**Cost control needs a durable counter.** A per-minute bucket bounds bursts,
not spend: it resets on every pod restart and forgets an idle user in minutes.
Add a per-user daily turn budget in the BFF's PostgreSQL database, which the
session store already uses. State the ceiling in dollars per user per day.

**The shared Consent budget.** Every tool call is an authenticated `/api/*`
request billed to the same per-user bucket as the user's ordinary page traffic
— 100 requests per minute per user in dev, staging and bees, and **disabled in
prod today**. A five-tool-call turn on top of a busy dataset page can trip it.
Size the chat limit against what is left of that budget, and handle the 429
(§3.3).

---

## 4. Infrastructure

### 4.1 Local: Ollama in docker-compose

- Add an `ollama` service and set `OLLAMA_URL` on the app service.
- Document the first-run model pull in the compose README.

### 4.2 Production: Vertex AI via Workload Identity

- Create a dedicated GCP service account with only `roles/aiplatform.user`.
- Bind it to the DUOS Kubernetes service account with Workload Identity.
- Never put a key file in the image.
- Deliver `projectId`, `region`, and `modelVersion` as plain env values in
  `terra-helmfile`, next to the existing `DUOS_*` variables from BFF Phase 0.
- When neither backend is configured, `/api/chat` must return a clear `503`.

Vertex never calls back into DUOS. All tool execution is in-process.

---

## 5. Client work

### 5.1 Chat UI

| File | Purpose |
|---|---|
| `src/components/chat/ChatPanel.tsx` | Floating button + slide-up panel |
| `src/components/chat/ChatMessage.tsx` | Message bubble; markdown via `react-markdown`, no raw HTML |
| `src/components/chat/useChatStream.ts` | History state; POST + SSE parse |

### 5.2 Auth and transport

- POST with `credentials: 'include'`; the HttpOnly session cookie rides along.
- Attach the `X-CSRF-Token` header from the existing `src/libs/ajax/csrf.ts`
  helper. This is required at launch (see §7).
- Send no `Authorization` header. The token never leaves the server.
- `EventSource` cannot POST. Read the response body stream and parse the SSE
  frames by hand.
- Hold an `AbortController`. A closed panel or a new question must cancel the
  open turn, or the server keeps spending on an answer nobody reads.
- Read signed-in state from the existing `/auth/me`-backed session module.
  Hide the chat button when the user is signed out.

### 5.3 Feature flag

- Gate the chat button with a `chatEnabled` boolean in `config.json`, set per
  environment in `terra-helmfile`. This matches the delivery path the BFF
  used for `bffEnabled`.
- Migrate to the Consent feature-flag service later for per-user staged
  rollout, as a follow-on sprint.

---

## 6. Sequencing

Two unknowns carry most of the risk: whether SSE survives the reverse proxy
(open question 2), and what the first real Vertex call does. Reach both early,
before other work depends on the answer.

```
Chat 0.  Data-governance sign-off                     (gate — open question 5)
Chat 1.  Stub POST /api/chat: CSRF, SSE, heartbeat, canned events, live in dev
Chat 2.  Vertex service account + Workload Identity + one real call
Chat 3.  Ollama in docker-compose                     (local dev unblock)
Chat 4.  Consent tool client + two tool declarations
Chat 5.  Agentic loop with hard bounds (Ollama first, Vertex second)
Chat 6.  Rate limit + daily cost budget
Chat 7.  Chat UI (panel, message, stream hook; chatEnabled gate)
Chat 8.  E2E test on the BFF Playwright harness
── follow-on sprints ──
Chat 9.  Migrate chatEnabled to the Consent feature-flag service
Chat 10. Add the get_dataset tool if usage shows the need
```

Chat 1 answers open question 2 in about a day and de-risks every story after
it. Chat 3 runs in parallel with Chat 2. Chats 9–10 do not block the first
ship.

---

## 7. Security notes

- **Tokens never touch the browser.** No token appears in any chat request,
  response, SSE frame, or log. The chat must not regress this BFF property.
- **CSRF.** The session cookie is `SameSite=Lax`, so the `X-CSRF-Token` guard
  on `/api/chat` is mandatory at launch. Lax treats sibling
  `*.broadinstitute.org` subdomains as same-site; the token closes that gap,
  exactly as it does for `POST /auth/logout`.
- **CSP.** The chat UI must work inside the Phase 5 Helmet CSP. SSE to the
  same origin fits `connect-src 'self'`. Add no inline scripts and no new
  external script origins.
- **Markdown rendering.** LLM output and Consent dataset text are untrusted.
  Use `react-markdown` without `rehype-raw`. Allow no raw HTML.
- **Rate limits.** Two controls: a per-user burst bucket that copies the
  Consent pod-share pattern, and a durable daily spend budget. See §3.4.
- **Untrusted history.** The client owns the transcript, so every entry is
  caller-controlled. Accept user and assistant text only. Never accept or
  re-execute tool results that arrive from the client.
- **Data leaving the cluster.** Dataset metadata and DAR text reach a Google
  service. Record what leaves, the retention and no-training terms, the region,
  and who approved it, before any code ships.
- **Least privilege on tools.** Keep the v1 tool set small and read-only.
  Any state-changing tool needs an explicit security review first.
- **Prompt injection.** Dataset names and study descriptions are
  researcher-supplied text that enters the model context. With read-only
  tools, the blast radius is data the user can already see. Review each new
  tool against this risk.

---

## 8. Open questions

1. **Production model and region.** Confirm the Gemini model version and the
   Vertex region before staging. The local model choice is dev-only.

2. **SSE through the reverse proxy.** The app sits behind one reverse-proxy
   hop (`httpd-terra-proxy` sidecar in k8s). Verify that the proxy does not
   buffer SSE responses and that its idle timeout exceeds a 60-second chat
   turn. Test this in dev before the UI work lands.

3. **Conversation history cap.** Agree on the cap (suggested: last 10 turns)
   before implementation, so the client and the server use one limit.

4. **Rate-limit numbers.** Pick `turnsPerMinute` — a multiple of the replica
   count — and the daily spend ceiling. Measure the tool-call count of a
   typical turn first, so the chat limit and the shared Consent budget (§3.4)
   are sized together.

5. **Data-governance sign-off.** Who approves sending Consent dataset and DAR
   text to Vertex AI? Confirm retention, no-training terms, and region. This
   gates Chat 0, and it is the item most likely to block a launch late.

6. **Vertex SDK.** Confirm the current Node client before Chat 2. Google moved
   from `@google-cloud/vertexai` to `@google/genai`; §3.2 still names the older
   package.
