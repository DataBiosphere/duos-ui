import { readFile } from 'node:fs/promises'
import path from 'node:path'
import type { FastifyBaseLogger } from 'fastify'

/**
 * Path to the static client config.json: `public/` in dev, `build/` once built
 * (see Dockerfile). CONFIG_PATH overrides this directly — used by tests and as
 * an escape hatch for non-standard layouts.
 */
export function configPath(projectRoot: string, isDev: boolean): string {
  return process.env.CONFIG_PATH ?? path.join(projectRoot, isDev ? 'public' : 'build', 'config.json')
}

/**
 * Reads the static client config and overrides `apiUrl` with DUOS_API_URL when
 * set, so local dev only has one value to change (DUOS_API_URL in .env/.env.local)
 * instead of also hand-editing the static file's `apiUrl` to match. Deployed
 * environments set DUOS_API_URL too (terra-helmfile envSecrets) — it MUST be
 * the downstream consent API base URL, the same value the ConfigMap's
 * config.json already carries as `apiUrl`, so the override is consistent there.
 * Also fills in `bannersUrl` from `env` when the file leaves it unset.
 *
 * The merged result is cached for the life of the process — both inputs (the
 * deploy-time config file and DUOS_API_URL) are fixed at startup, and this is
 * fetched on every SPA page load. Failed reads are NOT cached: a missing or
 * malformed file logs and errors per-request, and heals once the file appears.
 */
let configPromise: Promise<Record<string, unknown>> | null = null

export function readConfig(configPath: string, log: Pick<FastifyBaseLogger, 'error'>): Promise<Record<string, unknown>> {
  configPromise ??= loadAndMerge(configPath).catch((err: unknown) => {
    configPromise = null
    log.error({ err }, `[config] Could not read ${configPath}`)
    throw err
  })
  return configPromise
}

async function loadAndMerge(configPath: string): Promise<Record<string, unknown>> {
  const config = JSON.parse(await readFile(configPath, 'utf8')) as Record<string, unknown>
  if (process.env.DUOS_API_URL) {
    config.apiUrl = process.env.DUOS_API_URL
  }
  if (!isConfiguredString(config.bannersUrl)) {
    const bannersUrl = defaultBannersUrl(config.env)
    if (bannersUrl) {
      config.bannersUrl = bannersUrl
    }
  }
  return config
}

const isConfiguredString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim() !== ''

/**
 * The public GCS object holding the environment's notification banners, when
 * config.json does not name one. Each environment's bucket lives in its Terra
 * project (broad-dsde-<env>), so the default follows `env`; a local dev server
 * reads the dev feed. The CSP allowlists the same value the client fetches, so
 * this is the one place the location is decided. See docs/notification-banners.md.
 */
export function defaultBannersUrl(env: unknown): string | undefined {
  if (!isConfiguredString(env)) return undefined
  const bucketEnv = env === 'local' ? 'dev' : env
  return `https://storage.googleapis.com/duos-banners-${bucketEnv}/${bucketEnv}_notifications.json`
}

// Test-only: clear the process-lifetime cache between cases.
export const resetConfigCache = (): void => {
  configPromise = null
}

/** Names the env var so tests and docker-compose cannot drift from the read below. */
export const TRUST_PROXY_ENV_VAR = 'DUOS_TRUST_PROXY'

const TRUSTED_PEER_NAMES = new Set(['loopback', 'linklocal', 'uniquelocal'])

/**
 * Which peers may set `X-Forwarded-*` on this app's behalf, as Fastify
 * `trustProxy` names.
 *
 * The app always sits behind exactly one reverse-proxy hop. That hop must be
 * trusted for `request.protocol` to honor X-Forwarded-Proto and for
 * `request.ip` to carry the client. Without the forwarded protocol,
 * @fastify/session refuses to persist sessions once cookie.secure is true.
 *
 *   - **k8s (the default, `loopback`).** The httpd-terra-proxy sidecar is in
 *     the same pod, so it connects over loopback. Trusting only loopback means
 *     a pod that calls the app port directly (a `10.x` peer) cannot choose its
 *     own `request.ip` with X-Forwarded-For, so it cannot spend an unlimited
 *     number of rate-limit buckets (DT-4381).
 *   - **docker-compose (`loopback,uniquelocal`).** The `proxy` container
 *     reaches the app over a bridge network, so its peer is RFC1918.
 *   - **BEEs (the default, accepted).** The HAProxy ingress is a `10.x` pod
 *     in front of the sidecar, so `X-Forwarded-For` ends in its address and
 *     `request.ip` is that pod, not the client. With
 *     `DUOS_RATE_LIMIT_TRUST_REAL_IP` off, all BEE clients share one
 *     rate-limit bucket per route. BEEs are test environments, so we accept
 *     this. To key on the client there, set `loopback,uniquelocal` in the BEE
 *     values in terra-helmfile.
 *
 * Expressed as peer names rather than a hop count on purpose. Fastify 5.12.1
 * made the numeric form (`trustProxy: 1`) fail closed permanently, because a
 * hop count cannot verify who the immediate peer actually is. A numeric value
 * is now silently equivalent to `trustProxy: false`. `trustProxy: true` would
 * trust every peer, so the trusted peers are named instead. An unknown name
 * fails startup rather than silently trusting less (or more) than intended.
 */
export function trustedProxies(raw = process.env[TRUST_PROXY_ENV_VAR]): string[] {
  if (raw === undefined || raw.trim() === '') return ['loopback']
  const names = raw.split(',').map(name => name.trim())
  const unknown = names.filter(name => !TRUSTED_PEER_NAMES.has(name))
  if (unknown.length > 0) {
    throw new Error(`${TRUST_PROXY_ENV_VAR} must be a comma-separated list of ${[...TRUSTED_PEER_NAMES].join(', ')}; got ${JSON.stringify(raw)}`)
  }
  return names
}
