import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { OidcBroker } from 'src/libs/auth/oidcBroker'
import { Auth, Redirect, redirectOnLogout } from 'src/libs/auth/auth'
import { getSessionInfo, resetSessionProbeState } from 'src/libs/auth/session'
import { resetCsrfToken } from 'src/libs/ajax/csrf'
import { POST_LOGOUT_PATH, takePostLogoutTarget } from 'src/libs/auth/postLogout'
import { resetSignOutNoticeState } from 'src/libs/auth/signOutNotice'
import { ToastNotifications } from 'src/libs/ToastNotifications'
import { Storage } from 'src/libs/storage'
import { Config } from 'src/libs/config'
import { v4 as uuid } from 'uuid'
import type { UserManager } from 'oidc-client-ts'

const mockOidcUser = {
  access_token: 'valid-access-token',
  session_state: null as null,
  state: undefined as undefined,
  token_type: '',
  get expired() { return undefined },
  get scopes() { return [] as string[] },
  toStorageString() { return '' },
  profile: {
    sub: '', iss: '', aud: '', iat: 0,
    exp: Math.floor(Date.now() / 1000) + 3600, // valid for 1 hour
  },
}

describe('Auth Failure', () => {
  beforeEach(() => {
    vi.spyOn(Config, 'isBffEnabled').mockResolvedValue(false)
  })

  afterEach(() => {
    vi.restoreAllMocks()
    localStorage.clear()
  })

  it('Sign In error throws expected message', async () => {
    vi.spyOn(OidcBroker, 'signIn').mockResolvedValue(null as never)
    await expect(Auth.signIn()).rejects.toThrow(Auth.signInError())
    expect(Storage.userIsLogged()).toBe(false)
  })
})

describe('Auth Success', () => {
  beforeEach(async () => {
    vi.spyOn(Config, 'isBffEnabled').mockResolvedValue(false)
    vi.spyOn(OidcBroker, 'initialize').mockResolvedValue(undefined)
    vi.spyOn(OidcBroker, 'getUserManager').mockReturnValue({
      events: {
        addUserLoaded: vi.fn(),
        addAccessTokenExpiring: vi.fn(),
        addAccessTokenExpired: vi.fn(),
      },
    } as unknown as UserManager)
    vi.spyOn(OidcBroker, 'signOut').mockResolvedValue(undefined)
    await Auth.initialize()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    localStorage.clear()
  })

  it('Sign In stores the current user', async () => {
    vi.spyOn(OidcBroker, 'signIn').mockResolvedValue(mockOidcUser as never)
    await Auth.signIn()
    expect(Storage.getOidcUser().access_token).toBe(mockOidcUser.access_token)
    expect(Storage.userIsLogged()).toBe(true)
  })

  it('Sign Out Clears the session when called', async () => {
    Storage.setAnonymousId(uuid())
    Storage.setData('key', 'val')
    Storage.setEnv('test')
    expect(Storage.getAnonymousId()).not.toBeNull()
    expect(Storage.getData('key')).not.toBeNull()
    expect(Storage.getEnv()).not.toBeNull()
    const redirectSpy = vi.spyOn(Redirect, 'to').mockImplementation(() => {})

    await expect(Auth.signOut()).resolves.toEqual({ status: 'confirmed' })

    expect(Storage.userIsLogged()).toBe(false)
    expect(Storage.getAnonymousId()).toBeNull()
    expect(Storage.getData('key')).toBeNull()
    expect(Storage.getEnv()).toBeNull()
    // Story 5-E: Auth.signOut owns the navigation in BOTH modes.
    expect(redirectSpy).toHaveBeenCalledWith('/')
  })

  it('Sign Out validates the legacy redirect target', async () => {
    const redirectSpy = vi.spyOn(Redirect, 'to').mockImplementation(() => {})

    await Auth.signOut('//evil.example.com/steal')

    expect(redirectSpy).toHaveBeenCalledWith('/')
  })

  it('redirectOnLogout clears storage and calls signOut', async () => {
    Storage.setAnonymousId(uuid())
    Storage.setData('key', 'val')
    Storage.setEnv('test')
    expect(Storage.getAnonymousId()).not.toBeNull()
    expect(Storage.getData('key')).not.toBeNull()
    expect(Storage.getEnv()).not.toBeNull()

    const redirectSpy = vi.spyOn(Redirect, 'to').mockImplementation(() => {})
    const signOutSpy = vi.spyOn(Auth, 'signOut')

    await expect(redirectOnLogout()).resolves.toEqual({ status: 'confirmed' })

    expect(signOutSpy).toHaveBeenCalled()
    expect(Storage.userIsLogged()).toBe(false)
    expect(Storage.getAnonymousId()).toBeNull()
    expect(Storage.getData('key')).toBeNull()
    expect(Storage.getEnv()).toBeNull()
    // Auth.signOut owns the navigation — redirectOnLogout adds none.
    expect(redirectSpy).toHaveBeenCalledTimes(1)
  })
})

