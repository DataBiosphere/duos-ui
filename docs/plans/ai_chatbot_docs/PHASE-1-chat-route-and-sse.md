# Phase 1: Stub `POST /api/chat` — route, CSRF and SSE

**Phase:** 1 of 5 (near-term set) &nbsp;|&nbsp; **Effort:** ~6.25d &nbsp;|&nbsp; **Risk:** 🟡 Medium
**Depends on:** BFF stories 5-F (Helmet + CSP), 5-G (rate limiting) and 6-D-pre (Playwright BFF sign-in). Story 1-A confirms all three.
**Blocks:** Phase 2 (the stub backend plugs into this route), Phase 5 (the loop replaces the canned events), Chat 7 (the UI)
**Can parallelize with:** Phase 0
**Reference:** [AI_Chatbot_Overview.md](../AI_Chatbot_Overview.md) §3.1, §5.2, §7, open questions 2 and 3 &nbsp;|&nbsp; [ADR-002](ADR-002-sse-transport.md)

---

## Goal

Land a real `POST /api/chat` that a browser can call, that streams, and that
emits canned events. No model and no tools yet. When this phase ends, the
transport is proven in dev and the event contract is fixed, so Phases 2 through
5 can fill the route without touching the plumbing again.

---

## Background

§3.1 lists four hazards the route inherits. Three of them are settled by
[ADR-002](ADR-002-sse-transport.md) and appear here as stories; the fourth is a
small independent fix.

| Hazard | Where it is handled |
|---|---|
| 1. `@fastify/session` `onSend` double-send | ADR-002 decisions 1–2; stories 1-C and 1-E; proved under a real loop in story 5-F |
| 2. Reverse-proxy idle timeout and buffering | Story 1-B |
| 3. `close()` waits for in-flight requests | Story 1-F |
| 4. The SPA fallback answers a mistyped `/api/*` with the client shell | Story 1-G |

Two constraints from the existing server shape every story here.

**Route registration lives inside two gates.** In
[server/src/index.ts](../../../server/src/index.ts), the session, cookie and
CSRF plugins register only when `DUOS_DB_HOST` is set, and the auth routes and
proxies register only when `bffEnabled` is true. `/api/chat` needs the session
and the CSRF plugin, so it registers in the same `bffEnabled` block, after
`fastify.register(fastifyCsrf, csrfPluginOptions)`.

**The `/api/*` path space is free.** The BFF proxies mount at `/duos-api/*`,
`/ecm/*`, `/tdr/*` and `/bard/*`. Nothing else claims `/api/*`, so the chat
route does not collide with a proxy prefix.

---

## Stories

### 1-A: Confirm the three BFF dependencies are live

A gate, not a build. Verify each in `develop` before the rest of the phase
starts, because each one changes a later story if it is missing or different.

| Dependency | What to check | Why it matters here |
|---|---|---|
| BFF 5-F — Helmet + CSP | `@fastify/helmet` is registered in `server/src/index.ts`, and read the `connect-src` directive | The chat UI must fit the CSP. Same-origin SSE fits `connect-src 'self'`, but confirm the directive says that. |
| BFF 5-G — rate limiting | `@fastify/rate-limit` is registered with `global: false` | Phase 6 keys a chat limit on the same plugin. A global cap would also throttle SPA asset loads. |
| BFF 6-D-pre — Playwright BFF sign-in | A Playwright harness signs in through the BFF flow | Chat 8's E2E test has no other sign-in route. The legacy `test/e2e/auth.spec.ts` background flow is dead under the BFF. |

Confirmed absent at commit `faf06354`: neither `@fastify/helmet` nor
`@fastify/rate-limit` is a dependency, and `server/src/index.ts` registers
neither. Treat this story as real work until that changes.

If 5-F or 5-G has not merged, Phase 1 still proceeds — neither blocks the route
itself. Record the gap and re-check before Chat 7 (UI) and Phase 6 (limits).

**Files:** none. Record the finding in this file.
**Effort:** 0.25d &nbsp;|&nbsp; **Risk:** Low

---

### 1-B: Prove SSE survives `httpd-terra-proxy`

Answers open question 2. Run this first, because a buffering proxy changes the
transport and therefore changes the client work in §5.2.

Build the smallest thing that answers the question: a route that hijacks the
reply and emits one frame per second for 90 seconds. Call it from a browser in
dev, through the real proxy, not through a direct port.

Measure four things:

1. **Does the first frame arrive immediately, or after the last one?** A frame
   that arrives on time proves the proxy does not buffer the body.
2. **Does an idle stream survive longer than 60 seconds?** Emit nothing for 75
   seconds and see whether the connection lives.
3. **What is the proxy's idle timeout?** Read it from the sidecar config rather
   than inferring it from a test.
4. **Does the keep-alive frame reset that timer?**

