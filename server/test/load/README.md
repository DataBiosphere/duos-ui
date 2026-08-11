# Load test — BFF API proxy

Epic 3, story 3-H. Measures what the proxy layer costs and where it stops
scaling: latency and throughput under concurrent session load, and whether the
`@fastify/postgres` pool behind the session store holds up.

```bash
pnpm test:load                                   # read scenario, in-memory sessions
pnpm test:load -- --scenario all --store postgres
```

A breached threshold exits non-zero. That is for the person running it — **this
is not wired into CI and should not be**: absolute latency depends on the host,
its other tenants, the runner's virtualization and the Node version, so a
threshold tight enough to catch a regression would fail on a noisy runner and
one loose enough to survive one would catch nothing. Correctness of what the
proxy returns is `apiProxy.test.ts`'s job (101 cases); this run's job is the
shape of the curve.

## What it stands up

```
process 1: autocannon worker threads
      │  N seeded sessions, each with its own cookie and CSRF token
      ▼
process 2: Fastify — cookie → session → csrf → apiProxy    ← the code under test
      │                        │
      │ session SELECT         │ reply.from()
      ▼                        ▼
Postgres (own process)    process 3: stub DUOS API
```

**Three processes, not one.** The stub upstream is forked rather than started
in-process, because parsing requests and writing responses is real work on a
real event loop even when the bodies are pre-allocated. Sharing the BFF's loop
with it makes the stub's service time indistinguishable from the proxy's — and
it did: an earlier single-process draft of this harness reported a "process
ceiling" of ~6,100 req/s that was really the stub competing for the loop, and
made the in-memory session store look 20% *slower* than Postgres. Both numbers
moved once the stub was moved out. Load generation is likewise in worker
threads.

The target is assembled the way `index.ts`'s `if (process.env.DUOS_DB_HOST)`
block assembles it, in the same order. What is deliberately missing is
everything that is not in a `/duos-api/*` request's path: `@fastify/vite`, the
SPA fallback, `/config.json`.

Two things the harness fakes, and how:

- **Sessions** come from a seeding route (`POST /__load/seed`) that writes a
  real session through the real store and hands back the cookie — standing in
  for a completed OAuth flow. Access tokens expire an hour out, so no request
  in a run enters the refresh path.
- **The upstream** is a stub `http.Server` with a fixed `--upstream-latency`
  and pre-allocated bodies. Before each scenario is measured, one request is
  sent through the proxy and compared byte-for-byte with what the stub serves,
  so a run cannot report throughput for a fast but wrong response.

## Running against Postgres

`--store postgres` needs a database with the BFF's `user_sessions` table and the
`DUOS_DB_*` variables pointing at it. `.env.local` is loaded automatically —
**but two of its values will be wrong here**, because they describe the route to
Postgres from *inside* a container while this harness runs on the host:

```bash
# Against a docker compose consent (or duos) stack:
DUOS_DB_HOST=localhost DUOS_DB_SSL=false pnpm test:load -- --scenario all --store postgres
```

`DUOS_DB_HOST=host.docker.internal` does not resolve on the host, and
`DUOS_DB_SSL` defaults to on while the compose Postgres does not speak TLS. The
harness checks both before the run and says which one it hit; the seeding route
would otherwise report only a 500.

The run deletes the session rows it created when it finishes, so pointing it at
a real `consent` database leaves nothing behind.

Any Postgres will do — a compose stack, a `consent` checkout, or a throwaway
cluster:

```sql
CREATE TABLE user_sessions (
  sid    VARCHAR   NOT NULL COLLATE "default",
  sess   JSON      NOT NULL,
  expire TIMESTAMP NOT NULL,
  idp    VARCHAR(16),
  CONSTRAINT session_pkey PRIMARY KEY (sid)
);
CREATE INDEX idx_session_expire ON user_sessions (expire);
```

(A copy of the Consent Liquibase changeset, for standing up a scratch database.
Consent owns the real schema.)

