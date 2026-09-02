# Phase 2: Stub model backend

**Phase:** 2 of 5 (near-term set) &nbsp;|&nbsp; **Effort:** ~5d &nbsp;|&nbsp; **Risk:** 🟡 Medium
**Depends on:** Phase 1 for the route and the event contract (stories 1-E, 1-F)
**Blocks:** Phase 4 (the harness runs against a backend), Phase 5 (the loop drives a backend), Chat 8 (E2E), Chat 9 (Vertex implements the same interface)
**Can parallelize with:** Phase 0, and with Phase 3 once story 2-A lands
**Reference:** [AI_Chatbot_Overview.md](../AI_Chatbot_Overview.md) §3.2, §4.2 &nbsp;|&nbsp; [ADR-001](ADR-001-model-backend.md) decisions 1, 3 and 5, accepted risk 4

---

## Goal

Build the backend interface, and one backend that implements it from recorded
fixtures and reaches no network.

This is not a mock in a test file. ADR-001 decision 3 makes it a first-class
backend with its own work item, because it carries Phases 3 through 5 and the
whole of Chat 8 while Phase 0 sits in review. If the stub is weak, the team
meets the loop's real behavior only after approval lands.

---

## Background

**The interface is the deliverable, and it must stay vendor-neutral.** §3.2 is
explicit: do not shape the tool declarations to one vendor's schema. If
Compliance blocks Vertex AI, the fallback is self-hosted vLLM (ADR-001,
decision 5), and provider neutrality is what makes that a configuration change
instead of a rewrite. Build nothing Vertex-specific until Chat 0 returns.

The practical test: story 2-A must be writable by someone who has not read the
`@google/genai` documentation. If a type name or a field name comes from that
SDK, it is wrong.

**Accepted risk 4 in ADR-001 names the required coverage.** The stub must serve
multi-iteration turns, a tool `401`, a tool `429` with `Retry-After`, a
malformed tool-call argument, and a turn that hits the iteration bound. Story
2-E owns exactly that list, so it is the story to resist cutting when the phase
runs long.

---

## Stories

### 2-A: The provider-neutral backend interface

One module of types and one interface. No implementation.

Define at least:

| Type | Purpose |
|---|---|
| `ChatMessage` | `{ role: 'system' \| 'user' \| 'assistant' \| 'tool', content: string, toolCallId?: string }` |
| `ToolDeclaration` | A name, a description, and a JSON-Schema parameter object |
| `ToolCall` | `{ id: string, name: string, arguments: unknown }` — `unknown`, because the model can emit a malformed argument (2-E) |
| `ToolResult` | `{ toolCallId: string, content: string, isError: boolean }` |
| `BackendChunk` | A discriminated union: a text piece, a tool-call request, or a turn end with a stop reason |
| `ModelBackend` | One method that takes messages plus declarations plus an `AbortSignal`, and returns an async iterable of `BackendChunk` |

Three rules:

1. **`AbortSignal` is a parameter, not an afterthought.** Story 1-F aborts a
   turn on disconnect and on shutdown, and the backend must honor it.
2. **The backend streams; it does not return a whole turn.** The route needs
   `token` frames as text arrives.
3. **No vendor name appears in this module** — not in a type, a field, a comment
   or an import.

Also define the error taxonomy the loop reports through the `error` event:
`backend_unavailable`, `backend_error`, `tool_error`, `bound_exceeded`,
`server_shutting_down`. Story 1-E already needs `server_shutting_down`; keep one
list.

**Files:** `server/src/chat/backend/types.ts`, `server/src/chat/backend/errors.ts`
**Effort:** 1d &nbsp;|&nbsp; **Risk:** Low, but a wrong shape here is expensive later

---

### 2-B: Fixture format and loader

Decide how a recorded turn is stored, and write the loader.

A fixture holds an input and a scripted response sequence:

```
server/test/fixtures/chat/<name>.json
```

Each fixture needs: a matching rule (which user message it answers), and an
ordered list of scripted steps. A step is either text to emit or a tool call to
request. A fixture with two steps separated by a tool call is a two-iteration
turn.

Design decisions to settle in this story:

- **Matching.** Exact string, or a normalized match? Start with exact, and add
  normalization only when a test needs it. State the choice in the loader's
  comment.
- **The unmatched case.** What does the stub do with a question no fixture
  covers? Recommend a loud failure: throw with the unmatched message quoted, so
  a missing fixture is obvious rather than silently answered.
- **Fixture reuse.** Phase 4 records its own evaluation fixtures. Use one
  format for both, so the harness and the stub read the same files.

**Files:** `server/src/chat/backend/fixtures.ts`, `server/test/fixtures/chat/`, `server/test/chatFixtures.test.ts`
**Effort:** 1d &nbsp;|&nbsp; **Risk:** Low

---

### 2-C: The stub backend — single-iteration happy path