**Proposal — confirm in this story.** Apply these and report whether each was
necessary:

| Setting | Proposed value |
|---|---|
| Keep-alive frame | An SSE comment line, `:keep-alive`, every 15 seconds |
| `Content-Type` | `text/event-stream` |
| `Cache-Control` | `no-cache` |
| `Connection` | `keep-alive` |
| `X-Accel-Buffering` | `no` |
| Node socket timeout | 120 seconds, above the 60-second turn deadline |

If the proxy buffers whatever the headers say, stop and re-open ADR-002. The
WebSocket alternative is recorded there. If the proxy idle timeout is below 60
seconds, file the `terra-helmfile` change in this story rather than working
around it.

**Files:** a throwaway route, deleted at the end of the story; the finding goes in [ADR-002](ADR-002-sse-transport.md) and in §8.2 of the overview
**Effort:** 1.5d &nbsp;|&nbsp; **Risk:** Medium — the outcome can change the transport

---

### 1-C: Register the route with the CSRF, session and refresh guards

Create `server/src/chat/route.ts` and register it in the `bffEnabled` block of
`server/src/index.ts`, after the CSRF plugin.

Order matters, and ADR-002 explains why: the HTTP status commits at the first
byte, so **every check that can fail the turn runs before the hijack.**

1. `onRequest: fastify.csrfProtection` — the same option shape as
   `POST /auth/logout`. The session cookie is `SameSite=Lax`, and dev and
   staging share `broadinstitute.org` with sibling services, so this guard is
   mandatory at launch (§7).
2. Return `401` with a JSON body when `request.session.accessToken` is absent.
3. Refresh up front when the token expires inside `REFRESH_WINDOW_SECONDS`
   (60 seconds, exported from `server/src/auth/refresh.ts`). Follow the shape in
   `server/src/auth/me.ts`, which already does this outside the proxy layer.
   Distinguish the two failure modes the way `refresh.ts` documents them:
   `RefreshFailedError` means the session is dead, so answer `401`; anything
   else is transient, so answer `502`.
4. Call `request.session.save()` explicitly, then hijack. **Nothing writes to
   the session after the hijack.**

Tests: a missing CSRF header gives `403`; a wrong token gives `403`; no session
gives `401`; an expired-but-refreshable token refreshes once and proceeds; a
`RefreshFailedError` gives `401`; a transient refresh error gives `502`. Assert
that a failed check sends JSON and never an SSE frame.

**Files:** `server/src/chat/route.ts`, `server/src/index.ts`, `server/test/chatRoute.test.ts`
**Effort:** 1d &nbsp;|&nbsp; **Risk:** Low

---

### 1-D: Validate the request body

The client owns the transcript, so every entry is caller-controlled (§7). Treat
the whole body as hostile.

Accept exactly this shape:

```ts
{
  message: string,          // the new question
  history: Array<{ role: 'user' | 'assistant', content: string }>
}
```

Rules:

- **Reject any role except `user` and `assistant`.** Never accept a `tool` or
  `system` role from the client, and never re-execute a tool result that
  arrives in the body. A rejected role is a `400`, not a silent drop, because a
  silent drop hides a client bug.
- **Reject unknown properties.** A client that sends `toolResults` is either
  stale or hostile, and both deserve a `400`.
- **Set an explicit body size limit** on the route, below the Fastify default.
  Derive it from the history cap and a per-message character cap, and state the
  arithmetic in the code comment.
- **Cap the history.** *Proposal — confirm in review:* the last **10 turns**.
  Export one constant, `MAX_HISTORY_TURNS`, from a module both the client and
  the server import. The client trims before it sends. The server trims again
  and **does not reject** an over-long history, because a stale client tab
  should degrade rather than break. A history that exceeds the *body size limit*
  is still a `400` — that is a different bound, and it is a defence against
  volume, not against staleness.

Return every rejection as JSON before the hijack.

Tests: a `tool` role gives `400`; an extra property gives `400`; an 11-turn
history is trimmed to 10 and succeeds; an oversized body gives `413`; a missing
`message` gives `400`.

**Files:** `server/src/chat/requestSchema.ts`, `server/src/chat/limits.ts`, `server/src/chat/route.ts`, `server/test/chatRequestSchema.test.ts`
**Effort:** 1d &nbsp;|&nbsp; **Risk:** Low

---

### 1-E: The SSE event contract and a canned emitter

Fix the wire format now, because Phase 5 and Chat 7 both build against it.

Four event types, and no more:

| Event | Payload | Meaning |
|---|---|---|
| `token` | `{ text: string }` | A piece of the answer. Append it. |
| `status` | `{ phase: string, detail?: string }` | Progress the user should see, for example a tool call starting. Replace the previous status. |
| `done` | `{ }` | The turn finished normally. No further frames. |
| `error` | `{ code: string, message: string }` | The turn failed. No further frames. |

