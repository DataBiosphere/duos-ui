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
| [001](ai_chatbot_docs/ADR-001-model-backend.md) | Use Vertex AI in every environment; run no local model | Chat 2, Chat 9 |

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
  │    every environment: Vertex AI Gemini, one pinned model version
  │    developers authenticate with ADC; k8s uses Workload Identity
  │    tests and CI use the stub backend (recorded fixtures, no network)
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
- **Every environment: Vertex AI Gemini** through the Google Gen AI SDK
  (`@google/genai`). This is Google's current Node client;
  `@google-cloud/vertexai` is the older one. Developers, dev, staging and
  production all call the same service and the same pinned model version, so a
  tool-call bug appears on a developer's machine instead of on first contact
  with production. There is no local inference engine. See
  [ADR-001](ai_chatbot_docs/ADR-001-model-backend.md) for why, including why
  the local Postgres is not the precedent it looks like.
- **Tests and CI: a stub backend** that replays recorded fixtures and reaches no
  network. It is a first-class backend with its own work item (Chat 2), not a
  mock inside a test file. It must serve multi-iteration turns and the failure
  paths, because Chats 1 through 8 build against it while Chat 0 is in review.
- Keep the interface provider-neutral. Do not shape the tool declarations to one
  vendor's schema: if Compliance blocks Vertex AI, the fallback is self-hosted
  vLLM (ADR-001, decision 5), and provider neutrality is what makes that a
  configuration change instead of a rewrite.
- Build nothing Vertex-specific until Chat 0 returns.
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

One backend, two credential paths. No compose service for the model, and no
model files on anyone's disk (ADR-001).

### 4.1 Developers: Vertex AI through Application Default Credentials

- Developers run `gcloud auth application-default login` against the dev
  project. No key file, and no shared secret in `.env.local`.
- Compose must mount `~/.config/gcloud` read-only into the `app` container and
  set the project. That mount hands the container the developer's own Google
  identity, which is wider than a scoped service account — DEVNOTES must say so.
- Set the quota project (`gcloud auth application-default set-quota-project`),
  or the first call fails with an unhelpful error.
- **Verify the auth path under `node --enable-fips`.** The `app` service runs
  with that flag, it restricts the OpenSSL algorithm set, and it has broken auth
  libraries before. Test it in Chat 9, not later.
- Each developer needs `roles/aiplatform.user` on the dev project. That grant
  goes through Compliance and Infosec, so it travels with the data-governance
  decision as one ask (Chat 0).
- Development costs money. Set a budget alert on the dev project and measure a
  real turn in Chat 9.

### 4.2 Deployed environments: Vertex AI through Workload Identity

- Create a dedicated GCP service account with only `roles/aiplatform.user`.
- Bind it to the DUOS Kubernetes service account with Workload Identity.
- Never put a key file in the image.
- Deliver `projectId`, `region`, and `modelVersion` as plain env values in
  `terra-helmfile`, next to the existing `DUOS_*` variables from BFF Phase 0.
- When no backend is configured, `/api/chat` must return a clear `503`.

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

Chat 0 is slow and it is not a stop-the-world gate. The role grant and the data
contract go to the same reviewers, so they travel as one ask, and the stub
backend (§3.2) carries every story below it while that review runs.

The other unknown to reach early is whether SSE survives the reverse proxy
(open question 2). Chat 1 answers it in about a day.

```
Chat 0.  Compliance + Infosec: field-level data contract AND the dev role grant,
         one ask                                       (open question 5)
         ── everything below runs against the stub, in parallel with Chat 0 ──
Chat 1.  Stub POST /api/chat: CSRF, SSE, keep-alive, canned events, live in dev
Chat 2.  Stub model backend: recorded fixtures, multi-iteration turns, failures
Chat 3.  Consent tool client + two bounded tool declarations
Chat 4.  Evaluation fixtures + tool-choice harness
Chat 5.  Agentic loop with hard bounds
Chat 6.  Rate limit, daily turn quota, concurrency cap
Chat 7.  Chat UI (panel, message, stream hook; chatEnabled gate; accessibility)
Chat 8.  E2E test on the BFF Playwright harness
         ── gated on Chat 0 returning yes ──
Chat 9.  Vertex: service account, Workload Identity, developer ADC, the FIPS
         check, and the first real call
Chat 10. Prompt tuning and the evaluation set run against Gemini
Chat 11. Load and soak test, then a staged rollout by environment
── follow-on sprints ──
Chat 12. Migrate chatEnabled to the Consent feature-flag service
Chat 13. Add the get_dataset tool if usage shows the need
```

Chat 4 comes before Chat 5, so the loop has a regression check from its first
commit. Note what each half of that pair proves: built against the stub, the
harness verifies the loop's plumbing; run against Gemini in Chat 10, it
measures the model's tool choice. Chats 12–13 do not block the first ship.

If Chat 0 returns no, Chats 9–11 change target rather than disappearing: the
fallback is self-hosted vLLM (ADR-001, decision 5), which is why §3.2 keeps the
backend interface provider-neutral.

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
- **One model destination, everywhere.** Every environment calls one Vertex AI
  project in one pinned region, and no credential in the stack reaches another
  model provider. Tests reach no network at all. There is no registry, no model
  tag and no local weights file, so no accident can route a developer's prompts
  to a vendor cloud. See [ADR-001](ai_chatbot_docs/ADR-001-model-backend.md).
- **Developer credentials.** Developers authenticate with ADC, so no key file
  exists to leak. Compose mounts the credential directory read-only, and that
  mount carries the developer's own Google identity — wider than the deployed
  service account, and worth stating in DEVNOTES (§4.1).
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

1. **Model version and region.** Pin one exact Gemini model version and one
   Vertex region, and use them in every environment — that shared pin is what
   makes development predict production (ADR-001). Confirm the version supports
   tool calling, and agree how a version bump is reviewed: the evaluation set
   (Chat 4) is the check that a bump must pass.

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

5. **Data-governance sign-off, and the dev role grant with it.** Who approves
   sending DUOS data to Vertex AI? The decision covers prompts, answers, tool
   results, logs and metrics, not only dataset and DAR text. Read Google's
   current retention, caching and no-training terms first and record them:
   nobody on the team has confirmed them yet. Decide whether the project needs
   caching turned off or an abuse-monitoring exception.

   Two points of shape. First, `roles/aiplatform.user` on the dev project goes
   to the same reviewers, so ask once rather than twice (§4.1). Second, ask for
   dev, staging and production in one submission. A dev-only or synthetic-data
   pilot answers a different question and guarantees a second cycle, and the
   answer worth having early is whether DUOS text may reach Vertex **at all** —
   because a no changes the architecture, not the schedule.

6. **Where the quota table lives.** The daily quota needs a durable table, and
   Consent owns the schema the BFF already uses. Decide before Chat 6: a Consent
   Liquibase changeset, or a schema the BFF owns. See §3.4.