describe('Auth (BFF mode)', () => {
  beforeEach(() => {
    vi.spyOn(Config, 'isBffEnabled').mockResolvedValue(true)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
    localStorage.clear()
  })

  it('initialize purges legacy oidc keys and does not start the OidcBroker', async () => {
    localStorage.setItem('OidcUser', JSON.stringify({ access_token: 'stale' }))
    localStorage.setItem('oidc.user:authority:client', 'stale')
    localStorage.setItem('oidc.abc123', 'stale-state')
    localStorage.setItem('CurrentUser', JSON.stringify({ userId: 1 }))
    const brokerInit = vi.spyOn(OidcBroker, 'initialize')

    await Auth.initialize()

    expect(localStorage.getItem('OidcUser')).toBeNull()
    expect(localStorage.getItem('oidc.user:authority:client')).toBeNull()
    expect(localStorage.getItem('oidc.abc123')).toBeNull()
    expect(localStorage.getItem('CurrentUser')).not.toBeNull()
    expect(brokerInit).not.toHaveBeenCalled()
  })

  it('signIn POSTs /auth/login and redirects to the returned URL', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ redirectUrl: 'https://b2c.example.com/authorize?state=xyz' }),
    })
    vi.stubGlobal('fetch', fetchMock)
    const redirectSpy = vi.spyOn(Redirect, 'to').mockImplementation(() => {})

    // The BFF signIn promise never settles (full-page redirect), so don't await it
    void Auth.signIn()

    await vi.waitFor(
      () => expect(redirectSpy).toHaveBeenCalledWith('https://b2c.example.com/authorize?state=xyz'),
      { timeout: 5000 },
    )
    expect(fetchMock).toHaveBeenCalledWith('/auth/login', { method: 'POST', credentials: 'include' })
  })

  it('signIn forwards returnTo to the login endpoint', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ redirectUrl: 'https://b2c.example.com/authorize' }),
    })
    vi.stubGlobal('fetch', fetchMock)
    const redirectSpy = vi.spyOn(Redirect, 'to').mockImplementation(() => {})

    void Auth.signIn('/datalibrary?tab=all')

    await vi.waitFor(
      () => expect(redirectSpy).toHaveBeenCalledWith('https://b2c.example.com/authorize'),
      { timeout: 5000 },
    )
    expect(fetchMock).toHaveBeenCalledWith(
      `/auth/login?returnTo=${encodeURIComponent('/datalibrary?tab=all')}`,
      { method: 'POST', credentials: 'include' },
    )
  })

  it('signIn rejects when /auth/login fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500 }))
    const redirectSpy = vi.spyOn(Redirect, 'to').mockImplementation(() => {})

    await expect(Auth.signIn()).rejects.toThrow(Auth.signInError())
    expect(redirectSpy).not.toHaveBeenCalled()
  })
})

/*
  Story 5-E: front-channel logout.

  Auth.signOut classifies the logout response against ONE contract — only a
  200 with a well-formed redirectUrl and a bare 204 confirm anything — and owns
  every navigation. These suites cover the classification, the /auth/me
  verification that replaces the old swallow-and-assume catch, and the
  coalescing that keeps concurrent 401s to one attempt.
*/

const B2C_LOGOUT_URL = 'https://terradevb2c.b2clogin.com/logout?id_token_hint=abc'

const jsonResponse = (status: number, body: unknown): Response =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })

const emptyResponse = (status: number): Response => new Response(null, { status })

/** A 200 whose body is not JSON at all. */
const malformedOk = (): Response =>
  new Response('<html>gateway</html>', { status: 200, headers: { 'content-type': 'text/html' } })

const csrfRejection = (): Response =>
  jsonResponse(403, { error: 'csrf_validation_failed', reason: 'missing_secret' })

