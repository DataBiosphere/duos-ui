import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { OidcBroker } from 'src/libs/auth/oidcBroker'
import { Auth, Redirect, redirectOnLogout } from 'src/libs/auth/auth'
import { getSessionInfo, resetSessionProbeState } from 'src/libs/auth/session'
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
    await Auth.signOut()
    expect(Storage.userIsLogged()).toBe(false)
    expect(Storage.getAnonymousId()).toBeNull()
    expect(Storage.getData('key')).toBeNull()
    expect(Storage.getEnv()).toBeNull()
  })

  it('redirectOnLogout clears storage and calls signOut', async () => {
    Storage.setAnonymousId(uuid())
    Storage.setData('key', 'val')
    Storage.setEnv('test')
    expect(Storage.getAnonymousId()).not.toBeNull()
    expect(Storage.getData('key')).not.toBeNull()
    expect(Storage.getEnv()).not.toBeNull()

    const signOutSpy = vi.spyOn(Auth, 'signOut')
    try {
      redirectOnLogout()
    }
    catch (_e) {
      // ignore location redirect errors in jsdom
    }
    // await the async signOut that redirectOnLogout fires-and-forgets
    await signOutSpy.mock.results[0].value
    expect(signOutSpy).toHaveBeenCalled()
    expect(Storage.userIsLogged()).toBe(false)
    expect(Storage.getAnonymousId()).toBeNull()
    expect(Storage.getData('key')).toBeNull()
    expect(Storage.getEnv()).toBeNull()
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

  it('signOut fetches a CSRF token, POSTs logout with it, clears storage, and redirects', async () => {
    Storage.setAnonymousId(uuid())
    Storage.setData('key', 'val')
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ token: 'csrf-123' }) })
      .mockResolvedValueOnce({ ok: true, status: 204 })
    vi.stubGlobal('fetch', fetchMock)
    const redirectSpy = vi.spyOn(Redirect, 'to').mockImplementation(() => {})

    await Auth.signOut()

    expect(fetchMock).toHaveBeenNthCalledWith(1, '/auth/csrf-token', { credentials: 'include' })
    expect(fetchMock).toHaveBeenNthCalledWith(2, '/auth/logout', {
      method: 'POST',
      credentials: 'include',
      headers: { 'X-CSRF-Token': 'csrf-123' },
    })
    expect(Storage.getAnonymousId()).toBeNull()
    expect(Storage.getData('key')).toBeNull()
    // No OidcUser placeholder survives sign-out in BFF mode
    expect(localStorage.getItem('OidcUser')).toBeNull()
    expect(redirectSpy).toHaveBeenCalledWith('/')
  })

  it('signOut still clears local state and redirects when the logout request fails', async () => {
    Storage.setData('key', 'val')
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network down')))
    const redirectSpy = vi.spyOn(Redirect, 'to').mockImplementation(() => {})

    await Auth.signOut()

    expect(Storage.getData('key')).toBeNull()
    expect(localStorage.getItem('OidcUser')).toBeNull()
    expect(redirectSpy).toHaveBeenCalledWith('/')
  })

  it('signOut redirects to the requested target', async () => {
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ token: 'csrf-123' }) })
      .mockResolvedValueOnce({ ok: true, status: 204 }))
    const redirectSpy = vi.spyOn(Redirect, 'to').mockImplementation(() => {})

    await Auth.signOut('/home?redirectTo=/datalibrary')

    expect(redirectSpy).toHaveBeenCalledWith('/home?redirectTo=/datalibrary')
  })

  it('signOut refetches the CSRF token and retries once when logout is rejected', async () => {
    // A cached token can be stale after session rotation — the logout must not
    // silently 403 and leave the server session alive
    const csrfRejection = new Response(
      JSON.stringify({ error: 'csrf_validation_failed', reason: 'missing_secret' }),
      { status: 403, headers: { 'content-type': 'application/json' } },
    )
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ token: 'csrf-stale' }) })
      .mockResolvedValueOnce(csrfRejection)
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ token: 'csrf-fresh' }) })
      .mockResolvedValueOnce({ ok: true, status: 204 })
    vi.stubGlobal('fetch', fetchMock)
    const redirectSpy = vi.spyOn(Redirect, 'to').mockImplementation(() => {})

    await Auth.signOut()

    expect(fetchMock).toHaveBeenCalledTimes(4)
    expect(fetchMock).toHaveBeenNthCalledWith(4, '/auth/logout', {
      method: 'POST',
      credentials: 'include',
      headers: { 'X-CSRF-Token': 'csrf-fresh' },
    })
    expect(redirectSpy).toHaveBeenCalledWith('/')
  })

  it('signOut drops the cached session answer before redirecting', async () => {
    // DuosHeader navigates before Auth.signOut's redirect unloads the page;
    // a re-render in that window must re-probe rather than serve the cached
    // pre-logout "authenticated" — which painted a signed-in header around
    // the just-cleared empty user.
    resetSessionProbeState()
    const fetchMock = vi.fn()
      // 1: session probe → cached authenticated answer
      .mockResolvedValueOnce(new Response(JSON.stringify({ authenticated: true }), { status: 200 }))
      // 2: CSRF token, 3: logout
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ token: 'csrf-123' }) } as never)
      .mockResolvedValueOnce({ ok: true, status: 204 } as never)
      // 4: the post-signOut ask must reach the network again
      .mockResolvedValueOnce(new Response(JSON.stringify({ authenticated: false }), { status: 401 }))
    vi.stubGlobal('fetch', fetchMock)
    vi.spyOn(Redirect, 'to').mockImplementation(() => {})

    await expect(getSessionInfo()).resolves.toMatchObject({ authenticated: true })
    await Auth.signOut()
    await expect(getSessionInfo()).resolves.toEqual({ authenticated: false })

    expect(fetchMock).toHaveBeenNthCalledWith(4, '/auth/me', { credentials: 'include' })
  })

  it('redirectOnLogout signs out with the /home redirect target', async () => {
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ token: 'csrf-123' }) })
      .mockResolvedValueOnce({ ok: true, status: 204 }))
    globalThis.history.replaceState({}, '', '/datalibrary')
    const redirectSpy = vi.spyOn(Redirect, 'to').mockImplementation(() => {})
    const signOutSpy = vi.spyOn(Auth, 'signOut')

    redirectOnLogout()

    expect(signOutSpy).toHaveBeenCalledWith('/home?redirectTo=/datalibrary')
    await signOutSpy.mock.results[0].value
    expect(redirectSpy).toHaveBeenCalledWith('/home?redirectTo=/datalibrary')
  })

  it.each(['/home', '/'])(
    'redirectOnLogout from %s does not append a self-referential redirectTo',
    async (path) => {
      // The sign-out race: DuosHeader has already navigated home when an
      // in-flight 401 lands, and the user must not end on /home?redirectTo=/home.
      vi.stubGlobal('fetch', vi.fn()
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ token: 'csrf-123' }) })
        .mockResolvedValueOnce({ ok: true, status: 204 }))
      globalThis.history.replaceState({}, '', path)
      const redirectSpy = vi.spyOn(Redirect, 'to').mockImplementation(() => {})
      const signOutSpy = vi.spyOn(Auth, 'signOut')

      redirectOnLogout()

      expect(signOutSpy).toHaveBeenCalledWith('/home')
      await signOutSpy.mock.results[0].value
      expect(redirectSpy).toHaveBeenCalledWith('/home')
    },
  )
})
