import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { Storage } from 'src/libs/storage'
import { DuosUser } from 'src/types/model'
import { OidcUser } from 'src/libs/auth/oidcBroker'

const mockUser: DuosUser = {
  createDate: new Date(),
  displayName: 'John',
  email: 'john@example.com',
  emailPreference: false,
  isAdmin: false,
  isAlumni: false,
  isChairPerson: false,
  isDataSubmitter: false,
  isMember: false,
  isResearcher: false,
  isSigningOfficial: false,
  roles: [],
  userId: 123,
}

beforeEach(() => {
  localStorage.clear()
})

afterEach(() => {
  localStorage.clear()
})

describe('Storage', () => {
  describe('clearStorage', () => {
    it('should clear all localStorage items and set defaults', () => {
      localStorage.setItem('test', 'value')
      Storage.clearStorage()
      expect(localStorage.length).toBeGreaterThan(0)
      expect(Storage.getCurrentUser()).not.toBeNull()
      expect(Storage.getOidcUser()).not.toBeNull()
    })
  })

  describe('CurrentUser operations', () => {
    it('should set and get current user', () => {
      Storage.setCurrentUser(mockUser)
      const retrieved = Storage.getCurrentUser()
      expect(retrieved.userId).toBe(mockUser.userId)
      expect(retrieved.displayName).toBe(mockUser.displayName)
    })

    it('should return default user when current user is not set', () => {
      const retrieved = Storage.getCurrentUser()
      expect(retrieved).not.toBeNull()
      expect(retrieved.userId).toBe(0)
      expect(Array.isArray(retrieved.roles)).toBe(true)
    })
  })

  describe('Anonymous ID operations', () => {
    it('should set and get anonymous id', () => {
      const id = 'anon-123'
      Storage.setAnonymousId(id)
      expect(Storage.getAnonymousId()).toBe(id)
    })

    it('should generate uuid when no id provided', () => {
      Storage.setAnonymousId()
      const retrieved = Storage.getAnonymousId()
      expect(retrieved).not.toBeNull()
      expect(retrieved!.length).toBeGreaterThan(0)
    })

    it('should return null when anonymous id is not set', () => {
      expect(Storage.getAnonymousId()).toBeNull()
    })
  })

  describe('OIDC User operations', () => {
    it('should set and get oidc user', () => {
      const user: Partial<OidcUser> = {
        access_token: 'abc123',
        token_type: 'Bearer',
        profile: {
          email_verified: true,
          idp: 'test',
          idp_access_token: '',
          tid: '',
          ver: '1.0',
          sub: 'user123',
          iss: 'issuer',
          aud: 'audience',
          exp: Math.floor(Date.now() / 1000) + 3600,
          iat: Math.floor(Date.now() / 1000),
        },
      }
      Storage.setOidcUser(user as OidcUser)
      expect(Storage.getOidcUser().access_token).toBe('abc123')
    })

    it('should return default oidc user when not set', () => {
      const retrieved = Storage.getOidcUser()
      expect(retrieved).not.toBeNull()
      expect(retrieved.access_token).toBe('')
    })
  })

  describe('userIsLogged', () => {
    it('should return true when user is logged in with valid token', () => {
      const user: Partial<OidcUser> = {
        access_token: 'valid',
        token_type: 'Bearer',
        profile: {
          email_verified: false,
          idp: '', idp_access_token: '', tid: '', ver: '', sub: '', iss: '', aud: '',
          exp: Math.floor(Date.now() / 1000) + 3600,
          iat: Math.floor(Date.now() / 1000),
        },
      }
      Storage.setOidcUser(user as OidcUser)
      expect(Storage.userIsLogged()).toBe(true)
    })

    it('should return false when token is expired', () => {
      const user: Partial<OidcUser> = {
        access_token: 'expired',
        token_type: 'Bearer',
        profile: {
          email_verified: false,
          idp: '', idp_access_token: '', tid: '', ver: '', sub: '', iss: '', aud: '',
          exp: Math.floor(Date.now() / 1000) - 3600,
          iat: Math.floor(Date.now() / 1000),
        },
      }
      Storage.setOidcUser(user as OidcUser)
      expect(Storage.userIsLogged()).toBe(false)
    })

    it('should return false when oidc user is not set', () => {
      expect(Storage.userIsLogged()).toBe(false)
    })
  })

  describe('User Settings operations', () => {
    it('should set and get current user settings', () => {
      Storage.setCurrentUser(mockUser)
      Storage.setCurrentUserSettings('theme', 'dark')
      expect(Storage.getCurrentUserSettings<string>('theme')).toBe('dark')
    })

    it('should return undefined for non-existent setting', () => {
      Storage.setCurrentUser(mockUser)
      expect(Storage.getCurrentUserSettings<string>('nonexistent')).toBeUndefined()
    })

    it('should handle multiple settings for same user', () => {
      Storage.setCurrentUser(mockUser)
      Storage.setCurrentUserSettings('theme', 'dark')
      Storage.setCurrentUserSettings('language', 'en')
      expect(Storage.getCurrentUserSettings<string>('theme')).toBe('dark')
      expect(Storage.getCurrentUserSettings<string>('language')).toBe('en')
    })
  })

  describe('Generic data operations', () => {
    it('should set and get data with type inference', () => {
      const data = { key: 'value', count: 42 }
      Storage.setData('custom', data)
      expect(Storage.getData<typeof data>('custom')).toEqual(data)
    })

    it('should return null for non-existent key', () => {
      expect(Storage.getData('nonexistent')).toBeNull()
    })

    it('should remove data', () => {
      Storage.setData('temp', 'value')
      Storage.removeData('temp')
      expect(Storage.getData('temp')).toBeNull()
    })
  })

  describe('Environment operations', () => {
    it('should set and get environment', () => {
      Storage.setEnv('production')
      expect(Storage.getEnv()).toBe('production')
    })

    it('should return null when env is not set', () => {
      expect(Storage.getEnv()).toBeNull()
    })
  })
})
