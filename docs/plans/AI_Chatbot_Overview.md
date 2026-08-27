# AI Chat Implementation Plan — Post-BFF

**Project:** duos-ui
**Date:** August 2026

Parent Epic: https://broadworkbench.atlassian.net/browse/DT-3069

Add an AI chat window to DUOS. The chat answers user questions about datasets
and data-access requests. A server-side agentic loop drives an LLM (Large
Language Model). The loop executes tool calls against the Consent API as the
authenticated user.

This plan builds on the BFF (Backend For Frontend) migration,
[DT-3604](https://broadworkbench.atlassian.net/browse/DT-3604). The chat needs
three of its stories, and no more: 5-F, 5-G and 6-D-pre. §1 lists them.
Details stay high level on purpose. We will expand each work item into a story
when we implement that phase.

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

Supplemental: [Architecture decision records](#architecture-decision-records)

---

## Architecture decision records

Full records live in [`ai_chatbot_docs/`](ai_chatbot_docs/). That directory also
holds the phase documents this plan expands into. Each file carries a kind
prefix: `ADR-00N-*` for a decision, `PHASE-N-*` for a phase.

The sequence is this feature's own. It does not continue the BFF numbering in
[`bff_adrs/`](bff_adrs/).

| ADR | Decision | Work item |
|---|---|---|
| [001](ai_chatbot_docs/ADR-001-local-inference-engine.md) | Run local inference on llama.cpp `llama-server`, not Ollama | Chat 3 |

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

The Consent API needs **no endpoint changes**. `DatasetResource` and
`DarCollectionResource` already exist, and the BFF proves that the session
token is accepted for `/api/*` calls. Two caveats follow, both in §3.4: the
chat shares the existing per-user API rate limit, and the daily quota needs a
table in a schema that Consent owns.

Two rows above are not live today. Stories 5-F, 5-G and 6-D-pre are the only
hard dependencies for the chat. Story 6-J (legacy removal) only simplifies the
feature flag, so chat work does not have to wait for all of Phase 6. Chat 1
(§6) confirms the three are live before later work depends on them.

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
  │    local:      llama.cpp llama-server  (LOCAL_LLM_URL, OpenAI-compatible)
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
- Return `401` when `request.session.accessToken` is absent, and refresh the
  token up front when it is inside `REFRESH_WINDOW_SECONDS`.
- Stream the answer with SSE (Server-Sent Events). Four event types:
  `token`, `status`, `done`, `error`. This is a contract with the client, so it
  stays here.
- The client owns conversation history and sends it with each request. The
  server caps the history it forwards to the model (see open question 3).
- Treat `history[]` as untrusted input. Accept user and assistant text only —
  never tool results — and set an explicit body size limit.
- Stop spending when nobody listens. Abort the model call when the client
  disconnects, and abort open streams on shutdown.

**Four hazards this route inherits.** The BFF already paid for these lessons.
Record them here, and let Chat 1 pick the fix and the numbers:

1. `@fastify/session` saves in an `onSend` hook. A raw stream that does not
   hijack the reply re-runs the double-send crash fixed in Phase 2 — see the
   note in `server/src/auth/refresh.ts`.
2. The reverse proxy has an idle timeout. A long turn needs a keep-alive frame
   and a socket timeout that outlasts the turn (open question 2).
3. Fastify `close()` waits for in-flight requests, so a held stream delays every
   rolling deploy.
4. The SPA fallback in `server/src/index.ts` answers a mistyped `/api/*` path
   with the client shell instead of JSON.

### 3.2 Agentic loop

- One module with two backends behind a common interface.
- **Local:** llama.cpp `llama-server`, selected when `LOCAL_LLM_URL` is set.
  Run it with `--jinja`, and add `--chat-template-file` when the model needs it;
  without the flag the server rejects a request that carries tools. Pin the
  model with `LOCAL_LLM_MODEL` (open question 1). See
  [ADR-001](ai_chatbot_docs/ADR-001-local-inference-engine.md) for why this is
  not Ollama.
- The local backend talks to one OpenAI-compatible client, so a later engine
  swap changes two env values and no code. Accept `tool_calls.arguments` as
  either a JSON string or a JSON object: `llama-server` can return the object
  form, which the OpenAI contract does not allow (ADR-001, accepted risk 1).
- **Production:** Vertex AI Gemini through the Google Gen AI SDK
  (`@google/genai`). This is Google's current Node client;
  `@google-cloud/vertexai` is the older one. Keep the interface
  provider-neutral; do not shape the tool declarations to one vendor's schema.
- Loop: send message + history + tool declarations. If the model returns tool
  calls, execute them, append results, and re-invoke. Stop when the model
  returns a final text answer.
- **Bound every turn.** Cap the iteration count, set a wall-clock deadline, and
  cap the bytes of each tool result. Emit `error` and stop when a bound trips.
  Without bounds, a model that keeps calling tools runs until the socket dies,
  and the bill runs with it. The loop story picks the numbers.
- Emit `status` events around tool calls and `token` events for text.
- Record per turn: duration, iteration count, tool-call count, token counts,
  and error type. Follow the Phase 6 metrics pattern (story 6-G).
- Keep a fixture set of questions with recorded tool results, so a prompt edit
  or a model-version bump has a regression check. This lands as its own story
  **before** the loop story, not after. One E2E test does not cover tool choice.

### 3.3 Consent tool client

- A thin module that calls `DUOS_API_URL` with the session's bearer token.
- Consider a shared helper with `upstreamProxy.ts` for headers and refresh-on-401,
  but do not force the proxy abstraction onto simple JSON calls.
- **v1 tool set — two read-only tools:**

| Tool | Consent endpoint                                     | Purpose |
|---|------------------------------------------------------|---|
| `list_datasets` | `POST /api/dataset/search/index/v2` | Search the DUOS dataset index |
| `list_dar_collections` | `GET /api/collections/role/{roleName}/summary`       | List the user's DAR collections |

- Every call carries the user's own token. Consent enforces the user's actual
  access. The chat cannot show data the user cannot already see.
- **The server owns both request shapes.** Dataset search takes an
  Elasticsearch query body, and the collections route takes a role name.
  Give each tool a narrow parameter set and build the upstream request on the
  server. The model must never supply a raw query body.
- **The tool is fixed to the `Researcher` role in v1. The model never supplies
  it.** The role decides which view of the collections the caller reads, so it
  is an authorization decision, not a parameter. `Admin` reads every collection
  in DUOS, so a model that picks its own role picks its own permissions.
- The session stores no role: `server/src/types/session.ts` holds identity and
  tokens only, and `/auth/me` forwards the Consent profile without saving it.
  The tool story confirms the user holds `Researcher` through Consent, and
  answers plainly when they do not. The DAC and signing-official views need a
  role-selection rule, so they wait for v2.
- Cap the result count and the response fields each tool returns. The cap bounds
  the token cost and bounds what leaves DUOS (§7). Agree the numbers in the
  tool story.
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

There are different limiting controls.

**Burst Control — uses the pattern established by Consent.**
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

**Spend Control needs a durable tracker.** A per-minute bucket bounds bursts,
not spend: it resets on every pod restart and forgets an idle user in minutes.
Add a per-user daily **turn quota** in the BFF's PostgreSQL database, which the
session store already uses and which every pod shares.

The quota must outlive a logout and a session rotation, so it cannot sit inside
`user_sessions.sess`. It needs its own table, and Consent owns that schema
(`server/test/load/README.md`). Settle the migration route before the quota
story starts: a Consent Liquibase changeset, or a schema the BFF owns. This is
the one Consent-side change the chat needs (§1).

Call it a turn quota, because that is what it is. A turn count is not a dollar
ceiling: turns differ in history size, iteration count and output length. §3.2
already records token counts per turn, so measure the real cost of a turn first,
then set the quota from that number and review it (open question 4). Do not
build reserve-and-settle billing for v1.

**Bound Concurrency.** Neither control stops one person from opening several
tabs and starting several turns at once. Cap the concurrent turns per user, and
pick the number in the same story as the quota. Decide the scope with it: an
in-process counter set to 1 allows one turn *per pod*, not one per user. A
deployment-wide cap needs a shared lease, and a lease needs a release path for a
disconnect, a crash, and a turn that outruns its deadline.

**The shared Consent budget.** Every tool call is an authenticated `/api/*`
request billed to the same per-user bucket as the user's ordinary page traffic
— 100 requests per minute per user in dev, staging and bees, and **disabled in
prod today**. A five-tool-call turn on top of a busy dataset page can trip it.
Size the chat limit against what is left of that budget, and handle the 429
(§3.3).

---

## 4. Infrastructure

### 4.1 Local: llama.cpp in docker-compose

- Add a `llama-server` service, mount a model volume, and set `LOCAL_LLM_URL`
  and `LOCAL_LLM_MODEL` on the app service.
- Document the one-time GGUF file download in the compose README, with the
  exact URL and a digest check. The engine reaches no registry, so no tag pull
  exists (ADR-001, accepted risk 4).
- Docker on Apple Silicon gives the container no Metal access, so the service
  runs on the CPU. A developer who needs speed runs `llama-server` on the host
  and points `LOCAL_LLM_URL` at it.

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

- **Accessibility ships with the UI; it is not a follow-up.** A panel that
  streams text needs an announced live region, focus management on open and
  close, a keyboard route to close, and respect for reduced-motion. Agree the
  detail with the designer in the UI story.

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
- `chatEnabled` is environment-wide, so it cannot serve a per-user canary. The
  first rollout is staged by environment: dev, then staging, then prod.
- Migrate to the Consent feature-flag service later for per-user staged
  rollout, as a follow-on sprint. Move that migration ahead of launch if the
  team wants a true per-user canary.

---

## 6. Sequencing

Two unknowns carry most of the risk: whether SSE survives the reverse proxy
(open question 2), and what the first real Vertex call does. Reach both early,
before other work depends on the answer.

```
Chat 0.  Data-governance sign-off + field-level data contract
                                                      (gate — open question 5)
Chat 1.  Stub POST /api/chat: CSRF, SSE, heartbeat, canned events, live in dev
Chat 2.  Vertex service account + Workload Identity + one real call
Chat 3.  llama-server in docker-compose               (local dev unblock)
Chat 4.  Consent tool client + two bounded tool declarations
Chat 5.  Evaluation fixtures + tool-choice harness
Chat 6.  Agentic loop with hard bounds (local first, Vertex second)
Chat 7.  Rate limit, daily turn quota, concurrency cap
Chat 8.  Chat UI (panel, message, stream hook; chatEnabled gate; accessibility)
Chat 9.  E2E test on the BFF Playwright harness
Chat 10. Load and soak test, then a staged rollout by environment
── follow-on sprints ──
Chat 11. Migrate chatEnabled to the Consent feature-flag service
Chat 12. Add the get_dataset tool if usage shows the need
```

Chat 1 answers open question 2 in about a day and de-risks every story after
it. Chat 3 runs in parallel with Chat 2. Chat 5 comes before Chat 6 so the loop
has a regression check from its first commit. Chats 11–12 do not block the
first ship.

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
- **Rate limits.** Three controls: a per-user burst bucket that copies the
  Consent pod-share pattern, a durable daily turn quota, and a concurrency cap.
  See §3.4.
- **Untrusted history.** The client owns the transcript, so every entry is
  caller-controlled. Accept user and assistant text only. Never accept or
  re-execute tool results that arrive from the client.
- **Data leaving the cluster.** More than dataset and DAR text reaches a Google
  service: the user's prompts, the generated answers, and whatever the server
  logs or records as metrics. Decide field by field what may leave, how the logs
  are redacted, how long each side keeps the data, and whether request caching
  stays on. Record the region and who approved it before any code ships. See
  open question 5.
- **No accidental third-party model.** The local engine loads a file from disk
  and reaches no model registry, so no tag can route a developer's prompts to a
  vendor cloud. This guard is structural, not a rule in a README. See
  [ADR-001](ai_chatbot_docs/ADR-001-local-inference-engine.md).
- **Least privilege on tools.** Keep the v1 tool set small and read-only.
  The collections tool is pinned to the `Researcher` role, so the model cannot
  choose a wider view (§3.3). Any state-changing tool, and any new role, needs
  an explicit security review first.
- **Prompt injection.** Dataset names and study descriptions are
  researcher-supplied text that enters the model context. With read-only
  tools, the blast radius is data the user can already see. Review each new
  tool against this risk.

---

## 8. Open questions

1. **Model versions and region.** Pin an exact Gemini model version and Vertex
   region before staging. For local work, pin one GGUF repository, one revision
   and one SHA256 digest, and record the model license next to the pin. Prefer
   Apache-2.0 or MIT weights, such as Qwen or Mistral-Nemo; the Llama and Gemma
   terms are custom licenses, and the OSI has not approved them. Confirm the
   model supports tool calling. See
   [ADR-001](ai_chatbot_docs/ADR-001-local-inference-engine.md).

2. **SSE through the reverse proxy.** The app sits behind one reverse-proxy
   hop (`httpd-terra-proxy` sidecar in k8s). Verify that the proxy does not
   buffer SSE responses and that its idle timeout exceeds a 60-second chat
   turn. Test this in dev before the UI work lands.

3. **Conversation history cap.** Agree on the cap (suggested: last 10 turns)
   before implementation, so the client and the server use one limit.

4. **Limit numbers.** Pick `turnsPerMinute` — a multiple of the replica count
   — the daily turn quota, and the concurrent-turn cap. Measure the tool-call
   count and the token count of a typical turn first, so the chat limits, the
   spend they imply, and the shared Consent budget (§3.4) are sized together.

5. **Data-governance sign-off.** Who approves sending DUOS data to Vertex AI?
   The decision covers prompts, answers, tool results, logs and metrics, not
   only dataset and DAR text. Read Google's current retention, caching and
   no-training terms first and record them: nobody on the team has confirmed
   them yet. Decide whether the project needs caching turned off or an
   abuse-monitoring exception. This gates Chat 0, and it is the item most likely
   to block a launch late.

6. **Where the quota table lives.** The daily quota needs a durable table, and
   Consent owns the schema the BFF already uses. Decide before Chat 7: a Consent
   Liquibase changeset, or a schema the BFF owns. See §3.4.
