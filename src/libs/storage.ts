import get from 'lodash/fp/get'
import { v4 as uuid } from 'uuid'
import { DuosUser } from 'src/types/model'
import { OidcUser as OidcUserType } from 'src/libs/auth/oidcBroker'

// Storage Variables
const CurrentUser = 'CurrentUser'
const OidcUser = 'OidcUser'
const UserSettings = 'UserSettings'
const anonymousId = 'anonymousId'
const ENV = 'env'

interface UserSettingsType {
  [userId: number]: {
    [key: string]: unknown
  }
}

const DEFAULT_DUOS_USER: DuosUser = {
  createDate: new Date(),
  displayName: '',
  email: '',
  emailPreference: false,
  isAdmin: false,
  isAlumni: false,
  isChairPerson: false,
  isDataSubmitter: false,
  isMember: false,
  isResearcher: false,
  isSigningOfficial: false,
  roles: [],
  userId: 0,
}

const DEFAULT_OIDC_USER: OidcUserType = {
  access_token: '', get expires_in(): number | undefined {
    return undefined
  },
  session_state: null,
  state: undefined,
  token_type: '',
  get expired(): boolean | undefined {
    return undefined
  },
  get scopes(): string[] {
    return []
  },
  toStorageString(): string {
    return ''
  },
  profile: {
    email_verified: false,
    idp: '',
    idp_access_token: '',
    tid: '',
    ver: '',
    sub: '',
    iss: '',
    aud: '',
    exp: 0,
    iat: 0,
  },
}

export const Storage = {
  clearStorage: (): void => {
    localStorage.clear()
    localStorage.setItem(CurrentUser, JSON.stringify(DEFAULT_DUOS_USER))
    localStorage.setItem(OidcUser, JSON.stringify(DEFAULT_OIDC_USER))
  },

  setCurrentUser: (data: DuosUser): void => {
    localStorage.setItem(CurrentUser, JSON.stringify(data))
  },

  getCurrentUser: (): DuosUser => {
    const user = localStorage.getItem(CurrentUser)
    return user ? JSON.parse(user) : DEFAULT_DUOS_USER
  },

  getCurrentUserSettings: <T = never>(key: string): T | undefined => {
    const id = Storage.getCurrentUser().userId
    const userSettings = JSON.parse(localStorage.getItem(UserSettings) || '{}') as UserSettingsType
    return get([id, key], userSettings) as T | undefined
  },

  getAnonymousId: (): string | null => {
    return localStorage.getItem(anonymousId)
  },

  setAnonymousId: (id: string = uuid()): void => {
    localStorage.setItem(anonymousId, id)
  },

  setCurrentUserSettings: <T>(key: string, value: T): void => {
    const id = Storage.getCurrentUser().userId
    const userSettings = JSON.parse(localStorage.getItem(UserSettings) || '{}') as UserSettingsType
    if (!userSettings[id]) {
      userSettings[id] = {}
    }
    userSettings[id][key] = value
    localStorage.setItem(UserSettings, JSON.stringify(userSettings))
  },

  setOidcUser: (oidcUser: OidcUserType): void => {
    localStorage.setItem(OidcUser, JSON.stringify(oidcUser))
  },

  getOidcUser: (): OidcUserType => {
    const user = localStorage.getItem(OidcUser)
    return user ? JSON.parse(user) : DEFAULT_OIDC_USER
  },

  userIsLogged: (): boolean => {
    const user = Storage.getOidcUser()
    const expTime = user.profile?.exp ?? 0
    return expTime > Math.floor(Date.now() / 1000)
  },

  setData: (key: string, value: unknown): void => {
    localStorage.setItem(key, JSON.stringify(value))
  },

  getData: <T = unknown>(key: string): T | null => {
    const data = localStorage.getItem(key)
    return data ? JSON.parse(data) as T : null
  },

  removeData: (key: string): void => {
    localStorage.removeItem(key)
  },

  setEnv: (value: string): void => {
    localStorage.setItem(ENV, value)
  },

  getEnv: (): string | null => {
    return localStorage.getItem(ENV)
  },
}
