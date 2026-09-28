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

Playwright starts three processes and waits for each one:

| Process | Port | Consent upstream | Project |
|---|---|---|---|
| Mock OIDC provider and mock Consent upstream | 3100 (HTTPS), 3200 | — | — |
| Fastify, `pnpm run serve` | 3000 | `DUOS_API_URL` (dev Consent) | `chromium` |
| Fastify, `pnpm run serve` | 3001 | the mock | `mock` |

Both servers use the mock provider as their issuer; `playwright.config.ts` sets
the `DUOS_AZURE_*` and redirect variables for each one. The servers use the
process environment and built `config.json`; export `.env.local` variables
before running. `vite preview` lacks the BFF routes and security controls.

Prerequisites:

- `server.key` and `server.crt` in the project root: run `./scripts/render-configs.sh`.
  The mock provider serves HTTPS with the same pair. If Node does not trust the
  certificate (CI's is self-signed), set `NODE_EXTRA_CA_CERTS=$PWD/server.crt`.
- `local.dsde-dev.broadinstitute.org` resolving to `127.0.0.1` (use `/etc/hosts`).
- Ports 3000, 3001, 3100 and 3200 free.

### Path A: public specs

No database or credentials required. Use a fresh shell without `DUOS_TEST_SIGNIN_ENABLED=true`.

```sh
cp config/dev.json public/config.json
CI=false pnpm run build
pnpm exec playwright test about.spec.ts home.spec.ts status.spec.ts liveness.spec.ts
pnpm exec playwright test csp.spec.ts --grep-invert signed-in
```

### Path B: full suite

`role-access`, `studyTemplate` and the signed-in `csp` case use Google service-account tokens through
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

### CSP check

`csp.spec.ts` collects browser `securitypolicyviolation` events under the policy
served by Fastify; it does not inject or rewrite the policy. The public flow
covers home and status. The authenticated flow uses the researcher fixture and
covers the console through sign-out. Both expect no collected violations after
their response and UI checkpoints. 

A separate harness case requests https://csp-probe.invalid/probe.png and expects
an img-src violation, verifying that violation collection works. CI uses report-only
mode by default; the test observes violations rather than proving requests are
blocked. If the harness fails, inspect page startup, the CSP header, the probe
assertion, and the collector.

### Mock provider specs

`auth.spec.ts`, `session.spec.ts` and `mockHarness.spec.ts` run in the `mock`
project. They sign in through the BFF's real OAuth flow against a mock of the
B2C tenant, so they need no credentials. Real Consent rejects the mock's
tokens, so their server forwards to the mock Consent upstream instead. The
mocks are in `test/e2e/mocks/`; `mockHarness.spec.ts` proves that the harness works.

```sh
pnpm exec playwright test --project=mock
```

Use the `mockScenario` fixture from `test/e2e/support/mockProvider.ts`. It
registers a scenario for the test and deletes it afterwards. It adds
`scenario=<key>` to the browser's `/authorize` navigation, and the provider
puts the key into the tokens that it mints. Controls never apply globally, so
parallel workers do not affect each other.

```ts
await mockScenario.configure({ provider: { idp: 'microsoft', accessTokenLifetimeSeconds: 90 } })
await signInThroughMock(page, '/')
await mockScenario.configure({ provider: { refresh: 'server_error' } }) // change it mid-test
expect((await mockScenario.stats()).refreshGrants).toBe(1)
```

| Control | Values | Default |
|---|---|---|
| `provider.idp` | `google`, `microsoft`, `omit` (no `idp` claim) | `google` |
| `provider.email` | any string, or `null` (no `email` claim) | `mock-researcher@example.org` |
| `provider.accessTokenLifetimeSeconds` | positive integer | `3600` |
| `provider.issueRefreshToken` | `true`, `false` | `true` |
| `provider.refresh` | `ok`, `invalid_grant`, `server_error` (503), `hang` | `ok` |
| `provider.authorizeError` | an OAuth error code, e.g. `access_denied`, or `null` | `null` |
| `consent.userMe` | `200`, `401`, `404`, `409` | `200` |
| `consent.profile` | the 200 body, or `null` for a researcher with the `email` claim | `null` |

`stats()` returns the scenario's authorization, code-grant, refresh-grant and
end-session counts, and every request the mock Consent upstream received, with
its `Authorization` header. `GET /duos-api/api/mock/echo` returns the header
that the upstream received. The mock Consent upstream also serves `/status` and
`/tos/text/duos` without a token, as real Consent does; every other path is 404.

The provider keeps two B2C behaviors: without the client ID in `scope` the token
response has no access token, and without `offline_access` it has no refresh
token. It also checks the client secret, PKCE and `redirect_uri`.

A spec that needs global mock state must run in its own project that depends
on both `chromium` and `mock`, with one worker. No spec needs this today.

### Session cleanup

Role-access, CSP and mock harness tests sign out; other sessions remain stored after expiry. The E2E
schema has no scheduled cleanup. Delete only each test's recorded session IDs;
truncating `user_sessions` breaks parallel tests.
