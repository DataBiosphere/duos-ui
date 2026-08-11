import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { QueryClient } from '@tanstack/react-query'
import { completeSignIn } from 'src/libs/auth/postSignIn'
import { User } from 'src/libs/ajax/User'
import { Metrics } from 'src/libs/ajax/Metrics'
import { Storage } from 'src/libs/storage'
import { Auth } from 'src/libs/auth/auth'
import { Navigation, Notifications } from 'src/libs/utils'
import { ErrorReporter } from 'src/libs/ErrorReporter'
import { DuosUser, UserStatusInfo } from 'src/types/model'

vi.mock('src/libs/ajax/User')
vi.mock('src/libs/ajax/Metrics')
vi.mock('src/libs/ErrorReporter')
vi.mock('src/libs/auth/auth', () => ({
  Auth: {
    signOut: vi.fn().mockResolvedValue(undefined),
  },
}))
vi.mock('src/libs/utils', async (importOriginal) => {
  const actual = await importOriginal<typeof import('src/libs/utils')>()
  return {
    ...actual,
    Navigation: { ...actual.Navigation, console: vi.fn() },
    Notifications: { showError: vi.fn(), showSuccess: vi.fn() },
    setUserRoleStatuses: vi.fn((user) => {
      Storage.setCurrentUser(user)
      return user
    }),
  }
})

const tosAcceptedStatus: UserStatusInfo = {
  adminEnabled: false,
  enabled: true,
  userSubjectId: '1234',
  userEmail: 'test@user.com',
  tosAccepted: true,
}

const duosUser = {
  displayName: 'display name',
  email: 'test@user.com',
  emailPreference: true,
  isAdmin: true,
  isAlumni: false,
  isChairPerson: false,
  isDataSubmitter: false,
  isMember: false,
  isResearcher: false,
  isSigningOfficial: false,
  roles: [{ name: 'Admin' }],
  userId: 1,
} as unknown as DuosUser

const navigate = vi.fn()
const queryClient = { clear: vi.fn() } as unknown as QueryClient

const run = (redirectPath = '/') => completeSignIn({ navigate, queryClient, redirectPath })

