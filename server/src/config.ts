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
  // Unlike the DUOS_ECM/TDR/BARD_URL upstreams, Terra is not proxied: `terraUrl`
  // is the base for links that send the user to Terra itself (the dataset
  // export button), so the env var feeds the client config rather than a proxy
  // route. Trailing slashes are stripped because the client concatenates
  // `${terraUrl}/#import-data?…` — a slash here would produce `//#`.
  if (process.env.DUOS_TERRA_URL) {
    let terraUrl = process.env.DUOS_TERRA_URL
    while (terraUrl.endsWith('/')) {
      terraUrl = terraUrl.slice(0, -1)
    }
    config.terraUrl = terraUrl
  }
  return config
}

// Test-only: clear the process-lifetime cache between cases.
export const resetConfigCache = (): void => {
  configPromise = null
}
