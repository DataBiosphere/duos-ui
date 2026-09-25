import React from 'react'
import '@testing-library/jest-dom/vitest'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import BackgroundSignIn from 'src/pages/BackgroundSignIn'
import { User } from 'src/libs/ajax/User'
import { isBffEnabled } from 'src/libs/config'
import { Storage } from 'src/libs/storage'
import { Navigation } from 'src/libs/utils'

vi.mock('src/libs/config', async importActual => ({
  ...await importActual<typeof import('src/libs/config')>(),
  isBffEnabled: vi.fn(),
}))

const mockNavigate = vi.fn()

vi.mock('react-router', async (importActual) => {
  const actual = await importActual<typeof import('react-router')>()
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

vi.mock('src/libs/ajax/User', () => ({
  User: {
    getMe: vi.fn(),
  },
}))

vi.mock('src/libs/storage', () => ({
  Storage: {
    setOidcUser: vi.fn(),
    clearStorage: vi.fn(),
    setCurrentUser: vi.fn(),
  },
}))

vi.mock('src/libs/utils', async (importActual) => {
  const actual = await importActual<typeof import('src/libs/utils')>()
  return {
    ...actual,
    Navigation: { console: vi.fn() },
    setUserRoleStatuses: vi.fn(user => user),
  }
})

vi.mock('src/libs/auth/oidcBroker', () => ({}))

vi.mock('src/components/SpinnerComponent', () => ({
  SpinnerComponent: ({ loadingImage }: { loadingImage: string }) =>
    React.createElement('div', { 'data-testid': 'spinner', 'data-loading-image': loadingImage }),
}))

vi.mock('src/images/loading-indicator.svg', () => ({ default: 'loading.svg' }))

const mockUser = {
  userId: 1,
  displayName: 'Test User',
  email: 'test@example.com',
  roles: [],
  isChairPerson: false,
  isMember: false,
  isAdmin: false,
  isResearcher: false,
  isAlumni: false,
  isSigningOfficial: false,
  isDataSubmitter: false,
}

/** Match fetchAdapter's error shape. */
const adapterError = (status: number) =>
  Object.assign(new Error(`Request failed with status ${status}`), { response: { status, data: {} } })

const renderComponent = (props = {}, route = '/backgroundsignin') =>
  render(
    <MemoryRouter initialEntries={[route]}>
      <BackgroundSignIn {...props} />
    </MemoryRouter>,
  )

describe('BackgroundSignIn', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(isBffEnabled).mockResolvedValue(true)
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ status: 204 }))
  })

  afterEach(() => vi.unstubAllGlobals())

  it('renders the access token form when no token is present', () => {
    renderComponent()
    expect(screen.getByRole('textbox')).toBeInTheDocument()
  })

  it('renders the submit button in the form', () => {
    renderComponent()
    expect(screen.getByDisplayValue('Submit')).toBeInTheDocument()
  })

  it('renders the Access Token label', () => {
    renderComponent()
    expect(screen.getByText('Access Token')).toBeInTheDocument()
  })

  it('shows the spinner when a bearerToken is provided', () => {
    vi.mocked(User.getMe).mockReturnValue(new Promise(() => {}))
    renderComponent({ bearerToken: 'my-token' })
    expect(screen.getByTestId('spinner')).toBeInTheDocument()
  })

  it('creates a BFF session before fetching the user without storing the token', async () => {
    vi.mocked(User.getMe).mockResolvedValue(mockUser as never)
    await act(async () => renderComponent({ bearerToken: 'abc123' }))
    expect(Storage.setOidcUser).not.toHaveBeenCalled()
    expect(fetch).toHaveBeenCalledWith('/auth/test-signin', expect.objectContaining({ method: 'POST', credentials: 'same-origin' }))
    expect(User.getMe).toHaveBeenCalledTimes(1)
  })

  it('preserves legacy token storage and navigation with BFF disabled', async () => {
    vi.mocked(isBffEnabled).mockResolvedValue(false)
    vi.mocked(User.getMe).mockResolvedValue(mockUser as never)
    const before = Math.floor(Date.now() / 1000)
    const onSignIn = vi.fn()
    await act(async () => renderComponent({ bearerToken: 'legacy-token', onSignIn }))
    expect(fetch).not.toHaveBeenCalled()
    expect(Storage.setOidcUser).toHaveBeenCalledWith({
      id_token: 'legacy-token', profile: { exp: expect.any(Number) },
    })
    const stored = vi.mocked(Storage.setOidcUser).mock.calls[0][0]
    expect(stored.profile.exp).toBeGreaterThanOrEqual(before + 3600)
    expect(stored.profile.exp).toBeLessThanOrEqual(Math.floor(Date.now() / 1000) + 3600)
    expect(User.getMe).toHaveBeenCalledOnce()
    expect(Navigation.console).toHaveBeenCalledWith(expect.objectContaining({ userId: 1 }), mockNavigate)
    expect(onSignIn).toHaveBeenCalledOnce()
  })

  it('explains rate limiting without labeling the token invalid', async () => {
    vi.mocked(fetch).mockResolvedValue({ status: 429 } as Response)
    await act(async () => renderComponent({ bearerToken: 'throttled-token' }))
    expect(screen.getByText('Too many sign-in attempts. Please wait a minute and try again.')).toBeInTheDocument()
    expect(screen.queryByText('The provided token is invalid.')).not.toBeInTheDocument()
    expect(User.getMe).not.toHaveBeenCalled()
    expect(Storage.setOidcUser).not.toHaveBeenCalled()
  })

  it('calls Navigation.console and onSignIn on successful login', async () => {
    vi.mocked(User.getMe).mockResolvedValue(mockUser as never)
    const onSignIn = vi.fn()
    await act(async () => renderComponent({ bearerToken: 'good-token', onSignIn }))
    expect(Navigation.console).toHaveBeenCalledWith(expect.objectContaining({ userId: 1 }), mockNavigate)
    expect(onSignIn).toHaveBeenCalledTimes(1)
  })

  it('shows the invalid token message on 401 error', async () => {
    vi.mocked(User.getMe).mockRejectedValue(adapterError(401))
    await act(async () => renderComponent({ bearerToken: 'bad-token' }))
    expect(screen.getByText('The provided token is invalid.')).toBeInTheDocument()
  })

  it('reports a server failure without labeling the token invalid', async () => {
    vi.mocked(User.getMe).mockRejectedValue(adapterError(500))
    await act(async () => renderComponent({ bearerToken: 'server-error-token' }))
    expect(screen.getByText('Sign-in failed (HTTP 500). The server or one of its upstream services is unavailable.')).toBeInTheDocument()
    expect(screen.queryByText('The provided token is invalid.')).not.toBeInTheDocument()
  })

  it('reports a network failure without a status', async () => {
    vi.mocked(fetch).mockRejectedValue(new TypeError('Failed to fetch'))
    await act(async () => renderComponent({ bearerToken: 'network-error-token' }))
    expect(screen.getByText('Sign-in failed. The server or one of its upstream services is unavailable.')).toBeInTheDocument()
  })

  it('calls onError and hides spinner on 400 error', async () => {
    vi.mocked(User.getMe).mockRejectedValue(adapterError(400))
    const onError = vi.fn()
    await act(async () => renderComponent({ bearerToken: 'bad-token', onError }))
    expect(onError).toHaveBeenCalledWith(adapterError(400))
    expect(screen.queryByTestId('spinner')).not.toBeInTheDocument()
    expect(screen.getByRole('textbox')).toBeInTheDocument()
  })

  it('on 409 error re-fetches user and redirects', async () => {
    vi.mocked(User.getMe)
      .mockRejectedValueOnce(adapterError(409))
      .mockResolvedValue(mockUser as never)
    await act(async () => renderComponent({ bearerToken: 'conflict-token' }))
    expect(User.getMe).toHaveBeenCalledTimes(2)
    expect(Navigation.console).toHaveBeenCalledTimes(1)
  })

  it('clears storage on 409 when second getMe fails', async () => {
    vi.mocked(User.getMe)
      .mockRejectedValueOnce(adapterError(409))
      .mockRejectedValue(new Error('network error'))
    await act(async () => renderComponent({ bearerToken: 'conflict-token' }))
    expect(Storage.clearStorage).toHaveBeenCalledTimes(1)
  })

  it('triggers login when form is submitted with a typed token', async () => {
    vi.mocked(User.getMe).mockResolvedValue(mockUser as never)
    await act(async () => renderComponent())
    await act(async () => {
      fireEvent.change(screen.getByRole('textbox'), { target: { value: 'typed-token' } })
    })
    await act(async () => {
      fireEvent.submit(screen.getByRole('form'))
    })
    expect(Storage.setOidcUser).not.toHaveBeenCalled()
    expect(fetch).toHaveBeenCalledWith('/auth/test-signin', expect.objectContaining({ method: 'POST', credentials: 'same-origin' }))
    expect(User.getMe).toHaveBeenCalledTimes(1)
  })

  it('picks up a token from the URL query parameter', async () => {
    vi.mocked(User.getMe).mockResolvedValue(mockUser as never)
    await act(async () => renderComponent({}, '/backgroundsignin?token=url-token'))
    expect(Storage.setOidcUser).not.toHaveBeenCalled()
  })

  // The SPA fallback returns 200 for an absent route.
  it.each([200, 404])('names the missing fixture configuration when the route is not registered (HTTP %s)', async (status) => {
    vi.mocked(fetch).mockResolvedValue({ status } as Response)
    await act(async () => renderComponent({ bearerToken: 'unregistered-route-token' }))
    expect(screen.getByText(/Background sign-in is not enabled on this server/)).toBeInTheDocument()
    expect(screen.queryByText(/upstream services is unavailable/)).not.toBeInTheDocument()
    expect(User.getMe).not.toHaveBeenCalled()
  })

  it('tells an unregistered account apart from a disabled fixture', async () => {
    vi.mocked(User.getMe).mockRejectedValue(adapterError(404))
    await act(async () => renderComponent({ bearerToken: 'unregistered-account-token' }))
    expect(screen.getByText('The account behind this token is not registered in DUOS.')).toBeInTheDocument()
    expect(screen.queryByText(/Background sign-in is not enabled/)).not.toBeInTheDocument()
    expect(Navigation.console).not.toHaveBeenCalled()
  })

  it('does not fetch a user or navigate when fixture sign-in is rejected', async () => {
    vi.mocked(fetch).mockResolvedValue({ status: 401 } as Response)
    await act(async () => renderComponent({ bearerToken: 'rejected-token' }))
    expect(User.getMe).not.toHaveBeenCalled()
    expect(Navigation.console).not.toHaveBeenCalled()
    expect(screen.getByText('The provided token is invalid.')).toBeInTheDocument()
  })
})
