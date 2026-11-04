import fs from 'node:fs'
import path from 'node:path'
import { LEGACY_CONFIG_PATH, MOCK_SHOWCASE_API_URL } from '../mocks/settings'

/**
 * Writes the legacy server's config.json (DT-4353): the build's own, with
 * `bffEnabled` off and `showcaseApiUrl` at the mock Consent upstream. The
 * legacy webServer in playwright.config.ts runs this, then serves with
 * CONFIG_PATH pointing at the result, so the build's config is left alone.
 */

const source = path.join(import.meta.dirname, '..', '..', '..', 'build', 'config.json')
const config = JSON.parse(fs.readFileSync(source, 'utf8')) as Record<string, unknown>
fs.writeFileSync(LEGACY_CONFIG_PATH, JSON.stringify({ ...config, bffEnabled: false, showcaseApiUrl: MOCK_SHOWCASE_API_URL }, null, 2))
console.log(`[legacy config] wrote ${LEGACY_CONFIG_PATH}`)
