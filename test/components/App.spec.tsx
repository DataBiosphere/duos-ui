import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router'

vi.mock('src/libs/config', () => ({
  Config: {
    getEnv: vi.fn().mockResolvedValue('ci'),
    getApiUrl: vi.fn().mockResolvedValue('http://localhost'),
    getTerraUrl: vi.fn().mockResolvedValue('http://terra.localhost'),
  },
}))

vi.mock('src/libs/ajax/AuthenticateNIH', () => ({
  AuthenticateNIH: {
    getECMProviderLinkInfo: vi.fn(),
    getSyncedUser: vi.fn(),
  },
}))

vi.mock('src/libs/ajax/ServiceStatus', () => ({
  ServiceStatus: {
    getConsentStatus: vi.fn().mockResolvedValue({ ok: true, degraded: false, systems: {} }),
    isConsentHealthy: vi.fn().mockResolvedValue(true),
    isSamHealthy: vi.fn().mockResolvedValue(true),
  },
}))

vi.mock('src/libs/notificationService', () => ({
  NotificationService: {
    getActiveBanners: vi.fn().mockResolvedValue([]),
  },
}))

// Both vi.fn()s default to undefined: the probe reads as in-flight, so every
// pre-existing test runs signed out exactly as before these mocks existed.
vi.mock('src/hooks/useSession', () => ({
  useSessionInfo: vi.fn(),
  useUserIsLogged: vi.fn(),
}))

vi.mock('src/libs/auth/postSignIn', () => ({
  completeSignIn: vi.fn(),
}))

// BaseModal calls Modal.setAppElement('#root') at module load time; prevent
// the error by no-op-ing it before the import chain resolves.
vi.mock('react-modal', async (importOriginal) => {
  const mod = await importOriginal<{ default: { setAppElement: (el: unknown) => void } }>()
  mod.default.setAppElement = () => {}
  return mod
})

import App from 'src/App'
import { AuthenticateNIH } from 'src/libs/ajax/AuthenticateNIH'
import { Storage } from 'src/libs/storage'
import { useSessionInfo } from 'src/hooks/useSession'
import { completeSignIn } from 'src/libs/auth/postSignIn'

const duosUser = {
  userId: 2,
  displayName: 'Admin',
  institution: { id: 150, name: 'The Broad Institute of MIT and Harvard' },
  roles: [{ userId: 2, roleId: 4, name: 'Admin' }],
}

const linkInfo = {
  externalUserId: 'externalUserId',
  expirationTimestamp: '2023-10-01T00:00:00Z',
  authenticated: true,
  additionalState: { redirectTo: 'http://localhost:3000/profile' },
}

const code = 'code'
const state = 'state'
const initialLocation = { pathname: '/', search: `?code=${code}&state=${state}` }

