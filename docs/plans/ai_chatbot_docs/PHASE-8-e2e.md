# Phase 8: Playwright E2E on the BFF harness

**Phase:** 8 of 8 (near-term set) &nbsp;|&nbsp; **Effort:** ~3.5d &nbsp;|&nbsp; **Risk:** 🟡 Medium
**Depends on:** Phase 2 story 2-F (the stub backend is selectable by env), Phase 3 (the two tool paths the mock upstream must serve), Phase 6 (the env vars every harness server needs, and the two tables), Phase 7 (the UI the spec drives)
**Blocks:** Chat 11 (rollout)
**Can parallelize with:** Phase 0. Story 8-A's mock-upstream half can start after Phase 3; the rest waits on Phases 6 and 7.
**Reference:** [AI_Chatbot_Overview.md](../AI_Chatbot_Overview.md) §6; BFF Epic 6 stories 6-D-mock, 6-K1, 6-K2

---

## Goal

One browser test that signs in through the BFF, opens the panel, asks a
question the stub backend answers with a tool call, and sees the answer arrive
as a stream — with no network beyond the harness.

---

## Background

**The harness exists.** `playwright.config.ts` runs the production build
through the Fastify server (`pnpm run serve`) in four projects. Two matter
here:

| Project | Signs in through | Consent upstream | Use for the chat |
|---|---|---|---|
| `chromium` | `signInAs(role)` → `POST /auth/test-signin` with a service-account token | **Real dev Consent** | No. Dev Consent flaps `200`/`401` on `/api/user/me` since 2026-10-01 and the role specs retry sign-in. A chat spec here inherits that flake, and its tool calls would hit real dataset data. |
| `mock` | The mock OIDC provider (`test/e2e/mocks/oidcProvider.ts`) | **Mock Consent** (`test/e2e/mocks/consentUpstream.ts`) on port 3200 | Yes. Deterministic, network-free, and the server on port 3001 can carry a stub-backend env var. |

**The mock Consent upstream serves two paths.** `GET /api/user/me` with four
scripted outcomes, and `/api/mock/echo`. Everything else is a `404`. The two
tool endpoints from Phase 3 are not there, so story 8-A adds them.

**The stub backend answers from fixtures** (Phase 2 story 2-B). An E2E
question must match a fixture exactly, and an unmatched question is a loud
failure by design. The spec asks the fixture's question verbatim.

**The CSP collector is live** (Epic 6 story 6-K2, `test/e2e/csp.spec.ts`,
`test/e2e/support/csp.ts`). It fails on any violation in the public and
signed-in cases. The chat panel is new signed-in surface, so it goes under the
collector.

---

## Stories

### 8-A: The mock Consent upstream serves the two tool paths

Extend `test/e2e/mocks/consentUpstream.ts` with the two Phase 3 endpoints:

| Path | Response |
|---|---|
| `POST /api/dataset/search/index/v2` | A fixed, projected result set — reuse a Phase 4 story 4-B fixture so the shape is the one the tool already parses |
| `GET /api/collections/role/Researcher/summary` | A fixed list of two collections for the scenario's user |

Keep the mock's existing rules: the request must carry the single
`Authorization` header the proxy injects, the token must be a live one from the
mock provider, and every request is recorded in the scenario's
`upstreamRequests` so a spec can assert what the server called. Add a scenario
switch (`test/e2e/mocks/scenarios.ts`) that makes the search answer `429` with
`Retry-After`, so the Phase 3 story 3-C path has a browser test too.

Then turn the chat on in the harness. Three things, because the route and the
button are both gated (Phase 7 story 7-A) and the Phase 6 env vars are
required wherever the gate is open:

1. **`chatEnabled: true` in the harness `config.json`.**
   `.github/workflows/integration-tests.yml` builds it with
   `jq '.bffEnabled = true' config/dev.json > public/config.json`; extend that
   expression with `.chatEnabled = true`. One `config.json` serves all four
   Playwright servers, so the flag is on for all of them.
2. **The Phase 6 env vars on every server**, because every server now
   registers the route and reads them at startup: `DUOS_REPLICA_COUNT=1`,
   `DUOS_CHAT_DAILY_TURN_QUOTA` (high enough for a full run), and
   `DUOS_RATE_LIMIT_CHAT_MAX=600` beside the other raised limits. Put them in
   `serverDefaults` in `playwright.config.ts`, not on one entry, or the
   `chromium` and short-session servers fail to boot.
3. **The stub backend on the `mock` and `mock-short-session` servers** (ports
   3001 and 3003): the Phase 2 story 2-F env var, so chat cases there reach no
   network. The `chromium` server keeps whatever 2-F's default is; no chat
   case runs there.
4. **The two Phase 6 tables in the CI database.** The workflow loads only
   `test/e2e/sql/user_sessions.sql` today
   (`.github/workflows/integration-tests.yml`, the `psql … -f` step), so a
   chat request that passes every check would fail at the lease insert. Add
   `test/e2e/sql/chat_turn_quota.sql`, copied from the `bff-03` changeset the
   way `user_sessions.sql` copies `bff-01`, and a second `-f` on the same
   `psql` step. The scratch schema in `server/test/load/README.md` (Phase 6
   story 6-B) is for the load harness, not CI; both copies cite the changeset.

