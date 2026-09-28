import { defineConfig, devices } from '@playwright/test'
import { BASE_URL, MOCK_BASE_URL } from './test/e2e/support/baseUrl'
import {
  MOCK_CLIENT_ID,
  MOCK_CLIENT_SECRET,
  MOCK_CONSENT_URL,
  MOCK_OIDC_DISCOVERY_URL,
} from './test/e2e/mocks/settings'

// Specs that sign in through the mock OIDC provider (DT-4069). Real Consent
// rejects the mock's tokens, so they run against the mock Consent upstream.
const MOCK_SPECS = ['auth.spec.ts', 'session.spec.ts', 'mockHarness.spec.ts']

// Both servers use the mock provider as their issuer. The role specs never run a
// callback, so a real B2C issuer would only add a discovery call at boot.
const oidcEnv = (baseUrl: string): Record<string, string> => ({
  DUOS_AZURE_ISSUER_URL: MOCK_OIDC_DISCOVERY_URL,
  DUOS_AZURE_CLIENT_ID: MOCK_CLIENT_ID,
  DUOS_AZURE_CLIENT_SECRET: MOCK_CLIENT_SECRET,
  DUOS_OAUTH_REDIRECT_URI: `${baseUrl}/auth/callback`,
  DUOS_POST_LOGOUT_REDIRECT_URI: `${baseUrl}/post-logout`,
})

const serverDefaults = {
  command: 'pnpm run serve',
  ignoreHTTPSErrors: true,
  timeout: 120_000,
  reuseExistingServer: !process.env.CI,
}

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
      // Role fixture specs, against real dev Consent.
      name: 'chromium',
      testIgnore: MOCK_SPECS,
      use: { ...devices['Desktop Chrome'] },
      retries: process.env.CI ? 1 : 0,
    },
    {
      // OAuth flow and session lifecycle specs, against the mock Consent upstream.
      name: 'mock',
      testMatch: MOCK_SPECS,
      use: { ...devices['Desktop Chrome'], baseURL: MOCK_BASE_URL },
      retries: process.env.CI ? 1 : 0,
    },
  ],
  // Serve the production build through Fastify to exercise its headers and
  // routes. DUOS_API_URL is read once per process, so each Consent upstream
  // needs its own server instance.
  webServer: [
    {
      // The mock OIDC provider and the mock Consent upstream, in one process.
      command: 'pnpm exec tsx test/e2e/mocks/main.ts',
      url: MOCK_OIDC_DISCOVERY_URL,
      ignoreHTTPSErrors: true,
      timeout: 30_000,
      reuseExistingServer: !process.env.CI,
    },
    {
      ...serverDefaults,
      url: `${BASE_URL}/health`,
      env: { PORT: '3000', ...oidcEnv(BASE_URL) },
    },
    {
      ...serverDefaults,
      url: `${MOCK_BASE_URL}/health`,
      env: {
        PORT: '3001',
        ...oidcEnv(MOCK_BASE_URL),
        DUOS_API_URL: MOCK_CONSENT_URL,
        // The mock provider replaces the role fixture here.
        DUOS_TEST_SIGNIN_ENABLED: 'false',
        // Every mock spec signs in from one IP. Raise the limits so that
        // parallel workers do not throttle each other.
        DUOS_RATE_LIMIT_LOGIN_MAX: '600',
        DUOS_RATE_LIMIT_CALLBACK_MAX: '600',
      },
    },
  ],
})
