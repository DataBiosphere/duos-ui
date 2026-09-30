import type { Page } from '@playwright/test'
import { test, expect, signInThroughMock, signOutThroughMock } from './support/mockProvider'
import { MOCK_ECHO_PATH } from './mocks/settings'
import { MOCK_BASE_URL } from './support/baseUrl'

// Proves the mock harness itself (DT-4069): the BFF runs the code, refresh and
// end-session legs against the mock provider, and forwards the session's token
// to the mock Consent upstream. The flow and lifecycle assertions belong to
// stories 6-D and 6-E.

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
  // the console, not to /tos_acceptance. Check the URL: the header shows
  // "Researcher Console" on /tos_acceptance too, so its text proves nothing.
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

/** The Authorization header the mock upstream received, through the BFF proxy. */
async function echoedAuthorization(page: Page): Promise<string> {
  const response = await page.request.get(`/duos-api${MOCK_ECHO_PATH}`)
  expect(response.status()).toBe(200)
  return (await response.json() as { authorization: string }).authorization
}

test('forwards the refreshed access token, not the one it replaced', async ({ page, mockScenario }) => {
  // 30 s is inside the BFF's 60-second refresh window, so every forward refreshes first.
  await mockScenario.configure({ provider: { accessTokenLifetimeSeconds: 30 } })
  await signInThroughMock(page, '/')
  expect(await getMe(page)).toMatchObject({ authenticated: true, idp: 'google' })

  // Leave the SPA, so no request of its own refreshes between the two calls below.
  await page.goto('about:blank')
  const first = await echoedAuthorization(page)
  const refreshesBefore = (await mockScenario.stats()).refreshGrants
  const second = await echoedAuthorization(page)

  // The replaced token stays valid until it expires, so the mock upstream would
  // accept it too. Only a changed token proves the BFF forwards the new one.
  expect((await mockScenario.stats()).refreshGrants).toBe(refreshesBefore + 1)
  expect(second).not.toBe(first)
  for (const authorization of [first, second]) {
    expect(authorization.startsWith(`Bearer ${mockScenario.accessTokenPrefix}`)).toBe(true)
  }

  await signOutThroughMock(page)
})
