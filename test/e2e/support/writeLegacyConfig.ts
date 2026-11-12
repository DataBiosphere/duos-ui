import fs from 'node:fs'
import path from 'node:path'
import { LEGACY_CONFIG_PATH, MOCK_SHOWCASE_API_URL } from '../mocks/settings'

/**
 * Writes the legacy server's config.json (DT-4353): the build's own, with
 * `bffEnabled` off and `showcaseApiUrl` at the mock Consent upstream. `env` is
 * `prod`, so showcase.spec.ts checks the production rule for hidden entries
 * here and the preview rule in `chromium`, whose build config says `dev`
 * (DT-4358). The server reads `env` only for the test sign-in, which is off
 * here, and for a default `bannersUrl`, which the build's config already sets. The
 * legacy webServer in playwright.config.ts runs this, then serves with
 * CONFIG_PATH pointing at the result, so the build's config is left alone.
 */

const source = path.join(import.meta.dirname, '..', '..', '..', 'build', 'config.json')
const config = JSON.parse(fs.readFileSync(source, 'utf8')) as Record<string, unknown>
fs.writeFileSync(LEGACY_CONFIG_PATH, JSON.stringify({ ...config, env: 'prod', bffEnabled: false, showcaseApiUrl: MOCK_SHOWCASE_API_URL }, null, 2))
console.log(`[legacy config] wrote ${LEGACY_CONFIG_PATH}`)
