import { randomUUID } from 'node:crypto'
import { test as base, expect } from '@playwright/test'
import type { APIRequestContext, Page } from '@playwright/test'
import type { Scenario, ScenarioStats, ScenarioUpdate } from '../mocks/scenarios'
import { MOCK_CONTROL_PATH, MOCK_OIDC_ORIGIN } from '../mocks/settings'

/**
 * Spec helpers for the mock OIDC provider and the mock Consent upstream
 * (DT-4069). Specs that use them run in the `mock` Playwright project, whose
 * server points at both mocks.
 *
 * The `mockScenario` fixture gives each test a scenario of its own, so parallel
 * workers never share a control. It intercepts the browser's navigation to the
 * mock's `/authorize` and appends `scenario=<key>`; the provider carries the key
 * into the tokens from there. See test/e2e/mocks/scenarios.ts.
 */

export class MockScenario {
  readonly key: string
  private readonly request: APIRequestContext

  constructor(request: APIRequestContext) {
    // Letters and digits only, inside the mock's 64-character key limit.
    this.key = `t${randomUUID().replaceAll('-', '')}`
    this.request = request
  }

  private get url(): string {
    return `${MOCK_OIDC_ORIGIN}${MOCK_CONTROL_PATH}/${this.key}`
  }

  /** Merges settings into the scenario. Call it again mid-test to change a behavior. */
  async configure(update: ScenarioUpdate = {}): Promise<Scenario> {
    const response = await this.request.put(this.url, { data: update })
    const body = await response.json() as { scenario?: Scenario, error?: string }
    expect(response.status(), body.error).toBe(200)
    return body.scenario!
  }

  /** What the mocks saw for this scenario: grant counts, sign-outs and upstream requests. */
  async stats(): Promise<ScenarioStats> {
    const response = await this.request.get(this.url)
    expect(response.status()).toBe(200)
    return (await response.json() as { stats: ScenarioStats }).stats
  }

  /** The prefix of every access token that the provider mints for this scenario. */
  get accessTokenPrefix(): string {
    return `mock.${this.key}.`
  }

  async delete(): Promise<void> {
    await this.request.delete(this.url)
  }
}

type MockFixtures = {
  mockScenario: MockScenario
}

export const test = base.extend<MockFixtures>({
  // Named `provideScenario` rather than `use`, as in support/auth.ts.
  mockScenario: async ({ page, request }, provideScenario) => {
    const scenario = new MockScenario(request)
    await scenario.configure()
    // Only the navigation to /authorize is changed. `state`, `code_challenge`
    // and every other parameter the BFF set reach the provider untouched.
    await page.route(url => url.origin === MOCK_OIDC_ORIGIN && url.pathname === '/authorize', async (route) => {
      const url = new URL(route.request().url())
      url.searchParams.set('scenario', scenario.key)
      await route.continue({ url: url.href })
    })
    await provideScenario(scenario)
    await scenario.delete()
  },
})

/**
 * Signs in through the BFF's real OAuth flow, starting at `POST /auth/login` as
 * the Sign In button does, and waits for the callback's redirect to `returnTo`.
 * Configure the scenario first: the provider reads it at `/authorize`.
 */
export async function signInThroughMock(page: Page, returnTo = '/'): Promise<void> {
  const login = await page.request.post(`/auth/login?returnTo=${encodeURIComponent(returnTo)}`)
  expect(login.status()).toBe(200)
  const { redirectUrl } = await login.json() as { redirectUrl: string }
  expect(redirectUrl.startsWith(`${MOCK_OIDC_ORIGIN}/authorize?`), 'the server is not pointed at the mock provider').toBe(true)
  // The final response of the redirect chain (authorize, callback, returnTo).
  // Read from it, not from page.url(), which the SPA can change after load.
  const landing = await page.goto(redirectUrl)
  expect(new URL(landing!.url()).pathname).toBe(new URL(returnTo, MOCK_OIDC_ORIGIN).pathname)
}

/**
 * Signs out through `POST /auth/logout` and follows the end-session redirect,
 * which also deletes the session row the test created. Returns the landing URL.
 *
 * It leaves the SPA first. Otherwise the SPA's own CSRF fetch can replace the
 * session's CSRF secret between the two calls here, and its reaction to the
 * ended session can abort the navigation. auth.spec.ts covers the UI sign-out.
 */
export async function signOutThroughMock(page: Page): Promise<string | undefined> {
  await page.goto('about:blank')
  const csrf = await page.request.get('/auth/csrf-token')
  expect(csrf.status()).toBe(200)
  const { token } = await csrf.json() as { token: string }
  const logout = await page.request.post('/auth/logout', { headers: { 'X-CSRF-Token': token } })
  expect(logout.status(), await logout.text()).toBe(200)
  const { redirectUrl } = await logout.json() as { redirectUrl: string }
  expect(redirectUrl.startsWith(`${MOCK_OIDC_ORIGIN}/logout?`)).toBe(true)
  return (await page.goto(redirectUrl))?.url()
}

export { expect } from '@playwright/test'