describe('Main App Functions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(Storage, 'setCurrentUser').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
    localStorage.clear()
    Array.from(document.body.children)
      .filter(el => el.querySelector('[data-cy="notification-alert"]') || el.querySelector('.MuiSnackbar-root'))
      .forEach(el => el.remove())
  })

  it('should render main layout components on the home page', async () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>,
    )
    expect(document.querySelector('.body')).toBeInTheDocument()
    expect(document.querySelector('.wrap')).toBeInTheDocument()
    expect(document.querySelector('.main')).toBeInTheDocument()
    await waitFor(() => expect(screen.getByText('Data Use Oversight System')).toBeInTheDocument())
  })

  it('should display an error when ECM fails', async () => {
    vi.mocked(AuthenticateNIH.getECMProviderLinkInfo).mockRejectedValue(new Error('Authentication failed'))
    render(
      <MemoryRouter initialEntries={[initialLocation]}>
        <App />
      </MemoryRouter>,
    )
    await waitFor(() => expect(vi.mocked(AuthenticateNIH.getECMProviderLinkInfo)).toHaveBeenCalledWith(code, state))
    await waitFor(() => expect(document.querySelector('[data-cy="notification-alert"]')).toBeVisible())
  })

  it('should display an error when account syncing fails', async () => {
    vi.mocked(AuthenticateNIH.getECMProviderLinkInfo).mockResolvedValue(linkInfo as never)
    vi.mocked(AuthenticateNIH.getSyncedUser).mockRejectedValue(new Error('Authentication failed'))
    render(
      <MemoryRouter initialEntries={[initialLocation]}>
        <App />
      </MemoryRouter>,
    )
    await waitFor(() => expect(document.querySelector('[data-cy="notification-alert"]')).toBeVisible())
  })

  it('should process RAS query params (code, state) and navigate to the profile page when the parameter specifies it', async () => {
    vi.mocked(AuthenticateNIH.getECMProviderLinkInfo).mockResolvedValue(linkInfo as never)
    vi.mocked(AuthenticateNIH.getSyncedUser).mockResolvedValue(duosUser as never)
    const pageVisitStub = vi.fn()

    const LocationSpy = ({ onLocationChange }: { onLocationChange: (pathname: string) => void }) => {
      const location = useLocation()
      React.useEffect(() => {
        onLocationChange(location.pathname)
      }, [location, onLocationChange])
      return null
    }

    render(
      <MemoryRouter initialEntries={[initialLocation]}>
        <LocationSpy onLocationChange={pageVisitStub} />
        <App />
      </MemoryRouter>,
    )

    await waitFor(() => expect(vi.mocked(AuthenticateNIH.getECMProviderLinkInfo)).toHaveBeenCalledWith(code, state))
    await waitFor(() => expect(vi.mocked(AuthenticateNIH.getSyncedUser)).toHaveBeenCalledOnce())
    expect(pageVisitStub).toHaveBeenCalledWith('/')
  })
})

describe('post-sign-in bootstrap', () => {
  const renderApp = () =>
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>,
    )

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(completeSignIn).mockResolvedValue(undefined)
  })

  afterEach(() => {
    vi.restoreAllMocks()
    localStorage.clear()
  })

  it('starts the bootstrap for an authenticated session with no DUOS profile yet (new-user registration path)', async () => {
    // /auth/me reports a valid session but no user — the shape an
    // unregistered user produces right after the B2C callback. CurrentUser
    // holds the empty default (userId 0).
    vi.mocked(useSessionInfo).mockReturnValue({ authenticated: true })

    renderApp()

    await waitFor(() => expect(vi.mocked(completeSignIn)).toHaveBeenCalledOnce())
  })

  it('re-bootstraps when the session identity differs from the stored profile', async () => {
    // Another tab switched accounts (or the user re-signed-in after expiry):
    // the session says userId 2, storage still holds userId 7.
    vi.spyOn(Storage, 'getCurrentUser').mockReturnValue({ ...duosUser, userId: 7 } as never)
    vi.mocked(useSessionInfo).mockReturnValue({ authenticated: true, user: duosUser as never })

    renderApp()

    await waitFor(() => expect(vi.mocked(completeSignIn)).toHaveBeenCalledOnce())
  })

  it('does not bootstrap when the stored profile already matches the session identity', async () => {
    vi.spyOn(Storage, 'getCurrentUser').mockReturnValue(duosUser as never)
    vi.mocked(useSessionInfo).mockReturnValue({ authenticated: true, user: duosUser as never })

    renderApp()

    await waitFor(() => expect(document.querySelector('.main')).toBeInTheDocument())
    expect(vi.mocked(completeSignIn)).not.toHaveBeenCalled()
  })

  it('does not bootstrap while signed out', async () => {
    vi.mocked(useSessionInfo).mockReturnValue({ authenticated: false })

    renderApp()

    await waitFor(() => expect(document.querySelector('.main')).toBeInTheDocument())
    expect(vi.mocked(completeSignIn)).not.toHaveBeenCalled()
  })
})
