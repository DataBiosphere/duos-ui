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

The server reads `config.json` from the build output and refuses to start
without it, so copy an environment config in before you build:
```
cp config/dev.json public/config.json
```

Build the client and the server:
```
CI=false pnpm run build
```

Then run the tests (Playwright starts the server for you):
```
pnpm run test:e2e
```

The server runs at `https://local.dsde-dev.broadinstitute.org:3000`, and
Playwright waits on its `/health` route. You need the local certificate pair
(`server.key`, `server.crt`) in the project root; `pnpm run serve` starts the
same server on its own.

### Session infrastructure

The server registers its Postgres session layer when `DUOS_DB_HOST` is set, so
a run with no `DUOS_*` variables exercises the legacy sign-in flow and needs no
database. To run against the session infrastructure, export the database
variables (see `.env.example`) and start Postgres — `docker compose up -d db`
is enough — before `pnpm run test:e2e`.

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