**`--db-latency <ms>` is what makes the pool question answerable.** A session
`SELECT` against a Postgres on loopback costs ~0.2 ms, so a pool of *one*
connection sustains several thousand requests per second and no pool size is
ever the constraint — a fact about the laptop, not about the deployment, which
reaches Cloud SQL through a proxy sidecar. The flag inserts a delaying TCP relay
in front of Postgres (one-way, so a query pays twice it), which holds a pooled
connection checked out for a realistic round trip while leaving `pgStore` and
`@fastify/postgres` untouched.

## Against a deployed BFF

```bash
pnpm test:load -- --target https://duos.dsde-dev.broadinstitute.org \
  --cookie 'sessionId=…' --csrf-token '…'
```

Sign in with a browser, copy the `sessionId` cookie and a token from
`GET /auth/csrf-token`. This drives one real session against the real upstream:
no stub, no seeding, no pool sampling, and no `download` scenario worth running
(it would move gigabytes off the real API). Point it at dev or staging, never at
production.

**A remote run reports end-to-end latency for that environment, not proxy
overhead.** The budgets below are stated as overhead above the upstream's own
latency, and nothing here can measure that latency independently while it is
also loading the proxy — so they are not applied, and only errors, non-2xx and
timeouts can fail a remote run.

## Scenarios and thresholds

| scenario    | what it puts under pressure                                    | default connections |
|-------------|----------------------------------------------------------------|---------------------|
| `read`      | small authenticated GET — one session `SELECT`, one upstream hop | 100                 |
| `write`     | CSRF verification and a streamed 4 KB request body              | 100                 |
| `download`  | a 5 MB response through `reply.from` — streaming, not buffering | 20                  |
| `anonymous` | an allowlisted path: no session, so no database                 | 100                 |