Implement `ModelBackend` against the loader. The simplest turn: no tool call,
text streamed in several pieces, then a normal end.

Emit the text in more than one chunk. A stub that returns the whole answer in
one piece hides a client bug that only appears with real streaming.

Honor the `AbortSignal`: stop emitting, and end the iterable.

Tests: the chunks arrive in order; the concatenated text equals the fixture; an
aborted signal ends the iterable without further chunks.

**Files:** `server/src/chat/backend/stub.ts`, `server/test/stubBackend.test.ts`
**Effort:** 0.5d &nbsp;|&nbsp; **Risk:** Low

---

### 2-D: Multi-iteration turns

The case the loop actually exercises: the model asks for a tool, receives a
result, and continues.

The stub must:

1. Emit a tool-call chunk with a stable `id`.
2. Stop, and wait for the caller to append a `ToolResult` with the matching
   `toolCallId`.
3. On the next call, emit the next scripted step.

Cover a fixture with **two** tool calls in one turn, and a fixture with two
tool calls **in the same iteration**, because a model can request several at
once and the loop must handle both shapes.

Tests: a two-iteration fixture yields tool call, then text; the stub rejects a
`ToolResult` whose `toolCallId` does not match; a parallel-tool-call fixture
yields both calls before it waits.

**Files:** `server/src/chat/backend/stub.ts`, `server/test/fixtures/chat/`, `server/test/stubBackend.test.ts`
**Effort:** 1d &nbsp;|&nbsp; **Risk:** Medium — this shape drives every Phase 5 test

---

### 2-E: The five failure paths

ADR-001 accepted risk 4 names these, and they are the reason the stub is a
story rather than a mock. Each needs a fixture and a test.

| Path | What the stub does | What the loop must do (Phase 5) |
|---|---|---|
| Tool `401` | Requests a tool whose scripted result is a `401` | Emit `error`, close the stream. Do **not** destroy the session — see story 3-B. |
| Tool `429` with `Retry-After` | Requests a tool whose scripted result is a `429` carrying the header | Report the limit as a `status` event, do not retry inside the loop, end the turn (story 3-C) |
| Malformed tool-call argument | Emits a `ToolCall` whose `arguments` fail the declared schema | Reject before the upstream call, and either return the validation failure to the model or end the turn. Pick one in story 5-B and state it here. |
| Iteration bound tripped | Requests a tool forever | Emit `error` with `bound_exceeded` and stop (story 5-C) |
| Backend error mid-stream | Throws after two text chunks | Emit `error`, and never a `done` after it |

Write these fixtures now even though the loop that consumes them does not exist
yet. That is the point: Phase 5 gets its regression tests on the day it starts.

**Files:** `server/test/fixtures/chat/failures/`, `server/src/chat/backend/stub.ts`, `server/test/stubBackend.test.ts`
**Effort:** 1d &nbsp;|&nbsp; **Risk:** Medium — the story most likely to be cut, and the most costly to cut

---

### 2-F: Backend selection, and a clear `503` when none is configured

One factory reads the configuration and returns a backend.

- Tests, CI and Playwright get the stub. It must reach no network — assert
  that, do not assume it.
- Development and deployed environments get Vertex once Chat 9 builds it. Until
  then the factory has one real branch and one unimplemented branch.
- **When no backend is configured, `/api/chat` returns a clear `503`** (§4.2).
  Say what is missing in the message, the way `index.ts` already does for
  `DUOS_DB_HOST` and `DUOS_API_URL`.

The `503` runs **before the hijack** (ADR-002), so it is an ordinary JSON reply.

Follow the existing configuration idiom: read env vars in
`server/src/config.ts`, coerce booleans through `envBool`, and fail at startup
with an error that names the variable when a half-configured deployment would
otherwise boot and fail on first use.

Tests: no configuration gives a JSON `503`; the stub is selected under `CI`; the
stub opens no socket.

**Files:** `server/src/chat/backend/index.ts`, `server/src/config.ts`, `server/src/chat/route.ts`, `server/test/chatBackendSelection.test.ts`
**Effort:** 0.5d &nbsp;|&nbsp; **Risk:** Low

---

## Suggested sequencing

2-A first and alone: every other story imports it, and Phase 3 can start as
soon as it lands. 2-B before the three stub stories. 2-F can go last or in
parallel.

```
2-A ─→ 2-B ─→ 2-C ─→ 2-D ─→ 2-E
 └──────────────────────────→ 2-F
```

---

## Exit criteria

1. The interface module names no vendor, in no type, field, comment or import.
2. A fixture-driven turn streams text in several chunks.
3. A two-iteration fixture works, and so does a parallel-tool-call fixture.
4. All five failure fixtures from ADR-001 accepted risk 4 exist and are tested.
5. The stub opens no network socket, and a test asserts it.
6. An unconfigured backend gives a JSON `503` that names what is missing.
