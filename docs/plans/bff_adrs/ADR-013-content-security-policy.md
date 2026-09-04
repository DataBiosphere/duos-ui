# ADR-013 — Security headers, and a Content Security Policy derived from runtime config

**Status:** Accepted (2026-08-31) &nbsp;|&nbsp; **Phase:** 5, story 5-F
**Related:** [ADR-004](ADR-004-api-proxy-layer.md) (the proxies that make ECM and TDR same-origin)
**Implemented by:** `server/src/security/` (duos-ui, DT-4021)

This record is written across the 5-F stack and grows with it. Story 5-F1 —
helmet's non-CSP headers — is recorded here. The report sink (5-F2), the policy
itself (5-F3), and the sidecar change (5-F4) add their sections as they land.

---

## Context

The server sent no security headers at all. Adding them is the last large
control in Phase 5, and the risky one: a header that is one value wrong does
not fail a test, it breaks sign-in for everybody or blanks a page for one user.

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

## Consequences so far

- Sign-in is the thing to watch on the first deploy of 5-F1, in a **legacy**
  environment. Every environment is legacy today.
- `contentSecurityPolicy` is explicitly `false` until 5-F3. The tests assert its
  absence, so the stack cannot quietly deliver half a policy.
