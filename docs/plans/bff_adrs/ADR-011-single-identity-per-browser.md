# ADR-011 — One identity per browser: cross-tab account switching reloads the stale tab

**Status:** Accepted (2026-08-15) &nbsp;|&nbsp; **Phase:** 4, stories 4-E/4-F/4-G
**Related:** [ADR-004](ADR-004-api-proxy-layer.md) (the session cookie all tabs share)
**Implemented by:** `src/hooks/useSessionReconciler.ts` (duos-ui #3863)

---

## Context

With the BFF, authentication state lives in one server-side session addressed
by one cookie, shared by every tab of the browser profile. "Two different
users in two different tabs" is therefore not a state the system can be in:
every API call from every tab acts as whoever authenticated most recently.
The only real phenomenon is **serial account switching with a stale tab** —
tab A still *displaying* user X while the shared session has become user Y
(or has been signed out, or belongs to a not-yet-registered account).

The client reconciles the session identity against the locally stored profile
(`CurrentUser`, also shared across tabs) whenever the session probe
(`GET /auth/me`) returns a fresh answer — on navigation, focus/visibility
changes, and cache expiry. Review of the reconciliation logic (ten findings
across four rounds) kept surfacing new interleavings of the same underlying
problem: making a stale tab converge **gracefully, in place**, requires
supersede semantics for in-flight bootstraps, provenance tracking for which
run wrote which identity to shared storage, and a distinguishable identity
for unregistered sessions (which `/auth/me` cannot provide — every
unregistered account looks the same). Each mechanism fixed one interleaving
and exposed another.

## Decision

**Concurrent different-user usage across tabs is unsupported.** The
reconciler handles a detected identity conflict the way mainstream
multi-account applications do — by discarding the stale tab's state:

- An identity conflict that appears **while no reconciliation is running**
  (a fresh probe naming a different user, or reporting no profile over a
  stored identity) runs the normal post-sign-in bootstrap in place, behind
  the reconciliation spinner. This needs no conflict machinery: nothing else
  is in flight.
- An identity conflict that appears **under an in-flight bootstrap** cancels
  that run and **hard-reloads the tab** (`Redirect.reload()` — a true
  `location.reload()`, because assigning `location.href` to a URL with a
  `#fragment` is a same-document navigation that reloads nothing). The
  fresh page load reconciles from scratch; the reload kills all in-flight
  JavaScript, so no obsolete run can persist a user, emit metrics, navigate,
  or destroy the session after being overtaken.
- Within one tab, `localStorage` consequently has a **single writer** during
  a reconciliation run. The only join rule that remains is the one the
  single-writer assumption makes sound: a probe naming the user that a
  registration run (target = no identity) itself just persisted joins that
  run; anything else conflicting reloads.
- A probe turning **unauthenticated**, and hook **unmount**, cancel the
  in-flight run via the same token (`completeSignIn` polls it before every
  side-effecting step). These are same-user events (sign-out in another tab,
  session expiry) and remain fully supported.

What remains supported and graceful: the same user in many tabs, including
sign-out from any of them; same-user profile changes (roles, DAC
assignments, ToS state) hydrating on revalidation — with identity-bearing UI
withheld for the one render until the fresh profile commits.

## Consequences

- The reconciler shrinks: no supersede generations, no storage-provenance
  tracking, no unregistered-identity disambiguation. The review surface for
  cross-tab interleavings closes — conflicts have exactly one behavior.
- A user who switches accounts in another tab loses transient state (e.g. a
  half-typed form) in stale tabs when they next touch them: the tab reloads.
  This is the accepted cost, identical to the trade made by mainstream
  multi-account web applications.
- The reload can, in a pathological ping-pong (two tabs switching accounts
  repeatedly), reload more than once. Each reload converges on the current
  session, so there is no livelock — the fresh load either matches storage
  (hydrate) or bootstraps in place.

## Accepted risks

Two residual windows, surfaced by the cross-tab review on #3863
(2026-08-17), are accepted rather than engineered around:

1. **A registration run can adopt a different unregistered identity.**
   `/auth/me` cannot distinguish unregistered accounts — every one of them
   reports `authenticated: true` with no user, so a registration run's
   target identity is "none". If, during the seconds a registration run is
   in flight, another tab signs the shared cookie into a *different*
   unregistered account, a focus revalidation in the first tab joins the
   run (same "none" target) and the in-flight `registerUser()` registers
   whoever now owns the cookie. The tab converges on that account rather
   than reloading. Detecting this needs a stable per-session identifier for
   unregistered sessions from `/auth/me`; the join rule cannot be tightened
   without also reloading on the legitimate joins (StrictMode double
   invocation, focus revalidation) that the run-once machinery exists for.
   The window is seconds wide and requires two different unregistered
   accounts switching mid-registration.

2. **A transient upstream 401 for a registered user drives one
   registration POST.** `/auth/me` reports an upstream 401 as "valid
   session, no profile" (the upstream conflates the two — see #3861). For
   a *registered* user this shape only appears when the upstream 401s a
   freshly refreshed token: a revoked token, or upstream auth outage. The
   bootstrap then attempts `registerUser()`; the expected `409 Conflict`
   recovers into a normal sign-in, and any other failure signs the session
   out — which is the correct end state for a genuinely revoked token. The
   cost of the window is one spurious POST and, during an upstream auth
   outage, a sign-out instead of an error banner.

## Alternative considered

Full in-place reconciliation: record the identity each run commits, expose a
stable session identity for unregistered accounts from `/auth/me`, and
supersede-with-cancellation across every interleaving. Rejected as
disproportionate: it re-implements a session manager in the client to
polish an unsupported workflow, and each review round demonstrated the
interleaving space is larger than the value of handling it.
