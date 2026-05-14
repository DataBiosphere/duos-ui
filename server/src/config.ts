import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

// The runtime config.json is mounted into build/ at deploy time.
// Respect CONFIG_PATH so tests or local dev can point elsewhere.
const CONFIG_PATH
  = process.env.CONFIG_PATH
    || path.join(fileURLToPath(new URL('.', import.meta.url)), '..', '..', 'build', 'config.json')

type Config = Record<string, unknown>

let _config: Config | null = null

/**
 * Load and cache the runtime config.json.
 * Falls back to an empty object if the file is missing (e.g. during tests).
 */
function getConfig(): Config {
  if (_config) return _config
  try {
    _config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8')) as Config
  }
  catch (err) {
    console.warn(`[config] Could not read ${CONFIG_PATH}: ${(err as Error).message}`)
    _config = {}
  }
  return _config
}

/**
 * Return a single config value, falling back to an env var then a default.
 *
 * @param key      - Key in config.json
 * @param envVar   - Optional env-var override (checked first)
 * @param fallback - Value returned when both sources are absent
 */
function get(key: string, envVar?: string, fallback?: unknown): unknown {
  if (envVar && process.env[envVar]) return process.env[envVar]
  const v = getConfig()[key]
  if (v !== undefined && v !== '') return v
  return fallback
}

export { getConfig, get }
