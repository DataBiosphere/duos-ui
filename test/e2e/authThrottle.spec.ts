import { test, expect, signOutThroughMock } from './support/mockProvider'

// The callback's flood control (story 5-G3) against a server that allows one
// callback a minute. It has its own server and project (DT-4070): the other
// mock specs raise the limit so that parallel workers do not throttle each other.

const MAX_ATTEMPTS = 3

test('redirects a throttled callback into the SPA with a notice', async ({ page, mockScenario }) => {
  await mockScenario.configure()
  // The first callback in a window passes and the next is throttled. A server that
  // an earlier run used, or a window that ends between two callbacks, shifts that
  // point, so run callbacks until one is throttled.
  let throttledUrl: string | undefined
  for (let attempt = 0; attempt < MAX_ATTEMPTS && !throttledUrl; attempt++) {
    const login = await page.request.post('/auth/login')
    const { redirectUrl } = await login.json() as { redirectUrl: string }
    const landing = await page.goto(redirectUrl)
    if (landing!.url().includes('signInError=rate_limited')) throttledUrl = landing!.url()
  }

  expect(throttledUrl, `no callback was throttled in ${MAX_ATTEMPTS} attempts`).toBeDefined()
  await expect(page.getByText('too many sign-in attempts arrived at once')).toBeVisible()
  // The SPA removes the marker from the address bar after it shows the notice.
  await expect(page).not.toHaveURL(/signInError/)

  // An attempt that passed the limit left a session. A rerun inside the window has
  // none to sign out, and its login leaves one pre-auth row that CI's fresh server
  // never makes: the throttle blocks the sign-in that would retire it.
  if ((await page.request.get('/auth/me')).ok()) await signOutThroughMock(page)
})
