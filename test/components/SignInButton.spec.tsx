import '@testing-library/jest-dom/vitest'
import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, useLocation } from 'react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import SignInButton from 'src/components/SignInButton'
import { Auth } from 'src/libs/auth/auth'
import { User } from 'src/libs/ajax/User'
import { Metrics } from 'src/libs/ajax/Metrics'
import { ErrorReporter } from 'src/libs/ErrorReporter'
import { ServiceStatus } from 'src/libs/ajax/ServiceStatus'
import { Storage } from 'src/libs/storage'
import { Navigation } from 'src/libs/utils'
import { DuosUser, UserStatusInfo } from 'src/types/model'
import { OidcUser } from 'src/libs/auth/oidcBroker'

const mockOidcUser: OidcUser = {
  access_token: '',
  session_state: null,
  state: undefined,
  token_type: '',
  get expires_in() { return undefined },
  get expired() { return undefined },
  get scopes() { return [] },
  toStorageString() { return '' },
  profile: { jti: undefined, nbf: undefined, sub: '', iss: '', aud: '', exp: 0, iat: 0 },
}

vi.mock('src/libs/auth/auth')
vi.mock('src/libs/ajax/User')
vi.mock('src/libs/ajax/Metrics')
vi.mock('src/libs/ErrorReporter')
vi.mock('src/libs/ajax/ServiceStatus')
vi.mock('src/libs/utils', async (importOriginal) => {
  const actual = await importOriginal<typeof import('src/libs/utils')>()
  return { ...actual, Navigation: { ...actual.Navigation, console: vi.fn() } }
})

const signInText = 'Sign In'

const duosUser = {
  displayName: 'display name',
  email: 'test@user.com',
  emailPreference: true,
  eraCommonsId: 'eraCommonsId',
  institutionId: 1,
  isAdmin: true,
  isAlumni: false,
  isChairPerson: false,
  isDataSubmitter: false,
  isMember: false,
  isResearcher: false,
  isSigningOfficial: false,
  isServiceAccount: false,
  roles: [{ name: 'Admin' }],
} as unknown as DuosUser

const userStatus: UserStatusInfo = {
  adminEnabled: true,
  enabled: true,
  userSubjectId: '1234',
  userEmail: 'test@user.com',
  tosAccepted: true,
}

const consentStatus = {
  ok: true,
  degraded: false,
  systems: {
    sam: { details: { ok: true } },
  },
}

// Helper: renders SignInButton inside a MemoryRouter and exposes the current location
const LocationDisplay = () => {
  const { pathname } = useLocation()
  return <div data-testid="location">{pathname}</div>
}

const mountComponent = () =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <MemoryRouter>
        <SignInButton />
        <LocationDisplay />
      </MemoryRouter>
    </QueryClientProvider>,
  )

