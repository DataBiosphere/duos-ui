import os from 'node:os'
import path from 'node:path'
import { BASE_URL, LEGACY_BASE_URL, MOCK_BASE_URL, SHORT_SESSION_BASE_URL, THROTTLE_BASE_URL } from '../support/baseUrl'

/**
 * Addresses and client credentials shared by the mocks, the Playwright config
 * and the spec helpers, so each value is set in one place.
 *
 * The client secret is a fixed test value. The mock accepts nothing else, so a
 * BFF instance that is not pointed at the mock fails loudly at token exchange.
 */
export const MOCK_HOST = 'local.dsde-dev.broadinstitute.org'

/**
 * openid-client refuses a plain-HTTP issuer, so the provider speaks HTTPS with
 * the project's `server.key` and `server.crt`.
 */
export const MOCK_OIDC_PORT = 3100
export const MOCK_OIDC_ORIGIN = `https://${MOCK_HOST}:${MOCK_OIDC_PORT}`
export const MOCK_OIDC_DISCOVERY_URL = `${MOCK_OIDC_ORIGIN}/.well-known/openid-configuration`

/** The BFF's proxy accepts an HTTP upstream, and only the BFF calls this one. */
export const MOCK_CONSENT_PORT = 3200
export const MOCK_CONSENT_URL = `http://127.0.0.1:${MOCK_CONSENT_PORT}`

/**
 * The BFF routes the provider may redirect to, as the B2C app registration
 * lists them: exact URIs, one pair per server instance. The provider rejects
 * any other `redirect_uri` or `post_logout_redirect_uri`.
 */
export const callbackUri = (baseUrl: string): string => `${baseUrl}/auth/callback`
export const postLogoutUri = (baseUrl: string): string => `${baseUrl}/post-logout`
export const MOCK_SERVER_BASE_URLS: readonly string[] = [BASE_URL, MOCK_BASE_URL, THROTTLE_BASE_URL, SHORT_SESSION_BASE_URL]

export const MOCK_CLIENT_ID = 'duos-e2e-mock-client'
export const MOCK_CLIENT_SECRET = 'duos-e2e-mock-secret'

/** The mock's control API. Specs reach it through `test/e2e/support/mockProvider.ts`. */
export const MOCK_CONTROL_PATH = '/__mock/scenarios'

/** The one protected Consent path the mock serves besides `/api/user/me`. */
export const MOCK_ECHO_PATH = '/api/mock/echo'

/**
 * The mock Consent upstream again, over HTTPS, for legacy mode: there the
 * browser calls `showcaseApiUrl` itself, and the production CSP's
 * `upgrade-insecure-requests` would rewrite a plain-HTTP URL.
 */
export const MOCK_SHOWCASE_PORT = 3201
export const MOCK_SHOWCASE_API_URL = `https://${MOCK_HOST}:${MOCK_SHOWCASE_PORT}`

/** The anonymous lookup the mock answers; see `showcaseLookup.ts`. */
export const MOCK_SHOWCASE_LOOKUP_PATH = '/showcase/datasets'

/** The page origins the lookup admits by CORS. Only the legacy server calls it cross-origin. */
export const MOCK_SHOWCASE_ORIGINS: readonly string[] = [LEGACY_BASE_URL]

/** The legacy server's config.json, written by `writeLegacyConfig.ts` from the build's. */
export const LEGACY_CONFIG_PATH = path.join(os.tmpdir(), 'duos-e2e-legacy-config.json')
