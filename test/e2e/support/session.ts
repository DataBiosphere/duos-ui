import { expect } from '@playwright/test'
import type { Cookie, Page } from '@playwright/test'
import { MOCK_ECHO_PATH } from '../mocks/settings'

/** Helpers for the session lifecycle specs (DT-4071, story 6-E). */

export const SESSION_COOKIE = 'sessionId'

/**
 * A route the server answers itself. Signing in with it as the return path
 * leaves no SPA open, so nothing but the test refreshes the session.
 */
export const NO_SPA_PATH = '/health'

export async function sessionCookie(page: Page): Promise<Cookie | undefined> {
  return (await page.context().cookies()).find(cookie => cookie.name === SESSION_COOKIE)
}

/** One call through the BFF proxy to the mock upstream's echo route. */
export async function callUpstream(page: Page): Promise<{ status: number, body: Record<string, string> }> {
  const response = await page.request.get(`/duos-api${MOCK_ECHO_PATH}`)
  return { status: response.status(), body: await response.json() as Record<string, string> }
}

export async function meStatus(page: Page): Promise<number> {
  return (await page.request.get('/auth/me')).status()
}

/** The SPA found no session: it shows the Sign In button and keeps the page as the return path. */
export async function expectSignInPage(page: Page, returnPath: string): Promise<void> {
  await expect(page).toHaveURL(url => url.searchParams.get('redirectTo') === returnPath)
  await expect(page.getByRole('button', { name: 'Sign In', exact: true })).toBeVisible()
}
