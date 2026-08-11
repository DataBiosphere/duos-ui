import { v4 as uuid } from 'uuid'
import { DuosUser } from 'src/types/model'
import { getSessionInfo } from 'src/libs/auth/session'

// Storage Variables
const CurrentUser = 'CurrentUser'
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

/**
 * Whether the user has an active BFF session. Async because the session lives
 * server-side: the answer is `GET /auth/me` (cached per page load in
 * session.ts), not a localStorage read — the browser no longer holds tokens.
 */
export const userIsLogged = async (): Promise<boolean> => {
  return (await getSessionInfo()).authenticated
}

export const Storage = {
  clearStorage: (): void => {
    localStorage.clear()
    localStorage.setItem(CurrentUser, JSON.stringify(DEFAULT_DUOS_USER))
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
    return userSettings[id]?.[key] as T | undefined
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
