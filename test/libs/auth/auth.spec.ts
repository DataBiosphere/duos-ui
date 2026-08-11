import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { Auth, redirectOnLogout } from 'src/libs/auth/auth'
import { Storage } from 'src/libs/storage'
import { Config } from 'src/libs/config'
import { browserNavigation } from 'src/libs/browserNavigation'
import { getCsrfToken, resetCsrfToken } from 'src/libs/auth/csrf'
import { getSessionInfo, resetSessionCache } from 'src/libs/auth/session'

vi.mock('src/libs/auth/csrf', () => ({
  CSRF_HEADER: 'X-CSRF-Token',
  getCsrfToken: vi.fn(),
  resetCsrfToken: vi.fn(),
}))

vi.mock('src/libs/auth/session', () => ({
  getSessionInfo: vi.fn(),
  resetSessionCache: vi.fn(),
}))

vi.mock('src/libs/browserNavigation', () => ({
  browserNavigation: {
    assign: vi.fn(),
    currentPathname: vi.fn(),
  },
}))

describe('Auth (BFF)', () => {
  let fetchMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    vi.mocked(browserNavigation.currentPathname).mockReturnValue('/datalibrary')
    vi.mocked(getCsrfToken).mockResolvedValue('csrf-token-123')
    vi.mocked(getSessionInfo).mockResolvedValue({ authenticated: false })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
    localStorage.clear()
  })

  describe('initialize', () => {
    it('purges legacy oidc-client-ts keys when the environment has cut over', async () => {
      vi.spyOn(Config, 'isBffEnabled').mockResolvedValue(true)
      localStorage.setItem('OidcUser', '{"access_token":"secret"}')
      localStorage.setItem('oidc.abc123', 'state')
      localStorage.setItem('CurrentUser', '{"userId":1}')

      await Auth.initialize()

      expect(localStorage.getItem('OidcUser')).toBeNull()
      expect(localStorage.getItem('oidc.abc123')).toBeNull()
      expect(localStorage.getItem('CurrentUser')).toBe('{"userId":1}')
    })

    it('leaves legacy storage untouched in a non-cutover environment', async () => {
      vi.spyOn(Config, 'isBffEnabled').mockResolvedValue(false)
      localStorage.setItem('OidcUser', '{"access_token":"legacy"}')
      localStorage.setItem('oidc.abc123', 'state')

      await Auth.initialize()

      expect(localStorage.getItem('OidcUser')).toBe('{"access_token":"legacy"}')
      expect(localStorage.getItem('oidc.abc123')).toBe('state')
    })
  })

  describe('signIn', () => {
    it('POSTs /auth/login and redirects the page to the returned URL', async () => {
      fetchMock.mockResolvedValue(
        new Response(JSON.stringify({ redirectUrl: 'https://b2c.example.org/authorize?x=1' }), { status: 200 }),
      )

      await Auth.signIn()

      expect(fetchMock).toHaveBeenCalledWith('/auth/login', { method: 'POST', credentials: 'include' })
      expect(browserNavigation.assign).toHaveBeenCalledWith('https://b2c.example.org/authorize?x=1')
      expect(resetCsrfToken).toHaveBeenCalled()
      expect(resetSessionCache).toHaveBeenCalled()
    })

    it('passes returnTo as a query parameter', async () => {
      fetchMock.mockResolvedValue(
        new Response(JSON.stringify({ redirectUrl: 'https://b2c.example.org/authorize' }), { status: 200 }),
      )

      await Auth.signIn('/datalibrary')

      expect(fetchMock).toHaveBeenCalledWith(
        `/auth/login?returnTo=${encodeURIComponent('/datalibrary')}`,
        { method: 'POST', credentials: 'include' },
      )
    })

    it('takes no idp parameter — provider selection happens on the B2C page', () => {
      // One-argument signature: (returnTo?: string)
      expect(Auth.signIn.length).toBeLessThanOrEqual(1)
    })

    it('throws the standard sign-in error when the BFF rejects the login request', async () => {
      fetchMock.mockResolvedValue(new Response('{}', { status: 500 }))

      await expect(Auth.signIn()).rejects.toThrow(Auth.signInError())
      expect(browserNavigation.assign).not.toHaveBeenCalled()
    })
  })

  describe('signOut', () => {
    it('POSTs /auth/logout with a CSRF token, clears storage, and redirects home', async () => {
      Storage.setAnonymousId('anon-1')
      Storage.setData('key', 'val')
      fetchMock.mockResolvedValue(new Response(null, { status: 204 }))

      await Auth.signOut()

      expect(fetchMock).toHaveBeenCalledWith('/auth/logout', {
        method: 'POST',
        credentials: 'include',
        headers: { 'X-CSRF-Token': 'csrf-token-123' },
      })
      expect(Storage.getAnonymousId()).toBeNull()
      expect(Storage.getData('key')).toBeNull()
      expect(resetCsrfToken).toHaveBeenCalled()
      expect(resetSessionCache).toHaveBeenCalled()
      expect(browserNavigation.assign).toHaveBeenCalledWith('/')
    })

    it('still clears storage and redirects when the logout request fails', async () => {
      Storage.setData('key', 'val')
      fetchMock.mockRejectedValue(new TypeError('network down'))

      await Auth.signOut()

      expect(Storage.getData('key')).toBeNull()
      expect(browserNavigation.assign).toHaveBeenCalledWith('/')
    })
  })

  describe('isAuthenticated', () => {
    it('reflects the session probe', async () => {
      vi.mocked(getSessionInfo).mockResolvedValue({ authenticated: true, idp: 'google' })
      await expect(Auth.isAuthenticated()).resolves.toBe(true)

      vi.mocked(getSessionInfo).mockResolvedValue({ authenticated: false })
      await expect(Auth.isAuthenticated()).resolves.toBe(false)
    })
  })

  describe('redirectOnLogout', () => {
    it('ends the session and redirects to /home with the current path', async () => {
      Storage.setData('key', 'val')
      fetchMock.mockResolvedValue(new Response(null, { status: 204 }))

      redirectOnLogout()
      await vi.waitFor(() => expect(browserNavigation.assign).toHaveBeenCalledWith('/home?redirectTo=/datalibrary'))

      expect(fetchMock).toHaveBeenCalledWith('/auth/logout', expect.objectContaining({ method: 'POST' }))
      expect(Storage.getData('key')).toBeNull()
    })
  })
})
