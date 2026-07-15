// vite.config.ts only enables HTTPS locally (certs aren't available in CI), so the
// preview server serves plain HTTP there — match the scheme or requests never reach it.
const protocol = process.env.CI ? 'http' : 'https'
export const BASE_URL = `${protocol}://local.dsde-dev.broadinstitute.org:3000`
