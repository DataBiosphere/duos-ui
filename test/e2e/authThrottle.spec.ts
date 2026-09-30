import { test, expect, signInThroughMock, signOutThroughMock } from './support/mockProvider'

// The callback's flood control (story 5-G3) against a server that allows one
// callback a minute. It has its own server and project (DT-4070): the other
// mock specs raise the limit so that parallel workers do not throttle each other.

test('redirects a throttled callback into the SPA with a notice', async ({ page, mockScenario }) => {
  // The first callback spends the allowance. A server that an earlier run already
  // spent throttles it too, so only the second is asserted.
  await mockScenario.configure()
  await signInThroughMock(page, '/')

  const login = await page.request.post('/auth/login')
  const { redirectUrl } = await login.json() as { redirectUrl: string }
  const landing = await page.goto(redirectUrl)

  expect(landing!.url()).toContain('signInError=rate_limited')
  await expect(page.getByText('too many sign-in attempts arrived at once')).toBeVisible()
  // The SPA removes the marker from the address bar after it shows the notice.
  await expect(page).not.toHaveURL(/signInError/)

  if ((await page.request.get('/auth/me')).ok()) await signOutThroughMock(page)
})
