# ADR-013 — Security headers, and a Content Security Policy derived from runtime config

**Status:** Accepted (2026-08-31) &nbsp;|&nbsp; **Phase:** 5, story 5-F
**Related:** [ADR-004](ADR-004-api-proxy-layer.md) (the proxies that make ECM and TDR same-origin)
**Implemented by:** `server/src/security/` (duos-ui, DT-4021)

This record is written across the 5-F stack and grows with it. Stories 5-F1
(helmet's non-CSP headers) and 5-F2 (the report sink) are recorded here. The
policy itself (5-F3) and the sidecar change (5-F4) add their sections as they
land.

---

## Context

The BFF server sent no security headers, those are being provided by the
standard Terra proxy. Adding them is the last large control in Phase 5,
and the risky one: a header that is one value wrong does not fail a test,
it breaks sign-in for everybody or blanks a page for one user.

The app also still runs in two modes. Under `bffEnabled` sign-in is a top-level
redirect. A legacy deployment opens a popup, sends it to B2C, and reads the
result back through `window.opener`. One set of header values cannot be correct
for both.

## Decision, part 1 — helmet's non-CSP defaults are set deliberately

`@fastify/helmet` registers ahead of every route and outside both cutover
switches, because a legacy deployment needs these headers just as much. Two of
its defaults would break flows this app depends on.

### `Cross-Origin-Opener-Policy` is off in legacy mode

Not `same-origin`, and not `same-origin-allow-popups` either. `-allow-popups`
reads like the safe middle ground for a popup sign-in and is not one. This was
measured rather than assumed.

The token spares a popup only on its **initial** navigation, and only while the
popup's own document is `unsafe-none`. The return leg from B2C is a different
comparison: the popup's current document is B2C's (`unsafe-none`) and the
incoming one is ours (COOP set). That mismatches, so the browser swaps browsing
context groups and `window.opener` becomes null. `oidc-client-ts` then throws on
`postMessage`, the opener never hears back, and `signinPopup()` never resolves.

Measured in Chromium across two local origins with a cross-origin hop between:

```
COOP on callback  : openerNull=true,  postMessage threw, opener saw nothing
COOP off (control): openerNull=false, postMessage fine,  opener got the message
```

**COOP is not part of the CSP and has no report-only mode.** Nothing in 5-F3
would have caught this. It breaks sign-in on the first deploy, in every
environment, since none has `bffEnabled` on yet. That is why 5-F1 ships alone:
it can be deployed and sign-in verified before anything else rides on it.

Legacy deployments therefore get no COOP at all until Epic 6 retires that flow.
Under `bffEnabled`, sign-in has no popup and no opener, so it keeps
`same-origin-allow-popups`.

### `Cross-Origin-Embedder-Policy` stays off

COEP demands a CORP or CORS header on every cross-origin subresource. The banner
bucket and the two direct upstreams send neither, so enabling it would block
them. It stays off until those become same-origin (5-F6).

### HSTS is production-only

Gated on `NODE_ENV`, not on the transport, so `pnpm start:server` cannot pin a
developer's browser to https for a year. A docker-compose stack runs as
production and does send it; browsers ignore HSTS delivered over plain HTTP, so
that costs nothing there.

### The rest

`Cross-Origin-Resource-Policy: same-origin`, `Referrer-Policy: no-referrer`, and
`X-Frame-Options: DENY`. The deployed httpd sidecar also sets the last two, and
its values win — ours are what a local or compose run gets, where there is no
proxy at all.

## Decision, part 2 — the violation report sink is bounded six ways

`reportOnly: true` on its own collects nothing centrally, so the policy needs a
real endpoint to report to. `POST /csp-report` lands before the policy, and is
inert until 5-F3 points a browser at it.

It is an unauthenticated POST that anyone on the internet can reach, and
everything it accepts reaches the pod's logs. Six controls bound that:

1. An 8 KB body limit, enforced by Fastify before the parser runs.
2. Exactly two accepted media types; everything else gets 415 without reaching
   a handler.
3. A cap on how many reports one request may contribute. Neither content-type
   parser checks the body's shape, so an 8 KB array of minimal entries — around
   170 of them fit — is one request that would otherwise write 170 lines.
4. A logged-field allowlist, each value truncated and stripped of control
   characters. Unknown keys never reach the log.
5. A fixed-window log budget charged once per **request**, not once per report.
6. A per-client rate limit through `@fastify/rate-limit`, at 30 requests a
   minute, refusing the rest with a bare 429.

Controls 3, 5 and 6 exist because the obvious design fails in both directions.
Charging the budget per *report* lets a single 8 KB POST a minute exhaust the
window and silently drop every genuine report — the security-monitoring
equivalent of switching the sink off, for the cost of one request a minute. And
a budget alone bounds only what is *written*: without a rate limit the endpoint
still reads and parses everything it is sent.

Fastify's own per-request logging is switched off for this route
(`logLevel: 'silent'`). Without it, every POST — including the 415s and 413s
rejected before any handler runs — still emits an `incoming request` /
`request completed` pair that none of the six controls bounds. The report lines
go through `app.log` rather than `request.log` as a result: a route level
*pins* rather than raises, so logging at `warn` to keep `request.log` would have
overridden a deployment that deliberately configured a lower level.

The plugin registers `global: false`. This instance also serves every SPA asset
and one page load fetches many, so a global cap sized for this endpoint would
block page loads. Story 5-G attaches the auth-route limits to the same
registration. The store is per process, so a deployment's real ceiling is these
numbers times the replica count, and it resets on every restart — which is why
the epic puts flood protection at the ingress and treats this as the backstop.

The sink always answers 204, so it is no kind of oracle, and every rejection —
413, 415, 429 — carries the status alone rather than a framework error code.
The route sets its own error handler to get that: `index.ts` installs the
app-level one after this plugin registers, so Fastify never resolves it here.

## Consequences so far

- Sign-in is the thing to watch on the first deploy of 5-F1, in a **legacy**
  environment. Every environment is legacy today.
- `contentSecurityPolicy` is explicitly `false` until 5-F3. The tests assert its
  absence, so the stack cannot quietly deliver half a policy.
- `/csp-report` is live and reachable before anything reports to it. That is
  deliberate — it means 5-F3 changes one flag rather than adding an endpoint and
  a policy at once.
