import React from 'react'
import '@testing-library/jest-dom/vitest'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { act, render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import TermsOfService from 'src/pages/TermsOfService'
import { useUserIsLogged } from 'src/hooks/useSession'

const mockNavigate = vi.fn()

vi.mock('react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router')>()
  return { ...actual, useNavigate: () => mockNavigate }
})

vi.mock('src/libs/TosService', () => ({
  TosService: {
    getFormattedText: vi.fn().mockResolvedValue(
      React.createElement('span', { 'data-testid': 'tos-content' }, 'TOS Text'),
    ),
    rejectTos: vi.fn().mockResolvedValue({}),
    getBackgroundStyle: vi.fn().mockReturnValue({}),
    getContainerStyle: vi.fn().mockReturnValue({}),
    getScrollableStyle: vi.fn().mockReturnValue({}),
  },
}))

vi.mock('src/libs/auth/auth', () => ({
  Auth: {
    signOut: vi.fn().mockResolvedValue(undefined),
  },
}))

vi.mock('src/hooks/useSession', () => ({
  useUserIsLogged: vi.fn(),
}))

const renderComponent = async () => {
  await act(async () => {
    render(
      <MemoryRouter>
        <TermsOfService />
      </MemoryRouter>,
    )
  })
}

describe('Terms of Service Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useUserIsLogged).mockReturnValue(false)
  })

  it('renders the page heading', async () => {
    await renderComponent()
    expect(screen.getByRole('heading', { level: 1, name: 'DUOS Terms of Service' })).toBeInTheDocument()
  })

  it('loads and displays TOS text on mount', async () => {
    await renderComponent()
    expect(screen.getByTestId('tos-content')).toBeInTheDocument()
    expect(screen.getByText('TOS Text')).toBeInTheDocument()
  })

  it('does not show the reject button when user is not logged in', async () => {
    await renderComponent()
    expect(screen.queryByText('Reject Terms of Service')).not.toBeInTheDocument()
  })

  it('does not show the reject button while the session probe is in flight', async () => {
    vi.mocked(useUserIsLogged).mockReturnValue(undefined)
    await renderComponent()
    expect(screen.queryByText('Reject Terms of Service')).not.toBeInTheDocument()
  })

  it('shows the reject button when user is logged in', async () => {
    vi.mocked(useUserIsLogged).mockReturnValue(true)
    await renderComponent()
    expect(screen.getByText('Reject Terms of Service')).toBeInTheDocument()
  })

  it('clicking reject calls rejectTos, signOut, and navigates to /', async () => {
    const { TosService } = await import('src/libs/TosService')
    const { Auth } = await import('src/libs/auth/auth')
    vi.mocked(useUserIsLogged).mockReturnValue(true)
    await renderComponent()
    await act(async () => {
      fireEvent.click(screen.getByText('Reject Terms of Service'))
    })
    await waitFor(() => expect(TosService.rejectTos).toHaveBeenCalledOnce())
    expect(Auth.signOut).toHaveBeenCalledOnce()
    // The navigation covers the legacy flow, where Auth.signOut does not
    // redirect; in BFF mode the full-page reload supersedes it.
    expect(mockNavigate).toHaveBeenCalledWith('/')
  })
})
