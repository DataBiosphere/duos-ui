# Infosec answer — why the BFF session cookie is `SameSite=Lax` and not `Strict`

**Question:** the DUOS BFF session cookie is set with `SameSite=Lax`. Why not
`Strict`?

**Short answer:** `Strict` breaks sign-in completely, in every browser. The
protection `Strict` would have added over `Lax` is not the protection this
application needs, and the gap that does matter — sibling subdomains under
`broadinstitute.org` — is closed by session-bound CSRF tokens, which no SameSite
value can substitute for.

**Full decision record:** [ADR-012](bff_adrs/ADR-012-session-cookie-samesite.md).
**Configuration:** `server/src/session/sessionOptions.ts`.
**Tests:** `server/test/auth.test.ts` § *SameSite on the B2C callback redirect*.

---

## 1. Why `Strict` is unusable

The OAuth flow depends on the single request shape where `Lax` and `Strict`
differ — a cross-site, top-level GET navigation:

1. `POST /auth/login` writes the PKCE verifier and the OAuth `state` into the
   session, then returns the Azure B2C authorization URL.
2. The browser navigates to B2C. `b2clogin.com` and `*.broadinstitute.org` are
   different registrable domains, so B2C is cross-site to us.
3. B2C answers with a `302` back to `GET /auth/callback`. Because B2C's document
   initiated it, this is a **cross-site top-level GET navigation**.
4. `Lax` sends the session cookie on that request. `Strict` withholds it.

Under `Strict`, the callback receives a fresh, empty session. The token exchange
is then attempted with no PKCE verifier and no expected `state`, and
`openid-client` rejects the response. **No user can sign in.** There is no
partial or degraded mode to trade off.

## 2. What `Lax` does and does not protect against

| Threat | Covered by `Lax`? |
|---|---|
| Forged cross-site POST (auto-submitting `<form>` on an attacker domain) | **Yes** — cookie withheld |
| Credentialed cross-site `fetch`/XHR | **Yes** — cookie withheld |
| Cross-site subresource load (`<img>`, `<script>`) | **Yes** — cookie withheld |
| Script reading the cookie (XSS exfiltration) | Not SameSite's job — covered by `HttpOnly` |
| Request from a **sibling subdomain** under `broadinstitute.org` | **No** — same-site, cookie sent |
| Cross-site top-level GET navigation (a plain link) | **No** — sent by design; the callback needs this |

The two "no" rows are the whole reason `Lax` is not the only control:

- **Sibling subdomains.** Dev and staging run under `*.broadinstitute.org`
  alongside many other services. SameSite compares registrable domains, so every
  sibling is *same-site* and receives the cookie on requests of any method. This
  is the row `Strict` would not have helped with either: a `Strict` cookie is
  sent on same-site requests exactly as a `Lax` one is.
- **Top-level cross-site GET.** `Lax` sends the cookie on those deliberately —
  that is the property step 3 above relies on. It also means an upstream endpoint
  that mutates state on GET is forgeable by a link; that is tracked separately in
  [ADR-009](bff_adrs/ADR-009-state-changing-gets.md), with an upstream fix
  ([DT-3945](https://broadworkbench.atlassian.net/browse/DT-3945)) and a Fetch
  Metadata guard already in place for modern browsers.

## 3. What closes the gap

- **Session-bound CSRF tokens on every unsafe route.** The token is derived from
  a secret held in the session and must arrive in an `X-CSRF-Token` header. No
  cross-origin form, navigation, or `no-cors` request can set a custom header,
  and — unlike SameSite — the check does not care about the registrable domain,
  so it holds against a compromised sibling subdomain. Enforced on `POST
  /auth/logout` and on every unsafe method through the API proxy
  (`server/src/auth/csrf.ts`).
- **Login CSRF is neutralized by the PKCE state binding, not by a token.**
  `POST /auth/login` is intentionally CSRF-exempt. An attacker can make a
  victim's browser *start* a login, but cannot land the attacker's own identity
  in the victim's session: the `state` and verifier are written to the victim's
  session at login and read from that same session at the callback, and
  `openid-client` rejects any `state` that does not match. A code obtained in the
  attacker's browser is not redeemable against the victim's session.
- **`HttpOnly`, `Secure` (production), and `Path=/`** on the cookie, so it is
  invisible to page script and never travels in clear text.

## 4. Alternatives considered

- **`Strict` session cookie + a second short-lived `Lax` cookie holding only the
  OAuth transaction state.** The one design that yields a `Strict` session
  cookie. Rejected: it does not close the sibling-subdomain gap (those requests
  are same-site, so a `Strict` cookie is sent anyway), and it adds a second
  cookie lifetime to get wrong on four exit paths, turning an unmissable failure
  into an intermittent one. Reasoning in full in ADR-012 § Alternatives.
- **`__Host-` cookie-name prefixing.** Recommended as later hardening, and
  complementary rather than an alternative: it stops a sibling subdomain from
  *shadowing* our cookie (cookie tossing), which is a session-fixation defense,
  not a CSRF one. It requires `Secure` unconditionally — including CI, which
  currently serves plain HTTP — so it is scoped as Epic 6 work.
- **`SameSite=None`.** Rejected: strictly weaker than `Lax` for no benefit.

## 5. Standing assumption a reviewer should know

`Lax` rescues the callback **only because B2C returns via GET**
(`response_mode=query`, the authorization-code flow's default; the BFF never sets
the parameter). Under `response_mode=form_post` the redirect back would be a
cross-site POST, from which `Lax` also withholds the cookie — sign-in would break
just as it does under `Strict`. Any change to the B2C policy's response mode must
revisit ADR-012.

## 6. How this stays true

The session options are defined once, in
`server/src/session/sessionOptions.ts`, and imported by the production server and
by all five test harnesses — no harness restates them. Two tests model the
browser's SameSite decision for the B2C redirect by reading the attribute the
application actually set, so changing `sameSite` to `strict` fails the suite at
the cookie-withheld step rather than passing review and failing in production.
