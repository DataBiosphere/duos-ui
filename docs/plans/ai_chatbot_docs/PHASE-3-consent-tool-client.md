# Phase 3: Consent tool client and the two v1 tools

**Phase:** 3 of 5 (near-term set) &nbsp;|&nbsp; **Effort:** ~5.5d &nbsp;|&nbsp; **Risk:** 🔴 High — this is the security boundary
**Depends on:** Phase 2 story 2-A for `ToolDeclaration` and `ToolResult`
**Blocks:** Phase 4 (the harness asserts tool choice), Phase 5 (the loop executes these tools)
**Can parallelize with:** Phase 0, and with Phases 2-B through 2-F once 2-A lands
**Reference:** [AI_Chatbot_Overview.md](../AI_Chatbot_Overview.md) §3.3, §7 &nbsp;|&nbsp; Phase 0 story 0-A (the field contract this phase enforces)

---

## Goal

Give the model exactly two read-only tools, and make the server own every part
of the upstream request that the model does not need to choose.

The Consent API needs no endpoint changes. `DatasetResource` and
`DarCollectionResource` already exist, and the BFF proves the session token is
accepted for `/api/*` calls.

---

## Background

**The tool set is the capability boundary, not the system prompt** (§7). The
model emits text and calls declared tools. It opens no sockets, writes no files
and runs no code. Injected text in a dataset description can override an
instruction in a prompt; it cannot add a tool that was never declared. So every
capability limit is enforced here and in the Phase 5 bounds — never in prose.

Three rules follow, and each is a story below.

**The server owns both request shapes.** Dataset search takes an Elasticsearch
query body, and the collections route takes a role name. A model that supplies
a raw query body can ask for anything the index holds. Give each tool a narrow
parameter set, and build the upstream request on the server.

**The role is an authorization decision, not a parameter.** `Admin` reads every
collection in DUOS. A model that picks its own role picks its own permissions.
So `Researcher` is pinned in code, and the model never sees the field.

**Every call carries the user's own token.** Consent enforces the user's actual
access, so the chat can show nothing the user cannot already see. Prompt
injection's blast radius, with read-only tools, is data the user can already
read. That is the argument that makes v1 acceptable, and any state-changing
tool or any new role breaks it and needs its own security review.

---

## Stories

### 3-A: The tool client module

A thin module that calls `DUOS_API_URL` with the session's bearer token.

§3.3 raises the reuse question, and this story settles it: **consider a shared
helper with `server/src/proxy/upstreamProxy.ts` for headers and
refresh-on-`401`, but do not force the proxy abstraction onto simple JSON
calls.** The proxy streams bodies, rewrites headers, guards CSRF and handles
Fetch Metadata, none of which a server-side JSON call needs.

Recommended split, to confirm in the story:

- **Reuse** the refresh policy. `REFRESH_WINDOW_SECONDS` and
  `refreshAccessToken` live in `server/src/auth/refresh.ts` and are already
  imported outside the proxy layer by `server/src/auth/me.ts`. Follow `me.ts`,
  not `upstreamProxy.ts`.
- **Do not reuse** `upstreamProxy`'s request machinery. Write a small `fetch`
  wrapper: build the URL, set `Authorization: Bearer <session accessToken>`, set
  `Accept: application/json`, apply a per-call timeout, and pass the turn's
  `AbortSignal`.

The timeout matters. A tool call that hangs burns the turn's wall-clock deadline
(story 5-C) and gives the user nothing. Set a per-call timeout well below the
turn deadline, and state the arithmetic in a comment.

Tests: the bearer token comes from the session and appears in no log; a hung
upstream trips the per-call timeout; the turn's `AbortSignal` cancels an
in-flight call.

**Files:** `server/src/chat/tools/consentClient.ts`, `server/test/consentClient.test.ts`
**Effort:** 1d &nbsp;|&nbsp; **Risk:** Medium

---

