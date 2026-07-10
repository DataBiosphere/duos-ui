import { defineConfig, devices } from '@playwright/test'

const BASE_URL = 'https://local.dsde-dev.broadinstitute.org:3000'

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