Build three pieces:

1. **A shared types module** that both the server and the client import, so the
   contract cannot drift. Put it where the client can reach it.
2. **A writer** that owns `reply.raw`: it formats a frame, writes it, tracks
   whether the stream has ended, and refuses to write after `done` or `error`.
   One place to write a frame means one place to get the framing right.
3. **A canned emitter** behind the route: a fixed `status`, a handful of
   `token` frames on a timer, then `done`. Phase 2 replaces it.

Two rules the writer enforces, both from ADR-002:

- **The handler catches its own errors.** `setErrorHandler` in `index.ts` never
  sees a fault after the hijack. An uncaught throw must become an `error` frame
  and a closed socket, never a hung connection.
- **`error` is the only channel for a mid-turn fault.** A tool `401`, a tool
  `429`, a tripped bound and a dead upstream all arrive as `error` on a `200`
  response.

Tests: frames parse as valid SSE; a write after `done` throws or is dropped, and
the test states which; a thrown error inside the emitter produces exactly one
`error` frame and ends the socket.

**Files:** `server/src/chat/events.ts`, `server/src/chat/sseWriter.ts`, `src/libs/chat/events.ts` (or a shared path both reach), `server/test/sseWriter.test.ts`
**Effort:** 1d &nbsp;|&nbsp; **Risk:** Low

---

### 1-F: Turn lifecycle — disconnect and shutdown

Stop spending on an answer nobody reads.

**On client disconnect.** Listen for `close` on `request.raw`. Abort the turn's
`AbortController`. In this phase the abort only stops the canned timer; from
Phase 5 it stops the model call and any in-flight tool call.

**On shutdown.** `fastify.close()` waits for in-flight requests, so one held
stream delays every rolling deploy (hazard 3). Keep a registry of open turns.
Add an `onClose` hook that aborts every open turn, emits a final `error` frame
with a `server_shutting_down` code, and ends each socket.

**A turn that ends by disconnect is neither a success nor an error.** Record the
distinction now, because story 5-E reads it.

Tests: a client that destroys the socket triggers the abort; the registry empties
when a turn ends normally, so it does not leak; `fastify.close()` with an open
turn resolves without waiting for the turn's natural end.

**Files:** `server/src/chat/turnRegistry.ts`, `server/src/chat/route.ts`, `server/src/index.ts`, `server/test/chatLifecycle.test.ts`
**Effort:** 1d &nbsp;|&nbsp; **Risk:** Medium — a leaked registry entry holds a deploy open

---

### 1-G: The SPA fallback must not answer `/api/*` with the client shell

Hazard 4, and independent of everything above.

`server/src/index.ts` ends with:

```ts
fastify.setNotFoundHandler((_req, reply) => reply.html())
```

So a mistyped `/api/chatt` returns the client HTML shell with a `200`. A fetch
client parses that as a failed JSON body and reports a confusing error. The BFF
proxies avoid this by encapsulating their own error handler (ADR-010); the chat
route needs the same protection at the not-found boundary.

Change the handler: when the path starts with `/api/`, answer `404` with the
JSON error shape the rest of the server uses. Everything else keeps
`reply.html()`.

Consider covering the proxy prefixes in the same guard — `/duos-api/`, `/ecm/`,
`/tdr/`, `/bard/`. Check first whether their encapsulated handlers already
catch the mistyped-path case; if they do, leave them alone and say so in the
commit message.

Tests: `GET /api/nope` gives a JSON `404`; `GET /some/spa/route` still gives the
HTML shell; `GET /health` is unaffected.

**Files:** `server/src/index.ts`, `server/test/index.test.ts`
**Effort:** 0.5d &nbsp;|&nbsp; **Risk:** Low

---

## Suggested sequencing

1-B first: it can change the transport, and every story after it assumes the
answer. 1-A is a quick gate that can run the same day. 1-G is independent and
can go at any point, including as a filler task.

```
1-A ─┐
     ├─→ 1-B ─→ 1-C ─→ 1-D ─→ 1-E ─→ 1-F
1-G ─┘  (independent; sequence anywhere)
```

---

## Exit criteria

1. `POST /api/chat` exists in dev behind `bffEnabled`, and a browser can call it.
2. A forged request without `X-CSRF-Token` gives `403`.
3. A signed-out request gives `401` as JSON, never as an SSE frame.
4. A stream emits its first frame immediately through the real reverse proxy,
   and survives longer than 60 seconds idle.
5. The four event types exist in one shared module that the client imports.
6. A client disconnect stops the turn, and `fastify.close()` does not wait for
   an open stream.
7. A mistyped `/api/*` path gives a JSON `404`.
8. No route on the chat path writes to the session after the hijack.
