import type { Page, Request } from '@playwright/test'
import { test, expect, signInThroughMock, signOutThroughMock } from './support/mockProvider'
import { MOCK_ECHO_PATH, MOCK_OIDC_ORIGIN } from './mocks/settings'
import { MOCK_BASE_URL } from './support/baseUrl'

// The BFF sign-in and sign-out flow against the mock OIDC provider and the mock
// Consent upstream (DT-4070, story 6-D). Session lifecycle cases are story 6-E.

const CONSOLE_URL = /\/researcher_console_dashboard$/
const SESSION_COOKIE = 'sessionId'

const getMe = (page: Page) => page.request.get('/auth/me')

async function sessionCookie(page: Page) {
  return (await page.context().cookies(MOCK_BASE_URL)).find(cookie => cookie.name === SESSION_COOKIE)
}

/** Every URL that the main frame requests, redirects included, in order. */
function recordNavigations(page: Page): string[] {
  const urls: string[] = []
  page.on('request', (request) => {
    if (request.isNavigationRequest() && request.frame() === page.mainFrame()) urls.push(request.url())
  })
  return urls
}

async function openUserMenu(page: Page, label: string) {
  await page.locator('#sel_user').click()
  await page.getByText(label, { exact: true }).click()
}

test.describe('sign in', () => {
  test('rotates the session ID and sets a hardened cookie', async ({ page, mockScenario }) => {
    let idBeforeCallback: string | undefined
    // Runs before the fixture's route, then hands the request on to it.
    await page.route(url => url.origin === MOCK_OIDC_ORIGIN && url.pathname === '/authorize', async (route) => {
      idBeforeCallback = (await sessionCookie(page))?.value
      await route.fallback()
    })
    const loginRequests: Request[] = []
    page.on('request', (request) => {
      if (request.url().includes('/auth/login')) loginRequests.push(request)
    })

    await page.goto('/')
    await page.getByRole('button', { name: 'Sign In', exact: true }).click()
    await expect(page).toHaveURL(CONSOLE_URL)

    expect(loginRequests.map(request => request.method())).toEqual(['POST'])
    expect(idBeforeCallback, 'login starts a session for the PKCE state').toBeTruthy()
    const cookie = await sessionCookie(page)
    expect(cookie).toMatchObject({ httpOnly: true, secure: true, sameSite: 'Lax', path: '/' })
    expect(cookie!.value).not.toBe(idBeforeCallback)
    expect(await mockScenario.stats()).toMatchObject({ authorizations: 1, codeGrants: 1 })

    await signOutThroughMock(page)
  })

  for (const [idp, label] of [['google', 'Google'], ['microsoft', 'Microsoft']] as const) {
    test(`reports the ${idp} identity provider`, async ({ page, mockScenario }) => {
      await mockScenario.configure({ provider: { idp, email: `${idp}@example.org` } })
      await signInThroughMock(page, '/')
      await expect(page).toHaveURL(CONSOLE_URL)

      const me = await getMe(page)
      expect(me.status()).toBe(200)
      expect(await me.json()).toMatchObject({ authenticated: true, idp, user: { email: `${idp}@example.org` } })
      await page.locator('#sel_user').click()
      await expect(page.getByText(`Signed in with ${label}`)).toBeVisible()

      await signOutThroughMock(page)
    })
  }

  test('forwards the session token upstream, not a client-supplied one', async ({ page, mockScenario }) => {
    await signInThroughMock(page, '/')
    const response = await page.request.get(`/duos-api${MOCK_ECHO_PATH}`, { headers: { Authorization: 'Bearer client-supplied' } })
    expect(response.status()).toBe(200)

    const echoes = (await mockScenario.stats()).upstreamRequests.filter(request => request.path === MOCK_ECHO_PATH)
    expect(echoes).toHaveLength(1)
    expect(echoes[0].authorization?.startsWith(`Bearer ${mockScenario.accessTokenPrefix}`)).toBe(true)

    await signOutThroughMock(page)
  })
})

