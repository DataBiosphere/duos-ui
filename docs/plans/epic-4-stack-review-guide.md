# BFF Phase 4 stack — review guide & retrospective

**Audience:** reviewers of the Epic 4 stack while Greg is out (back in ~a week
from 2026-08-16). This answers "why does it look like this?" so review can
proceed without him. Jira: DT-3609 throughout.

---

## How to review this stack

The stack (GitHub stack **#3865**), bottom to top. Each PR's diff is against
the PR below it — review bottom-up. Every PR needs **two approvals**.

| Order | PR | Story | What it delivers |
|---|---|---|---|
| merged | #3855 | 4-C/4-D | Config-level BFF gating of the fetch layer (URLs, CSRF, Authorization stripping) — already on develop |
| 1 | #3861 | 4-E | `GET /auth/me` session probe (client) + `/auth/me` contract fixes (server) |
| 2 | #3862 | 4-F | `useSession` hooks; every component off sync `Storage.userIsLogged()` |
| 3 | #3863 | 4-G | Post-sign-in bootstrap (`postSignIn.ts`), single-button `SignInButton`, session reconciler, **ADR-011** |
| 4 | #3864 | 4-H | "Signed in with Google/Microsoft" user-menu badge |
| 5 | #3869 | — | Follow-up: no self-referential `redirectTo` on logout |

Stories **4-I and 4-J ship no code**: #3855's config-level gating routes every
ajax module and the RAS/ECM callback through the proxies by construction.
**4-K** (remove `oidc-client-ts`) is deliberately held for Epic 6.

Merging: `gh stack merge <PR> --yes` merges that PR plus everything below it,
in order (repo is squash-only; gh-stack handles squash-merged parents). Do not
use `gh pr merge` on stack members.

### Priority note for reviewers

**#3861 needs the most attention.** kevinmarete approved an early version; it
has since grown three substantive rounds: the `/auth/me` unregistered-user
contract (see "the consent regression" below), refresh-before-forward, and the
bounded/revalidating session cache. Treat the approval as stale.

---

## The design in five decisions

1. **Coexistence everywhere.** Both auth flows work behind
   `Config.isBffEnabled()`. Legacy artifacts that look like dead code —
   `Token`/`authOpts`, `Storage.setOidcUser/getOidcUser`, the sync
   `userIsLogged` — are **deliberate keeps** until Epic 6 (story 6-J). Deleting
   them breaks legacy sign-in, the 401 metric, and `/backgroundsignin` (the
   e2e auth backdoor, which runs in legacy mode in CI).

2. **Auth state is a network question, cached honestly.**
   `src/libs/auth/session.ts` probes `/auth/me` with a page-load promise cache
   (BFF mode only), a 5-minute TTL, and focus/visibility revalidation. Real
   answers (200, 401-no-session) cache; transient failures don't. In legacy
   mode it's an uncached sync localStorage read — the popup flow and
   `/backgroundsignin` mutate storage without a page load.

3. **Sign-in completion moved out of the button.** The BFF flow is a full-page
   redirect, so the popup `onSuccess` logic (user fetch, registration, metrics,
   cache reset, ToS gate) lives in `src/libs/auth/postSignIn.ts` and runs from
   App when a session exists without a local profile. `completeSignIn` returns
   an explicit outcome (`'completed' | 'signed-out' | 'cancelled'`) and honors
   a cancellation token before every side effect.

4. **One identity per browser — ADR-011** (`docs/plans/bff_adrs/`). The
   session cookie is shared across tabs, so "two users in two tabs" was never
   real. `src/hooks/useSessionReconciler.ts` classifies every fresh probe once:
   hydrate (same user — refresh roles/ToS from the server), bootstrap (no local
   identity / different user / unregistered), or — for a conflict **under an
   in-flight bootstrap** — cancel and hard-reload the tab. Identity-bearing UI
   (routes *and* header) hides while reconciling.

5. **Server `/auth/me` tells the truth about unregistered users.** An upstream
   401/404 from `/api/user/me` with a fresh token means "no DUOS profile yet",
   not "dead session" — report `authenticated: true` with no `user` so
   registration is reachable, and refresh-before-forward (mirroring the API
   proxy) so an idle tab's expired access token never destroys a refreshable
   session.

---

## Things you will trip on without this context

- **The consent regression (DT-3997, in sprint).** Consent's DT-3788 changed
  `/api/user/me` to return **401** (not the historic 404) for
  authenticated-but-unregistered users — `DuosUserAuthenticator` swallows the
  user lookup's `NotFoundException` into an empty principal. This silently
  broke new-user registration on develop (the 401 cascades into a logout
  before `handleRegistration` runs) and was caught here by manual testing.
  The BFF handles both statuses, so **this stack is not blocked on DT-3997**;
  the 404 branch in `me.ts` is future-proofing for the consent fix.
- **4-F/4-G share a seam.** The reconciler (in #3863) consumes hooks
  introduced in #3862. The split is for reviewability; they merge together.
- **e2e auth is legacy-only.** CI's playwright suite runs with `bffEnabled`
  absent (`config/dev.json`). BFF-mode e2e auth is an acknowledged Phase 6
  gap with its own ticket. The five "Background sign-in as ROLE" tests are the
  legacy regression net — they caught two real regressions during this work.
- **Sign-out call sites keep their `navigate()`.** Legacy `Auth.signOut()`
  does not navigate; the SPA navigation is load-bearing there, and BFF mode's
  full-page reload harmlessly supersedes it.
- **The reconciler and postSignIn specs are behavioral contracts.** 22
  scenarios paid for by seven adversarial review rounds (see below). If a
  refactor breaks one, assume the refactor is wrong first.

---

## Review retrospective

Four review streams ran against this stack: **kevinmarete** (human),
**Copilot** (per-PR), **SonarCloud**, and **Codex** (run separately by Greg,
findings relayed — its fixes are commits, not PR replies). Roughly two dozen
substantive findings; every one is fixed with a regression test. The two that
mattered most:

- **Kevin's P1** — `/auth/me` conflated "unregistered" with "unauthenticated",
  making registration unreachable. Fixing it surfaced the consent regression
  (DT-3997) and reshaped the server contract.
- **Codex's identity-reconciliation arc** (7 rounds, 12 findings) — each round
  found a real interleaving in stale-tab reconciliation. Round 3 forced the
  extraction of `useSessionReconciler`; round 5 forced the scope question that
  became **ADR-011**, which deleted more machinery than any fix added. Codex's
  closing statement: *"No remaining actionable findings."*

Process notes that held up: one story per PR made three cross-layer fixes
(one review comment → commits in two PRs) legible; `gh stack` absorbed a
mid-review bottom merge (#3855) and multiple develop rebases without manual
surgery; CI's `tsc --noEmit` catches what `pnpm lint` alone does not.

---

## Open items (waiting on humans)

1. Kevin's re-review of #3861 (see priority note), then second approvals
   everywhere (2/2 rule).
2. Manual verification Greg has queued: new-user BFF flow end-to-end against
   the fixed `/auth/me` (restart the local BFF server first — the fix is
   server-side), and idle-token/focus recovery (exercises
   refresh-before-forward).
3. Flip drafts to ready; merge bottom-up with `gh stack merge`.
4. DT-3997 lands in consent on its own schedule; no duos-ui change needed
   when it does.
