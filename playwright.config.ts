import { defineConfig, devices } from '@playwright/test'

// vite.config.ts only enables HTTPS locally (certs aren't available in CI), so the
// preview server serves plain HTTP there — match the scheme or the webServer never comes up.
const protocol = process.env.CI ? 'http' : 'https'
const BASE_URL = `${protocol}://local.dsde-dev.broadinstitute.org:3000`

export default defineConfig({
  testDir: 'test/e2e',
  use: {
    baseURL: BASE_URL,
    ignoreHTTPSErrors: true,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'pnpm run serve',
    url: BASE_URL,
    ignoreHTTPSErrors: true,
    timeout: 120_000,
    reuseExistingServer: !process.env.CI,
  },
})
