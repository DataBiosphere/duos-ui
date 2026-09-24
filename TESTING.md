# Testing

## Unit & Component Tests (Vitest + RTL)

Run the client tests:
```
pnpm test
```

Run the server tests:
```
pnpm --filter duos-server test
```

Run the client tests in watch mode:
```
pnpm test:watch
```

Run the client tests with coverage:
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

Playwright starts the server for you (`pnpm run serve`) and waits on its
`/health` route. The server reads its configuration from the process
environment and from `config.json` in the build output. It does not read
`.env.local`, so export what it needs before you run the suite.

### What each spec needs

| Spec | Path |
|---|---|
| `about`, `home`, `status`, `liveness` | Public specs: a build and the certificate |
| `role-access`, `studyTemplate` | Full suite: a BFF-enabled build, a session database, role service-account keys, and the test-sign-in fixture |

### Shared prerequisites

1. **Certificate.** The server terminates TLS itself, because the session cookie
   is `Secure`. Put `server.key` and `server.crt` in the project root.
   `./scripts/render-configs.sh` writes them from the dev cluster.
2. **Hostname.** `local.dsde-dev.broadinstitute.org` must resolve to
   `127.0.0.1`. Add it to `/etc/hosts` if it does not.

### Path A: public specs

No database, no credentials, and no extra environment variables. Use a fresh
shell: a `DUOS_TEST_SIGNIN_ENABLED=true` left over from Path B stops this
server at startup. Three commands:

```sh
cp config/dev.json public/config.json
CI=false pnpm run build
pnpm exec playwright test about.spec.ts home.spec.ts status.spec.ts liveness.spec.ts
```

### Path B: full suite

The role-based specs sign in through `/backgroundsignin`, which POSTs a Google
service-account access token to the BFF route `/auth/test-signin`. The BFF
checks the token with Google, rotates the session ID, and keeps the token
server-side. The browser holds only the session cookie. These specs cover role
access. They do not cover the B2C callback flow.

#### 1. Server environment

Put these in `.env.local` ([.env.example](.env.example) explains each one).
That file is the documented path: the compose command in step 2 reads it. If
you export the variables instead, drop `--env-file .env.local` from that
command.

| Variable | Value |
|---|---|
| `DUOS_DB_HOST`, `DUOS_DB_PORT` | A host-reachable address such as `localhost` and the published port. The server runs on the host, so a compose service name such as `db` does not resolve. |
| `DUOS_DB_NAME`, `DUOS_DB_USER`, `DUOS_DB_PASSWORD` | Credentials for that database |
| `DUOS_DB_SSL` | `false` for a local Postgres without TLS |
| `DUOS_SESSION_SECRET` | At least 32 characters: `openssl rand -base64 32` |
| `DUOS_API_URL` | The Consent upstream, such as `https://consent.dsde-dev.broadinstitute.org` |
| `DUOS_TEST_SIGNIN_ENABLED` | `true` |
| `DUOS_TEST_SIGNIN_EMAILS` | The five automation service-account emails, comma-separated. Step 3 prints them. |

`./scripts/render-configs.sh --write_env true` fills the database and API
values from the dev cluster.

#### 2. Session database

The server needs a Postgres database with the session and audit schema,
including its triggers. Pick one:

- The bundled `db` service. Follow the database setup in
  [DEVNOTES.md](DEVNOTES.md), then run
  `docker compose --env-file .env.local up -d db`. Compose reads
  `DUOS_DB_PASSWORD` from that file, which is why step 1 comes first. The dump
  already carries the schema.
- Any other database. Apply the schema by hand:

  ```sh
  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f test/e2e/sql/user_sessions.sql
  ```

  `DATABASE_URL` must name the same database and user that the server will
  use. [test/e2e/sql/user_sessions.sql](test/e2e/sql/user_sessions.sql) lists
  the Consent changesets it copies; keep it in step with them.

#### 3. Role credentials

Fetch the five role service-account keys from Secret Manager (requires `gcloud`
and `jq`). The rendered file is gitignored, holds live credentials, and is
written with owner-only permissions. The helper script prints only the public
`client_email` identities for the allowlist, never the keys.

```sh
./scripts/render-accounts.sh
set -a
source test/e2e/fixtures/duos-automation.env
source .env.local   # skip if the server variables are already exported
set +a
export DUOS_TEST_SIGNIN_ENABLED=true
DUOS_TEST_SIGNIN_EMAILS=$(node scripts/e2e-fixture-emails.mjs)
export DUOS_TEST_SIGNIN_EMAILS
```

#### 4. Build and run

The client build must carry `env: "dev"` and `bffEnabled: true`:

```sh
jq '.bffEnabled = true' config/dev.json > public/config.json
CI=false pnpm run build
pnpm run test:e2e
```

CI does the same with an ephemeral Postgres service, the schema file, a
generated session secret, and a self-signed certificate. See
[.github/workflows/integration-tests.yml](.github/workflows/integration-tests.yml).
For deployed dev or BEE environments, see
[E2E role fixture deployment configuration](docs/testing/e2e-role-fixture.md).

#### Fixture rules

- The fixture runs only when `config.json` has `env: "dev"`, `bffEnabled` is
  true, and the session database is configured. Any other combination with
  `DUOS_TEST_SIGNIN_ENABLED=true` stops the server at startup.
- The server must reach `https://oauth2.googleapis.com/tokeninfo`. Each attempt
  has a three-second timeout, with one retry for a transient failure.
- A token must belong to an allowlisted identity, carry a verified email and
  both the email and profile scopes, and have at least five minutes left.
- A fixture session cannot refresh. `/auth/me` and the proxies answer 401 at the
  token's real expiry, about one hour after Google issued it. Sign in again for
  a longer run.
- Sign-out destroys the local session only. The Google token is never sent to
  B2C.

#### Troubleshooting

| Symptom | Check |
|---|---|
| Playwright reports a server that never started | Read the server log. A missing `server.key` exits at once with `ENOENT`. A fixture rule above names the failing variable. |
| `/backgroundsignin` says sign-in is not enabled | The route is unregistered, so the server's SPA fallback answered the POST with the index page (HTTP 200). Export `DUOS_TEST_SIGNIN_ENABLED` and `DUOS_TEST_SIGNIN_EMAILS`, then restart the server. |
| Sign-in returns 401 | The server log names the failing check (`claim`): allowlist, verified email, scopes, expiry, or tokeninfo connectivity. Logs never carry the token or the tokeninfo body. |
| Sign-in returns 429 | The per-IP limit is 300 sign-ins per minute. Wait a minute, or raise `DUOS_RATE_LIMIT_TEST_SIGNIN_MAX`. |
| A configuration change has no effect | Rebuild after editing `public/config.json`. Outside CI, Playwright reuses a running server, so restart it after changing its environment. |

### Cleaning up sessions a spec creates

The role-access specs delete their sessions by signing out. The other specs
leave their sessions behind. Token expiry stops further authenticated requests.
Session expiry makes a row unreadable but does not delete it, and the isolated
E2E schema installs no scheduled cleanup.

Any cleanup code added later must delete by identity, never truncate.
Playwright runs spec **files** concurrently, so a blanket wipe of
`user_sessions` between files would delete another file's live session and
fail the suite at random. Record the `sessionId` each spec was issued and
remove only those rows.