test.describe('sign out', () => {
  // Fixtures are lazy: list mockScenario, or the sign-in runs in the shared default scenario.
  test.beforeEach(async ({ page, mockScenario: _mockScenario }) => {
    await signInThroughMock(page, '/')
    await expect(page).toHaveURL(CONSOLE_URL)
  })

  test('follows the end-session URL and lands on /post-logout', async ({ page, mockScenario }) => {
    // Read the body here: the page navigates away as soon as the response arrives.
    let redirectUrl = ''
    await page.route('**/auth/logout', async (route) => {
      const response = await route.fetch()
      redirectUrl = (await response.json() as { redirectUrl: string }).redirectUrl
      await route.fulfill({ response })
    })
    const urls = recordNavigations(page)
    await openUserMenu(page, 'Sign out')

    await expect(page).toHaveURL(`${MOCK_BASE_URL}/home`)
    expect(urls).toContain(redirectUrl)
    expect(urls).toContain(`${MOCK_BASE_URL}/post-logout`)
    expect(urls.indexOf(redirectUrl)).toBeLessThan(urls.indexOf(`${MOCK_BASE_URL}/post-logout`))
    expect((await mockScenario.stats()).endSessions).toBe(1)
    expect((await getMe(page)).status()).toBe(401)
  })

  test('lands on /post-logout after a confirmed 204', async ({ page, mockScenario }) => {
    // The server answers 204 when it cannot build an end-session URL. Run the
    // real logout, so the session is destroyed, and answer with the 204.
    await page.route('**/auth/logout', async (route) => {
      await route.fetch()
      await route.fulfill({ status: 204 })
    })
    const urls = recordNavigations(page)
    await openUserMenu(page, 'Sign out')

    await expect(page).toHaveURL(`${MOCK_BASE_URL}/home`)
    expect(urls).toContain(`${MOCK_BASE_URL}/post-logout`)
    expect((await mockScenario.stats()).endSessions).toBe(0)
    expect((await getMe(page)).status()).toBe(401)
  })

  test('shows a persistent notice with Retry when sign-out is unconfirmed', async ({ page, mockScenario }) => {
    await page.route('**/auth/logout', route => route.abort())
    await page.clock.install()
    await openUserMenu(page, 'Sign out')

    const notice = page.locator('[data-cy="unconfirmed-sign-out-notice"]')
    await expect(notice).toBeVisible()
    // No local cleanup: the session is live and the user stays on the page.
    await expect(page).toHaveURL(CONSOLE_URL)
    expect((await getMe(page)).status()).toBe(200)
    expect((await mockScenario.stats()).endSessions).toBe(0)
    // The notice has no timeout: it outlasts a minute on the page clock.
    await page.clock.fastForward(60_000)
    await expect(notice).toBeVisible()

    await page.unroute('**/auth/logout')
    await page.locator('[data-cy="unconfirmed-sign-out-retry"]').click()
    // Retry signs out from the current page, so the SPA keeps it as the return path.
    await expect(page).toHaveURL(`${MOCK_BASE_URL}/home?redirectTo=/researcher_console_dashboard`)
    expect((await mockScenario.stats()).endSessions).toBe(1)
    expect((await getMe(page)).status()).toBe(401)
  })
})

test.describe('callback errors', () => {
  /** Runs the login leg and returns the authorize URL and the callback's final response. */
  async function startSignIn(page: Page) {
    const login = await page.request.post('/auth/login')
    return (await login.json() as { redirectUrl: string }).redirectUrl
  }

  test('rejects an id_token without an email claim and starts no session', async ({ page, mockScenario }) => {
    await mockScenario.configure({ provider: { email: null } })
    const landing = await page.goto(await startSignIn(page))

    expect(landing!.status()).toBe(400)
    expect(await landing!.json()).toEqual({ error: 'token_missing_email_claim' })
    expect((await getMe(page)).status()).toBe(401)
  })

  test('rejects a callback whose state does not match and starts no session', async ({ page, mockScenario }) => {
    const authorizeUrl = new URL(await startSignIn(page))
    authorizeUrl.searchParams.set('state', 'tampered-state')
    const landing = await page.goto(authorizeUrl.href)

    expect(landing!.status()).toBeGreaterThanOrEqual(400)
    expect(new URL(landing!.url()).pathname).toBe('/auth/callback')
    expect((await getMe(page)).status()).toBe(401)
    expect((await mockScenario.stats()).codeGrants).toBe(0)
  })
})
