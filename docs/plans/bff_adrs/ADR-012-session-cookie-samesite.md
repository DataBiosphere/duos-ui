# ADR-012 — Session cookie is `SameSite=Lax`, with session-bound CSRF tokens closing the gap Lax leaves

**Status:** Accepted (2026-08-31) &nbsp;|&nbsp; **Phase:** 1 (the cookie), 2–4 (the CSRF tokens), recorded in [DT-3996](https://broadworkbench.atlassian.net/browse/DT-3996)
**Related:** [ADR-001](../BFF_Overview.md#adr-001--postgresql-backed-sessions-via-fastifysession) (the session cookie itself), [ADR-009](ADR-009-state-changing-gets.md) (the GET residual Lax deliberately leaves open), [ADR-004](ADR-004-api-proxy-layer.md) (the proxy the CSRF tokens guard)
**Audience:** this is also the written answer to the infosec review question, linked from DT-3996 — start at [The infosec question, answered](#the-infosec-question-answered).
**Config:** `server/src/session/sessionOptions.ts` &nbsp;|&nbsp; **Tests:** `server/test/auth.test.ts` § *SameSite on the B2C callback redirect*

---

## The infosec question, answered

**Question:** the DUOS BFF session cookie is set with `SameSite=Lax`. Why not
`Strict`?

**Answer:** `Strict` is not a stricter version of what we have — it breaks
sign-in outright, in every browser. B2C returns from authentication with a `302`
to `GET /auth/callback`, which is a cross-site top-level GET navigation; `Strict`
withholds the session cookie from exactly that shape, so the callback arrives
with an empty session, without the PKCE verifier or the expected `state`, and
`openid-client` rejects the response. No user can sign in.

`Lax` withholds the cookie from the requests that matter for classic CSRF —
cross-site POSTs, credentialed cross-site `fetch`, cross-site subresource loads —
but it does **not** withhold it from a sibling subdomain: SameSite compares
registrable domains, so every other service under `*.broadinstitute.org` is
*same-site* and receives the cookie on requests of any method. A `Strict` cookie
would not have helped there either, for the same reason.

That gap is closed by **session-bound CSRF tokens**, which do not depend on the
registrable domain: the token is derived from a secret in the session and must
arrive in an `X-CSRF-Token` header, which no cross-origin form, navigation, or
`no-cors` request can set. Together with `HttpOnly`, `Secure` in production, and
the PKCE `state` binding on login, that is the control set. The rest of this
document is the evidence, the alternatives (including the one design that does
yield a `Strict` session cookie), and the standing assumptions.

---

## Context

The BFF session cookie carries the user's whole identity: an opaque session ID
whose row holds the access token, refresh token, and `userId`. Its `SameSite`
attribute therefore decides which cross-origin requests can act as that user.

Until this ADR, the choice of `Lax` over `Strict` was recorded only in a code
comment. Infosec review asked the obvious question — *why not `Strict`?* — and
the comment is not a place a reviewer can find, or an auditor can trust to still
be true. This document is the durable answer.

### What the two values mean, request shape by request shape

Per [RFC 6265bis](https://datatracker.ietf.org/doc/html/draft-ietf-httpbis-rfc6265bis),
"site" means the **registrable domain**, not the origin:

| Request shape | `Lax` | `Strict` |
|---|---|---|
| Same-site request of any method — **a sibling `*.broadinstitute.org` service included** | sent | sent |
| Cross-site top-level GET navigation — a plain `<a href>`, `window.open`, or a `302`; this is the B2C callback | **sent** | withheld |
| Cross-site POST — an auto-submitting `<form>` on an attacker domain | withheld | withheld |
| Cross-site credentialed `fetch`/XHR | withheld | withheld |
| Cross-site subresource load — `<img>`, `<script>` | withheld | withheld |

One row is not SameSite's job at all: page script reading the cookie for
exfiltration is covered by `HttpOnly`, which the cookie also carries.

### Why `Strict` is unusable

The OAuth flow depends on the one row where `Lax` and `Strict` differ:

1. `POST /auth/login` generates the PKCE verifier and the `state`, writes both to
   the session, saves it, and returns B2C's authorization URL
   (`server/src/auth/login.ts`).
2. The browser navigates to B2C. `b2clogin.com` and `*.broadinstitute.org` are
   different registrable domains.
3. B2C answers with a `302` to `GET /auth/callback` — a **cross-site, top-level
   GET navigation**, because the navigation was initiated by B2C's document, not
   by ours.
4. `Lax` sends the session cookie on that request. `Strict` withholds it.

With `Strict`, step 4 hands `/auth/callback` a fresh, empty session.
`authorizationCodeGrant` then receives `pkceCodeVerifier: undefined` and
`expectedState: undefined`, and openid-client rejects the response outright —
its `validateAuthResponse` treats *any* `state` parameter as unexpected when no
`expectedState` was supplied. **Every login fails, in every browser.** It is not
a degraded mode; sign-in does not work at all.

Verified by investigation on 2026-08-14, and now executable: the two tests in
`server/test/auth.test.ts` read the `SameSite` attribute the app actually sets
and model the browser's decision for that redirect, so setting `sameSite:
'strict'` in the shared config fails the suite at exactly the cookie-withheld
step.

### Why `Lax` alone is not enough

`Lax` blocks cross-site POSTs and credentialed cross-site `fetch`, which covers
the classic forged-form CSRF from an unrelated attacker domain. It does **not**
cover the two rows above where the cookie is still sent:

- **Sibling subdomains.** Dev and staging live under `*.broadinstitute.org`
  alongside many other services, and SameSite treats every sibling under that
  registrable domain as *same-site*. A compromised or hostile sibling service can
  issue cookie-bearing POSTs to the BFF, and `Lax` will attach the session
  cookie. Nothing about the attribute distinguishes a sibling from the app
  itself — and, to repeat the point the alternatives return to, `Strict` would
  not either.
- **Top-level cross-site GET.** `Lax` sends the cookie on those *by design* —
  that is the property the callback relies on. It is also what makes an upstream
  endpoint that mutates state on GET forgeable by a plain link, which is
  [ADR-009](ADR-009-state-changing-gets.md)'s subject: `GET /api/nih/sync` and
  `GET /api/user/me` both mutate state upstream and are reachable through the
  proxy. The real fix is upstream
  ([DT-3945](https://broadworkbench.atlassian.net/browse/DT-3945)); story 5-B's
  Fetch Metadata allowlist closes it for browsers that send those headers.

The sibling-subdomain row is the one we rate higher: it needs no upstream bug to
exploit, it applies to unsafe methods rather than two specific GETs, and it is
live in the environments we actually run in.

## Decision

**`SameSite=Lax` on the session cookie, plus session-bound CSRF tokens on every
cookie-authenticated unsafe route.** Neither control is sufficient alone;
together they cover the shapes each one misses.

The pieces, and where they live:

| Control | Covers | Where |
|---|---|---|
| `SameSite=Lax`, `HttpOnly`, `Secure` (production), `Path=/` | cross-site POST/`fetch`; script access to the cookie | `server/src/session/sessionOptions.ts` |
| Session-bound CSRF token, header-only (`X-CSRF-Token`) | unsafe methods from any origin, **sibling subdomains included** | `server/src/auth/csrf.ts`; enforced on `POST /auth/logout` and on every unsafe proxied request that carries session-derived credentials — two unauthenticated exemptions, named below |
| PKCE `state` bound to the session | login CSRF | `server/src/auth/login.ts` + `callback.ts` |
| Fetch Metadata allowlist | the state-changing-GET residual, on browsers that send the headers | `server/src/security/fetchMetadata.ts` (story 5-B) |

Three of those need a word of explanation.

**CSRF tokens do not depend on the registrable domain.** The token is minted
from a secret in the session and must arrive in a custom header, which no
cross-origin form or navigation can set and which a `no-cors` request cannot
add. That is what closes the sibling-subdomain hole SameSite cannot see. The
header-only narrowing and the reason for it are in `server/src/auth/csrf.ts`.

**Coverage is every *cookie-authenticated* unsafe route, with two named
exemptions.** The token is required on `POST /auth/logout`
(`server/src/index.ts`) and on every unsafe method through all four proxies —
DUOS API, ECM, TDR, Bard — except the two entries in
`CSRF_EXEMPT_UNSAFE_REQUESTS` (`server/src/proxy/apiProxy.ts`):
`POST /support/request` and `POST /support/upload`, the signed-out Contact Us
form. Those two are safe to exempt because they receive no session-derived
credentials and so cannot borrow the signed-in user's authority: both paths are
also in `UNAUTHENTICATED_PATHS`, so the proxy injects no `Authorization` header
even when a session exists, and the request leg (`rewriteRequestHeaders` in
`server/src/proxy/upstreamProxy.ts`) strips the caller's own `cookie` and
`authorization` before forwarding. A forged write to either path therefore
reaches the upstream unauthenticated — a request anyone can already make without
a victim, borrowing nothing — which is the only thing CSRF protects. The
exemption is keyed on method *and* path, so it cannot widen to an unsafe method
against one of the read-only allowlisted paths, and an unauthenticated unsafe
path added to the allowlist but not to the exemption set fails closed with
`MissingCSRFSecretError` rather than being quietly waived. The ECM, TDR, and
Bard proxies exempt nothing.

**`/auth/login` is deliberately CSRF-exempt, and login CSRF is neutralized by
the state binding instead.** An attacker can cause a victim's browser to start a
login, but not to finish one as the attacker: the `state` and PKCE verifier are
written to the victim's own session at step 1 and read back from that same
session at step 3, and openid-client rejects a `state` that does not match. An
authorization code obtained in the attacker's own browser cannot be redeemed
against the victim's session, because the session it needs holds a different
`state`. This is proven against a real openid-client and a fake B2C in
`server/test/authCrypto.test.ts` ("rejects a tampered state").

### Assumption this rests on: `response_mode=query`

`Lax` rescues the callback only because B2C returns via **GET**. That is the
authorization-code flow's default response mode, and `server/src/auth/login.ts`
passes `response_mode: 'query'` explicitly to `buildAuthorizationUrl` rather
than relying on the default, so the assumption is a stated parameter instead of
an implicit one. With `response_mode=form_post`, the redirect back would be a
cross-site **POST**, and `Lax` withholds the cookie from those too — so login
would break exactly as it does under `Strict`, and no SameSite value short of
`None` would fix it.

**What a test can catch, and what it cannot.** `server/test/auth.test.ts`
asserts the `response_mode` the BFF sends and derives the simulated callback's
HTTP method from it, so changing that parameter to `form_post` **in this
repository** turns the suite red at the cookie-withheld step. That is the limit
of what any test here can see. The response mode is ultimately a property of the
**Azure B2C policy**, and a change made on the B2C side — a policy edit, a new
user flow, a tenant migration — is invisible to this repository and to its CI:
no test can fail on it. **A B2C-side change of response mode can only be caught
by a human reading this ADR.** That is why the assumption is written here as
well as beside the attribute in `server/src/session/sessionOptions.ts` and in
the test's browser model — anyone touching the B2C policy or
`buildAuthorizationUrl` must revisit this document.

## Alternatives considered

### 1. `SameSite=Strict` on the session cookie — rejected

Breaks sign-in outright, as above. This is the option the infosec question asks
about, and it is not a trade-off: there is no benefit to weigh, because the
application does not function.

### 2. `Strict` session cookie + a separate short-lived `Lax` transaction cookie — rejected for now

The one design that gets a `Strict` session cookie. Split the state in two:

- a `Strict` session cookie carrying identity (tokens, `userId`), which no
  cross-site navigation can ever present; and
- a second, `Lax`, short-lived cookie carrying **only** the OAuth transaction —
  either the PKCE verifier/state/`returnTo` directly, or a random key into a
  `oauth_transactions` row — cleared at the end of the callback.

It is coherent, and it is worth being precise about what it would and would not
achieve, because the two are easy to conflate:

- **It would reduce the ADR-009 GET residual.** A `Strict` session cookie is
  withheld from cross-site top-level GET navigations, which is exactly the shape
  [ADR-009](ADR-009-state-changing-gets.md) accepts as residual risk:
  `GET /api/nih/sync` and `GET /api/user/me` mutate state upstream and are
  reachable through the proxy, so a link on an attacker's page can drive them
  today. Under a `Strict` session cookie those forged navigations would arrive
  without credentials. That benefit is real, and it holds on **every** browser —
  including the older ones that send no Fetch Metadata headers and therefore fall
  straight through story 5-B's allowlist.
- **It would not touch the sibling-subdomain threat.** Sibling origins under
  `*.broadinstitute.org` are *same-site*, and a `Strict` cookie is sent on
  same-site requests exactly as a `Lax` one is. The control that stops a hostile
  sibling is the session-bound CSRF token, which we have either way.

Rejected on cost against benefit:

- **The benefit is on the lower-priority threat, and mostly already bought.**
  The gap it narrows is the state-changing GETs; the gap it leaves untouched is
  the sibling subdomain, which we rate higher (see § Context). Modern browsers
  already have the GET residual closed by the Fetch Metadata allowlist (story
  5-B), so the exposure this design would remove is confined to browsers that
  send no `Sec-Fetch-*` headers.
- **The state-changing GETs should be fixed where they are.** Making the sync
  side effect a POST, or removing it from `GET /api/user/me`, is a small upstream
  change ([DT-3945](https://broadworkbench.atlassian.net/browse/DT-3945)) that
  eliminates the residual for every client and every browser. Reshaping the BFF's
  cookie architecture to compensate for an upstream verb choice is the more
  expensive fix in the wrong place.
- **It adds a second stateful mechanism** to the auth flow — a second cookie
  with its own lifetime, its own clearing logic on all four exit paths (success,
  user cancel, provider error, abandonment), and, in the keyed variant, a second
  table with its own expiry job. Session fixation and rotation
  (`regenerate()`, story 5-C) would need to reason about both cookies.
- **It moves the failure mode from "obvious" to "subtle."** Today a SameSite
  mistake breaks every login on the first try. With two cookies, a
  lifetime or clearing bug produces intermittent, browser-dependent login
  failures.

Worth revisiting if DT-3945 stalls and the browsers without Fetch Metadata
support still matter to the threat model, or if a *new* cross-site top-level
navigation that changes state at the BFF appears — that is the one attack shape a
`Strict` attribute stops and a CSRF token cannot.

### 3. `__Host-` cookie-name prefixing — optional hardening, out of scope here

`__Host-sessionId` makes the *browser* enforce `Secure`, `Path=/`, and host-only
scope. Its real value is against the sibling-subdomain threat this ADR keeps
returning to: a sibling under `*.broadinstitute.org` can today set a cookie with
`Domain=broadinstitute.org` and shadow ours (cookie tossing), which a `__Host-`
name makes impossible. That is a session-fixation and confusion defense, not a
CSRF one, so it is complementary to everything above rather than an alternative.

Not adopted in this ADR for one concrete reason: the browser rejects a
`__Host-` cookie that is not `Secure`, and the BFF sets `secure` only when
`NODE_ENV === 'production'` — CI runs the server over plain HTTP. Adopting the
prefix means making `Secure` unconditional and moving CI to TLS, which is its own
change. Already noted as Epic 6 hardening in the epic-5 plan; this ADR records
the rationale so that work has something to build on.

### 4. `SameSite=None` — rejected

Sends the cookie on every cross-site request of every method, which is strictly
worse than `Lax` and removes the only protection SameSite was providing.

## Consequences

- **The reasoning outlives the code comment.** The attribute, the sibling-subdomain
  rationale, and the `response_mode=query` assumption are recorded here, restated
  next to the attribute in `server/src/session/sessionOptions.ts`, and — for the
  parts a test can observe — executable in `server/test/auth.test.ts`.
- **Changing the attribute fails the build.** The session options are defined
  once and imported by production and by all five test harnesses, so `strict`
  (or `rolling: true`) cannot be set without three tests going red. Before this,
  each harness restated the options, and production could have changed with the
  whole suite staying green.
- **CSRF token coverage is load-bearing, not defense in depth.** On the sibling
  subdomains that dev and staging actually run on, the token is the *only* thing
  standing between a hostile same-site page and a state-changing request. Any new
  unsafe route that is authenticated by the session cookie must carry it, and any
  addition to `CSRF_EXEMPT_UNSAFE_REQUESTS` must first establish that the route
  receives no session-derived credentials — the two Contact Us exemptions qualify
  only because the proxy injects no token for them and strips the caller's own
  `cookie` and `authorization`. Story 5-B verified the current coverage end to
  end.
- **The GET residual stays as ADR-009 describes it.** `Lax` sends the cookie on
  top-level cross-site GETs by design, so a state-changing upstream GET remains
  forgeable by a link on browsers that send no Fetch Metadata headers. A `Strict`
  session cookie would have narrowed this — that is alternative 2's one real
  benefit, weighed and rejected above — so this residual is accepted knowingly
  rather than for want of a mechanism. The real fix is upstream
  ([DT-3945](https://broadworkbench.atlassian.net/browse/DT-3945)).