describe('Sign In: Component Loads', () => {
  beforeEach(() => {
    vi.mocked(ServiceStatus.getConsentStatus).mockResolvedValue(consentStatus as never)
    vi.mocked(ServiceStatus.isConsentHealthy).mockResolvedValue(true)
    vi.mocked(ServiceStatus.isSamHealthy).mockResolvedValue(true)
  })

  afterEach(() => {
    vi.restoreAllMocks()
    Storage.clearStorage()
  })

  it('Sign In Button Loads', async () => {
    mountComponent()
    await waitFor(() => expect(screen.getByText(signInText)).toBeInTheDocument())
    const button = screen.getByRole('button')
    expect(button).not.toBeDisabled()
    // Button uses inline styles — white color and border are directly testable in jsdom
    expect(button).toHaveStyle({ color: 'rgb(255, 255, 255)' })
    expect(button).toHaveStyle({ border: '2px solid rgb(255, 255, 255)' })
  })

  it('Sign In: On Success', async () => {
    const tosAcceptedUser = { userStatusInfo: userStatus, ...duosUser }
    vi.mocked(Auth.signIn).mockResolvedValue(mockOidcUser)
    vi.mocked(User.getMe).mockResolvedValue(tosAcceptedUser as never)
    vi.mocked(ErrorReporter.report).mockResolvedValue(undefined)
    vi.mocked(Metrics.identify).mockResolvedValue(undefined as never)
    vi.mocked(Metrics.syncProfile).mockResolvedValue(undefined as never)
    vi.mocked(Metrics.captureEvent).mockResolvedValue(undefined as never)
    vi.mocked(Navigation.console).mockResolvedValue(undefined)
    mountComponent()
    await waitFor(() => expect(screen.getByRole('button')).not.toBeDisabled())
    await userEvent.click(screen.getByRole('button'))
    await waitFor(() => expect(vi.mocked(User.getMe)).toHaveBeenCalled())
    expect(Storage.getCurrentUser()).toEqual(tosAcceptedUser)
    expect(Storage.getAnonymousId()).not.toBeNull()
    expect(vi.mocked(ErrorReporter.report)).not.toHaveBeenCalled()
    expect(vi.mocked(Metrics.identify)).toHaveBeenCalled()
    expect(vi.mocked(Metrics.syncProfile)).toHaveBeenCalled()
    expect(vi.mocked(Metrics.captureEvent)).toHaveBeenCalled()
  })

  it('Sign In: No Roles Error Reporter Is Called', async () => {
    const bareUser = { email: 'test@user.com' }
    const tosAcceptedUser = { userStatusInfo: userStatus, ...bareUser }
    vi.mocked(Auth.signIn).mockResolvedValue(mockOidcUser)
    vi.mocked(User.getMe).mockResolvedValue(tosAcceptedUser as never)
    vi.mocked(ErrorReporter.report).mockResolvedValue(undefined)
    vi.mocked(Navigation.console).mockResolvedValue(undefined)
    mountComponent()
    await waitFor(() => expect(screen.getByRole('button')).not.toBeDisabled())
    await userEvent.click(screen.getByRole('button'))
    await waitFor(() => expect(vi.mocked(ErrorReporter.report)).toHaveBeenCalled())
  })

  it('Sign In: Redirects to ToS if not accepted', async () => {
    vi.mocked(Auth.signIn).mockResolvedValue(mockOidcUser)
    vi.mocked(User.getMe).mockResolvedValue(duosUser as never)
    mountComponent()
    await waitFor(() => expect(screen.getByRole('button')).not.toBeDisabled())
    await userEvent.click(screen.getByRole('button'))
    await waitFor(() =>
      expect(screen.getByTestId('location').textContent).toBe('/tos_acceptance'),
    )
  })

  it('Sign In: Registers user if not found and redirects to ToS', async () => {
    vi.mocked(Auth.signIn).mockResolvedValue(mockOidcUser)
    vi.mocked(User.getMe).mockRejectedValue(new Error('not found'))
    vi.mocked(User.registerUser).mockResolvedValue(duosUser)
    mountComponent()
    await waitFor(() => expect(screen.getByRole('button')).not.toBeDisabled())
    await userEvent.click(screen.getByRole('button'))
    await waitFor(() => expect(vi.mocked(User.registerUser)).toHaveBeenCalled())
    await waitFor(() =>
      expect(screen.getByTestId('location').textContent).toBe('/tos_acceptance'),
    )
  })

  it('Sign In: Button is disabled when SAM is unhealthy', async () => {
    vi.mocked(ServiceStatus.isSamHealthy).mockResolvedValue(false)
    mountComponent()
    await waitFor(() => expect(screen.getByRole('button')).toBeDisabled())
  })

  it('Sign In: Button is disabled when Consent is unhealthy', async () => {
    vi.mocked(ServiceStatus.isConsentHealthy).mockResolvedValue(false)
    mountComponent()
    await waitFor(() => expect(screen.getByRole('button')).toBeDisabled())
  })

  it('Sign In: Handles AzureB2C authentication error', async () => {
    vi.mocked(Auth.signIn).mockResolvedValue(mockOidcUser)
    vi.mocked(Auth.signOut).mockResolvedValue(undefined as never)
    vi.mocked(User.getMe).mockRejectedValue(
      new Error('AzureB2C authentication error'),
    )
    mountComponent()
    await waitFor(() => expect(screen.getByRole('button')).not.toBeDisabled())
    await userEvent.click(screen.getByRole('button'))
    await waitFor(() => expect(vi.mocked(Auth.signOut)).toHaveBeenCalled())
    await waitFor(() =>
      expect(screen.getByText('AzureB2C authentication error')).toBeInTheDocument(),
    )
  })
})
