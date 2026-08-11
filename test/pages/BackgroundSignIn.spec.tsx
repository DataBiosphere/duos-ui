import React from 'react'
import '@testing-library/jest-dom/vitest'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import BackgroundSignIn from 'src/pages/BackgroundSignIn'
import { User } from 'src/libs/ajax/User'
import { Storage } from 'src/libs/storage'
import { Navigation } from 'src/libs/utils'

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

const renderComponent = (props = {}, route = '/backgroundsignin') =>
  render(
    <MemoryRouter initialEntries={[route]}>
      <BackgroundSignIn {...props} />
    </MemoryRouter>,
  )

describe('BackgroundSignIn', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

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

  // The browser no longer stores tokens — a pasted token only triggers the
  // getMe probe; the BFF injects the session's token server-side.
  it('calls User.getMe when bearerToken is provided', async () => {
    vi.mocked(User.getMe).mockResolvedValue(mockUser as never)
    await act(async () => renderComponent({ bearerToken: 'abc123' }))
    expect(User.getMe).toHaveBeenCalledTimes(1)
  })

  it('calls Navigation.console and onSignIn on successful login', async () => {
    vi.mocked(User.getMe).mockResolvedValue(mockUser as never)
    const onSignIn = vi.fn()
    await act(async () => renderComponent({ bearerToken: 'good-token', onSignIn }))
    expect(Navigation.console).toHaveBeenCalledWith(expect.objectContaining({ userId: 1 }), mockNavigate)
    expect(onSignIn).toHaveBeenCalledTimes(1)
  })

  it('shows the invalid token message on 401 error', async () => {
    vi.mocked(User.getMe).mockRejectedValue({ status: 401 })
    await act(async () => renderComponent({ bearerToken: 'bad-token' }))
    expect(screen.getByText('The provided token is invalid.')).toBeInTheDocument()
  })

  it('shows the invalid token message on unknown error status', async () => {
    vi.mocked(User.getMe).mockRejectedValue({ status: 500 })
    await act(async () => renderComponent({ bearerToken: 'bad-token' }))
    expect(screen.getByText('The provided token is invalid.')).toBeInTheDocument()
  })

  it('calls onError and hides spinner on 400 error', async () => {
    vi.mocked(User.getMe).mockRejectedValue({ status: 400 })
    const onError = vi.fn()
    await act(async () => renderComponent({ bearerToken: 'bad-token', onError }))
    expect(onError).toHaveBeenCalledWith({ status: 400 })
    expect(screen.queryByTestId('spinner')).not.toBeInTheDocument()
    expect(screen.getByRole('textbox')).toBeInTheDocument()
  })

  it('on 409 error re-fetches user and redirects', async () => {
    vi.mocked(User.getMe)
      .mockRejectedValueOnce({ status: 409 })
      .mockResolvedValue(mockUser as never)
    await act(async () => renderComponent({ bearerToken: 'conflict-token' }))
    expect(User.getMe).toHaveBeenCalledTimes(2)
    expect(Navigation.console).toHaveBeenCalledTimes(1)
  })

  it('clears storage on 409 when second getMe fails', async () => {
    vi.mocked(User.getMe)
      .mockRejectedValueOnce({ status: 409 })
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
    expect(User.getMe).toHaveBeenCalledTimes(1)
  })

  it('picks up a token from the URL query parameter', async () => {
    vi.mocked(User.getMe).mockResolvedValue(mockUser as never)
    await act(async () => renderComponent({}, '/backgroundsignin?token=url-token'))
    expect(User.getMe).toHaveBeenCalledTimes(1)
  })
})