A scenario fails on any non-2xx, any connection error or timeout, any response
body that was not the upstream's, or a p99 above `upstream-latency +
p99BudgetMs` (`scenarios.ts`). The budgets are stated as overhead *above* the
measured upstream floor rather than as absolute latency, and are deliberately
loose — 100 ms against a measured 3–20 ms — for the reason in the opening
section.

## Results — 2026-08-10

Apple M2 Max, 12 cores, 32 GB, Node 26.6.0. Driver, BFF, stub and Postgres are
separate processes but share one machine, so absolute ceilings are the host's
rather than a pod's; the ratios and the shapes of the curves are the
transferable part. 50 sessions, 20 s per scenario after a 3 s warmup, 20 ms stub
upstream, defaults otherwise (`pg` pool `max: 10`, 128 upstream sockets).

**A — Postgres on loopback**

| scenario    | conns | req/s | MB/s  | p50   | p99   | non-2xx | errors | bad body | pool max/waiting |
|-------------|-------|-------|-------|-------|-------|---------|--------|----------|------------------|
| `read`      | 100   | 4243  | 9.1   | 22ms  | 39ms  | 0       | 0      | 0        | 10/78            |
| `write`     | 100   | 4107  | 8.8   | 22ms  | 51ms  | 0       | 0      | 0        | 10/51            |
| `download`  | 20    | 138   | 691.8 | 147ms | 195ms | 0       | 0      | 0        | 10/5             |
| `anonymous` | 100   | 4490  | 9.6   | 22ms  | 25ms  | 0       | 0      | 0        | 10/0             |

**B — the same, with a 2 ms round-trip database (`--db-latency 1`)**

| scenario    | conns | req/s | MB/s  | p50   | p99   | non-2xx | errors | bad body | pool max/waiting |
|-------------|-------|-------|-------|-------|-------|---------|--------|----------|------------------|
| `read`      | 100   | 3045  | 6.5   | 32ms  | 42ms  | 0       | 0      | 0        | 10/90            |
| `write`     | 100   | 2898  | 6.2   | 34ms  | 41ms  | 0       | 0      | 0        | 10/48            |
| `download`  | 20    | 132   | 660.0 | 151ms | 206ms | 0       | 0      | 0        | 10/9             |
| `anonymous` | 100   | 4461  | 9.6   | 22ms  | 27ms  | 0       | 0      | 0        | 10/0             |

### What the numbers say

**The proxy costs about two milliseconds.** Against a 20 ms upstream, `read`
sits at 22 ms p50 — and `anonymous`, which skips the session store entirely, is
the same. `write` is indistinguishable from `read` despite carrying a 4 KB body
and a CSRF check, which is the evidence that the wildcard content-type parser
streams bodies rather than buffering them (ADR-004). `download` moves 5 MB
bodies at ~690 MB/s with 20 in flight, which is loopback bandwidth: the proxy is
not a copy in the middle.

**The session store costs 5% on a loopback database and a third on a remote
one.** `read` against `anonymous`: 4243 vs 4490 req/s in run A, 3045 vs 4461 in
run B. The in-memory store is ~4% faster than loopback Postgres (4471–4513 vs
4313–4325, interleaved), which is the expected direction and the size to expect
of it.

**The pg pool holds at its default, and the load test can tell the difference.**
`max: 10` never turned into a failed request at any concurrency tried. Its
`waiting` high-water mark reaches 90, but against a 0.2 ms query that queue is
not latency — it drains faster than it builds. With a realistic 2 ms round trip
it does start to cost:

| `--pg-pool-max` (2 ms DB, 100 conns) | 10   | 20   | 32   | 64   |
|--------------------------------------|------|------|------|------|
| req/s                                | 2924 | 3751 | 3545 | 3777 |
| p50                                  | 33ms | 25ms | 26ms | 25ms |

~22% of throughput and 8 ms of p50, with no further gain above 20. **No change
is proposed**: 2900 req/s per pod against a remote database is orders of
magnitude above DUOS's load, and every connection here is a backend on the
Consent database. The rule to remember is that a pod's session-store ceiling is
roughly `pool_size ÷ query_round_trip`.

**`UPSTREAM_POOL_CONNECTIONS = 128` is a real throughput ceiling, not a
formality.** Whenever in-flight requests exceed the socket pool, a pod is capped
at `sockets ÷ upstream latency` — and the measurement tracks that product
closely (400 client connections, memory store, `--upstream-pool`):

| req/s        | 32 sockets | 64   | 128   | 256   |
|--------------|------------|------|-------|-------|
| 20 ms upstream  | 1437    | 2901 | 5849  | 10302 |
| 50 ms upstream  | 569     | 1200 | 2449  | 4886  |
| 100 ms upstream | 270     | 589  | 1232  | 2459  |

Every cell is 85–95% of `sockets ÷ latency`. The process itself saturates near
**11,400 req/s** (0 ms upstream, 256 sockets; 512 sockets does not beat it), so
at the shipped 128 the sockets bind first at every upstream latency worth
caring about. **128 stays** — it caps a pod at ~6,400 req/s against a 20 ms
upstream and ~1,280 against a 100 ms one, both far above what DUOS sees, and it
is the backpressure that stops a slow upstream from consuming file descriptors
without limit. Raising it is a decision about a ceiling nobody is near, and the
formula above is how to size it if that changes.

*(An earlier single-process version of this harness concluded the opposite —
that the socket pool never bound — from a plateau at ~6,100 req/s that turned
out to be the stub upstream sharing the BFF's event loop. That plateau sat close
enough to `128 ÷ 20 ms` to look like a coincidence worth ignoring. It was not a
coincidence, and the fix was to fork the stub.)*

**Past the socket pool, latency grows in proportion and throughput does not.**
At 20 ms upstream with the shipped 128 sockets:

| connections | 50   | 100  | 200  | 400  |
|-------------|------|------|------|------|
| req/s       | 2141 | 4401 | 5725 | 5788 |
| p50         | 23ms | 22ms | 34ms | 67ms |

The queue past ~200 concurrent requests is in front of the pod, which is what a
horizontal pod autoscaler is for.

### Not covered

- **The refresh path.** It needs a live B2C token endpoint; stubbing one would
  measure the stub. Single-flight under concurrency is covered by
  `refresh.test.ts` (story 3-G), including an N-way concurrent burst.
- **Multi-pod behavior.** One BFF process, one pool. Cross-pod refresh races and
  session-store contention are reasoned about in story 3-B, not measured here.
- **A real network.** Everything is on loopback: no TLS termination, no ingress,
  no sidecar. Use `--target` against a deployed environment for that.
- **Per-request body verification.** One request per scenario is checked
  byte-for-byte before the run; autocannon's own `expectBody` cannot be combined
  with the per-session request templates the run needs.