const b2cLogoutOk = (url: string = B2C_LOGOUT_URL): Response =>
  jsonResponse(200, { redirectUrl: url })

interface RouteQueues {
  /** Defaults to an inexhaustible 200 { token } — override only to test the
   *  gated endpoint answering 401. */
  csrf?: (Response | Error)[]
  logout?: (Response | Error)[]
  me?: (Response | Error)[]
}

/**
 * Routes fetch by URL and consumes one queued answer per endpoint, so a
 * multi-step sign-out reads as "what each endpoint said" instead of as an
 * opaque call-order sequence.
 */
const stubFetchRoutes = (routes: RouteQueues) => {
  const queues = {
    csrf: [...(routes.csrf ?? [])],
    logout: [...(routes.logout ?? [])],
    me: [...(routes.me ?? [])],
  }
  const routeOf = (url: string): keyof typeof queues => {
    if (url.startsWith('/auth/csrf-token')) return 'csrf'
    if (url.startsWith('/auth/logout')) return 'logout'
    return 'me'
  }
  const fetchMock = vi.fn((input: string) => {
    const route = routeOf(input)
    const next = queues[route].shift()
    if (next === undefined) {
      // An inexhaustible CSRF token keeps the interesting queues short.
      if (route === 'csrf') return Promise.resolve(jsonResponse(200, { token: 'csrf-123' }))
      return Promise.reject(new Error(`unexpected fetch to ${input}`))
    }
    if (next instanceof Error) return Promise.reject(next)
    return Promise.resolve(next)
  })
  vi.stubGlobal('fetch', fetchMock)
  const urlsFor = (route: keyof typeof queues): string[] =>
    fetchMock.mock.calls.map(call => call[0]).filter(url => routeOf(url) === route)
  return { fetchMock, urlsFor }
}

