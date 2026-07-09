import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { OidcBroker } from 'src/libs/auth/oidcBroker'
import { Auth, redirectOnLogout } from 'src/libs/auth/auth'
import { Storage } from 'src/libs/storage'
import { v4 as uuid } from 'uuid'
import type { UserManager } from 'oidc-client-ts'

const mockOidcUser = {
  access_token: '',
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
  afterEach(() => {
    vi.restoreAllMocks()
    localStorage.clear()
  })

  it('Sign In error throws expected message', async () => {
    vi.spyOn(OidcBroker, 'signIn').mockResolvedValue(null as never)
    await expect(Auth.signIn()).rejects.toThrow(Auth.signInError())
    expect(Storage.getOidcUser()).toBeTruthy()
    expect(Storage.userIsLogged()).toBe(false)
  })
})

describe('Auth Success', () => {
  beforeEach(async () => {
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
    expect(Storage.getOidcUser()).toBeTruthy()
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
