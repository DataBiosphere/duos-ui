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

export const MOCK_CLIENT_ID = 'duos-e2e-mock-client'
export const MOCK_CLIENT_SECRET = 'duos-e2e-mock-secret'

/** The mock's control API: PUT, GET and DELETE `<path>/<key>`. */
export const MOCK_CONTROL_PATH = '/__mock/scenarios'

/** The one protected Consent path the mock serves besides `/api/user/me`. */
export const MOCK_ECHO_PATH = '/api/mock/echo'
