// Local and CI runs both use HTTPS for Secure session cookies.
export const BASE_URL = 'https://local.dsde-dev.broadinstitute.org:3000'

// The second server instance, whose upstream is the mock Consent API (DT-4069).
export const MOCK_BASE_URL = 'https://local.dsde-dev.broadinstitute.org:3001'

// The third instance, which allows one OAuth callback a minute (DT-4070).
export const THROTTLE_BASE_URL = 'https://local.dsde-dev.broadinstitute.org:3002'
