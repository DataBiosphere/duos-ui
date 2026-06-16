import { describe, it, expect, vi, beforeEach } from 'vitest'
import { OAuth2 } from 'src/libs/ajax/OAuth2'
import { OidcBroker } from 'src/libs/auth/oidcBroker'

vi.mock('src/libs/ajax/OAuth2', () => ({
  OAuth2: {
    getConfig: vi.fn(),
  },
}))

vi.mock('src/libs/config', () => ({
  Config: {
    getApiUrl: vi.fn().mockResolvedValue('http://localhost'),
  },
}))

describe('OidcBroker Failure', () => {
  it('Get User Manager Fails without initialization', () => {
    expect(() => OidcBroker.getUserManager()).toThrow('initialized')
  })

  it('Get User Manager Settings Fails without initialization', () => {
    expect(() => OidcBroker.getUserManagerSettings()).toThrow('initialized')
  })
})

describe('OidcBroker Success', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(OAuth2.getConfig).mockResolvedValue({
      authorityEndpoint: 'http://localhost',
      clientId: 'clientId',
    })
  })

  it('Initialization Succeeds', async () => {
    await OidcBroker.initialize()
    expect(OidcBroker.getUserManager()).not.toBeNull()
    expect(OidcBroker.getUserManagerSettings()).not.toBeNull()
  })

  it('Sign In calls Oidc Broker UserManager sign-in popup function', async () => {
    await OidcBroker.initialize()
    const um = OidcBroker.getUserManager()
    const signinPopup = vi.spyOn(um, 'signinPopup').mockRejectedValue(new Error('Invalid URL'))
    // Since we are not calling a real sign-in url, we expect oidc-client errors when doing so
    try {
      await OidcBroker.signIn()
    }
    catch (_err) {
      // Ignore errors from attempting to sign in with an invalid URL
    }
    expect(signinPopup).toHaveBeenCalled()
  })

  it('Sign Out calls Oidc UserManager sign-out functions', async () => {
    await OidcBroker.initialize()
    const um = OidcBroker.getUserManager()
    const removeUser = vi.spyOn(um, 'removeUser').mockResolvedValue(undefined)
    const clearStaleState = vi.spyOn(um, 'clearStaleState').mockResolvedValue(undefined)
    await OidcBroker.signOut()
    expect(removeUser).toHaveBeenCalled()
    expect(clearStaleState).toHaveBeenCalled()
  })
})
