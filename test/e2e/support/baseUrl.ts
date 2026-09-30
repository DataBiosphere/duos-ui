// Local and CI runs both use HTTPS for Secure session cookies.
export const BASE_URL = 'https://local.dsde-dev.broadinstitute.org:3000'

// The second server instance, whose upstream is the mock Consent API (DT-4069).
export const MOCK_BASE_URL = 'https://local.dsde-dev.broadinstitute.org:3001'

// The third instance, whose sessions last 10 seconds (DT-4071).
export const SHORT_SESSION_BASE_URL = 'https://local.dsde-dev.broadinstitute.org:3003'
export const SHORT_SESSION_MAX_AGE_MS = 10_000