describe('Auth.signOut classification (BFF, story 5-E)', () => {
  let redirectSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    vi.spyOn(Config, 'isBffEnabled').mockResolvedValue(true)
    redirectSpy = vi.spyOn(Redirect, 'to').mockImplementation(() => {})
    resetCsrfToken()
    resetSessionProbeState()
    resetSignOutNoticeState()
    sessionStorage.clear()
    localStorage.clear()
    globalThis.history.replaceState({}, '', '/')
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
    localStorage.clear()
    sessionStorage.clear()
  })

  it('navigates to the B2C end-session URL on 200 { redirectUrl }', async () => {
    Storage.setData('key', 'val')
    stubFetchRoutes({ logout: [b2cLogoutOk()] })

    await expect(Auth.signOut('/home?redirectTo=/datalibrary')).resolves.toEqual({ status: 'confirmed' })

    expect(redirectSpy).toHaveBeenCalledWith(B2C_LOGOUT_URL)
    // Local cleanup ran BEFORE the navigation away.
    expect(Storage.getData('key')).toBeNull()
  })

  it('stores the validated local target for /post-logout to consume', async () => {
    stubFetchRoutes({ logout: [b2cLogoutOk()] })

    await Auth.signOut('/home?redirectTo=/datalibrary')

    expect(takePostLogoutTarget()).toBe('/home?redirectTo=/datalibrary')
  })

  it('never stores an external target', async () => {
    stubFetchRoutes({ logout: [b2cLogoutOk()] })

    await Auth.signOut('https://evil.example.com/steal')

    expect(takePostLogoutTarget()).toBe('/')
  })

  it('navigates to /post-logout on a bare 204', async () => {
    Storage.setData('key', 'val')
    stubFetchRoutes({ logout: [emptyResponse(204)] })

    await expect(Auth.signOut('/home')).resolves.toEqual({ status: 'confirmed' })

    expect(redirectSpy).toHaveBeenCalledWith(POST_LOGOUT_PATH)
    expect(Storage.getData('key')).toBeNull()
  })

  it('runs local cleanup before the navigation, in that order', async () => {
    localStorage.setItem('OidcUser', JSON.stringify({ access_token: 'stale' }))
    let storageStillPopulatedAtRedirect = true
    stubFetchRoutes({ logout: [emptyResponse(204)] })
    redirectSpy.mockImplementation(() => {
      storageStillPopulatedAtRedirect = localStorage.getItem('OidcUser') !== null
    })

    await Auth.signOut('/home')

    expect(storageStillPopulatedAtRedirect).toBe(false)
  })

  it('follows the CSRF retry and navigates to the SECOND response URL', async () => {
    // The exact path the retry exists for: reading the first 403 instead of
    // the retry's answer would skip the B2C navigation entirely.
    const secondUrl = 'https://terradevb2c.b2clogin.com/logout?id_token_hint=second'
    const { urlsFor } = stubFetchRoutes({
      logout: [csrfRejection(), b2cLogoutOk(secondUrl)],
    })

    await expect(Auth.signOut('/home')).resolves.toEqual({ status: 'confirmed' })

    expect(redirectSpy).toHaveBeenCalledWith(secondUrl)
    expect(urlsFor('logout')).toHaveLength(2)
  })

  it('treats a final CSRF rejection as unconfirmed and performs no cleanup', async () => {
    Storage.setData('key', 'val')
    const { urlsFor } = stubFetchRoutes({
      // Both attempts are rejected, and /auth/me says the session is alive.
      logout: [csrfRejection(), csrfRejection(), csrfRejection(), csrfRejection()],
      me: [jsonResponse(200, { authenticated: true })],
    })

    await expect(Auth.signOut('/home')).resolves.toEqual({ status: 'unconfirmed' })

    expect(redirectSpy).not.toHaveBeenCalled()
    expect(Storage.getData('key')).toBe('val')
    // Bounded: two attempts of two POSTs each, and no loop.
    expect(urlsFor('logout')).toHaveLength(4)
    expect(urlsFor('me')).toHaveLength(1)
  })

  it('verifies against /auth/me on a 500 rather than assuming a logout', async () => {
    const { urlsFor } = stubFetchRoutes({
      logout: [emptyResponse(500)],
      me: [emptyResponse(401)],
    })

    await expect(Auth.signOut('/home')).resolves.toEqual({ status: 'confirmed' })

    expect(urlsFor('me')).toEqual(['/auth/me'])
    expect(redirectSpy).toHaveBeenCalledWith(POST_LOGOUT_PATH)
  })

  it('verifies against /auth/me on a malformed 200 body', async () => {
    const { urlsFor } = stubFetchRoutes({
      logout: [malformedOk()],
      me: [emptyResponse(401)],
    })

    await expect(Auth.signOut('/home')).resolves.toEqual({ status: 'confirmed' })

    expect(urlsFor('me')).toEqual(['/auth/me'])
  })

  it('verifies against /auth/me on a 200 without a redirectUrl', async () => {
    // The server contract says a 200 always carries one, so this is an
    // anomaly — not a signal that the session was destroyed.
    const { urlsFor } = stubFetchRoutes({
      logout: [jsonResponse(200, { loggedOut: true })],
      me: [emptyResponse(401)],
    })

    await expect(Auth.signOut('/home')).resolves.toEqual({ status: 'confirmed' })

    expect(urlsFor('me')).toEqual(['/auth/me'])
  })

  it('rejects a 200 whose redirectUrl is not a well-formed absolute URL', async () => {
    const { urlsFor } = stubFetchRoutes({
      logout: [jsonResponse(200, { redirectUrl: '/not-absolute' })],
      me: [emptyResponse(401)],
    })

    await expect(Auth.signOut('/home')).resolves.toEqual({ status: 'confirmed' })

    expect(redirectSpy).toHaveBeenCalledWith(POST_LOGOUT_PATH)
    expect(urlsFor('me')).toEqual(['/auth/me'])
  })

  it('reports unconfirmed when /auth/me answers 502', async () => {
    Storage.setData('key', 'val')
    stubFetchRoutes({
      logout: [emptyResponse(500)],
      me: [emptyResponse(502)],
    })

    await expect(Auth.signOut('/home')).resolves.toEqual({ status: 'unconfirmed' })

    expect(redirectSpy).not.toHaveBeenCalled()
    expect(Storage.getData('key')).toBe('val')
  })

  it('reports unconfirmed when the /auth/me probe fails at the transport', async () => {
    Storage.setData('key', 'val')
    stubFetchRoutes({
      logout: [new Error('network down')],
      me: [new Error('network down')],
    })

    await expect(Auth.signOut('/home')).resolves.toEqual({ status: 'unconfirmed' })

    expect(Storage.getData('key')).toBe('val')
    // Nothing will consume the stored target, so it must not linger.
    expect(sessionStorage).toHaveLength(0)
  })

  it('retries the logout once when /auth/me reports the session is still live', async () => {
    const { urlsFor } = stubFetchRoutes({
      logout: [new Error('network down'), emptyResponse(204)],
      me: [jsonResponse(200, { authenticated: true })],
    })

    await expect(Auth.signOut('/home')).resolves.toEqual({ status: 'confirmed' })

    expect(urlsFor('logout')).toHaveLength(2)
    expect(redirectSpy).toHaveBeenCalledWith(POST_LOGOUT_PATH)
  })

  it('drops the cached session answer before navigating away', async () => {
    // A re-render in the window before the navigation unloads the page must
    // re-probe rather than serve the cached pre-logout "authenticated" answer,
    // which painted a signed-in header around the just-cleared empty user.
    stubFetchRoutes({
      me: [
        jsonResponse(200, { authenticated: true }),
        emptyResponse(401),
      ],
      logout: [emptyResponse(204)],
    })

    await expect(getSessionInfo()).resolves.toMatchObject({ authenticated: true })
    await Auth.signOut('/home')

    await expect(getSessionInfo()).resolves.toEqual({ authenticated: false })
  })

  it('leaves no stored target when cleanup itself throws', async () => {
    // Storage.clearStorage reaches localStorage unguarded, so cleanup can
    // throw where web storage is blocked. The wrapper reports that as
    // unconfirmed, and an unconfirmed outcome must leave nothing behind for a
    // later visit to /post-logout to consume.
    vi.spyOn(Storage, 'clearStorage').mockImplementation(() => {
      throw new Error('site data blocked')
    })
    stubFetchRoutes({ logout: [emptyResponse(204)] })

    await expect(Auth.signOut('/home?redirectTo=/datalibrary')).resolves.toEqual({ status: 'unconfirmed' })

    expect(redirectSpy).not.toHaveBeenCalled()
    expect(sessionStorage).toHaveLength(0)
  })

  it('resolves the automatic terminal-401 path to a confirmed LOCAL logout', async () => {
    // The proxy already destroyed the session, so /auth/csrf-token (gated on
    // authentication) answers 401 and the logout POST never goes out. The
    // /auth/me probe settles it — no B2C navigation is attempted.
    const { urlsFor } = stubFetchRoutes({
      csrf: [emptyResponse(401)],
      me: [emptyResponse(401)],
    })

    await expect(Auth.signOut('/home')).resolves.toEqual({ status: 'confirmed' })

    expect(urlsFor('logout')).toHaveLength(0)
    expect(redirectSpy).toHaveBeenCalledWith(POST_LOGOUT_PATH)
  })
})