### 3-B: Mid-turn `401` — do not destroy the session

§3.3 says decide this before implementation. Here is the decision.

`server/src/proxy/apiProxy.ts` sets `destroySessionOnUpstream401: true`, and
that is right for the proxy: with proactive refresh already running, an upstream
`401` there means the token is genuinely dead. But a tool client that reuses
that behavior destroys the session **while an SSE stream is open**. The stream
then keeps writing into a request whose session no longer exists, and the client
sees a half-finished answer instead of a sign-in redirect.

**Decision.** The tool client does not destroy the session. On a tool `401`:

1. Stop the turn.
2. Emit an `error` event with a code the client can act on, for example
   `session_expired`.
3. Close the stream.
4. Let the client redirect to sign-in, exactly as it does for a proxy `401`.

The session row is left alone. The next ordinary request through the proxy
finds the dead token and ends the session through the existing path, which
keeps one place responsible for that decision.

Refresh once before the turn (story 1-C), so an ordinary expiry never reaches
this path. A `401` that survives that refresh is a real failure, not a race.

Tests: a tool `401` produces exactly one `error` frame and a closed stream; the
session row still exists afterwards; the client-visible code is stable and
documented.

**Files:** `server/src/chat/tools/consentClient.ts`, `server/src/chat/events.ts`, `server/test/consentClient.test.ts`
**Effort:** 0.5d &nbsp;|&nbsp; **Risk:** Medium

---

### 3-C: Handle `429` from Consent

Every tool call spends the user's shared Consent API budget — 100 requests per
minute per user in dev, staging and BEEs, and disabled in production today
(§3.4). A five-tool-call turn on top of a busy dataset page can trip it.

Rules:

- **Honor `Retry-After`.** Read it, and report the number to the user.
- **Do not retry inside the loop.** A retry inside a turn spends the same
  budget again and pushes the turn toward its wall-clock deadline.
- **Report it as a `status` event**, then end the turn cleanly. A rate limit is
  a thing the user can wait out, so it reads better as a status than as a
  failure.

Consider whether the turn should end with `done` and a plain-English answer, or
with `error`. Recommend `status` followed by `error` with a `rate_limited`
code, so the client can style it and the metrics can count it. Confirm in
review.

Tests: a `429` with `Retry-After` emits a `status` naming the wait; no second
upstream call is made; the turn ends once.

**Files:** `server/src/chat/tools/consentClient.ts`, `server/test/consentClient.test.ts`
**Effort:** 0.5d &nbsp;|&nbsp; **Risk:** Low

---

### 3-D: `list_datasets`

| | |
|---|---|
| **Upstream** | `POST /api/dataset/search/index/v2` |
| **Purpose** | Search the DUOS dataset index |

The upstream takes an Elasticsearch query body. **The model never supplies
it.** Declare a narrow parameter set — a free-text search term, and a small
number of optional filters the team agrees on — and build the query body on the
server from those parameters.

Two caps, both required:

1. **A result count cap.** Bounds the token cost of the turn and bounds what
   leaves DUOS (§7).
2. **A field projection.** Return only the fields the Phase 0 story 0-A
   contract permits. The projection is where that contract is enforced, so put
   a comment on it pointing at 0-A.

Agree both numbers in this story. Record them next to the projection.

Dataset names and study descriptions are researcher-supplied text that enters
the model context. That is the prompt-injection surface named in §7. With
read-only tools the blast radius is data the user can already see, so v1
accepts it — but say so in the code comment, so the next person to add a tool
re-reads the argument.

Tests: the model cannot influence the query body beyond the declared
parameters; a result set larger than the cap is truncated; an excluded field
never appears in a `ToolResult`; a malformed argument is rejected before the
upstream call.

**Files:** `server/src/chat/tools/listDatasets.ts`, `server/test/listDatasets.test.ts`
**Effort:** 1.5d &nbsp;|&nbsp; **Risk:** High — the projection is a data-governance control

