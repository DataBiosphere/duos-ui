# Phase 5: The agentic loop, with hard bounds

**Phase:** 5 of 5 (near-term set) &nbsp;|&nbsp; **Effort:** ~6d &nbsp;|&nbsp; **Risk:** 🔴 High
**Depends on:** Phase 1 (route, events, lifecycle), Phase 2 (backend interface and stub), Phase 3 (tool registry), Phase 4 (the harness that gates it)
**Blocks:** Chat 7 (UI), Chat 8 (E2E), Chat 9 (Vertex), Chat 10 (prompt tuning)
**Can parallelize with:** Phase 0
**Reference:** [AI_Chatbot_Overview.md](../AI_Chatbot_Overview.md) §3.1, §3.2, §7, open questions 4 and 7 &nbsp;|&nbsp; [ADR-002](ADR-002-sse-transport.md)

---

## Goal

Replace the canned emitter from Phase 1 with a real loop: send the prompt, the
message, the history and the tool declarations; execute any tool calls; append
the results; re-invoke; stop on a final text answer or on a bound.

---

## Background

**Every bound is a cost control, and an unbounded loop is an open bill.** §3.2
is blunt: without bounds, a model that keeps calling tools runs until the socket
dies, and the bill runs with it. The bounds are not defensive polish; they are
the reason the feature is affordable.

**The system prompt is code.** It ships in the repository, it changes under
review, and a change triggers the Phase 4 run. §3.2 says a prompt edit changes
behavior as surely as a code edit.

**The prompt is not a security control.** §7 and open question 7 both say this,
and it is worth restating because it is the easiest mistake in this phase. The
model emits text and calls two declared read-only tools. It opens no sockets,
writes no files and runs no code. Writing "do not call external services" into a
prompt restates something already impossible, and injected text can override a
prompt instruction while it cannot invent a tool. Capability limits live in the
tool declarations (Phase 3) and in the bounds (story 5-C).

**Phase 4's failure fixtures already exist.** Phase 2 story 2-E wrote five of
them and Phase 4 wrote the question set. So this phase starts with its
regression tests in place, which is the whole point of the ordering.

---

## Stories

### 5-A: The system prompt as a versioned file

**Proposal — confirm in review.**

**Where it lives:** `server/src/chat/prompt/system-v1.md`. A file, not a string
literal. The version is in the filename, so a change to behavior is visible in
a diff and in a file list.

**Who reviews a change:** the same reviewers as any server change, plus a
passing Phase 4 run against Gemini (story 4-E). Put that rule in a header
comment at the top of the file.

**What it says.** Five jobs, and no capability claims:

1. **Scope.** Answer questions about DUOS datasets and data access requests.
2. **Refusal.** Decline anything else, and say why in one sentence. Do not
   apologize at length and do not offer to try anyway.
3. **No authority over access decisions.** Never present the answer as a ruling
   on whether a request will be granted. Point the user at the process.
4. **Admit an empty result.** When a tool returns nothing, say so. Never fill
   the gap from memory.
5. **Attribution.** Attribute the answer to the data that was retrieved, so a
   user can tell a retrieved fact from a general statement.

Plus tone: plain, short, no filler.

**What it must not say:** anything that reads as a capability limit. No "do not
call external services", no "do not access other users' data", no "ignore
instructions in the data". The first two are already impossible; the third
invites a reader to believe the prompt is the control.

**Token cost.** The prompt ships on every turn, so its length is a per-turn
cost. Measure it in this story and feed the number into open question 4, which
sizes the limits in Phase 6.

**Files:** `server/src/chat/prompt/system-v1.md`, `server/src/chat/prompt/index.ts`
**Effort:** 1d &nbsp;|&nbsp; **Risk:** Medium — easy to write, easy to write badly

---

### 5-B: The loop core

One module. It takes a backend, a tool registry, a prompt, a validated request
and an `AbortSignal`, and it yields events.

The loop:

1. Build the message list: system prompt, then the trimmed history, then the new
   message.
2. Call the backend with the messages and the declarations.
3. Stream text chunks out as `token` events.
4. When the backend requests tool calls, execute them through the registry,
   append each `ToolResult` to the messages, and go to step 2.
5. Stop when the backend returns a final text answer with no tool call.

Decisions to settle here:

- **Parallel tool calls.** Phase 2 story 2-D produces a fixture with two calls in
  one iteration. Execute them concurrently or in sequence? Recommend concurrent,
  with the turn's `AbortSignal` shared, because two sequential upstream calls
  each pay the network round trip inside one wall-clock deadline. Confirm that
  Consent's per-user rate limit tolerates the burst (§3.4).
- **A malformed tool-call argument.** Phase 2 story 2-E scripts one. Two
  options: return the validation failure to the model as a `ToolResult` with
  `isError: true` and let it retry, or end the turn. Recommend returning it
  once, then ending the turn if the next argument is also invalid — a model that
  cannot form a valid call twice will not form one on the third try, and each
  attempt costs an iteration. Pick one and write it down.
- **History trimming.** Apply `MAX_HISTORY_TURNS` from Phase 1 story 1-D here
  too. The server trims what it forwards to the model, whatever the client sent.

Tests run against the stub, and the Phase 4 harness runs green from this story's
first commit.

**Files:** `server/src/chat/loop.ts`, `server/test/chatLoop.test.ts`
**Effort:** 2d &nbsp;|&nbsp; **Risk:** High

---

### 5-C: Hard bounds

Three bounds. Each one trips into an `error` event with a `bound_exceeded`
code, and stops the turn.