describe('Auth.signOut coalescing (BFF, story 5-E)', () => {
  beforeEach(() => {
    vi.spyOn(Config, 'isBffEnabled').mockResolvedValue(true)
    vi.spyOn(Redirect, 'to').mockImplementation(() => {})
    resetCsrfToken()
    resetSessionProbeState()
    resetSignOutNoticeState()
    sessionStorage.clear()
    localStorage.clear()
    globalThis.history.replaceState({}, '', '/')
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
    localStorage.clear()
    sessionStorage.clear()
  })

  it('shares one attempt between concurrent callers', async () => {
    const { urlsFor } = stubFetchRoutes({ logout: [emptyResponse(204)] })

    const results = await Promise.all([
      Auth.signOut('/home'),
      Auth.signOut('/home'),
      Auth.signOut('/home'),
    ])

    expect(results).toEqual([
      { status: 'confirmed' },
      { status: 'confirmed' },
      { status: 'confirmed' },
    ])
    expect(urlsFor('logout')).toHaveLength(1)
  })

  it('lets the first caller\'s validated target win', async () => {
    stubFetchRoutes({ logout: [emptyResponse(204)] })

    await Promise.all([
      Auth.signOut('/home?redirectTo=/datalibrary'),
      Auth.signOut('/home?redirectTo=/profile'),
    ])

    expect(takePostLogoutTarget()).toBe('/home?redirectTo=/datalibrary')
  })

  it('starts a NEW attempt after an unconfirmed result', async () => {
    const { urlsFor } = stubFetchRoutes({
      logout: [emptyResponse(500), emptyResponse(204)],
      me: [emptyResponse(502)],
    })

    await expect(Auth.signOut('/home')).resolves.toEqual({ status: 'unconfirmed' })
    // The coalescing promise must be cleared, or Retry would re-await the
    // failed attempt instead of trying again.
    await expect(Auth.signOut('/home')).resolves.toEqual({ status: 'confirmed' })

    expect(urlsFor('logout')).toHaveLength(2)
  })
})

