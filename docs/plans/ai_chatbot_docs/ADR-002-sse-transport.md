# ADR-002 — Stream chat turns with SSE over a hijacked Fastify reply

**Status:** Proposed (2026-09-02) &nbsp;|&nbsp; **Work item:** Chat 1 (stories 1-B, 1-E, 1-F), Chat 5 (story 5-F)
**Related:** [AI_Chatbot_Overview.md](../AI_Chatbot_Overview.md) §3.1, §5.2, §7, open question 2
**Supersedes:** nothing

---

## Context

A chat turn takes seconds, not milliseconds. The model emits text one piece at
a time, and the loop calls tools between pieces. A user who waits for a whole
turn with no feedback reads a blank panel for up to a minute. So the server
must push partial results as it produces them.

Four constraints decide the transport. Each is a fact about this stack, not a
preference.

**Constraint 1 — the reply must be hijacked.** `@fastify/session` saves the
session in an `onSend` hook. Phase 2 of the BFF hit the failure this creates:
an async `onSend` write leaves `reply.sent` false when the route handler
resolves, Fastify's `wrapThenable` fires a second `reply.send()`, and the later
write throws `ERR_HTTP_HEADERS_SENT` and kills the process. The comment on
`rolling: false` in [server/src/index.ts](../../../server/src/index.ts) records
the whole chain. A route that writes to the raw socket for a minute and then
returns normally re-runs that crash. `reply.hijack()` removes the reply from
Fastify's lifecycle, so no `onSend` hook and no second send can fire.

**Constraint 2 — one reverse-proxy hop, which may buffer.** The app always
sits behind exactly one proxy: the `httpd-terra-proxy` sidecar in Kubernetes,
or the `proxy` container in compose. A proxy that buffers the response body
defeats streaming completely: the user still waits for the whole turn, and the
symptom looks like a slow model. A proxy idle timeout below the turn length
kills a healthy turn mid-answer.

**Constraint 3 — `EventSource` cannot POST.** A turn carries a message and a
history array, which is a request body. The browser's `EventSource` issues a
`GET` only, and it cannot set an `X-CSRF-Token` header. Putting a transcript
in a query string also breaks the privacy rule in §7.

**Constraint 4 — the session cookie is `SameSite=Lax`, so the route needs the
CSRF header guard.** That guard is a Fastify `onRequest` hook. Any transport
must keep the request an ordinary same-origin `POST` that carries the cookie
and the header.

## Decision

1. **`POST /api/chat` streams `text/event-stream` over a hijacked reply.** The
   handler calls `reply.hijack()`, writes the status line and headers to
   `reply.raw`, then writes SSE frames to `reply.raw` until the turn ends.
2. **The handler saves the session before it hijacks, and never after.** Any
   token refresh happens up front, followed by an explicit
   `request.session.save()`. After the hijack, nothing may write to the
   session. This is the direct answer to constraint 1.
3. **Four event types, and no more:** `token`, `status`, `done`, `error`. The
   set is a contract with the client, so it lives in one shared module and both
   sides import it.
4. **A keep-alive comment frame every 15 seconds.** An SSE comment line
   (`:keep-alive`) is legal, carries no event, and resets an idle timer at every
   hop. *Proposal — confirm in story 1-B.*
5. **Set `X-Accel-Buffering: no` alongside `Cache-Control: no-cache` and
   `Connection: keep-alive`.** *Proposal — confirm in story 1-B.*
6. **Set the socket timeout above the turn deadline.** The turn deadline is
   60 seconds (§8.2), so the socket timeout is 120 seconds. The proxy idle
   timeout must also exceed 60 seconds; story 1-B measures it and files the
   `terra-helmfile` change when it does not.
7. **The client reads the response body stream and parses SSE frames by hand.**
   No `EventSource`. This follows from constraint 3.
8. **Every turn holds an `AbortController` on both sides.** The client aborts
   on a closed panel or a new question. The server aborts the model call when
   `request.raw` emits `close`, and it aborts open streams on shutdown.

## Consequences

- **The route sits outside Fastify's normal error path.** `setErrorHandler` in
  `index.ts` never sees a fault after the hijack, because the reply is no longer
  Fastify's. The handler must catch its own errors, emit an `error` frame, and
  end the socket. Story 1-E owns that shape.
- **A held stream delays every rolling deploy**, because `fastify.close()` waits
  for in-flight requests. Hazard 3 in §3.1. The turn deadline bounds the delay
  to 60 seconds, and story 1-F adds the shutdown abort so a deploy does not
  wait even that long.
- **The HTTP status is committed at the first byte.** Once a frame is sent, the
  turn cannot become a `500`. Every check that can fail a turn — no session, no
  access token, a refused CSRF token, a rate-limit rejection, no configured
  backend — must run before the hijack and answer with ordinary JSON. Story 1-C
  fixes that order.
- **The `error` event is the only channel for a mid-turn fault.** A tool 401, a
  tool 429, a tripped bound and a dead upstream all arrive as `error` frames on
  a `200` response. The client must treat an `error` frame as seriously as a
  failed request.
- **Metrics need the stream's own end.** A turn that ends because the client
  disconnected is not a success and not an error. Story 5-E records the
  distinction.

## Accepted risks

1. **The proxy behavior is unverified today.** Open question 2 is still open,
   and decisions 4 through 6 are proposals. If `httpd-terra-proxy` buffers the
   body whatever the headers say, the fallback is decision 1 of the rejected
   alternatives below, and the client work in §5.2 changes with it. Story 1-B
   runs first in Chat 1 for this reason.
2. **A hijacked reply skips every Fastify hook, not only `onSend`.** Anything
   the team later adds as an `onSend` or `onResponse` hook — an access log, a
   metric, a header — will not apply to `/api/chat`. Story 5-E must emit its
   metrics from the handler.
3. **A missed `request.session.save()` loses a refreshed token silently.** The
   session write must complete before the hijack. Story 5-F tests this under a
   real multi-iteration loop, not only under canned events.

## Alternatives considered

**Chunked JSON lines over a plain `reply.send(stream)`.** Rejected. It solves
nothing that SSE does not, and it loses the framing. SSE gives named event
types, comment frames for keep-alive, and one well-known parse. A raw stream
sent through `reply.send()` also keeps the reply inside Fastify's lifecycle,
which re-opens constraint 1.

**WebSocket.** Rejected for v1. It is a real answer to buffering, and it would
survive a hostile proxy. But it costs more than it returns here: the traffic is
one-directional after the request, the upgrade needs its own CSRF story because
the `X-CSRF-Token` header guard does not apply to a socket, `@fastify/websocket`
is a new dependency, and the CSP needs a `connect-src` change. SSE to the same
origin already fits `connect-src 'self'` (§7). Revisit only if story 1-B proves
the proxy buffers.

**Submit a turn, poll a job id.** Rejected. It needs durable per-turn state,
which means a table, which means the Consent schema question in open question 6
arrives four phases early. It also gives a worse experience than either
streaming option, and it multiplies the request count against the rate limit
in §3.4.

**`EventSource` on a `GET` with the message in the query string.** Rejected on
constraint 3 and on §7. A transcript in a URL reaches access logs and browser
history, and `EventSource` cannot send the CSRF header.