---

### 3-E: `list_dar_collections`

| | |
|---|---|
| **Upstream** | `GET /api/collections/role/{roleName}/summary` |
| **Purpose** | List the user's DAR (Data Access Request) collections |

**The role is pinned to `Researcher` in code. The model never supplies it.**
The role decides which view of the collections the caller reads, so it is an
authorization decision. `Admin` reads every collection in DUOS.

The session stores no role: `server/src/types/session.ts` holds identity and
tokens only, and `/auth/me` forwards the Consent profile without saving it. So
this story must confirm the user actually holds `Researcher` through Consent,
and answer plainly when they do not — not fail with an opaque upstream error.

Decide how to confirm it, and state the choice:

- Call the Consent profile endpoint once per turn and read the roles, or
- Call the collections endpoint and treat its refusal as the answer.

The first costs an extra request against the shared budget (§3.4). The second
depends on the upstream's error shape being stable. Recommend the second, with
a `status` event that says the user holds no researcher role, and confirm the
upstream's actual response in the story.

The DAC and signing-official views need a role-selection rule, so they wait for
v2. Say that in the code comment.

Same two caps as 3-D: a result count cap, and a field projection tied to story
0-A.

Tests: the declared parameters contain no role field; a user without the
researcher role gets a plain answer, not a stack trace; the count cap and the
projection hold.

**Files:** `server/src/chat/tools/listDarCollections.ts`, `server/test/listDarCollections.test.ts`
**Effort:** 1.5d &nbsp;|&nbsp; **Risk:** High — a role bug is a permissions bug

---

### 3-F: The tool registry and the shared result bound

One module that holds the declarations and the executors, so the loop takes a
list rather than knowing tool names.

- **One registry** maps a tool name to its declaration and its executor.
- **One shared byte cap** on a `ToolResult`, applied after the per-tool count
  cap and projection. Story 5-C names it as a turn bound; enforce it here, at
  the point where the bytes exist. Two caps in two places is a bug waiting to
  happen, so this story owns the enforcement and 5-C only reads the constant.
- **Argument validation happens before the executor runs.** The declared
  JSON Schema is the gate. A malformed argument (Phase 2 story 2-E) must never
  reach an upstream call.

Adding a tool must mean adding one registry entry and nothing else. Test that by
adding a trivial third tool in the test file and deleting it again — or state
plainly why the registry cannot be that simple.

`get_dataset` (a single dataset by ID) is the natural v2 tool. Do not build it.
§3.3 says add it when usage shows the model needs per-dataset detail.

Tests: an unknown tool name is refused; a schema-invalid argument is refused
before the upstream call; an oversized result is truncated at the shared cap and
the truncation is visible to the model, not silent.

**Files:** `server/src/chat/tools/registry.ts`, `server/src/chat/limits.ts`, `server/test/toolRegistry.test.ts`
**Effort:** 0.5d &nbsp;|&nbsp; **Risk:** Low

---

## Suggested sequencing

3-A first; 3-B and 3-C extend it and are small. The two tools are independent
of each other and can run in parallel. 3-F needs both tools to exist.

```
3-A ─→ 3-B ─→ 3-C ─┬─→ 3-D ─┬─→ 3-F
                   └─→ 3-E ─┘
```

---

## Exit criteria

1. Neither tool declaration exposes a query body, a role, or any field the
   model does not need to choose.
2. `list_dar_collections` is pinned to `Researcher` in code, and a user without
   that role gets a plain answer.
3. Both tools cap the result count and project the fields, and both projections
   name the Phase 0 story 0-A contract in a comment.
4. A tool `401` ends the turn and leaves the session row alone.
5. A tool `429` honors `Retry-After`, retries nothing, and reports the wait.
6. A schema-invalid tool argument never reaches an upstream call.
7. No bearer token appears in any log line, `ToolResult`, or SSE frame.
