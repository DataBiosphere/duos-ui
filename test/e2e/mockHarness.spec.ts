import type { Page } from '@playwright/test'
import { test, expect, signInThroughMock, signOutThroughMock } from './support/mockProvider'
import { MOCK_ECHO_PATH } from './mocks/settings'
import { MOCK_BASE_URL } from './support/baseUrl'

// Proves the mock harness itself (DT-4069): the BFF runs the code, refresh and
// end-session legs against the mock provider, and forwards the session's token
// to the mock Consent upstream. The flow and lifecycle assertions belong to
// auth.spec.ts and session.spec.ts.

interface Me {
  authenticated: boolean
  idp?: string
  user?: { email?: string }
}

const getMe = (page: Page): Promise<Me> =>
  page.evaluate(async () => (await fetch('/auth/me')).json() as Promise<Me>)

test('signs in through the mock provider and forwards the session token upstream', async ({ page, mockScenario }) => {
  await mockScenario.configure({ provider: { idp: 'microsoft', email: 'harness@example.org' } })
  await signInThroughMock(page, '/')
  // The default profile has accepted the terms of service, so the SPA routes to
  // the console, not to /tos_acceptance. The header names the console on both.
  await expect(page).toHaveURL(/\/researcher_console_dashboard$/)

  expect(await getMe(page)).toMatchObject({ authenticated: true, idp: 'microsoft', user: { email: 'harness@example.org' } })

  // A client-supplied Authorization header must not reach the upstream.
  const echo = await page.evaluate(async (path) => {
    const response = await fetch(`/duos-api${path}`, { headers: { Authorization: 'Bearer client-supplied' } })
    return response.json() as Promise<{ authorization: string }>
  }, MOCK_ECHO_PATH)
  expect(echo.authorization.startsWith(`Bearer ${mockScenario.accessTokenPrefix}`)).toBe(true)

  expect(await signOutThroughMock(page)).toBe(`${MOCK_BASE_URL}/post-logout`)

  expect(await mockScenario.stats()).toMatchObject({ authorizations: 1, codeGrants: 1, refreshGrants: 0, endSessions: 1 })
})

test('renews a short-lived access token through the mock refresh grant', async ({ page, mockScenario }) => {
  // Inside the BFF's 60-second refresh window from the moment it is issued.
  await mockScenario.configure({ provider: { accessTokenLifetimeSeconds: 30 } })
  await signInThroughMock(page, '/')

  expect(await getMe(page)).toMatchObject({ authenticated: true, idp: 'google' })

  const stats = await mockScenario.stats()
  expect(stats.refreshGrants).toBeGreaterThanOrEqual(1)
  // Every upstream call carried a token from this scenario, refreshed or not.
  expect(stats.upstreamRequests.length).toBeGreaterThan(0)
  for (const request of stats.upstreamRequests) {
    expect(request.authorization?.startsWith(`Bearer ${mockScenario.accessTokenPrefix}`)).toBe(true)
  }

  await signOutThroughMock(page)
})
