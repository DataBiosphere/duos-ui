# Testing

## Unit & Component Tests (Vitest + RTL)

| Suite | Command |
|---|---|
| Client | `pnpm test` |
| Server | `pnpm --filter duos-server test` |
| Client watch | `pnpm test:watch` |
| Client coverage | `pnpm test:coverage` |

## Browser Component Tests (Vitest + Playwright)

```sh
pnpm test:browser
```

## E2E Tests (Playwright)

Playwright starts Fastify with `pnpm run serve` and waits for `/health`.
The server uses the process environment and built `config.json`; export
`.env.local` variables before running. `vite preview` lacks the BFF routes and security controls.

Prerequisites:

- `server.key` and `server.crt` in the project root: run `./scripts/render-configs.sh`.
- `local.dsde-dev.broadinstitute.org` resolving to `127.0.0.1` (use `/etc/hosts`).

### Path A: public specs

No database or credentials required. Use a fresh shell without `DUOS_TEST_SIGNIN_ENABLED=true`.

```sh
cp config/dev.json public/config.json
CI=false pnpm run build
pnpm exec playwright test about.spec.ts home.spec.ts status.spec.ts liveness.spec.ts
```

### Path B: full suite

`role-access` and `studyTemplate` use Google service-account tokens through
`/backgroundsignin` → `POST /auth/test-signin`. This tests role access, not B2C login.

#### 1. Server environment

Set these in `.env.local` (see [.env.example](.env.example)):

| Variable | Value |
|---|---|
| `DUOS_DB_HOST`, `DUOS_DB_PORT` | Host-reachable address (usually `localhost`) and published port; Docker's `db` hostname won't resolve |
| `DUOS_DB_NAME`, `DUOS_DB_USER`, `DUOS_DB_PASSWORD` | Database credentials |
| `DUOS_DB_SSL` | `false` for local Postgres without TLS |
| `DUOS_SESSION_SECRET` | 32+ characters: `openssl rand -base64 32` |
| `DUOS_API_URL` | Consent URL, e.g. `https://consent.dsde-dev.broadinstitute.org` |
| `DUOS_TEST_SIGNIN_ENABLED` | `true` |
| `DUOS_TEST_SIGNIN_EMAILS` | Automation emails, derived in step 3 |

`./scripts/render-configs.sh --write_env true` fills database and API values from dev.

#### 2. Session database

Use either:

- Bundled Postgres: follow [DEVNOTES.md](DEVNOTES.md), then run
  `docker compose --env-file .env.local up -d db`. The dump includes the schema.
- Another database: apply the session and audit schema using the server's database and user:

  ```sh
  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f test/e2e/sql/user_sessions.sql
  ```

Keep [the schema copy](test/e2e/sql/user_sessions.sql) aligned with the Consent changesets it lists.
If variables are already exported, omit Compose's `--env-file .env.local`.

#### 3. Role credentials

Fetch the five service-account keys from Secret Manager (`gcloud` and `jq` required).
The generated credentials file is gitignored and owner-readable only; the email helper prints no keys.

```sh
./scripts/render-accounts.sh
set -a
source test/e2e/fixtures/duos-automation.env
source .env.local   # skip if server variables are already exported
set +a
export DUOS_TEST_SIGNIN_ENABLED=true
DUOS_TEST_SIGNIN_EMAILS=$(node scripts/e2e-fixture-emails.mjs)
export DUOS_TEST_SIGNIN_EMAILS
```

#### 4. Build and run

```sh
jq '.bffEnabled = true' config/dev.json > public/config.json
CI=false pnpm run build
pnpm run test:e2e
```

See the [CI workflow](.github/workflows/integration-tests.yml) and
[dev/BEE deployment settings](docs/testing/e2e-role-fixture.md).

#### Fixture rules

- Enabling the fixture requires `env: "dev"`, `bffEnabled: true` and a session DB; otherwise startup fails.
- `https://oauth2.googleapis.com/tokeninfo` must be reachable. Attempts time out after 3 seconds; 5xx, network and JSON failures retry once.
- Tokens need an allowlisted, verified email, email/profile scopes and at least 5 minutes remaining.
- Tokens stay server-side. Sessions end at token expiry without refresh; sign-out is local only.

#### Troubleshooting

| Symptom | Check |
|---|---|
| Server won't start | Server log: missing TLS files or invalid fixture/database configuration |
| Sign-in not enabled | Set `DUOS_TEST_SIGNIN_ENABLED` and `DUOS_TEST_SIGNIN_EMAILS`; restart |
| Sign-in 401 | Server log: failing claim or tokeninfo failure |
| Sign-in 429 | Wait a minute; default limit is 300/min/IP (`DUOS_RATE_LIMIT_TEST_SIGNIN_MAX`) |
| Configuration ignored | Rebuild after config.json changes; restart after environment changes. Playwright reuses running servers outside CI. |

### Session cleanup

Role-access tests sign out; other sessions remain stored after expiry. The E2E
schema has no scheduled cleanup. Delete only each test's recorded session IDs;
truncating `user_sessions` breaks parallel tests.
