import { test, expect, signInThroughMock, signOutThroughMock } from './support/mockProvider'
import { callUpstream, expectSignInPage, meStatus, NO_SPA_PATH, sessionCookie } from './support/session'

// Access-token refresh against the mock provider and the mock Consent upstream
// (DT-4071, story 6-E). The BFF renews a token that expires within 60 seconds,
// so a 90-second token needs a wait of 30 seconds. Session expiry is on another
// clock, and sessionExpiry.spec.ts covers it.

const REFRESH_WINDOW_SECONDS = 60
const TOKEN_LIFETIME_SECONDS = 90
const PAST_THE_WINDOW_MS = (TOKEN_LIFETIME_SECONDS - REFRESH_WINDOW_SECONDS + 1) * 1000

// A 30-second token is inside the window from the start, so every call refreshes.
const ALWAYS_REFRESHING = 30

const CONSOLE_PATH = '/researcher_console_dashboard'

test('refreshes the access token mid-session and keeps the session', async ({ page, mockScenario }) => {
  test.setTimeout(PAST_THE_WINDOW_MS + 30_000)
  await mockScenario.configure({ provider: { accessTokenLifetimeSeconds: TOKEN_LIFETIME_SECONDS } })
  await signInThroughMock(page, NO_SPA_PATH)
  const sessionId = (await sessionCookie(page))?.value
  expect(sessionId).toBeTruthy()

  const before = await callUpstream(page)
  expect(before.status).toBe(200)
  expect((await mockScenario.stats()).refreshGrants, 'the token is outside the window').toBe(0)

  // A call outside the window forwards the token as it is, and the first call
  // inside the window refreshes it. Poll until the token changes.
  await expect.poll(async () => (await callUpstream(page)).body.authorization, {
    intervals: [2_000],
    timeout: PAST_THE_WINDOW_MS + 15_000,
  }).not.toBe(before.body.authorization)

  const after = await callUpstream(page)
  expect(after.status).toBe(200)
  expect(after.body.authorization.startsWith(`Bearer ${mockScenario.accessTokenPrefix}`)).toBe(true)
  expect((await mockScenario.stats()).refreshGrants).toBe(1)
  expect((await sessionCookie(page))?.value, 'a refresh does not rotate the session ID').toBe(sessionId)
  expect(await meStatus(page)).toBe(200)

  await signOutThroughMock(page)
})

test.describe('refresh fails', () => {
  test('destroys the session when the provider rejects the refresh token', async ({ page, mockScenario }) => {
    await mockScenario.configure({ provider: { accessTokenLifetimeSeconds: ALWAYS_REFRESHING, refresh: 'invalid_grant' } })
    await signInThroughMock(page, NO_SPA_PATH)

    const { status, body } = await callUpstream(page)

    expect(status).toBe(401)
    expect(body).toEqual({ error: 'session_expired' })
    expect(await sessionCookie(page), 'the response clears the dead cookie').toBeUndefined()
    const stats = await mockScenario.stats()
    expect(stats.refreshGrants).toBe(1)
    expect(stats.upstreamRequests, 'the call stops before the forward').toEqual([])
    expect(await meStatus(page)).toBe(401)
  })

  test('sends the client to sign-in when the refresh token is rejected', async ({ page, mockScenario }) => {
    await mockScenario.configure({ provider: { accessTokenLifetimeSeconds: ALWAYS_REFRESHING, refresh: 'invalid_grant' } })
    await signInThroughMock(page, NO_SPA_PATH)

    await page.goto(CONSOLE_PATH)

    await expectSignInPage(page, CONSOLE_PATH)
    expect(await sessionCookie(page)).toBeUndefined()
  })

  test('keeps the session and answers 502 when the provider is unavailable', async ({ page, mockScenario }) => {
    await mockScenario.configure({ provider: { accessTokenLifetimeSeconds: ALWAYS_REFRESHING, refresh: 'server_error' } })
    await signInThroughMock(page, NO_SPA_PATH)
    const sessionId = (await sessionCookie(page))?.value

    const failed = await callUpstream(page)

    expect(failed.status).toBe(502)
    expect(failed.body).toEqual({ error: 'upstream_unavailable' })
    expect((await sessionCookie(page))?.value, 'a transient failure keeps the cookie').toBe(sessionId)
    expect(await meStatus(page), '/auth/me treats it the same way').toBe(502)
    expect((await mockScenario.stats()).refreshGrants).toBe(2)

    await mockScenario.configure({ provider: { refresh: 'ok' } })
    const recovered = await callUpstream(page)

    expect(recovered.status).toBe(200)
    expect(recovered.body.authorization.startsWith(`Bearer ${mockScenario.accessTokenPrefix}`)).toBe(true)
    expect((await sessionCookie(page))?.value).toBe(sessionId)
    expect(await meStatus(page)).toBe(200)

    await signOutThroughMock(page)
  })
})
