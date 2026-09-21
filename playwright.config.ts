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
  // The built Fastify server, not `vite preview`. The preview server sends none
  // of the security headers, cookies or routes the real deployment sends, so a
  // spec could pass against it and fail in production. `pnpm run serve` selects
  // the static build, port 3000 and HTTPS; everything else the server needs —
  // the database, the session secret and the upstream URL — comes from the
  // environment (integration-tests.yml in CI, an exported environment locally).
  webServer: {
    command: 'pnpm run serve',
    // The liveness route, so the wait ends when the server can answer, not when
    // the port opens.
    url: `${BASE_URL}/health`,
    ignoreHTTPSErrors: true,
    timeout: 120_000,
    reuseExistingServer: !process.env.CI,
  },
})
