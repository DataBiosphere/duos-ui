# Development

## Dev Container

If you use Visual Studio Code (VSCode) and Docker, you can use the Dev Container configuration. The container makes the local config files for you. When the container is created, it runs `scripts/setup-devcontainer.sh`, which installs gcloud, asks for a gcloud login, and runs [render-configs.sh](scripts/render-configs.sh) with all write options. Every new or rebuilt container starts from scratch and makes all files again.

1. Connect the host to the non-split Broad VPN. Make sure that the host's git credentials can read `broadinstitute/terra-helmfile`. VSCode shares them with the container.

2. Open the project in VSCode. When the notification in the bottom right corner asks about the Dev Container, click "Reopen in container".

3. When the setup script asks for the gcloud login, complete it in the browser that opens.

4. If the setup fails (for example, the VPN is down), fix the issue. Then rebuild the container, or run the script again. Every 3 months the certs rotate. Run the script again to make all files again:

   ```sh
   ./scripts/setup-devcontainer.sh
   ```

If you do not use the Dev Container, follow [Local Setup](#local-setup) and run `render-configs.sh` yourself.

## Local Setup

Alternatively, you may install DUOS locally.

1. Install Node LTS, but verify the [version of Node declared in the Dockerfile](https://github.com/DataBiosphere/duos-ui/blob/develop/Dockerfile#L2) and install that when setting up. You can install it with [Volta](https://docs.volta.sh/guide/understanding) or NVM.

```
volta install node@26.4.0
```

2. Next, install the project dependencies.

```
pnpm install
```

3. Ensure you are connected to the Broad VPN. Copy the configuration files and certificates locally by running the [render-configs.sh](scripts/render-configs.sh) script. By default, the DUOS UI points to the dev environment.

```sh
./scripts/render-configs.sh --write_env true --write_config true --write_site_conf true
```

### Notes on `render-configs`:

* Ensure that `HOST` is not set in your shell environment, as it will override the value in `.env.local`.  You can check like so: `env | grep HOST=`.
* **BFF env vars**: `--write_env true` also fetches the Azure B2C client secret from the dev cluster
(`duos-azure-client-secret` in the `terra-dev` namespace, base64-decoded — the decode matters: the wrapped
`.data` value fails at the token exchange with `AADB2C90081: client_secret does not match`) and generates a
`DUOS_SESSION_SECRET`. An existing `.env.local` is backed up to `.env.local.bak` and its values (DB
credentials, redirect URI, etc.) are carried forward, so it's safe to re-run on cert rotation. The
consent DB user/password are fetched from the dev cluster's `consent-secrets` secret (keys
`databaseUser`/`databasePassword`) when not already set, and `DUOS_DB_NAME` defaults to `consent`
(its name in every environment) — a fresh run produces a fully populated `.env.local` with nothing
left to fill in by hand. See [.env.example](.env.example) for what each variable means.
* **Development against other envs**: If you want to point to other envs, you can populate public/config.json with the values from any
environment by looking at the deployed configs in https://duos-k8s.dsde-{%ENV%}.broadinstitute.org/config.json where
{%ENV%} is any of `dev`, `staging`, `alpha`, or `prod`. Remember to set the `env` value appropriately, for example,
`dev`. Certain features are available only in specific environments. Setting the `env` value to the desired environment
will simulate it for local development.
* **Refresh certs on rotation**: render-config.sh populates local certificate files. The certificates are rotated every
3 months and can be repopulated by re-running the script. Again, you'll need to be on the broad VPN.

```sh
./scripts/render-configs.sh
```

4. Ensure that your `/etc/hosts` file has an entry for `local.dsde-dev.broadinstitute.org`

```properties
127.0.0.1	local.dsde-dev.broadinstitute.org
```

5. Make sure that `site.conf` is in the project root. `docker compose` mounts it into the httpd proxy. The `--write_site_conf true` option in step 3 renders it from the [terra-helmfile duos chart template](https://github.com/broadinstitute/terra-helmfile/blob/master/charts/duos/templates/_site.conf.tpl), so the local proxy sends the same security headers as the deployed one. The option needs read access to `broadinstitute/terra-helmfile`, with either git HTTPS credentials or a GitHub SSH key. The script tries HTTPS first, then SSH. When the template changes, run `./scripts/render-site-conf.sh` to render `site.conf` again. This script does not need the VPN. Do not copy `site.conf` from a bucket or edit it by hand, because that copy drifts from the deployed config.

6. Start the development server. There are two modes:

   **Frontend only (default — fastest HMR):**

   ```shell
   pnpm start
   ```

   Runs Vite's standalone dev server on port 3000 with native hot-module reloading. Use this for
   day-to-day UI work. The Fastify server is not involved, so sessions, cookies, auth callbacks, and
   the API proxy are not exercised.

   **Full stack (Fastify + Vite middleware):**

   ```shell
   pnpm run start:server
   ```

   Boots the Fastify server (port 3000) with Vite's HMR middleware embedded, so server code (sessions,
   cookies, auth callbacks, API proxy) runs alongside the frontend. Reloads via `tsx watch`, which is
   slower than native Vite HMR — use this when you need the server behavior.

   Both modes serve HTTPS from `server.key`/`server.crt` and open the browser automatically.

## Running using Docker Compose

Update your local `docker-compose.yaml` file to mount the preferred `config.json` file in app volumes. Remember to set
the `env` value appropriately, for example, `dev`. Certain features are available only in specific environments. Setting
the `env` value to the desired environment will simulate it for local development.

```yaml
    volumes:
      - ./public/config.json:/usr/src/app/build/config.json
```

Build:

```shell
docker build . -t duos --platform linux/amd64
```

Run — there are three modes, split across four compose files (`docker-compose.yaml` is the shared base; the
`docker-compose.override.yaml`, `docker-compose.consent.yaml` and `docker-compose.cloudsql.yaml` files each add the
bits specific to one mode):

**Standalone (bundled Postgres stands in for the consent DB):**

```shell
docker compose --env-file .env.local up -d
```

Compose automatically merges in `docker-compose.override.yaml` whenever it's present alongside `docker-compose.yaml`
and no `-f` flags are given, which is what adds the bundled `db` service here.

Standalone mode requires a consent database dump (which includes the BFF `user_sessions` table) at
`config/consentdb.sql` before first start — the file is gitignored and nothing provisions it automatically. If it's
missing, Docker silently creates a directory at that path and the stack comes up green with an *empty* database;
the first session write then fails with "relation user_sessions does not exist".

**Against a local `consent` compose stack instead** (see below for the full walkthrough):

First, ensure that the consent stack is up and running separately, then run this repo's stack with the consent overlay.
DUOS will share the database with consent instead of using its own bundled Postgres

```shell
docker compose --env-file .env.local -f docker-compose.yaml -f docker-compose.consent.yaml up -d
```

Passing explicit `-f` files opts out of the automatic `docker-compose.override.yaml` merge, so the bundled `db`
service is never defined and can't fight consent's `sqlproxy` for host port 5432.

**Against the remote dev consent database** (through a Cloud SQL Auth Proxy container):

```shell
docker compose --env-file .env.local -f docker-compose.yaml -f docker-compose.cloudsql.yaml up -d
```

> **WARNING:** this mode writes the BFF's `user_sessions` rows into the **shared dev database** that the deployed dev
> environment uses. Do not use it for destructive experiments.

Prerequisites, all one-time:

1. Run `gcloud auth application-default login`. Your account needs two roles on `broad-dsde-dev`: Cloud SQL Client,
   which the proxy uses, and Secret Manager Secret Accessor on the `consent-postgres-creds` secret, which the
   `gcloud secrets` command in step 2 needs.
2. Add the instance connection name to `.env.local`:
   ```properties
   CLOUDSQL_INSTANCE=broad-dsde-dev:us-central1:<instance_name>
   ```
   Read `<instance_name>` with:
   ```shell
   gcloud --project broad-dsde-dev secrets versions access latest --secret=consent-postgres-creds | jq -r .instance_name
   ```
3. Set `DUOS_DB_NAME`, `DUOS_DB_USER` and `DUOS_DB_PASSWORD` in `.env.local` to the dev values. `render-configs.sh
   --write_env true` fetches the user and password from the dev cluster when they are unset.

The overlay sets `DUOS_DB_HOST` to `cloudsql-proxy` and `DUOS_DB_SSL` to `false`; the proxy encrypts the link to Cloud
SQL itself. The proxy publishes no host port, so it cannot clash with a `consent` stack on host port 5432. Optional
`GCLOUD_ADC_FILE` and `CLOUDSQL_PROXY_VERSION` override the credentials file and proxy image version; see the header
of `docker-compose.cloudsql.yaml`.

On native Linux Docker, the bind mount keeps the ADC file's host ownership and mode 600, and the proxy image runs as
UID 65532, so the proxy fails with `open /secrets/adc.json: permission denied`. Run it as your own user instead:

```shell
echo "CLOUDSQL_PROXY_USER=$(id -u):$(id -g)" >> .env.local
```

Docker Desktop (Mac/Windows) maps file ownership and needs no change. `render-configs.sh --write_env true` carries
all four `CLOUDSQL_*`/`GCLOUD_*` variables forward when it regenerates `.env.local`.

`--env-file .env.local` is required in every mode — the `${VAR:?...}` placeholders in these compose files are resolved
by Compose's own YAML interpolation, which only reads a file literally named `.env` by default, and that name is
reserved for real secrets (see `.gitignore`).

Visit https://local.dsde-dev.broadinstitute.org/ to see the instance running under docker.

### Environment variables

The server reads sensitive configuration from `.env.local` in the project root (gitignored). Create this file before running `docker compose up` — `./scripts/render-configs.sh --write_env true` generates it fully populated, including the Azure B2C client secret and consent DB credentials fetched from the dev cluster (see the render-configs notes above). When a value is unset, the script writes the portless HTTPS redirect URI (`https://local.dsde-dev.broadinstitute.org/auth/callback`), which suits docker compose. Values already present in `.env.local` carry forward unchanged, so an existing file keeps whatever it had, including the old `http://...:3000` defaults. Both variants are registered in B2C. If you run `pnpm run start:server`, which serves the BFF on port 3000, set `DUOS_OAUTH_REDIRECT_URI` to `https://local.dsde-dev.broadinstitute.org:3000/auth/callback`. `pnpm start` runs Vite only, has no auth callback, and needs neither. `DUOS_POST_LOGOUT_REDIRECT_URI` (the B2C front-channel logout return URI, `.../post-logout`) follows the same port rule, and B2C requires an exact match against a URI registered on the app registration. When you switch between docker compose and `pnpm run start:server`, update both redirect variables by hand; the script never rewrites a value that is already set. The required variables are:

```properties
# Fastify session
DUOS_SESSION_SECRET=          # random base64 string, e.g.: openssl rand -base64 32
DUOS_SESSION_MAX_AGE_MS=      # cookie max-age in milliseconds (default: 28800000 = 8 hours)

# PostgreSQL connection
# DUOS_DB_HOST is not listed here — it's supplied by whichever compose overlay
# you run with (see the three modes above). Only docker-compose.consent.yaml
# honors a value set here; the standalone and Cloud SQL overlays set a fixed
# hostname (db / cloudsql-proxy) that wins over .env.local.
DUOS_DB_NAME=                 # database name
DUOS_DB_PORT=5432             # defaults to 5432 if omitted
DUOS_DB_USER=                 # database user
DUOS_DB_PASSWORD=             # database password
```

`NODE_ENV`, `PORT`, and `FASTIFY_LOG_LEVEL` can be overridden at the shell level when running `docker compose up` but have sensible defaults and do not need to be in `.env.local`.

### Pointing at a local `consent` compose stack instead of the bundled Postgres

Real deployments run the BFF's `user_sessions` table in the same Postgres consent already uses, not a separate database — the `consent` schema's default role (`consent`) resolves unqualified table names (like `user_sessions`) to the `consent` schema automatically via Postgres's `"$user"` search_path convention, so no extra config is needed to point this app's BFF at a local `consent` compose checkout's database instead of the bundled one:

1. Start (or leave running) `consent`'s own compose stack — its `sqlproxy` service already publishes Postgres on host port 5432.
2. In this repo's `.env.local`, set:
   ```properties
   DUOS_DB_NAME=consent
   DUOS_DB_USER=consent
   DUOS_DB_PASSWORD=            # must match consent's sqlproxy password
   ```
   `docker-compose.consent.yaml` already defaults `DUOS_DB_HOST` to `host.docker.internal`; only set it in `.env.local` if you need something else.
3. Run with both compose files, so the bundled `db` service (which would otherwise also try to claim host port 5432)
   is never defined:
   ```shell
   docker compose --env-file .env.local -f docker-compose.yaml -f docker-compose.consent.yaml up -d
   ```

`host.docker.internal` resolves out of the box on Docker Desktop (Mac/Windows); `docker-compose.consent.yaml` also
sets `extra_hosts` so it resolves on native Linux Docker too.

consent's own `app` service also publishes host port 8080, which would otherwise collide with this repo's `app`. To avoid that, this repo's `app` publishes to `DUOS_HOST_PORT` (`18080` by default) instead of `8080` — only the host-side port changes; the container still listens on `PORT` internally, so `proxy`'s routing to `app:8080` is unaffected. You shouldn't need to hit `app` directly at all (go through `proxy` at https://local.dsde-dev.broadinstitute.org/), but `curl localhost:18080/health` works if you want to bypass the proxy. Override `DUOS_HOST_PORT` in `.env.local` if `18080` is also taken.

# Testing

See [TESTING.md](TESTING.md) for full testing instructions.

## E2E Tests (Playwright)

See [TESTING.md](TESTING.md#e2e-tests-playwright) for public-spec and full-suite setup.

## Unit & Component Tests (Vitest)

```shell
pnpm test
```
