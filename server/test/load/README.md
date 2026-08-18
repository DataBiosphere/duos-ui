# BFF proxy load testing

This harness measures the BFF API proxy under concurrent load. It focuses on:

- latency and throughput through `apiProxy`;
- request and response streaming;
- the Postgres pool used by the session store; and
- backpressure from the proxy's upstream socket pool.

It was created for Phase 3, story 3-H.

> [!IMPORTANT]
> This is a local diagnostic tool, not a CI benchmark. Absolute latency varies
> with the host, virtualization, other workloads, and the Node version. Proxy
> correctness remains covered by `apiProxy.test.ts`; this harness is for
> understanding capacity and the shape of the performance curve.

## Quick start

Run the default authenticated-read scenario with in-memory sessions:

```bash
pnpm test:load
```

Run every scenario against Postgres:

```bash
DUOS_DB_HOST=localhost DUOS_DB_SSL=false \
  pnpm test:load -- --scenario all --store postgres
```

Add one millisecond of simulated database latency in each direction:

```bash
DUOS_DB_HOST=localhost DUOS_DB_SSL=false \
  pnpm test:load -- --store postgres --db-latency 1
```

## Headline results

Reference runs on an Apple M2 Max found that:

- the proxy added about 2 ms of median latency in this setup;
- the default Postgres pool of 10 connections supported roughly 2,900 req/s
  with a simulated 2 ms database round trip;
- increasing the Postgres pool beyond 20 connections produced no consistent
  improvement; and
- the 128-socket upstream pool provides intentional backpressure and becomes
  the throughput ceiling well before the Node process does.

These results support keeping both production pool sizes unchanged. Full
measurements and interpretation are recorded below.

## Test topology

```text
process 1: autocannon worker threads
      │  seeded sessions, each with its own cookie and CSRF token
      ▼
process 2: Fastify — cookie → session → CSRF → apiProxy
      │                        │
      │ session SELECT         │ reply.from()
      ▼                        ▼
Postgres                  process 3: stub DUOS API
```

The driver, BFF, and stub upstream do not share a Node event loop. This matters
because parsing requests and writing responses consume event-loop time even
when response bodies are pre-allocated. An earlier single-process harness made
the stub's work look like proxy overhead and produced misleading conclusions.

The Fastify target registers Postgres, cookies, sessions, CSRF protection, and
`apiProxy` in the same order as `index.ts`. It omits components that are not on
a `/duos-api/*` request path, including `@fastify/vite`, the SPA fallback, and
`/config.json`.

The harness substitutes two external dependencies:

- **Authentication:** `POST /__load/seed` creates a real session through the
  configured session store and returns its cookie and CSRF token. Its access
  token expires an hour later, keeping the refresh path out of the benchmark.
- **DUOS API:** a small HTTP server returns fixed-latency, pre-allocated bodies.
  Before measuring a scenario, the harness verifies one proxied response
  byte-for-byte against the stub's response.

## Run modes

### In-memory sessions

This is the default and requires no external services:

```bash
pnpm test:load
pnpm test:load -- --scenario all
```

Use it when the proxy and upstream socket pool are the systems of interest.

### Postgres sessions

Use `--store postgres` to include the production session store in the request
path. The database must contain the BFF's `user_sessions` table, and the
`DUOS_DB_*` variables must point to it.

When using a Docker Compose database, override two common `.env.local` values:

```bash
DUOS_DB_HOST=localhost DUOS_DB_SSL=false \
  pnpm test:load -- --scenario all --store postgres
```

The overrides are necessary because:

- `host.docker.internal` describes a route from a container, but this harness
  runs on the host; and
- Compose Postgres does not use TLS, while `DUOS_DB_SSL` defaults to enabled.

The harness validates both settings before running and deletes the session rows
it creates when it finishes.

For a scratch database, the required schema is:

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

This is copied from the Consent Liquibase changeset for local setup; Consent
continues to own the production schema.

#### Simulating database latency

A loopback session query takes roughly 0.2 ms, so even a one-connection pool can
serve thousands of requests per second. That says little about a deployment
reaching Cloud SQL through a proxy sidecar.

Use `--db-latency <ms>` to insert a delaying TCP relay in front of Postgres:

```bash
DUOS_DB_HOST=localhost DUOS_DB_SSL=false \
  pnpm test:load -- --store postgres --db-latency 1
```

The value is one-way latency, so `--db-latency 1` adds approximately 2 ms to a
query round trip. The relay keeps the pooled connection checked out while
delaying traffic, leaving `pgStore` and `@fastify/postgres` unchanged.

### Deployed BFF

The harness can also drive a signed-in session in development or staging:

```bash
pnpm test:load -- --target https://duos.dsde-dev.broadinstitute.org \
  --cookie 'sessionId=…' --csrf-token '…'
```

Sign in through a browser, copy the `sessionId` cookie, and obtain a CSRF token
from `GET /auth/csrf-token`.

A remote run uses one real session and the real upstream. It has no seeding,
stub, or pool sampling. Avoid the `download` scenario, which can transfer
gigabytes, and never target production.

Remote results describe end-to-end environment latency, not isolated proxy
overhead. Because upstream latency cannot be measured independently during the
run, remote verdicts check only non-2xx responses, connection errors, and
timeouts; they do not apply the local p99 budgets.

## Scenarios and verdicts

| Scenario | What it exercises | Default connections |
|---|---|---:|
| `read` | Authenticated small GET: one session lookup and one upstream hop | 100 |
| `write` | CSRF verification and a streamed 4 KB request body | 100 |
| `download` | A 5 MB response streamed through `reply.from` | 20 |
| `anonymous` | An allowlisted request with no session or database access | 100 |

A local scenario fails if it observes:

