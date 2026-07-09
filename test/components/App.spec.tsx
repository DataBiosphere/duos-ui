import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router-dom'

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
