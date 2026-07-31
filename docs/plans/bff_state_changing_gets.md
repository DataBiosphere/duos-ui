# State-changing GET audit (Phase 3, story 3-D)

**Date:** 2026-07-31 &nbsp;|&nbsp; **Consent API commit audited:** `16ef31d15`
**Verdict:** two endpoints found. Neither is blocked; the residual risk is
recorded below and the fix belongs upstream.

---

## Why this audit exists

Story 3-D puts CSRF enforcement on the proxy's unsafe methods. That guard cannot
cover GET, and the gap is not theoretical:

- The BFF session cookie is `SameSite=Lax` — required, because the OAuth callback
  is a top-level cross-site redirect and `Strict` would withhold the cookie and
  lose the PKCE verifier (see `server/src/index.ts`).
- `Lax` deliberately **does** send the cookie on top-level GET navigations. A
  plain `<a href>`, a `window.open`, or a `302` from an attacker's page is a
  top-level navigation.
- CSRF tokens don't apply to GET, because a navigation cannot carry a custom
  header.

So any upstream endpoint that mutates state on GET is forgeable by a link, once
the proxy makes it reachable with the session cookie. The proxy forwards every
path under `/duos-api`, not just the ones the client calls today, so the audit
covers the whole API rather than the client's call sites.

## Method

Every `@GET`-annotated JAX-RS method across the 32 `*Resource.java` files in
`consent/src/main/java/.../resources` was extracted by brace-matching its body
and searched for calls matching
`insert|update|delete|create|save|sync|persist|add|remove|revoke|approve|deny`.
Three candidates surfaced; each was then read by hand, following the service
call into `NihService` / `DatasetService` to confirm or dismiss it.

## Findings

### 1. `GET /api/nih/sync` — confirmed state-changing

`NihAccountResource.syncAccount` → `NihService.syncAccount`, which:

- calls `serviceDAO.updateUserNihStatus(user, nihAccount)` on the success path;
- calls `serviceDAO.deleteNihAccountById(user.getUserId())` when ECM returns 500
  or 404 — **deleting the user's NIH/eRA account linkage**.

Called by the client as `AuthenticateNIH.getSyncedUser` (`src/libs/ajax/AuthenticateNIH.ts`).

### 2. `GET /api/user/me` — confirmed state-changing

`UserResource.getUser` calls `nihService.syncAccount(duosUser)` unconditionally —
the same mutating chain as above — and, when the user has no Sam status yet,
`samService.asyncPostRegistrationInfo(duosUser)`, which registers the user in
Sam.

This is the hot path: the client fetches it on load, and the BFF's own
`/auth/me` handler calls the same upstream endpoint.

### 3. `GET /api/user/me/researcher/datasets` — dismissed

A false positive. The regex matched `Approved` inside
`datasetService.getApprovedDatasets(user)`, which is a read.

## Residual risk

An attacker page can cause a signed-in victim's browser to issue either GET with
its session cookie attached, via a top-level navigation. What that achieves:

- a forced NIH re-sync — normally a no-op, since it re-fetches the same linkage;
- **unlinking the victim's NIH/eRA account**, if ECM happens to answer 404, or
  500, during the forged request;
- first-time Sam registration for a user who had none.

The attacker cannot read any response: a top-level navigation renders in the
victim's own tab under the DUOS origin, and the same-origin policy keeps the body
out of the attacker's reach. So this is a write-only, low-severity, partly
non-deterministic CSRF, and its worst outcome is user-recoverable — the victim
can re-link their account.

## Decision

**Neither endpoint is excluded from the proxy.** Excluding them was the option
the Phase 3 plan offered, and it is worse than the risk: `/api/user/me` is how
the client learns who the user is, so blocking it breaks the app outright, and
blocking `/api/nih/sync` breaks eRA Commons linking. Requiring a CSRF token on
these two GETs specifically was also rejected — the client would need a token
before its first user fetch, and `/auth/csrf-token` is documented as a
post-authentication call, so it inverts the bootstrap order.

The real fix is upstream, and is small: make the sync side effect a `POST`, or
move it out of `GET /api/user/me` so reading a profile stops writing one. That is
a Consent API change, out of scope for a duos-ui story — **raise it with the
Consent API owners as follow-up.**

One mitigation is available to the BFF without touching client or upstream:
reject requests arriving with `Sec-Fetch-Mode: navigate` on the proxy, since no
API call should ever be a top-level navigation and the header cannot be forged
from JavaScript. It is deliberately **not** implemented here — it is a new
request-rejection rule rather than part of this story, and it should be decided
on its own merits. Worth considering for Epic 5 (security hardening).

## Re-running this

The audit script is not checked in — it is 40 lines of throwaway Python and
would rot against the Consent API's shape. Re-derive it when the upstream API
changes materially, or when a new epic widens what the proxy forwards.
