# ADR-009 — Accept the two state-changing GETs rather than excluding them from the proxy

**Status:** Accepted (2026-07-31) &nbsp;|&nbsp; **Phase:** 3, story 3-D
**Related:** [ADR-004](ADR-004-api-proxy-layer.md) (the proxy layer this applies to)
**Upstream follow-up:** [DT-3945](https://broadworkbench.atlassian.net/browse/DT-3945) — remove the sync side effect from `GET /api/user/me` (see [The real fix is upstream](#the-real-fix-is-upstream--tracked-as-dt-3945))

---

## Context

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
path under `/duos-api`, not just the ones the client calls today, so this was
assessed across the whole API rather than the client's call sites.

Two such endpoints exist — `GET /api/nih/sync` and `GET /api/user/me`, both
reaching `NihService.syncAccount`. The evidence is recorded at the end of this
document; the decision below is what to do about them.

## Decision

**Neither endpoint is excluded from the proxy.**

Excluding them was the option the Phase 3 plan offered, and it is worse than the
risk: `/api/user/me` is how the client learns who the user is, so blocking it
breaks the app outright, and blocking `/api/nih/sync` breaks eRA Commons linking.

Requiring a CSRF token on these two GETs specifically was also rejected — the
client would need a token before its first user fetch, and `/auth/csrf-token` is
documented as a post-authentication call, so it inverts the bootstrap order.

## Consequences

### Residual risk, accepted

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

### The real fix is upstream — tracked as [DT-3945](https://broadworkbench.atlassian.net/browse/DT-3945)

It is small: make the sync side effect a `POST`, or move it out of
`GET /api/user/me` so reading a profile stops writing one. That is a Consent API
change, out of scope for a duos-ui story — **raise it with the Consent API owners
as follow-up.** This ADR should be revisited, and can likely be retired, once
that lands.

### One BFF-side mitigation, deliberately deferred — since implemented (Phase 5, story 5-B)

Available without touching client or upstream: reject requests arriving with
`Sec-Fetch-Mode: navigate` on the proxy, since no API call should ever be a
top-level navigation and the header cannot be forged from JavaScript. It was
**not** implemented here — it is a new request-rejection rule rather than part of
this story, and it should be decided on its own merits.

**Update (2026-08-24, Phase 5, story 5-B):** implemented, and deliberately
broader than the navigate-only rule sketched above — that rule would not have
closed the gap. The dangerous requests here are same-**site** (a compromised
`*.broadinstitute.org` sibling), and they come in three shapes — a top-level
navigation, a `no-cors` subresource (`<img>`), and a credentialed `fetch()`
whose read CORS blocks but whose GET still executes upstream. The enforced
rule is a positive allowlist: when `Sec-Fetch-Site` is present, require
`same-origin` AND `Sec-Fetch-Mode: cors`/`same-origin`; when the headers are
absent (older browsers, non-browser clients), allow and rely on the
CSRF/session controls. It is applied by the shared proxy machinery to every
upstream prefix, and to `/auth/me` (which calls `GET /api/user/me`
server-side); `/auth/login` and `/auth/callback` are exempt because the OAuth
callback is a legitimate cross-site navigation. See
`server/src/security/fetchMetadata.ts` for the rule and its rationale, and
`server/test/fetchMetadata.test.ts` for the matrix.

The residual risk above is therefore closed for modern browsers; the
accepted-risk analysis continues to apply only to browsers that send no Fetch
Metadata headers. The upstream fix (DT-3945) remains the real fix.

---

## Evidence (point-in-time)

**Audited:** Consent API `16ef31d15`, 2026-07-31.

The reasoning above does not go stale: `SameSite=Lax` remains required, and a
CSRF token still cannot guard a GET. **The findings below can.** They describe the
Consent API at one commit, so treat them as the state of the upstream when this
decision was taken rather than as current fact.

### Method

Every `@GET`-annotated JAX-RS method across the 32 `*Resource.java` files in
`consent/src/main/java/.../resources` was extracted by brace-matching its body
and searched for calls matching
`insert|update|delete|create|save|sync|persist|add|remove|revoke|approve|deny`.
Three candidates surfaced; each was then read by hand, following the service
call into `NihService` / `DatasetService` to confirm or dismiss it.

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

### Re-running this

The audit script is not checked in — it is 40 lines of throwaway Python and
would rot against the Consent API's shape. Re-derive it when the upstream API
changes materially, or when a new phase widens what the proxy forwards.

### Re-run (2026-08-24, Phase 5, story 5-B)

**Audited:** Consent API `origin/develop` at `001497ae1`, 2026-08-24, with the
same method (brace-matched `@GET` bodies across the `*Resource.java` files,
searched for mutation-verb calls): 37 resource files, 91 `@GET` methods.

**Result: unchanged.** The same two endpoints are state-changing — 
`GET /api/nih/sync` (`nihService.syncAccount`) and `GET /api/user/me`
(`nihService.syncAccount` unconditionally, plus
`samService.asyncPostRegistrationInfo` when the user has no Sam status) — and
no new ones appeared. Every other candidate the verb regex surfaced was the
`createExceptionResponse` error-path false positive. Both endpoints are now
behind the Fetch Metadata guard described above; DT-3945 is still open.
