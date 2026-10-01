import { defineConfig, devices } from '@playwright/test'
import { BASE_URL, MOCK_BASE_URL, SHORT_SESSION_BASE_URL, SHORT_SESSION_MAX_AGE_MS, THROTTLE_BASE_URL } from './test/e2e/support/baseUrl'
import {
  callbackUri,
  MOCK_CLIENT_ID,
  MOCK_CLIENT_SECRET,
  MOCK_CONSENT_URL,
  MOCK_OIDC_DISCOVERY_URL,
  postLogoutUri,
} from './test/e2e/mocks/settings'

// Specs that sign in through the mock OIDC provider (DT-4069). Real Consent
// rejects the mock's tokens, so they run against the mock Consent upstream.
// Naming a spec here keeps it out of `chromium`, where real Consent would reject
// every mock token.
const MOCK_SPECS = ['auth.spec.ts', 'session.spec.ts', 'mockHarness.spec.ts']
// Specs that need a server of their own, because they change its rate limits.
const THROTTLE_SPECS = ['authThrottle.spec.ts']
// Specs that need a server of their own, because they change its session lifetime.
const SHORT_SESSION_SPECS = ['sessionExpiry.spec.ts']

// All three servers use the mock provider as their issuer. The role specs never run a
// callback, so a real B2C issuer would only add a discovery call at boot. The
// mock redirects only to the URIs it registers for each base URL.
const oidcEnv = (baseUrl: string): Record<string, string> => ({
  DUOS_AZURE_ISSUER_URL: MOCK_OIDC_DISCOVERY_URL,
  DUOS_AZURE_CLIENT_ID: MOCK_CLIENT_ID,
  DUOS_AZURE_CLIENT_SECRET: MOCK_CLIENT_SECRET,
  DUOS_OAUTH_REDIRECT_URI: callbackUri(baseUrl),
  DUOS_POST_LOGOUT_REDIRECT_URI: postLogoutUri(baseUrl),
})

const serverDefaults = {
  command: 'pnpm run serve',
  ignoreHTTPSErrors: true,
  timeout: 120_000,
  reuseExistingServer: !process.env.CI,
  // DIAGNOSTIC: print each server's output in the job log. Playwright discards it
  // by default, which hides the `[test-signin] rejected` reason on a failed sign-in.
  stdout: 'pipe' as const,
  stderr: 'pipe' as const,
}

export default defineConfig({
  testDir: 'test/e2e',
  timeout: 30_000,
  expect: {
    timeout: 10_000,
  },
  // DIAGNOSTIC: the workflow uploads playwright-report/ on failure, but no reporter wrote one.
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: BASE_URL,
    ignoreHTTPSErrors: true,
    navigationTimeout: 30_000,
    trace: 'retain-on-failure',
  },
  projects: [
    {
      // Role fixture specs, against real dev Consent.
      name: 'chromium',
      testIgnore: [...MOCK_SPECS, ...THROTTLE_SPECS, ...SHORT_SESSION_SPECS],
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
    {
      // A throttled callback. No retry: the allowance lasts a minute, so a retry
      // would meet a server that the first attempt already spent.
      name: 'mock-throttle',
      testMatch: THROTTLE_SPECS,
      use: { ...devices['Desktop Chrome'], baseURL: THROTTLE_BASE_URL },
    },
    {
      // Session expiry, on a server whose sessions last 10 seconds.
      name: 'mock-short-session',
      testMatch: SHORT_SESSION_SPECS,
      use: { ...devices['Desktop Chrome'], baseURL: SHORT_SESSION_BASE_URL },
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
    {
      ...serverDefaults,
      url: `${THROTTLE_BASE_URL}/health`,
      env: {
        PORT: '3002',
        ...oidcEnv(THROTTLE_BASE_URL),
        DUOS_API_URL: MOCK_CONSENT_URL,
        DUOS_TEST_SIGNIN_ENABLED: 'false',
        DUOS_RATE_LIMIT_LOGIN_MAX: '600',
        DUOS_RATE_LIMIT_CALLBACK_MAX: '1',
      },
    },
    {
      ...serverDefaults,
      url: `${SHORT_SESSION_BASE_URL}/health`,
      env: {
        PORT: '3003',
        ...oidcEnv(SHORT_SESSION_BASE_URL),
        DUOS_API_URL: MOCK_CONSENT_URL,
        DUOS_TEST_SIGNIN_ENABLED: 'false',
        DUOS_SESSION_MAX_AGE_MS: String(SHORT_SESSION_MAX_AGE_MS),
        DUOS_RATE_LIMIT_LOGIN_MAX: '600',
        DUOS_RATE_LIMIT_CALLBACK_MAX: '600',
      },
    },
  ],
})
