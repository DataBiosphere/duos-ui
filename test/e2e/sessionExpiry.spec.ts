import { test, expect, signInThroughMock, signOutThroughMock } from './support/mockProvider'
import { callUpstream, expectSignInPage, meStatus, NO_SPA_PATH, sessionCookie } from './support/session'
import { SHORT_SESSION_MAX_AGE_MS } from './support/baseUrl'

// Session expiry (DT-4071, story 6-E). It is a different clock from the access
// token: the session row holds the tokens, so an expired session has nothing
// left to refresh. `maxAge` is set per server process, so these specs run on a
// server of their own, whose sessions last SHORT_SESSION_MAX_AGE_MS.

// How long after the cookie is gone the server can still hold the row.
const SERVER_EXPIRY_MARGIN_MS = 5_000
const CONSOLE_PATH = '/researcher_console_dashboard'

test('rejects calls after the session expires and sends the user to sign-in', async ({ page, mockScenario: _mockScenario }) => {
  await signInThroughMock(page, NO_SPA_PATH)
  const cookie = (await sessionCookie(page))!
  expect(await meStatus(page)).toBe(200)

  // The browser drops the cookie at maxAge.
  await expect.poll(() => sessionCookie(page), { timeout: SHORT_SESSION_MAX_AGE_MS + 5_000 }).toBeUndefined()
  expect(await meStatus(page)).toBe(401)
  expect((await callUpstream(page)).status).toBe(401)

  // The expiry is also the server's: a browser that still sent the cookie is refused.
  // The browser drops the cookie at Max-Age from the response, and the store row
  // expires at its own save time plus maxAge, so the row can outlive the cookie
  // by a moment. Poll until the server refuses the cookie.
  await page.context().addCookies([{ ...cookie, expires: -1 }])
  await expect.poll(() => meStatus(page), { timeout: SERVER_EXPIRY_MARGIN_MS }).toBe(401)
  expect((await callUpstream(page)).status).toBe(401)
  await page.context().clearCookies()

  await page.goto(CONSOLE_PATH)
  await expectSignInPage(page, CONSOLE_PATH)
})

test('a new sign-in after expiry starts a session that works', async ({ page, mockScenario: _mockScenario }) => {
  await signInThroughMock(page, NO_SPA_PATH)
  await expect.poll(() => sessionCookie(page), { timeout: SHORT_SESSION_MAX_AGE_MS + 5_000 }).toBeUndefined()

  await signInThroughMock(page, NO_SPA_PATH)

  expect(await meStatus(page)).toBe(200)
  await signOutThroughMock(page)
})
