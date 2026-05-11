'use strict'

const fs = require('fs')
const path = require('path')

// The runtime config.json is mounted into build/ at deploy time.
// Respect CONFIG_PATH so tests or local dev can point elsewhere.
const CONFIG_PATH =
  process.env.CONFIG_PATH ||
  path.join(__dirname, '..', '..', 'build', 'config.json')

let _config = null

/**
 * Load and cache the runtime config.json.
 * Falls back to an empty object if the file is missing (e.g. during tests).
 */
function getConfig() {
  if (_config) return _config
  try {
    _config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'))
  } catch (err) {
    console.warn(`[config] Could not read ${CONFIG_PATH}: ${err.message}`)
    _config = {}
  }
  return _config
}

/**
 * Return a single config value, falling back to an env var then a default.
 *
 * @param {string} key        - Key in config.json
 * @param {string} [envVar]   - Optional env-var override (checked first)
 * @param {*}      [fallback] - Value returned when both sources are absent
 */
function get(key, envVar, fallback) {
  if (envVar && process.env[envVar]) return process.env[envVar]
  const v = getConfig()[key]
  if (v !== undefined && v !== '') return v
  return fallback
}

module.exports = { getConfig, get }
