# ADR-012 — Session cookie is `SameSite=Lax`, with session-bound CSRF tokens closing the gap Lax leaves

**Status:** Accepted (2026-08-31) &nbsp;|&nbsp; **Phase:** 1 (the cookie), 2–4 (the CSRF tokens), recorded in [DT-3996](https://broadworkbench.atlassian.net/browse/DT-3996)
**Related:** [ADR-001](../BFF_Overview.md#adr-001--postgresql-backed-sessions-via-fastifysession) (the session cookie itself), [ADR-009](ADR-009-state-changing-gets.md) (the GET residual Lax deliberately leaves open)
**Config:** `server/src/session/sessionOptions.ts` &nbsp;|&nbsp; **Tests:** `server/test/auth.test.ts` § *SameSite on the B2C callback redirect*

---

## Context

The BFF session cookie carries the user's whole identity: an opaque session ID
whose row holds the access token, refresh token, and `userId`. Its `SameSite`
attribute therefore decides which cross-origin requests can act as that user.

Until this ADR, the choice of `Lax` over `Strict` was recorded only in a code
comment. Infosec review asked the obvious question — *why not `Strict`?* — and
the comment is not a place a reviewer can find, or an auditor can trust to still
be true. This document is the durable answer.

### What the two values mean

Per [RFC 6265bis](https://datatracker.ietf.org/doc/html/draft-ietf-httpbis-rfc6265bis),
"site" means the **registrable domain**, not the origin:

| Request shape | `Lax` | `Strict` |
|---|---|---|
| Same-site request of any method | sent | sent |
| Cross-site top-level GET navigation | **sent** | withheld |
| Cross-site POST (form, `fetch`) | withheld | withheld |
| Cross-site subresource or credentialed `fetch` | withheld | withheld |

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
cover two things that matter here:

- **Sibling subdomains.** Dev and staging live under `*.broadinstitute.org`, and
  SameSite treats every sibling under that registrable domain as *same-site*. A
  compromised or hostile sibling service can issue cookie-bearing POSTs to the
  BFF, and `Lax` will attach the session cookie. Nothing about the attribute
  distinguishes a sibling from the app itself.
- **Top-level cross-site GET.** `Lax` sends the cookie on those *by design* —
  that is the property the callback relies on. It is also what makes an upstream
  endpoint that mutates state on GET forgeable by a plain link, which is
  [ADR-009](ADR-009-state-changing-gets.md)'s subject.

## Decision

**`SameSite=Lax` on the session cookie, plus session-bound CSRF tokens on every
unsafe route.** Neither control is sufficient alone; together they cover the
shapes each one misses.

The pieces, and where they live:

| Control | Covers | Where |
|---|---|---|
| `SameSite=Lax`, `HttpOnly`, `Secure` (production), `Path=/` | cross-site POST/`fetch`; script access to the cookie | `server/src/session/sessionOptions.ts` |
| Session-bound CSRF token, header-only (`X-CSRF-Token`) | unsafe methods from any origin, **sibling subdomains included** | `server/src/auth/csrf.ts`; enforced on `POST /auth/logout` and every unsafe proxied method |
| PKCE `state` bound to the session | login CSRF | `server/src/auth/login.ts` + `callback.ts` |
| Fetch Metadata allowlist | the state-changing-GET residual, on modern browsers | `server/src/security/fetchMetadata.ts` (story 5-B) |

Two of those need a word of explanation.

**CSRF tokens do not depend on the registrable domain.** The token is minted
from a secret in the session and must arrive in a custom header, which no
cross-origin form or navigation can set and which a `no-cors` request cannot
add. That is what closes the sibling-subdomain hole SameSite cannot see. The
header-only narrowing and the reason for it are in `server/src/auth/csrf.ts`.

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
authorization-code flow's default response mode (`response_mode=query`), and the
BFF never sets the parameter. With `response_mode=form_post`, the redirect back
would be a cross-site **POST**, and `Lax` withholds the cookie from those too —
so login would break exactly as it does under `Strict`, and no SameSite value
short of `None` would fix it.

**Anyone changing the B2C policy's response mode, or adding
`response_mode` to `buildAuthorizationUrl`, must revisit this ADR.** The
assumption is stated in the code beside the attribute and in the test's browser
model, so it is visible from all three places.

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

It is coherent, and it genuinely narrows what a cross-site navigation can reach:
the transaction cookie is worthless outside a login in flight and dies within
minutes. Rejected on cost against benefit:

- **It does not close the gap that actually matters.** The residual risk here is
  the sibling subdomain, which is *same-site* — a `Strict` session cookie is
  sent on those requests exactly as a `Lax` one is. The control that stops them
  is the CSRF token, which we have either way. So this buys nothing against the
  live threat.
- **It adds a second stateful mechanism** to the auth flow — a second cookie
  with its own lifetime, its own clearing logic on all four exit paths (success,
  user cancel, provider error, abandonment), and, in the keyed variant, a second
  table with its own expiry job. Session fixation and rotation
  (`regenerate()`, story 5-C) would need to reason about both cookies.
- **It moves the failure mode from "obvious" to "subtle."** Today a SameSite
  mistake breaks every login on the first try. With two cookies, a
  lifetime or clearing bug produces intermittent, browser-dependent login
  failures.

Worth revisiting only if the session cookie ever has to survive an attack that a
`Strict` attribute would stop and a CSRF token would not — i.e. a *cross-site*
top-level navigation that changes state at the BFF. None exists today, and
[ADR-009](ADR-009-state-changing-gets.md)'s GET residual is upstream and now
also covered by the Fetch Metadata guard.

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
  next to the attribute in `server/src/session/sessionOptions.ts`, and executable
  in `server/test/auth.test.ts`.
- **Changing the attribute fails the build.** The session options are defined
  once and imported by production and by all five test harnesses, so `strict`
  (or `rolling: true`) cannot be set without three tests going red. Before this,
  each harness restated the options, and production could have changed with the
  whole suite staying green.
- **CSRF token coverage is load-bearing, not defense in depth.** On the sibling
  subdomains that dev and staging actually run on, the token is the *only* thing
  standing between a hostile same-site page and a state-changing request. Any new
  unsafe route must carry it; story 5-B verified the current coverage end to end.
- **The GET residual stays as ADR-009 describes it.** `Lax` sends the cookie on
  top-level cross-site GETs by design, so a state-changing upstream GET remains
  forgeable by a link on browsers that send no Fetch Metadata headers. The real
  fix is upstream ([DT-3945](https://broadworkbench.atlassian.net/browse/DT-3945)).
