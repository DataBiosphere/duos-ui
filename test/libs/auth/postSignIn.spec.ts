import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { QueryClient } from '@tanstack/react-query'
import { completeSignIn } from 'src/libs/auth/postSignIn'
import { User } from 'src/libs/ajax/User'
import { Metrics } from 'src/libs/ajax/Metrics'
import { Storage } from 'src/libs/storage'
import { Auth, reportUnconfirmedSignOut } from 'src/libs/auth/auth'
import { resetSessionCache } from 'src/libs/auth/session'
import { Navigation, Notifications } from 'src/libs/utils'
import { ErrorReporter } from 'src/libs/ErrorReporter'
import { DuosUser, UserStatusInfo } from 'src/types/model'

vi.mock('src/libs/ajax/User')
vi.mock('src/libs/ajax/Metrics')
vi.mock('src/libs/ErrorReporter')
vi.mock('src/libs/auth/session', () => ({ resetSessionCache: vi.fn() }))
vi.mock('src/libs/auth/auth', () => ({
  Auth: {
    // Story 5-E: signOut resolves a discriminated result and never rejects.
    signOut: vi.fn().mockResolvedValue({ status: 'confirmed' }),
  },
  reportUnconfirmedSignOut: vi.fn(),
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

const run = (redirectPath = '/', options: { sessionReportsNoProfile?: boolean } = {}) =>
  completeSignIn({ navigate, queryClient, redirectPath, ...options })

// The exact shape fetchAdapter throws for an HTTP error: the axios-like
// { response: { status } } error is re-wrapped by the adapter's outer catch,
// so the status lives on Error.cause, not on the thrown error itself.
const adapterHttpError = (status: number, message = `Request failed with status ${status}`): Error => {
  const inner = new Error(message) as Error & { response: { status: number, data: object } }
  inner.response = { status, data: { message } }
  return new Error(`${message} Please contact the help desk.`, { cause: inner })
}

describe('completeSignIn', () => {
  beforeEach(() => {
    Storage.clearStorage()
    vi.mocked(Metrics.identify).mockResolvedValue(undefined as never)
    vi.mocked(Metrics.syncProfile).mockResolvedValue(undefined as never)
    vi.mocked(Metrics.captureEvent).mockResolvedValue(undefined as never)
    vi.mocked(ErrorReporter.report).mockResolvedValue(undefined)
    vi.mocked(Navigation.console).mockResolvedValue(undefined)
    // clearAllMocks keeps implementations, so restate the default outcome —
    // one case below overrides it with 'unconfirmed'.
    vi.mocked(Auth.signOut).mockResolvedValue({ status: 'confirmed' })
  })

  afterEach(() => {
    vi.clearAllMocks()
    Storage.clearStorage()
  })

  describe('existing user', () => {
    beforeEach(() => {
      globalThis.history.replaceState({}, '', '/')
    })

    it('persists the user, clears the query cache, and routes ToS-accepted users to their console', async () => {
      const tosAcceptedUser = { ...duosUser, userStatusInfo: tosAcceptedStatus }
      vi.mocked(User.getMe).mockResolvedValue(tosAcceptedUser as never)

      await expect(run('/')).resolves.toBe('completed')

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

    it('leaves a ToS-accepted user in place when the callback landed on the destination page', async () => {
      const tosAcceptedUser = { ...duosUser, userStatusInfo: tosAcceptedStatus }
      vi.mocked(User.getMe).mockResolvedValue(tosAcceptedUser as never)
      // The BFF /auth/callback redirect already put the browser on /datalibrary.
      globalThis.history.replaceState({}, '', '/datalibrary')

      await run('/datalibrary')

      expect(vi.mocked(Navigation.console)).not.toHaveBeenCalled()
      expect(navigate).not.toHaveBeenCalled()
    })

    it('navigates a ToS-accepted user to the destination when not already there (legacy reload)', async () => {
      const tosAcceptedUser = { ...duosUser, userStatusInfo: tosAcceptedStatus }
      vi.mocked(User.getMe).mockResolvedValue(tosAcceptedUser as never)

      // The legacy popup flow reloads on the landing page ('/'), with the
      // destination carried in ?redirectTo= — the bootstrap must finish the trip.
      await run('/datalibrary')

      expect(navigate).toHaveBeenCalledWith('/datalibrary')
      expect(vi.mocked(Navigation.console)).not.toHaveBeenCalled()
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

      expect(navigate).toHaveBeenCalledWith('/tos_acceptance?redirectTo=%2Fdatalibrary')
    })

    it('encodes a destination that carries its own query string', async () => {
      // Unencoded, '/datalibrary?filter=a&b=c' splits at the '&' and the tail
      // becomes sibling params of the ToS page — accepting the ToS then drops
      // the user on the wrong page. URLSearchParams on the reading side decodes.
      vi.mocked(User.getMe).mockResolvedValue(duosUser as never)

      await run('/datalibrary?filter=a&b=c')

      const url = vi.mocked(navigate).mock.calls[0][0] as string
      expect(new URLSearchParams(url.split('?')[1]).get('redirectTo')).toBe('/datalibrary?filter=a&b=c')
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

      await expect(run('/')).resolves.toBe('completed')

      expect(vi.mocked(User.registerUser)).toHaveBeenCalled()
      expect(queryClient.clear).toHaveBeenCalled()
      // The cached /auth/me answer predates the registration — it must be
      // dropped or the app deadlocks on a stale authenticated-no-user session.
      expect(vi.mocked(resetSessionCache)).toHaveBeenCalled()
      expect(vi.mocked(Metrics.captureEvent)).toHaveBeenCalledWith('user:register')
      expect(navigate).toHaveBeenCalledWith('/tos_acceptance')
    })

    it('preserves the destination when registering with a redirect path', async () => {
      vi.mocked(User.getMe).mockRejectedValue(new Error('not found'))
      vi.mocked(User.registerUser).mockResolvedValue(duosUser)

      await run('/datalibrary')

      expect(navigate).toHaveBeenCalledWith('/tos_acceptance?redirectTo=%2Fdatalibrary')
    })

    it('treats a 409 from registration as an already-registered sign-in, re-fetching the user', async () => {
      const tosAcceptedUser = { ...duosUser, userStatusInfo: tosAcceptedStatus }
      // getMe fails first (that's how we reached registration), the register
      // 409 proves the user exists, and the re-fetch succeeds.
      vi.mocked(User.getMe)
        .mockRejectedValueOnce(new Error('not found'))
        .mockResolvedValueOnce(tosAcceptedUser as never)
      vi.mocked(User.registerUser).mockRejectedValue(adapterHttpError(409))

      await run('/')

      // The full sign-in completion runs off the fresh fetch, not stale storage.
      expect(Storage.getCurrentUser()).toEqual(tosAcceptedUser)
      expect(queryClient.clear).toHaveBeenCalled()
      expect(vi.mocked(resetSessionCache)).toHaveBeenCalled()
      expect(vi.mocked(Metrics.captureEvent)).toHaveBeenCalledWith('user:signin')
      expect(vi.mocked(Navigation.console)).toHaveBeenCalledWith(tosAcceptedUser, navigate)
      expect(vi.mocked(Notifications.showError)).not.toHaveBeenCalled()
    })

    it('sends a 409 user who has not accepted the ToS to /tos_acceptance', async () => {
      vi.mocked(User.getMe)
        .mockRejectedValueOnce(new Error('not found'))
        .mockResolvedValueOnce(duosUser as never)
      vi.mocked(User.registerUser).mockRejectedValue(adapterHttpError(409))

      await run('/')

      expect(navigate).toHaveBeenCalledWith('/tos_acceptance')
    })

    it('signs out when the post-409 user fetch fails too', async () => {
      vi.mocked(User.getMe).mockRejectedValue(new Error('still failing'))
      vi.mocked(User.registerUser).mockRejectedValue(adapterHttpError(409))

      await expect(run('/')).resolves.toBe('signed-out')

      expect(vi.mocked(Auth.signOut)).toHaveBeenCalled()
      expect(vi.mocked(Navigation.console)).not.toHaveBeenCalled()
    })

    it('shows a registration error and signs out for any other failure', async () => {
      vi.mocked(User.getMe).mockRejectedValue(new Error('not found'))
      vi.mocked(User.registerUser).mockRejectedValue(adapterHttpError(500, 'boom'))

      await expect(run('/')).resolves.toBe('signed-out')

      expect(vi.mocked(Notifications.showError)).toHaveBeenCalledWith(expect.objectContaining({
        description: 'There was an error completing your registration. Please try again.',
      }))
      // Resolving with an empty CurrentUser would unlock the authenticated
      // routes — destroy the session instead so the user lands signed out.
      expect(vi.mocked(Auth.signOut)).toHaveBeenCalled()
      expect(navigate).not.toHaveBeenCalled()
    })

    it('reports sign-out-unconfirmed (not signed-out) when the bootstrap sign-out cannot be confirmed', async () => {
      // Story 5-E: an unconfirmed sign-out left the session authenticated and
      // performed no cleanup, so the reconciler must NOT be told the run signed
      // out — and a non-UI path like this one must own the Retry notice itself.
      vi.mocked(User.getMe).mockRejectedValue(new Error('not found'))
      vi.mocked(User.registerUser).mockRejectedValue(adapterHttpError(500, 'boom'))
      vi.mocked(Auth.signOut).mockResolvedValue({ status: 'unconfirmed' })

      await expect(run('/')).resolves.toBe('sign-out-unconfirmed')

      expect(vi.mocked(reportUnconfirmedSignOut)).toHaveBeenCalled()
      expect(navigate).not.toHaveBeenCalled()
    })
  })

  describe('unregistered session probe (BFF)', () => {
    // The regression Kevin traced: /auth/me reports the upstream 401 on
    // /api/user/me as "authenticated, no profile", but repeating getMe through
    // /duos-api hits the same 401 — which the proxy treats as an authoritative
    // token rejection and destroys the session, so the registerUser that
    // follows arrives unauthenticated. The probe's answer must route straight
    // to registration with the session intact.
    it('registers without calling getMe when the probe already reported no profile', async () => {
      // What the doomed getMe would produce: the proxy destroys the session
      // and answers 401 session_expired. If completeSignIn regresses into
      // calling it, registration fails and this test routes to sign-out.
      vi.mocked(User.getMe).mockRejectedValue(adapterHttpError(401, 'session_expired'))
      vi.mocked(User.registerUser).mockResolvedValue(duosUser)

      await expect(run('/', { sessionReportsNoProfile: true })).resolves.toBe('completed')

      expect(vi.mocked(User.getMe)).not.toHaveBeenCalled()
      expect(vi.mocked(User.registerUser)).toHaveBeenCalled()
      expect(vi.mocked(Auth.signOut)).not.toHaveBeenCalled()
      expect(vi.mocked(Metrics.captureEvent)).toHaveBeenCalledWith('user:register')
      expect(navigate).toHaveBeenCalledWith('/tos_acceptance')
    })

    it('recovers through the 409 branch when the no-profile answer was stale', async () => {
      // The user registered in another tab after the probe answered: the
      // register 409 proves it, and the re-fetch (now safe — a registered
      // user's getMe succeeds) completes the sign-in.
      const tosAcceptedUser = { ...duosUser, userStatusInfo: tosAcceptedStatus }
      vi.mocked(User.getMe).mockResolvedValue(tosAcceptedUser as never)
      vi.mocked(User.registerUser).mockRejectedValue(adapterHttpError(409))

      await expect(run('/', { sessionReportsNoProfile: true })).resolves.toBe('completed')

      expect(vi.mocked(User.getMe)).toHaveBeenCalledOnce()
      expect(Storage.getCurrentUser()).toEqual(tosAcceptedUser)
      expect(vi.mocked(Metrics.captureEvent)).toHaveBeenCalledWith('user:signin')
      expect(vi.mocked(Notifications.showError)).not.toHaveBeenCalled()
    })
  })

  describe('cancellation (superseded runs)', () => {
    it('performs no side effects once cancelled mid-flight', async () => {
      let resolveGetMe!: (user: unknown) => void
      vi.mocked(User.getMe).mockReturnValue(new Promise((resolve) => {
        resolveGetMe = resolve
      }) as never)
      let cancelledFlag = false

      const run = completeSignIn({ navigate, queryClient, redirectPath: '/', isCancelled: () => cancelledFlag })
      // A newer reconciliation supersedes this run while its getMe is in flight.
      cancelledFlag = true
      resolveGetMe({ ...duosUser, userStatusInfo: tosAcceptedStatus })
      await expect(run).resolves.toBe('cancelled')

      // The obsolete run must not persist, clear caches, emit metrics, or route.
      expect(Storage.getCurrentUser().userId).toBe(0)
      expect(queryClient.clear).not.toHaveBeenCalled()
      expect(vi.mocked(Metrics.captureEvent)).not.toHaveBeenCalled()
      expect(vi.mocked(Navigation.console)).not.toHaveBeenCalled()
      expect(navigate).not.toHaveBeenCalled()
    })

    it('resamples the joined profile after the missing-roles report and routes off the fresher state', async () => {
      // The roles-missing report is the one await between the profile sample
      // and routing: a fresher same-user profile joining during it must reach
      // metrics/ToS routing, or an accepted user gets routed to the ToS gate
      // — a navigation the reconciler's post-completion apply cannot repair.
      const rolelessUser = { userId: 1, email: 'test@user.com' }
      const acceptedUser = { ...duosUser, userStatusInfo: tosAcceptedStatus }
      vi.mocked(User.getMe).mockResolvedValue(rolelessUser as never)
      let joined: DuosUser | undefined
      vi.mocked(ErrorReporter.report).mockImplementation(async () => {
        joined = acceptedUser
      })

      await expect(completeSignIn({
        navigate,
        queryClient,
        redirectPath: '/',
        latestJoinedProfile: () => joined,
      })).resolves.toBe('completed')

      // Routed as the accepted user, not the pre-report roleless one.
      expect(Storage.getCurrentUser()).toEqual(acceptedUser)
      expect(vi.mocked(Navigation.console)).toHaveBeenCalledWith(acceptedUser, navigate)
      expect(navigate).not.toHaveBeenCalledWith('/tos_acceptance')
    })

    it('stops before metrics and routing when superseded during the missing-roles report', async () => {
      // ErrorReporter.report awaits env lookup + delivery — long enough to be
      // superseded mid-call. The run must not resume with metrics/navigation.
      let cancelledFlag = false
      const rolelessUser = { email: 'test@user.com', userStatusInfo: tosAcceptedStatus }
      vi.mocked(User.getMe).mockResolvedValue(rolelessUser as never)
      vi.mocked(ErrorReporter.report).mockImplementation(async () => {
        cancelledFlag = true
      })

      await completeSignIn({ navigate, queryClient, redirectPath: '/', isCancelled: () => cancelledFlag })

      expect(vi.mocked(ErrorReporter.report)).toHaveBeenCalled()
      expect(vi.mocked(Metrics.captureEvent)).not.toHaveBeenCalled()
      expect(vi.mocked(Navigation.console)).not.toHaveBeenCalled()
      expect(navigate).not.toHaveBeenCalled()
    })

    it('does not sign out or toast when a cancelled run fails', async () => {
      vi.mocked(User.getMe).mockRejectedValue(new Error('not found'))

      await expect(
        completeSignIn({ navigate, queryClient, redirectPath: '/', isCancelled: () => true }),
      ).resolves.toBe('cancelled')

      // The newer run owns the session — a superseded failure must not
      // destroy it or surface stale errors.
      expect(vi.mocked(Auth.signOut)).not.toHaveBeenCalled()
      expect(vi.mocked(Notifications.showError)).not.toHaveBeenCalled()
      expect(vi.mocked(User.registerUser)).not.toHaveBeenCalled()
    })
  })

  describe('Sam sub-provider conflicts', () => {
    it('shows the 409 conflict message and signs the user out instead of attempting registration', async () => {
      // Consent DT-4011 answers the conflict with a 409 and an actionable
      // message — registration cannot succeed, so it must not be attempted.
      const message = 'Email: test@user.com. You may have previously signed in with a different authentication provider (Google or Microsoft). Please sign in with that provider.'
      vi.mocked(User.getMe).mockRejectedValue(adapterHttpError(409, message))

      await expect(run('/')).resolves.toBe('signed-out')

      expect(vi.mocked(Notifications.showError)).toHaveBeenCalledWith(
        expect.objectContaining({ text: expect.stringContaining('different authentication provider') }),
      )
      expect(vi.mocked(Auth.signOut)).toHaveBeenCalled()
      expect(vi.mocked(User.registerUser)).not.toHaveBeenCalled()
    })

    it('still recognizes the legacy 500 "AzureB2C authentication error" message', async () => {
      // Older consent builds answer the conflict with a 500 and this message.
      vi.mocked(User.getMe).mockRejectedValue(new Error('AzureB2C authentication error: bad tenant'))

      await expect(run('/')).resolves.toBe('signed-out')

      expect(vi.mocked(Notifications.showError)).toHaveBeenCalledWith(
        expect.objectContaining({ text: 'AzureB2C authentication error: bad tenant' }),
      )
      expect(vi.mocked(Auth.signOut)).toHaveBeenCalled()
      expect(vi.mocked(User.registerUser)).not.toHaveBeenCalled()
    })
  })
})
