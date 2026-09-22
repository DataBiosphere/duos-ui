# Testing

## Unit & Component Tests (Vitest + RTL)

Run all tests:
```
pnpm test
```

Run in watch mode:
```
pnpm test:watch
```

Run with coverage:
```
pnpm test:coverage
```

## Browser Component Tests (Vitest + Playwright)

```
pnpm test:browser
```

## E2E Tests (Playwright)

The suite runs against the **Fastify server**, not `vite preview`. The preview
server sends none of the security headers, cookies or routes the real
deployment sends, so a spec could pass against it and still fail in production.

### What each spec needs

Read this table before you run anything. The suite is not uniform: four of the
six spec files need nothing but a build, and two need live role credentials.

| Spec | Needs |
|---|---|
| `about`, `home`, `status`, `liveness` | a build, and the certificate below |
| `auth`, `studyTemplate` | the role service-account keys as well |

Nothing in the suite needs a database yet. The session infrastructure is
optional, and the last section covers it.

### 1. Certificate

The server terminates TLS itself, because the session cookie is `Secure`. Put
`server.key` and `server.crt` in the project root. `./scripts/render-configs.sh`
writes them from the dev cluster.

### 2. Config file

The server reads `config.json` from the build output and refuses to start
without it:

```
cp config/dev.json public/config.json
```

### 3. Build

```
CI=false pnpm run build
```

### 4. Run

The four specs that need no credentials:

```
pnpm exec playwright test about.spec.ts home.spec.ts status.spec.ts liveness.spec.ts
```

Playwright starts the server for you and waits on its `/health` route.
`pnpm run serve` starts the same server on its own.

### 5. Role credentials, for `auth` and `studyTemplate`

These two specs sign in as each DUOS role, and the whole suite fails with
`Missing service account key env var DUOS_AUTOMATION_ADMIN_SA` without them.
Fetch the keys from Secret Manager (you need `gcloud` and `jq`), load them, then
run everything:

```
./scripts/render-accounts.sh
set -a; source test/e2e/fixtures/duos-automation.env; set +a
pnpm run test:e2e
```

The rendered file holds live credentials. It is gitignored and written with
owner-only permissions.

### Session infrastructure (optional)

The server registers its Postgres session layer when `DUOS_DB_HOST` is set, so
a run with no `DUOS_*` variables exercises the legacy sign-in flow and needs no
database. To run against the session infrastructure instead, do all three of
these before `pnpm run test:e2e`:

1. Start Postgres. `docker compose up -d db` is enough, and its
   `config/consentdb.sql` dump already carries the `user_sessions` table. A
   database from any other source needs the schema applied by hand:
   `psql "$DATABASE_URL" -f test/e2e/sql/user_sessions.sql`.
2. Export the database variables — `DUOS_DB_HOST`, `DUOS_DB_NAME`,
   `DUOS_DB_USER`, `DUOS_DB_PASSWORD`, and `DUOS_DB_SSL=false` for a local
   container. See `.env.example`.
3. Export `DUOS_SESSION_SECRET`, at least 32 characters
   (`openssl rand -base64 32`). The server refuses to start without it once
   `DUOS_DB_HOST` is set, so Playwright reports a server that never came up.

CI provisions the same thing per run: a Postgres service container, the session
schema in `test/e2e/sql/user_sessions.sql`, a generated session secret and a
self-signed certificate. See `.github/workflows/integration-tests.yml`.

`test/e2e/sql/user_sessions.sql` is a copy of Consent's Liquibase changeset
`changelog-consent-2026-06-16-bff-01-user-sessions.xml`, because this
repository has no migration path of its own. Keep the two in step.

### Cleaning up sessions a spec creates

Delete by identity, never truncate. Playwright runs spec **files**
concurrently, so a blanket wipe of `user_sessions` between files would delete
another file's live session and fail the suite at random. A spec records the
`sessionId` it was issued and removes only those rows. Leaked rows from an
earlier run expire on their own, through the `maxAge` the store already applies.