Tests: `mockHarness.spec.ts` gains a case that calls each new path through the
proxy with the echo pattern and sees the fixture body and exactly one
`Authorization` header.

**Files:** `test/e2e/mocks/consentUpstream.ts`, `test/e2e/mocks/scenarios.ts`, `test/e2e/mocks/settings.ts`, `playwright.config.ts`, `.github/workflows/integration-tests.yml`, `test/e2e/sql/chat_turn_quota.sql`, `test/e2e/mockHarness.spec.ts`
**Effort:** 1d &nbsp;|&nbsp; **Risk:** Low

---

### 8-B: `chat.spec.ts` in the `mock` project

Add the spec to `MOCK_SPECS` in `playwright.config.ts`. Sign in with the
`mock` project's helper (`test/e2e/support/mockProvider.ts`), the way
`auth.spec.ts` does.

Cases:

1. **Signed out, no button.** Load the home page without a session; the chat
   button is absent.
2. **A two-iteration turn streams.** Open the panel, type the fixture
   question, send. Assert in order: a `status` line appears before any answer
   text; answer text grows across at least two paint frames (prove the stream,
   not just the result); the status clears on `done`; the mock recorded one
   call to the dataset search path with the proxy-injected token.
3. **Markdown renders without HTML.** The fixture answer carries a link, a
   list and an `<img>` tag in raw HTML; the link renders, the list renders,
   and the image does not exist in the DOM.
4. **Abort on close.** Start a turn against a slow fixture, close the panel
   mid-stream, reopen: the entry carries the "stopped" marker and no further
   text arrives. The server-side `client_disconnected` end reason is a unit
   test in Phase 1; the browser proves only the client half.
5. **Rate-limited tool call.** Flip the scenario switch from 8-A; the panel
   shows the wait message from the `status` frame and the turn ends once.
6. **Session expiry mid-use.** In the `mock-short-session` project
   (`sessionExpiry.spec.ts`, ten-second sessions): send a turn after the
   session has expired and assert the SPA signs the user out, the same landing
   the existing spec asserts for a proxied call. One case, added to the
   existing spec rather than a new file, because that project has one server.

Teardown: delete only this spec's sessions, per the harness rule in the Epic 6
exit criteria. The scenario store is keyed per test already.

**Files:** `test/e2e/chat.spec.ts`, `test/e2e/sessionExpiry.spec.ts`, `playwright.config.ts`, `test/e2e/support/chat.ts` (page helpers)
**Effort:** 1.5d &nbsp;|&nbsp; **Risk:** Medium — streaming assertions are the first timing-sensitive specs in the suite

---

### 8-C: The CSP collector covers the panel

`test/e2e/csp.spec.ts` has a signed-in case that fails on any violation.
Extend it: open the chat panel, run one short turn, close it. Zero violations
expected. This is the test that proves §7's CSP claim — same-origin SSE fits
`connect-src 'self'`, MUI styles fit `style-src`, and the markdown renderer
loads nothing.

The collector runs against the `chromium` project today. If 8-B's reasoning
holds and the chat is unreachable there, move the signed-in collector case to
the `mock` project or add a second one; state which in the commit.

**Files:** `test/e2e/csp.spec.ts`, `test/e2e/support/csp.ts`
**Effort:** 0.5d &nbsp;|&nbsp; **Risk:** Low

---

### 8-D: CI wiring, and the no-network assertion

`.github/workflows/integration-tests.yml` runs the Playwright projects. Add the
stub-backend and chat-limit env vars where the other BFF env vars are set, and
confirm the `mock` project's chat cases run on every PR.

Prove the stub reaches no network from the browser side as well as the server
side: a Playwright route handler that fails the test on any request leaving
the harness's origins (the three mock ports and the server under test) during
the chat cases. Phase 2 story 2-F asserts the same at the socket level; this
closes the browser half.

Record the chat spec's runtime. If a case waits on a real 60-second deadline
(it should not — use a short-deadline server env for that case, or leave the
deadline to unit tests), it is wrong for this suite.

**Files:** `.github/workflows/integration-tests.yml`, `test/e2e/chat.spec.ts`
**Effort:** 0.5d &nbsp;|&nbsp; **Risk:** Low

---

## Suggested sequencing

```
8-A ─→ 8-B ─→ 8-C ─→ 8-D
```

8-A can start as soon as Phase 3's tool paths and Phase 2's env var are fixed,
before the UI exists. 8-B waits for Phase 7.

---

## Exit criteria

1. The mock Consent upstream serves both tool paths and a `429` scenario; the
   harness `config.json` has `chatEnabled: true`; every Playwright server
   boots with the Phase 6 env vars; the `mock` and short-session servers run
   the stub backend.
2. `chat.spec.ts` passes in CI on every PR, with the stream, markdown, abort,
   rate-limit and sign-out cases.
3. The CSP collector sees zero violations with the panel open and a turn run.
4. No request leaves the harness's origins during a chat case, proven by a
   route handler.
5. No chat case waits on a real turn deadline.