describe('redirectOnLogout (story 5-E)', () => {
  beforeEach(() => {
    vi.spyOn(Config, 'isBffEnabled').mockResolvedValue(true)
    resetCsrfToken()
    resetSessionProbeState()
    resetSignOutNoticeState()
    sessionStorage.clear()
    localStorage.clear()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
    localStorage.clear()
    sessionStorage.clear()
  })

  it('signs out with the /home redirect target and performs no navigation of its own', async () => {
    globalThis.history.replaceState({}, '', '/datalibrary')
    stubFetchRoutes({ logout: [emptyResponse(204)] })
    const redirectSpy = vi.spyOn(Redirect, 'to').mockImplementation(() => {})
    const signOutSpy = vi.spyOn(Auth, 'signOut')

    await redirectOnLogout()

    expect(signOutSpy).toHaveBeenCalledWith('/home?redirectTo=/datalibrary')
    // The ONLY navigation is Auth.signOut's own — an extra Redirect.to here
    // would unload the page mid-flight.
    expect(redirectSpy).toHaveBeenCalledTimes(1)
    expect(redirectSpy).toHaveBeenCalledWith(POST_LOGOUT_PATH)
  })

  it.each(['/home', '/'])(
    'from %s does not append a self-referential redirectTo',
    async (path) => {
      globalThis.history.replaceState({}, '', path)
      stubFetchRoutes({ logout: [emptyResponse(204)] })
      vi.spyOn(Redirect, 'to').mockImplementation(() => {})
      const signOutSpy = vi.spyOn(Auth, 'signOut')

      await redirectOnLogout()

      expect(signOutSpy).toHaveBeenCalledWith('/home')
    },
  )

  it('does not navigate before the logout request settles', async () => {
    globalThis.history.replaceState({}, '', '/datalibrary')
    let releaseLogout: (res: Response) => void = () => {}
    const logoutSettled = new Promise<Response>((resolve) => {
      releaseLogout = resolve
    })
    const fetchMock = vi.fn((input: string) => {
      if (input.startsWith('/auth/csrf-token')) {
        return Promise.resolve(jsonResponse(200, { token: 'csrf-123' }))
      }
      return logoutSettled
    })
    vi.stubGlobal('fetch', fetchMock)
    const redirectSpy = vi.spyOn(Redirect, 'to').mockImplementation(() => {})

    const pending = redirectOnLogout()
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2))
    expect(redirectSpy).not.toHaveBeenCalled()

    releaseLogout(emptyResponse(204))
    await pending
    expect(redirectSpy).toHaveBeenCalledWith(POST_LOGOUT_PATH)
  })

  it('surfaces an unconfirmed result as a persistent notice with a Retry', async () => {
    globalThis.history.replaceState({}, '', '/datalibrary')
    stubFetchRoutes({
      logout: [emptyResponse(500)],
      me: [emptyResponse(502)],
    })
    vi.spyOn(Redirect, 'to').mockImplementation(() => {})
    const noticeSpy = vi.spyOn(ToastNotifications, 'showError').mockImplementation(() => {})

    await expect(redirectOnLogout()).resolves.toEqual({ status: 'unconfirmed' })

    // Assert the dispatch itself, not merely the absence of a rejection.
    expect(noticeSpy).toHaveBeenCalledTimes(1)
    // A security-relevant Retry cannot auto-hide.
    expect(noticeSpy.mock.calls[0][0]).toMatchObject({ timeout: null })
  })

  it('does not stack a notice per concurrent caller', async () => {
    globalThis.history.replaceState({}, '', '/datalibrary')
    stubFetchRoutes({
      logout: [emptyResponse(500)],
      me: [emptyResponse(502)],
    })
    vi.spyOn(Redirect, 'to').mockImplementation(() => {})
    const noticeSpy = vi.spyOn(ToastNotifications, 'showError').mockImplementation(() => {})

    await Promise.all([redirectOnLogout(), redirectOnLogout(), redirectOnLogout()])

    expect(noticeSpy).toHaveBeenCalledTimes(1)
  })
})