- a non-2xx response;
- a connection error or timeout;
- a response body that differs from the upstream body; or
- p99 latency above `upstream latency + p99BudgetMs` from `scenarios.ts`.

The latency budgets are deliberately loose. They are intended to expose a
change in the curve, not enforce an absolute number from one machine.

## Reference results — 2026-08-10

Environment: Apple M2 Max, 12 cores, 32 GB, Node 26.6.0. The driver, BFF, stub,
and Postgres ran as separate processes on the same machine.

Unless noted otherwise, each run used 50 sessions, a 3-second warmup, 20 seconds
of measurement, a 20 ms stub upstream, the default Postgres pool of 10, and 128
upstream sockets.

### All scenarios

Postgres on loopback:

| Scenario | Conns | Req/s | MB/s | p50 | p99 | Non-2xx | Errors | Bad body | Pool max/waiting |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| `read` | 100 | 4,243 | 9.1 | 22 ms | 39 ms | 0 | 0 | 0 | 10/78 |
| `write` | 100 | 4,107 | 8.8 | 22 ms | 51 ms | 0 | 0 | 0 | 10/51 |
| `download` | 20 | 138 | 691.8 | 147 ms | 195 ms | 0 | 0 | 0 | 10/5 |
| `anonymous` | 100 | 4,490 | 9.6 | 22 ms | 25 ms | 0 | 0 | 0 | 10/0 |

The same run with a simulated 2 ms database round trip
(`--db-latency 1`):

| Scenario | Conns | Req/s | MB/s | p50 | p99 | Non-2xx | Errors | Bad body | Pool max/waiting |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| `read` | 100 | 3,045 | 6.5 | 32 ms | 42 ms | 0 | 0 | 0 | 10/90 |
| `write` | 100 | 2,898 | 6.2 | 34 ms | 41 ms | 0 | 0 | 0 | 10/48 |
| `download` | 20 | 132 | 660.0 | 151 ms | 206 ms | 0 | 0 | 0 | 10/9 |
| `anonymous` | 100 | 4,461 | 9.6 | 22 ms | 27 ms | 0 | 0 | 0 | 10/0 |

## Interpreting the results

### Proxy overhead and streaming

Against a 20 ms upstream, both `read` and `anonymous` had a 22 ms median. In
this setup, the proxy therefore added approximately 2 ms at the median, and the
session lookup was not visible until database latency was introduced.

`write` performed similarly to `read` despite its CSRF check and 4 KB body. The
`download` scenario moved 5 MB bodies at about 690 MB/s with 20 requests in
flight. Together, these results support the intended streaming behavior from
ADR-004 rather than request or response buffering.

### Session-store cost and Postgres pool size

On loopback, authenticated `read` reached 4,243 req/s compared with 4,490 req/s
for `anonymous`, a difference of about 5%. With a 2 ms database round trip,
authenticated throughput fell to 3,045 req/s while `anonymous` remained at
4,461 req/s.

Changing the Postgres pool size under a 2 ms database round trip produced:

| Pool size | 10 | 20 | 32 | 64 |
|---|---:|---:|---:|---:|
| Req/s | 2,924 | 3,751 | 3,545 | 3,777 |
| p50 | 33 ms | 25 ms | 26 ms | 25 ms |

Moving from 10 to 20 connections improved throughput by about 22% and reduced
p50 by 8 ms, with no consistent gain above 20. No production change is
proposed: roughly 2,900 req/s per pod is far above expected DUOS traffic, and
each additional connection consumes a backend on the Consent database.

As a sizing approximation:

```text
session-store ceiling ≈ pool size ÷ database query round trip
```

### Upstream socket pool

With 400 client connections and in-memory sessions, throughput closely followed
the upstream pool's theoretical ceiling:

| Upstream latency | 32 sockets | 64 sockets | 128 sockets | 256 sockets |
|---|---:|---:|---:|---:|
| 20 ms | 1,437 req/s | 2,901 req/s | 5,849 req/s | 10,302 req/s |
| 50 ms | 569 req/s | 1,200 req/s | 2,449 req/s | 4,886 req/s |
| 100 ms | 270 req/s | 589 req/s | 1,232 req/s | 2,459 req/s |

Each measurement reached 85–95% of `socket count ÷ upstream latency`. The Node
process itself saturated near 11,400 req/s with a zero-latency upstream and 256
sockets; increasing to 512 sockets did not improve it.

The shipped pool of 128 sockets therefore provides meaningful backpressure. It
caps a pod near 6,400 req/s with a 20 ms upstream and 1,280 req/s with a 100 ms
upstream—both well above expected DUOS traffic—while preventing a slow upstream
from causing unbounded file-descriptor growth.

At 20 ms upstream latency with 128 sockets, increasing client concurrency
showed the expected queueing behavior:

| Client connections | 50 | 100 | 200 | 400 |
|---|---:|---:|---:|---:|
| Req/s | 2,141 | 4,401 | 5,725 | 5,788 |
| p50 | 23 ms | 22 ms | 34 ms | 67 ms |

Past roughly 200 concurrent requests, throughput flattened while latency grew.
That queue belongs in front of the pod, where horizontal scaling can address it.

## What this harness does not cover

- **Token refresh:** exercising it requires a live B2C token endpoint.
  Concurrent single-flight behavior is covered by `refresh.test.ts`.
- **Multiple BFF pods:** this harness runs one BFF process and one connection
  pool. It does not measure cross-pod refresh races or session-store contention.
- **A production network:** local runs do not include TLS termination, ingress,
  or a sidecar. Use remote mode to measure an actual environment.
- **Every response during the timed run:** the harness verifies one response
  per scenario byte-for-byte before measuring. Autocannon's `expectBody` cannot
  be combined with the per-session request templates used here.
