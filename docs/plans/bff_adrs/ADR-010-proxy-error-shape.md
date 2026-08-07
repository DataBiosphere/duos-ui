# ADR-010 — The proxy scope declares its own error shape, preserving CSRF as the one client-actionable code

**Status:** Accepted (2026-08-07) &nbsp;|&nbsp; **Phase:** 3, story 3-E(c)
**Related:** [ADR-004](ADR-004-api-proxy-layer.md) (the encapsulation this works around), [ADR-009](ADR-009-state-changing-gets.md) (the CSRF guard whose rejections this shapes)
**Consumed by:** Phase 4, story 4-D — the fetch layer's CSRF refetch-and-retry keys on the code decided here

---

## Context

The proxy is registered with `fastify.register(apiProxy)` and deliberately **not**
wrapped in `fastify-plugin`: `removeAllContentTypeParsers()` has to apply to the
proxy's routes and nowhere else, or `/auth/*` loses its JSON parsing. That makes
the proxy an encapsulated child context.

A child context copies the error handler that exists when it is created.
`index.ts` calls `setErrorHandler` near the end of `buildApp()`, *after*
`register(apiProxy)` — so the proxy captured Fastify's **default** handler and
the app's sanitizing one never reaches it. The `/auth/*` routes are declared on
the root instance, so they do get it. The asymmetry is the proxy's alone.

Verified by experiment on Fastify 5, both orderings:

```
setErrorHandler AFTER  register(apiProxy)
  CSRF rejection  →  403 {"statusCode":403,"code":"FST_CSRF_INVALID_TOKEN","error":"Forbidden","message":"Invalid csrf token"}
  proxy-path bug  →  500 {"statusCode":500,"error":"Internal Server Error","message":"<the thrown message>"}

setErrorHandler BEFORE register(apiProxy)
  CSRF rejection  →  403 {"error":"An unexpected error occurred."}
  proxy-path bug  →  500 {"error":"An unexpected error occurred."}
```

So CSRF rejections did reach the browser with a usable code — but by accident,
and nothing else from the scope was sanitised either: an unexpected 500 from a
bug on a proxy path returned its `message` (no stack) rather than the generic
body the rest of the app returns. **The defect is that the shape was incidental
rather than chosen**, and the 500's leaked message is what it cost.

### What the client actually needs

Phase 4's fetch layer refetches a CSRF token and retries once when the guard
rejects a request. It cannot key that on the status, because **403 is ambiguous
through this proxy**: an upstream authorization denial from the DUOS API is an
ordinary proxied response and arrives as a 403 with the upstream's own body,
never touching the error handler. Retrying on the status alone would replay
every write Consent refused.

So the client needs a positive, stable discriminator in the body — and that is
the only thing about a proxy error it needs.

## Decision

**A scope-local error handler inside `apiProxy`,** which preserves CSRF as the
one machine-actionable failure and sanitises everything else to the same body
the root handler returns.

```
403  { "error": "csrf_validation_failed", "reason": "missing_secret" | "invalid_token" }
5xx  { "error": "An unexpected error occurred." }
```

Both plugin codes are allowlisted — `FST_CSRF_MISSING_SECRET` and
`FST_CSRF_INVALID_TOKEN` — and both map to the same `error`, because both call
for the same single retry. `reason` is diagnostic, not contractual: it separates
the two for a human reading a network tab (a missing secret is what a Phase 5
session rotation will look like), and it is what lets the tests assert *which*
rejection fired — the drift story 3-D's review caught, where cases meant to
exercise one path had silently moved onto the other.

The generic body is shared as `GENERIC_ERROR_BODY` in `server/src/errors.ts`
rather than written out in both handlers: the point of the second branch is that
the browser cannot tell which scope failed, and two string literals drift
invisibly.

### The plugin's error code is not on the wire

`FST_CSRF_*` stays in the log line and out of the response. It is
`@fastify/csrf-protection` internals, renameable on a major bump — and `code` in
an error body already means something else to this client:
[`DataAccessRequestApplication.tsx:559`](../../../src/pages/dar_application/DataAccessRequestApplication.tsx)
reads it as *"the upstream sent a structured error, so its `message` is safe to
render as markdown"*. Nothing breaks either way, since the CSRF body carries no
`message`, but publishing under a BFF-owned key costs nothing and needs no client
type change.

## Alternatives rejected

**Move `index.ts`'s `setErrorHandler` above the BFF registrations.** One line,
and it does fix the leaked message. Rejected because it flattens the CSRF
rejection into the generic body, which is the one distinction the client needs.

Recorded accurately because it is the obvious objection to the option chosen:
the blast radius of moving that line is **exactly the proxy scope**. Every plugin
registered before it wraps itself in `fastify-plugin` and so already runs in the
root scope, `@fastify/vite` included; `apiProxy` is the only encapsulated child
in the app. The case against it is the 403 ambiguity alone — lossy, not risky.

**Leave the incidental shape and document it.** Rejected: the leaked `message`
on an unexpected 500 is a real (if minor) disclosure, and a shape that depends
on plugin registration order is one refactor away from changing silently.

**Reject CSRF failures in the `onRequest` hook instead of an error handler.**
Works for the expected case, but leaves the unexpected-500 sanitising still to be
solved — the same amount of code in two places instead of one.

## Consequences

- The client gets one thing to branch on: `error === 'csrf_validation_failed'`.
  Phase 4, story 4-D must key its single retry on that and **not** on "any 403" —
  the story text said the latter and has been corrected.
- No change is needed to `fetchAdapter`'s `ErrorData` type. Had the Fastify code
  been exposed, `code` would have had to widen to `number | string`.
- Anything else the proxy scope throws is indistinguishable from a failure
  elsewhere in the app, which is the intent. Operators read `request.log`, which
  carries the real error and the request id.
- `reply.from`'s transport failures never reach this handler —
  `onUpstreamTransportError` answers those with 502 `upstream_unavailable` — so
  the generic branch means a bug on a proxy path.
- The five CSRF assertions added by story 3-D's review were pinning Fastify's
  default serialisation, which their own comment admitted was "what this harness
  exposes". They now assert the body above, against a harness that registers the
  app's real handler ordering.

## Revisit when

- `@fastify/csrf-protection` changes its error codes — the allowlist is the only
  place that names them, and a rename there fails the tests loudly.
- The proxy stops being encapsulated (if raw-body handling ever moves), at which
  point the scope-local handler becomes redundant rather than wrong.
- A second client-actionable proxy failure appears. The shape extends by adding
  an `error` code, not by widening what `reason` means.
