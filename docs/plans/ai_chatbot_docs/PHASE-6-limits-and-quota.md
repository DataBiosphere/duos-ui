# Phase 6: Burst limit, daily turn quota and concurrency cap

**Phase:** 6 of 8 (near-term set) &nbsp;|&nbsp; **Effort:** ~5d &nbsp;|&nbsp; **Risk:** 🟡 Medium
**Depends on:** Phase 1 (the route and its pre-hijack check order), Phase 7 story 7-A only (the `chatEnabled` gate that 6-A and 6-C read their env vars behind), Phase 5 story 5-E (the per-turn token counts that size the numbers)
**Blocks:** Phase 8 (its servers need this phase's env vars and tables), Chat 11 (rollout). Chat 7 stories 7-B onward only need the error codes from 6-A and 6-C to style them, and can stub those.
**Can parallelize with:** Phase 0, Phase 7 from story 7-B on. Story order across the two phases: 7-A, then 6-A, then 7-B.
**Reference:** [AI_Chatbot_Overview.md](../AI_Chatbot_Overview.md) §3.4, §7, open questions 4 and 6

---

## Goal

Three controls, each a separate story, each enforced **before the hijack** so a
rejection is an ordinary JSON reply (ADR-002):

| Control | Bounds | Where the state lives |
|---|---|---|
| Burst limit | Turns per minute per user | In-process, one bucket per pod, divided by the replica count |
| Daily turn quota | Turns per user per UTC day | A Consent-owned Postgres table, shared by every pod |
| Concurrency cap | Open turns per user at one time | The same table, as a lease with an expiry |

---

## Background

**Three controls, not one.** §3.4 is explicit. A per-minute bucket bounds
bursts, not spend: it resets on every pod restart and forgets an idle user in
minutes. A quota bounds spend but not a burst. Neither stops one person opening
several tabs and starting several turns at once.

**What exists in `develop` today.** `@fastify/rate-limit` is registered with
`global: false` in `server/src/index.ts`, and `server/src/security/rateLimit.ts`
holds the route configs for the auth routes, each keyed on `request.ip` with an
env override through `maxFromEnv`. Nothing is keyed on a user, and nothing
divides by the replica count, because the DUOS chart delivers no replica-count
value. Story 6-A adds both.

**The session is available to the limiter.** With `global: false` the plugin
attaches a *route*-level `onRequest` hook, which Fastify runs after the
instance-level session hook; `rateLimit.ts` documents that a throttled request
still costs one session read. So a key generator can read
`request.session.userId`. It must still tolerate a missing session, because
the `401` for a signed-out caller is a later step in the route's own order.

**The quota table's home is settled.** Open question 6 is answered: a Consent
Liquibase changeset in the existing BFF series. `changelog-master.xml` already
includes `changelog-consent-2026-06-16-bff-01-user-sessions.xml` and
`-02-user-session-audit.xml`. The Consent schema is this team's, so there is
no cross-team step.

**Every number is a proposal until story 6-E.** Phase 5 story 5-E produces the
token counts and iteration counts of a real turn. §3.4 says measure first, then
set the quota. The stories below carry placeholder values so the code can land;
6-E replaces them.

---

## Stories

### 6-A: Burst limit, keyed on the user and divided by the replica count

Add a `chatRateLimit()` to `server/src/security/rateLimit.ts` beside the three
auth configs, and attach it to the route's `onRequest` list after the CSRF
guard (Phase 1 story 1-C sets the order).

Rules, each from §3.4:

1. **Key on `request.session.userId`**, the B2C email claim — the same key
   Consent's own filter uses, so one person maps to one bucket on both sides.
   Fall back to `request.ip` when there is no session, and let the route's own
   `401` reject that caller afterwards. Never key on a hashed value that a
   caller can choose.
2. **`max = ceil(turnsPerMinute / DUOS_REPLICA_COUNT)`.** Read the divisor
   from a new env var. Read it **only where the chat route registers** — inside
   the `chatEnabled` gate from Phase 7 story 7-A — and fail startup there,
   naming the variable, when it is unset or not a positive whole number.
   `maxFromEnv` is not the helper for this: it returns the default when the
   variable is unset and fails only on a malformed value. Write a
   `requiredIntFromEnv` beside it (or compose `requireEnv` from
   `server/src/auth/oidcClient.ts` with the same integer check), and use it
   for every required number this phase adds. An environment with chat
   off never reads it, so this story cannot break boot in dev, staging, prod
   or a BEE that has not turned chat on. Story 6-C's quota env var follows the
   same rule. Development (`NODE_ENV !== 'production'`) defaults to `1`.
3. **Deliver `DUOS_REPLICA_COUNT` from `.Values.replicas` in `terra-helmfile`**,
   the way the Consent chart delivers `podCount`. This is a chart change in
   `charts/duos/templates/deployment.yaml`, and **it merges before this
   story**: the chart renders the variable in every environment whether or not
   chat is on, so the value is already present when the first BEE flips
   `chatEnabled`. The Playwright servers set it explicitly (Phase 8 story 8-A).
4. **`turnsPerMinute` is a multiple of the replica count** (dev and prod both
   run 2 replicas today). The env override is `DUOS_RATE_LIMIT_CHAT_MAX`,
   through `maxFromEnv`, and it holds the deployment-wide number; the code
   divides.
5. **Raise it in the E2E harness.** `playwright.config.ts` already sets
   `DUOS_RATE_LIMIT_LOGIN_MAX` and `DUOS_RATE_LIMIT_CALLBACK_MAX` to 600 so
   parallel workers do not throttle each other. Add the chat override to the
   same server entries.

The rejection already has a shape. `handleServerError` in `server/src/index.ts`
maps a limiter error to `429 { error: 'rate_limited' }` through
`isRateLimitError`, and it runs before the hijack because the limiter is an
`onRequest` hook. Reuse it; add no handler.

*Proposal — replace in 6-E:* 6 turns per minute deployment-wide, so 3 per pod.

Tests: the seventh turn inside a minute from one user gives `429` as JSON; a
second user on the same IP is not throttled; a sessionless caller is keyed on
IP and then gets `401`; an unset `DUOS_REPLICA_COUNT` fails startup in
production mode **with chat enabled** and names the variable, and does not
fail startup with chat disabled; the Playwright `mock` project runs its chat
spec under the raised limit.

**Files:** `server/src/security/rateLimit.ts`, `server/src/chat/route.ts`, `server/src/config.ts`, `playwright.config.ts`, `.env.example`, `server/test/rateLimit.test.ts`, `server/test/chatRoute.test.ts`; `terra-helmfile`: `charts/duos/templates/deployment.yaml`, `charts/duos/values.yaml`
**Effort:** 1d &nbsp;|&nbsp; **Risk:** Low

---

### 6-B: The quota table, as a Consent Liquibase changeset

Two tables, in one changeset, in the series the BFF already uses:

```
changesets/changelog-consent-2026-MM-DD-bff-03-chat-turn-quota.xml
```

*Proposal — confirm in review:*

```sql
-- The daily count. One row per user per UTC day.
CREATE TABLE chat_turn_quota (
  user_id  text    NOT NULL,   -- the session's userId: the B2C email claim
  day      date    NOT NULL,   -- UTC calendar day
  turns    integer NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, day)
);

-- The open-turn lease (story 6-D). One row per user, independent of the day,
-- so a turn that spans UTC midnight holds one lease, not two rows.
CREATE TABLE chat_turn_lease (
  user_id     text        PRIMARY KEY,
  lease_token uuid        NOT NULL,   -- owner check on release
  lease_until timestamptz NOT NULL
);
```

Rules:

- **Keyed on `userId`, not on the session.** The quota must outlive a logout
  and a session rotation (§3.4), so it cannot sit in `user_sessions.sess`.
- **One quota row per user per day, upserted.** `INSERT … ON CONFLICT
  (user_id, day) DO UPDATE SET turns = chat_turn_quota.turns + 1 RETURNING
  turns` is one round-trip and is safe across pods.
- **The lease is its own row.** Keeping it on the day row would let a turn
  started at 23:59:50 hold yesterday's row while a second tab at 00:00:01
  creates today's row and runs beside it.
- **Retention.** Add a daily delete of rows older than 35 days, or state why
  the table may grow. The `user_session_audit` changeset is the precedent for
  how Consent handles a BFF table's housekeeping; follow it.
- **The scratch schema.** `server/test/load/README.md` carries a copy of the
  `user_sessions` DDL for a local database. Add this table there too, with the
  same note that Consent owns the production schema.
- **Local Postgres under FIPS Node.** The 6-G revert (#3994) came from the dev
  database's MD5 password mode against FIPS Node's `pg`. The fix is a SCRAM
  password on the database and it is in flight; this story's local test runs
  need it in place. Check before you start, not after.

Tests: a Consent-side migration test in the usual place; a BFF-side
`server/test/chatQuota.test.ts` against the scratch schema that proves the
upsert returns the incremented count and that two pods incrementing at once
lose no turn.

**Files:** Consent: `src/main/resources/changesets/…bff-03…xml`, `changelog-master.xml`; duos-ui: `server/test/load/README.md`, `server/src/chat/quota.ts`, `server/test/chatQuota.test.ts`
**Effort:** 1d &nbsp;|&nbsp; **Risk:** Medium — a schema change deploys with Consent, on Consent's cadence

---

### 6-C: Enforce the daily quota in the route

**The last pre-hijack step, and nothing else after it.** Every check that can
refuse the request for free runs first — the guards and the limiter
(`onRequest`), the `401` for no session, the `expired` fixture case, the
refresh and its `502`, the body validation (Phase 1 story 1-D), and the `503`
for no configured backend (Phase 2 story 2-F). Only once all of them pass does
the route touch the database:

1. Take the lease (story 6-D). If it is held, answer `409` — **before** the
   quota is touched, so a second tab's `409` spends nothing.
2. Upsert the user's quota row for today (UTC) and read back `turns`.
3. If `turns` exceeds the quota, release the lease (the token is still in
   hand) and answer `429 { error: 'quota_exceeded', resetsAt: <ISO timestamp
   of the next UTC midnight> }` as JSON.
4. Hijack.

Run steps 1 to 3 in one transaction, so a crash between them leaves neither a
held lease nor a spent turn. The order is the point: a request that fails
validation, has no backend, has no session, or loses to an open turn must not
spend a turn or leave a lease behind. It also means the `NOT NULL user_id`
upsert never runs for a signed-out caller — the `401` has already answered.
Put the lease and quota calls in the route handler itself, immediately before
`reply.hijack()`, not in a `preHandler`, because Fastify runs route
`preHandler` hooks before the handler's own checks.

Decisions, each stated here so the UI story can rely on them:

- **Count at turn start, not at turn end.** A turn that the client abandons
  still spent model time up to the abort. Counting at the end would let a user
  abandon turns for free. "Turn start" means the step above, after every free
  rejection. Say so in the code comment.
- **A distinct error code from the burst limit.** `rate_limited` means wait a
  minute; `quota_exceeded` means wait until tomorrow. The UI (Phase 7) shows a
  different message for each, and the metrics (story 5-E) count them apart.
- **The quota is an env value, `DUOS_CHAT_DAILY_TURN_QUOTA`**, read in
  `server/src/config.ts` and validated at startup — inside the `chatEnabled`
  gate, like `DUOS_REPLICA_COUNT` (story 6-A), so an environment with chat off
  never requires it. It is a count of turns, not a dollar figure (§3.4).
  *Proposal — replace in 6-E:* 50.
- **A database error here is a `503`, not a free turn.** State the choice. The
  conservative reading is that a quota you cannot check is a quota you cannot
  enforce; the user-friendly reading is that one database blip should not
  block the chat. Recommend `503 { error: 'quota_unavailable' }`, because the
  session store shares the same database and a blip there already fails the
  request.

Emit the rejection as the same structured event story 5-E defines, with
`outcome: 'quota_exceeded'`, so the daily count of blocked users is one filter
away.

Tests: the fifty-first turn in a UTC day gives `429` with the documented body;
the first turn after midnight succeeds; a database error gives `503`; no SSE
frame is ever sent on a rejection; a request rejected by validation, by a
missing backend, or by a missing session leaves `turns` unchanged and no lease
row behind.

**Files:** `server/src/chat/quota.ts`, `server/src/chat/route.ts`, `server/src/config.ts`, `server/src/chat/events.ts`, `.env.example`, `server/test/chatQuota.test.ts`
**Effort:** 1d &nbsp;|&nbsp; **Risk:** Low

---

### 6-D: The concurrency cap

§3.4 names the trap: an in-process counter set to 1 allows one turn *per pod*,
not one per user, and two tabs can land on two pods. A deployment-wide cap
needs a shared lease, and a lease needs a release path for a disconnect, a
crash and a turn that outruns its deadline.

*Proposal — confirm in review:* **one open turn per user, deployment-wide,
leased in the `chat_turn_lease` row with an owner token.**

1. Mint a `lease_token` (`crypto.randomUUID()`) for the turn. Then, as the
   first database step, ahead of the quota upsert (story 6-C): `INSERT INTO
   chat_turn_lease (user_id, lease_token, lease_until) VALUES ($1, $2, now() +
   <turn deadline + 10 s>) ON CONFLICT (user_id) DO UPDATE SET lease_token =
   EXCLUDED.lease_token, lease_until = EXCLUDED.lease_until WHERE
   chat_turn_lease.lease_until < now() RETURNING lease_token`. A row comes
   back only when the lease was free or expired; compare the returned token
   with the minted one.
2. If no row came back, answer `409 { error: 'turn_in_progress' }` as JSON. The
   UI (Phase 7) already cancels an open turn before it starts a new one, so a
   user sees this only across tabs.
3. Release the lease on `done`, on `error`, on a quota rejection in 6-C, and
   on client disconnect (Phase 1 story 1-F's `reply.raw` `close` listener):
   `DELETE FROM chat_turn_lease WHERE user_id = $1 AND lease_token = $2`. **The token is the owner check.** Without it,
   turn A's late release would clear a lease that turn B took after A's
   expired, and a third tab could start beside B. A crash releases nothing,
   and that is what the expiry is for: a lease outlives its turn by ten
   seconds at most.
4. The lease delete on release is the one database call that happens **after
   the hijack**. It touches `chat_turn_lease`, never the session, so ADR-002
   decision 2 holds; say so in the code comment next to it.

Why not an in-process counter: it would be simpler, and the Phase 1 turn
registry already holds every open turn on a pod. But with two replicas it caps
a user at two turns, not one, and the number of replicas is a chart value the
code cannot see. Keep the registry for shutdown; use the lease for the cap.

Tests: a second turn while one is open gives `409`; a turn that ends by `done`,
by `error` and by disconnect each release the lease; a lease older than the
deadline plus grace is treated as free; a release carrying a stale token
deletes nothing; a turn that spans UTC midnight holds one lease and increments
yesterday's quota row only; the release path runs with the session untouched.

**Files:** `server/src/chat/quota.ts`, `server/src/chat/route.ts`, `server/src/chat/turnRegistry.ts`, `server/test/chatQuota.test.ts`, `server/test/chatSessionSafety.test.ts`
**Effort:** 1.5d &nbsp;|&nbsp; **Risk:** Medium — a leaked lease blocks a user for the grace period

---

### 6-E: Size the numbers from measured turns

Answers open question 4. Do this last, with story 5-E's output in hand.

1. Run the Phase 4 question set against the stub and read the iteration count
   and tool-call count per question from the report.
2. Once Chat 9 lands, run ten real turns against Gemini in a BEE and record
   input and output token counts per turn from the 5-E event.
3. Derive three numbers and write them in `server/src/chat/limits.ts` with the
   arithmetic in the comment:
   - `turnsPerMinute`: a multiple of the replica count, sized so the tool calls
     of a full minute of turns stay inside what is left of the user's shared
     Consent budget (100 requests per minute in dev and staging, §3.4) after
     ordinary page traffic. Five tool calls per turn and six turns per minute
     is thirty of the hundred.
   - `dailyTurnQuota`: from the measured token cost of a turn and the dollar
     ceiling the team agrees per user per day. Record the ceiling and the price
     used, with a date, because the price changes.
   - The concurrency cap stays at one unless the measurements argue otherwise.
4. Put the per-environment values in `terra-helmfile` (`values/app/duos/live/`
   and `bee.yaml.gotmpl`) as the three env vars this phase introduced.

Until step 2 is possible, land the stub-derived numbers and mark them in the
file header as pre-Gemini.

**Files:** `server/src/chat/limits.ts`, this document (append the measurements), `terra-helmfile` values
**Effort:** 0.5d, plus the measurement runs &nbsp;|&nbsp; **Risk:** Low

---

## Suggested sequencing

The `terra-helmfile` change (the replica count and the quota env var, from
6-A and 6-C) merges first, because the chart must render the variables before
any environment turns chat on. 6-B goes early too, because it deploys with
Consent on Consent's cadence and the two route stories wait on it. 6-A is
otherwise independent and can land any time after Phase 1 and Phase 7 story
7-A, whose gate it reads.

```
helmfile ─→ 6-A ──────────┐
6-B ─→ 6-C ─→ 6-D ────────┴─→ 6-E (after 5-E, and again after Chat 9)
```

---

## Exit criteria

1. A user's seventh turn in a minute is rejected as JSON `429` before any SSE
   frame, and the limit divides by `DUOS_REPLICA_COUNT` delivered from the
   chart.
2. The quota and lease tables exist in Consent's changelog as `bff-03`, and
   the scratch schema in `server/test/load/README.md` matches them.
3. The daily quota rejects with `quota_exceeded`, counts at turn start after
   every free rejection, and survives a logout and a session rotation.
4. A second concurrent turn for one user is rejected deployment-wide, every
   end state releases the lease, and a release checks its owner token.
5. All three numbers are recorded with their arithmetic, and the measurement
   that produced them is appended to this document.
6. No story in this phase writes to the session after the hijack.
7. An environment with `chatEnabled` off boots without any of this phase's env
   vars, and a request rejected before the hijack spends no turn and leaves no
   lease.
