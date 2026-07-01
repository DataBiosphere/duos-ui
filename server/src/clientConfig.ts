import { readFile } from 'node:fs/promises'
import path from 'node:path'

/**
 * Path to the static client config.json: `public/` in dev, `build/` once built
 * (see Dockerfile). CONFIG_PATH overrides this directly — used by tests and as
 * an escape hatch for non-standard layouts.
 */
export function clientConfigPath(projectRoot: string, isDev: boolean): string {
  return process.env.CONFIG_PATH ?? path.join(projectRoot, isDev ? 'public' : 'build', 'config.json')
}

/**
 * Reads the static client config and overrides `apiUrl` with DUOS_API_URL when
 * set, so local dev only has one value to change (DUOS_API_URL in .env/.env.local)
 * instead of also hand-editing the static file's `apiUrl` to match. DUOS_API_URL
 * isn't wired into real deployed environments yet (see BFF migration Phase 0/1),
 * so the override is a no-op there and the ConfigMap-provided `apiUrl` passes
 * through unchanged.
 */
export async function readClientConfig(configPath: string): Promise<Record<string, unknown>> {
  const config = JSON.parse(await readFile(configPath, 'utf8')) as Record<string, unknown>
  if (process.env.DUOS_API_URL) {
    config.apiUrl = process.env.DUOS_API_URL
  }
  return config
}