describe('completeSignIn', () => {
  beforeEach(() => {
    Storage.clearStorage()
    vi.mocked(Metrics.identify).mockResolvedValue(undefined as never)
    vi.mocked(Metrics.syncProfile).mockResolvedValue(undefined as never)
    vi.mocked(Metrics.captureEvent).mockResolvedValue(undefined as never)
    vi.mocked(ErrorReporter.report).mockResolvedValue(undefined)
    vi.mocked(Navigation.console).mockResolvedValue(undefined)
  })

  afterEach(() => {
    vi.clearAllMocks()
    Storage.clearStorage()
  })

  describe('existing user', () => {
    it('persists the user, clears the query cache, and routes ToS-accepted users to their console', async () => {
      const tosAcceptedUser = { ...duosUser, userStatusInfo: tosAcceptedStatus }
      vi.mocked(User.getMe).mockResolvedValue(tosAcceptedUser as never)

      await run('/')

      expect(Storage.getCurrentUser()).toEqual(tosAcceptedUser)
      expect(Storage.getAnonymousId()).not.toBeNull()
      expect(queryClient.clear).toHaveBeenCalled()
      expect(vi.mocked(Metrics.identify)).toHaveBeenCalled()
      expect(vi.mocked(Metrics.syncProfile)).toHaveBeenCalled()
      expect(vi.mocked(Metrics.captureEvent)).toHaveBeenCalledWith('user:signin')
      expect(vi.mocked(ErrorReporter.report)).not.toHaveBeenCalled()
      expect(vi.mocked(Navigation.console)).toHaveBeenCalledWith(tosAcceptedUser, navigate)
      expect(navigate).not.toHaveBeenCalled()
    })

    it('leaves a ToS-accepted user in place when the callback landed on a destination page', async () => {
      const tosAcceptedUser = { ...duosUser, userStatusInfo: tosAcceptedStatus }
      vi.mocked(User.getMe).mockResolvedValue(tosAcceptedUser as never)

      await run('/datalibrary')

      // The /auth/callback redirect already put the browser on /datalibrary.
      expect(vi.mocked(Navigation.console)).not.toHaveBeenCalled()
      expect(navigate).not.toHaveBeenCalled()
    })

    it('routes a user who has not accepted the ToS to /tos_acceptance', async () => {
      vi.mocked(User.getMe).mockResolvedValue(duosUser as never)

      await run('/')

      expect(navigate).toHaveBeenCalledWith('/tos_acceptance')
      expect(vi.mocked(Navigation.console)).not.toHaveBeenCalled()
    })

    it('carries the destination through the ToS gate as redirectTo', async () => {
      vi.mocked(User.getMe).mockResolvedValue(duosUser as never)

      await run('/datalibrary')

      expect(navigate).toHaveBeenCalledWith('/tos_acceptance?redirectTo=/datalibrary')
    })

    it('reports missing roles to the error reporter', async () => {
      const bareUser = { email: 'test@user.com', userStatusInfo: tosAcceptedStatus }
      vi.mocked(User.getMe).mockResolvedValue(bareUser as never)

      await run('/')

      expect(vi.mocked(ErrorReporter.report)).toHaveBeenCalledWith('roles not found for user: test@user.com')
    })
  })

  describe('registration fallback', () => {
    it('registers a new user when getMe returns no user', async () => {
      vi.mocked(User.getMe).mockResolvedValue(undefined as never)
      vi.mocked(User.registerUser).mockResolvedValue(duosUser)

      await run('/')

      expect(vi.mocked(User.registerUser)).toHaveBeenCalled()
      expect(navigate).toHaveBeenCalledWith('/tos_acceptance')
    })

    it('registers a new user when getMe fails and routes to /tos_acceptance', async () => {
      vi.mocked(User.getMe).mockRejectedValue(new Error('not found'))
      vi.mocked(User.registerUser).mockResolvedValue(duosUser)

      await run('/')

      expect(vi.mocked(User.registerUser)).toHaveBeenCalled()
      expect(queryClient.clear).toHaveBeenCalled()
      expect(vi.mocked(Metrics.captureEvent)).toHaveBeenCalledWith('user:register')
      expect(navigate).toHaveBeenCalledWith('/tos_acceptance')
    })

    it('preserves the destination when registering with a redirect path', async () => {
      vi.mocked(User.getMe).mockRejectedValue(new Error('not found'))
      vi.mocked(User.registerUser).mockResolvedValue(duosUser)

      await run('/datalibrary')

      expect(navigate).toHaveBeenCalledWith('/tos_acceptance?redirectTo=/datalibrary')
    })

    it('treats a 409 from registration as an already-registered sign-in', async () => {
      vi.mocked(User.getMe).mockRejectedValue(new Error('not found'))
      vi.mocked(User.registerUser).mockRejectedValue({ status: 409 })
      // The 409 path routes off the locally stored user's ToS status.
      Storage.setCurrentUser({ ...duosUser, userStatusInfo: tosAcceptedStatus })

      await run('/')

      expect(vi.mocked(Navigation.console)).toHaveBeenCalledWith(expect.objectContaining({ userId: 1 }), navigate)
      expect(vi.mocked(Notifications.showError)).not.toHaveBeenCalled()
    })

    it('sends a 409 user who has not accepted the ToS to /tos_acceptance', async () => {
      vi.mocked(User.getMe).mockRejectedValue(new Error('not found'))
      vi.mocked(User.registerUser).mockRejectedValue({ response: { status: 409 } })

      await run('/')

      expect(navigate).toHaveBeenCalledWith('/tos_acceptance')
    })

    it('shows a registration error for any other failure', async () => {
      vi.mocked(User.getMe).mockRejectedValue(new Error('not found'))
      vi.mocked(User.registerUser).mockRejectedValue({ status: 500, message: 'boom' })

      await run('/')

      expect(vi.mocked(Notifications.showError)).toHaveBeenCalledWith(expect.objectContaining({
        description: 'There was an error completing your registration. Please try again.',
      }))
      expect(navigate).not.toHaveBeenCalled()
    })
  })

  describe('AzureB2C errors from Sam', () => {
    it('shows the error and signs the user out', async () => {
      vi.mocked(User.getMe).mockRejectedValue(new Error('AzureB2C authentication error: bad tenant'))

      await run('/')

      expect(vi.mocked(Notifications.showError)).toHaveBeenCalledWith({ text: 'AzureB2C authentication error: bad tenant' })
      expect(vi.mocked(Auth.signOut)).toHaveBeenCalled()
      expect(vi.mocked(User.registerUser)).not.toHaveBeenCalled()
    })
  })
})
