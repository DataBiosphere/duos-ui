import { defineConfig, devices } from '@playwright/test'
import { BASE_URL } from './test/e2e/support/baseUrl'

export default defineConfig({
  testDir: 'test/e2e',
  timeout: 30_000,
  expect: {
    timeout: 10_000,
  },
  use: {
    baseURL: BASE_URL,
    ignoreHTTPSErrors: true,
    navigationTimeout: 30_000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      retries: process.env.CI ? 1 : 0,
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