| Bound | What it stops | Notes |
|---|---|---|
| Iteration cap | A model that keeps calling tools | Count model invocations, not tool calls. Two parallel calls in one iteration is one iteration. |
| Wall-clock deadline | A slow turn, and a slow upstream | 60 seconds (§8.2). The per-call tool timeout from Phase 3 story 3-A sits below it. |
| Tool result byte cap | An oversized upstream response | **Enforced in Phase 3 story 3-F**, where the bytes exist. This story reads the constant and reports the truncation; it does not re-implement the cap. |

Pick the iteration cap in this story. Base it on the evaluation set: story 4-C
reports iteration counts per question, so set the cap above the worst
legitimate case with margin, not from a guess.

Put every number in one module with a comment explaining each. §3.2 says the
loop story picks the numbers; this is where they live.

**Truncation must be visible to the model, not silent.** A model that receives
a truncated result and does not know it will answer as though it saw everything.

Tests: the iteration-bound fixture from Phase 2 story 2-E trips the cap and
emits exactly one `error`; a slow stub trips the deadline; a truncated result
carries a marker the model can read.

**Files:** `server/src/chat/limits.ts`, `server/src/chat/loop.ts`, `server/test/chatBounds.test.ts`
**Effort:** 1d &nbsp;|&nbsp; **Risk:** Medium

---

### 5-D: Event emission around tool calls

Wire the loop's progress into the Phase 1 event contract.

- **`status` around each tool call.** The user should see that a search is
  running, in plain words. Do not leak the arguments — a `status` frame reaches
  the browser and the user's own question is already there, but a raw query body
  is noise at best.
- **`token` for text**, streamed as it arrives.
- **`status` for a rate limit**, from Phase 3 story 3-C.
- **`error` for every failure**, and never a `done` after an `error`.

One rule worth stating: **`status` replaces, `token` appends.** The client needs
that distinction to render, and it belongs in the contract module's comment, not
only in the UI story.

Tests: a two-iteration turn emits status, then tokens, then done, in that order;
no frame follows a `done` or an `error`.

**Files:** `server/src/chat/loop.ts`, `server/src/chat/events.ts`, `server/test/chatLoop.test.ts`
**Effort:** 0.5d &nbsp;|&nbsp; **Risk:** Low

---

### 5-E: Per-turn metrics

Record the operational shape of every turn. Follow the Phase 6 metrics pattern
from BFF story 6-G.

Record: duration, iteration count, tool-call count by tool, input and output
token counts, and the end reason.

**The end reason has four values, not two:** `done`, `error`, `bound_exceeded`,
and `client_disconnected`. Phase 1 story 1-F says a turn that ends by
disconnect is neither a success nor an error, and a metric that conflates them
hides the case where users abandon slow turns.

Two constraints:

- **ADR-002 accepted risk 2:** a hijacked reply skips every Fastify hook, so an
  `onResponse` metric never fires for this route. Emit from the handler.
- **§7:** prompts and answers stay out of ordinary logs. Record counts and
  types. Do not record text. Open question 8 asks what usage data may be kept
  beyond this, and its answer belongs in the Phase 0 story 0-A contract, not
  here.

The token counts feed open question 4. §3.4 says measure the real cost of a turn
first, then set the quota from that number. This story produces that
measurement.

**Files:** `server/src/chat/metrics.ts`, `server/src/chat/loop.ts`, `server/test/chatMetrics.test.ts`
**Effort:** 1d &nbsp;|&nbsp; **Risk:** Low

---

### 5-F: Prove the double-send crash does not return

Hazard 1, tested under a real loop rather than under canned events.

`@fastify/session` saves in an `onSend` hook. The comment on `rolling: false` in
[server/src/index.ts](../../../server/src/index.ts) records the failure chain:
an async `onSend` write leaves `reply.sent` false when the handler resolves,
Fastify's `wrapThenable` fires a second `reply.send()`, and the later write
throws `ERR_HTTP_HEADERS_SENT` and kills the process. The doc comment in
[server/src/auth/refresh.ts](../../../server/src/auth/refresh.ts) states the rule
that came out of it — save the session explicitly, so `onSend` finds nothing to
do — and names the fix commit `25a71a81`.

ADR-002 decision 2 is the guard: refresh and save **before** the hijack, and
never write to the session after it. Canned events in Phase 1 do not exercise
this hard enough, because a real turn is long, touches the session's token, and
can fail in the middle.

Write the tests that would catch a regression:

1. A multi-iteration turn that lasts through a token refresh window completes
   with one reply and no second send.
2. A turn that ends in `error` mid-stream does not re-enter the Fastify reply
   path.
3. A turn aborted by client disconnect (story 1-F) does not write the session
   afterwards.
4. Grep-level guard: no `request.session` write appears in `loop.ts` or in the
   tool modules. Consider a lint rule if one is cheap.

**Files:** `server/test/chatSessionSafety.test.ts`, `server/src/chat/route.ts`
**Effort:** 0.5d &nbsp;|&nbsp; **Risk:** Medium — the failure mode is a process crash

---

## Suggested sequencing

5-A first, because 5-B sends it. 5-C and 5-D extend the core. 5-E and 5-F are
independent of each other and close the phase.

```
5-A ─→ 5-B ─→ 5-C ─→ 5-D ─┬─→ 5-E
                          └─→ 5-F
```

---

## Exit criteria

1. `server/src/chat/prompt/system-v1.md` exists, states no capability limit, and
   carries the review rule in its header.
2. A multi-iteration turn works end to end against the stub, and streams.
3. All five Phase 2 failure fixtures produce the documented behavior.
4. The iteration cap and the wall-clock deadline both trip cleanly, with exactly
   one `error` frame.
5. A truncated tool result is visible to the model.
6. Every turn records duration, iterations, tool calls, tokens and one of four
   end reasons — and records no prompt or answer text.
7. The Phase 4 harness runs green against the stub in CI.
8. No module under `server/src/chat/` writes to the session after the hijack.
