import { Storage } from 'src/libs/storage'
import { DuosUser } from 'src/types/model'
import { OidcUser } from 'src/libs/auth/oidcBroker'

describe('Storage', () => {
  beforeEach(() => {
    cy.window().then((win) => {
      win.localStorage.clear()
    })
  })

  afterEach(() => {
    cy.window().then((win) => {
      win.localStorage.clear()
    })
  })

  describe('clearStorage', () => {
    it('should clear all localStorage items and set defaults', () => {
      cy.window().then((win) => {
        win.localStorage.setItem('test', 'value')
        Storage.clearStorage()
        expect(win.localStorage.length).to.be.greaterThan(0)
        expect(Storage.getCurrentUser()).to.not.equal(null)
        expect(Storage.getOidcUser()).to.not.equal(null)
      })
    })
  })

  describe('CurrentUser operations', () => {
    it('should set and get current user', () => {
      const user: DuosUser = {
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
      Storage.setCurrentUser(user)
      const retrieved = Storage.getCurrentUser()
      expect(retrieved.userId).to.equal(user.userId)
      expect(retrieved.displayName).to.equal(user.displayName)
    })

    it('should return default user when current user is not set', () => {
      const retrieved = Storage.getCurrentUser()
      expect(retrieved).to.not.equal(null)
      expect(retrieved.userId).to.equal(0)
      expect(retrieved.roles).to.be.an('array')
    })
  })

  describe('Anonymous ID operations', () => {
    it('should set and get anonymous id', () => {
      const id = 'anon-123'
      Storage.setAnonymousId(id)
      const retrieved = Storage.getAnonymousId()
      expect(retrieved).to.equal(id)
    })

    it('should generate uuid when no id provided', () => {
      Storage.setAnonymousId()
      const retrieved = Storage.getAnonymousId()
      expect(retrieved).to.not.equal(null)
      expect(retrieved?.length).to.be.greaterThan(0)
    })

    it('should return null when anonymous id is not set', () => {
      const retrieved = Storage.getAnonymousId()
      expect(retrieved).to.equal(null)
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
      const retrieved = Storage.getOidcUser()
      expect(retrieved.access_token).to.equal('abc123')
    })

    it('should return default oidc user when not set', () => {
      const retrieved = Storage.getOidcUser()
      expect(retrieved).to.not.equal(null)
      expect(retrieved.access_token).to.equal('')
    })
  })

  describe('userIsLogged', () => {
    it('should return true when user is logged in with valid token', () => {
      const futureTimestamp = Math.floor(Date.now() / 1000) + 3600
      const user: Partial<OidcUser> = {
        access_token: 'valid',
        token_type: 'Bearer',
        profile: {
          email_verified: false,
          idp: '',
          idp_access_token: '',
          tid: '',
          ver: '',
          sub: '',
          iss: '',
          aud: '',
          exp: futureTimestamp,
          iat: Math.floor(Date.now() / 1000),
        },
      }
      Storage.setOidcUser(user as OidcUser)
      expect(Storage.userIsLogged()).to.equal(true)
    })

    it('should return false when token is expired', () => {
      const pastTimestamp = Math.floor(Date.now() / 1000) - 3600
      const user: Partial<OidcUser> = {
        access_token: 'expired',
        token_type: 'Bearer',
        profile: {
          email_verified: false,
          idp: '',
          idp_access_token: '',
          tid: '',
          ver: '',
          sub: '',
          iss: '',
          aud: '',
          exp: pastTimestamp,
          iat: Math.floor(Date.now() / 1000),
        },
      }
      Storage.setOidcUser(user as OidcUser)
      expect(Storage.userIsLogged()).to.equal(false)
    })

    it('should return false when oidc user is not set', () => {
      expect(Storage.userIsLogged()).to.equal(false)
    })
  })

  describe('User Settings operations', () => {
    it('should set and get current user settings', () => {
      const user: DuosUser = {
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
      Storage.setCurrentUser(user)
      Storage.setCurrentUserSettings('theme', 'dark')
      const retrieved = Storage.getCurrentUserSettings<string>('theme')
      expect(retrieved).to.equal('dark')
    })

    it('should return undefined for non-existent setting', () => {
      const user: DuosUser = {
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
      Storage.setCurrentUser(user)
      const retrieved = Storage.getCurrentUserSettings<string>('nonexistent')
      expect(retrieved).to.equal(undefined)
    })

    it('should handle multiple settings for same user', () => {
      const user: DuosUser = {
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
      Storage.setCurrentUser(user)
      Storage.setCurrentUserSettings('theme', 'dark')
      Storage.setCurrentUserSettings('language', 'en')
      expect(Storage.getCurrentUserSettings<string>('theme')).to.equal('dark')
      expect(Storage.getCurrentUserSettings<string>('language')).to.equal('en')
    })
  })

  describe('Generic data operations', () => {
    it('should set and get data with type inference', () => {
      const data = { key: 'value', count: 42 }
      Storage.setData('custom', data)
      const retrieved = Storage.getData<typeof data>('custom')
      expect(retrieved).to.deep.equal(data)
    })

    it('should return null for non-existent key', () => {
      const retrieved = Storage.getData('nonexistent')
      expect(retrieved).to.equal(null)
    })

    it('should remove data', () => {
      Storage.setData('temp', 'value')
      Storage.removeData('temp')
      const retrieved = Storage.getData('temp')
      expect(retrieved).to.equal(null)
    })
  })

  describe('Environment operations', () => {
    it('should set and get environment', () => {
      Storage.setEnv('production')
      expect(Storage.getEnv()).to.equal('production')
    })

    it('should return null when env is not set', () => {
      expect(Storage.getEnv()).to.equal(null)
    })
  })
})
