import React from 'react'
import '@testing-library/jest-dom/vitest'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act, render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import TermsOfServiceAcceptance from 'src/pages/TermsOfServiceAcceptance'

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
    acceptTos: vi.fn().mockResolvedValue({}),
    getBackgroundStyle: vi.fn().mockReturnValue({}),
    getContainerStyle: vi.fn().mockReturnValue({}),
    getScrollableStyle: vi.fn().mockReturnValue({}),
  },
}))

vi.mock('src/libs/auth/auth', () => ({
  Auth: {
    signOut: vi.fn().mockResolvedValue({ status: 'confirmed' }),
  },
  reportUnconfirmedSignOut: vi.fn(),
}))

const renderComponent = async () => {
  await act(async () => {
    render(
      <MemoryRouter>
        <TermsOfServiceAcceptance />
      </MemoryRouter>,
    )
  })
}

describe('Terms of Service Acceptance Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the reject and accept buttons', async () => {
    await renderComponent()
    expect(screen.getByText('Reject Terms of Service')).toBeInTheDocument()
    expect(screen.getByText('Accept Terms of Service')).toBeInTheDocument()
  })

  it('loads and displays TOS text on mount', async () => {
    await renderComponent()
    expect(screen.getByTestId('tos-content')).toBeInTheDocument()
  })

  it('clicking the reject button hands the navigation to Auth.signOut', async () => {
    const { Auth } = await import('src/libs/auth/auth')
    await renderComponent()
    await act(async () => {
      fireEvent.click(screen.getByText('Reject Terms of Service'))
    })
    await waitFor(() => expect(Auth.signOut).toHaveBeenCalledWith('/'))
    expect(mockNavigate).not.toHaveBeenCalled()
  })

  it('reports an unconfirmed sign-out instead of claiming success', async () => {
    const { Auth, reportUnconfirmedSignOut } = await import('src/libs/auth/auth')
    vi.mocked(Auth.signOut).mockResolvedValue({ status: 'unconfirmed' })
    await renderComponent()
    fireEvent.click(screen.getByText('Reject Terms of Service'))

    await waitFor(() => expect(reportUnconfirmedSignOut).toHaveBeenCalledOnce())
    expect(mockNavigate).not.toHaveBeenCalled()
  })

  it('clicking the accept button calls acceptTos and navigates', async () => {
    const { TosService } = await import('src/libs/TosService')
    await renderComponent()
    await act(async () => {
      fireEvent.click(screen.getByText('Accept Terms of Service'))
    })
    await waitFor(() => expect(TosService.acceptTos).toHaveBeenCalledOnce())
    expect(mockNavigate).toHaveBeenCalledWith('/datalibrary')
  })

  describe('the redirectTo destination', () => {
    afterEach(() => {
      globalThis.history.replaceState({}, '', '/')
    })

    const acceptWithRedirect = async (target: string) => {
      globalThis.history.replaceState({}, '', `/tos_acceptance?redirectTo=${encodeURIComponent(target)}`)
      await renderComponent()
      await act(async () => {
        fireEvent.click(screen.getByText('Accept Terms of Service'))
      })
      await waitFor(() => expect(mockNavigate).toHaveBeenCalledOnce())
      return mockNavigate.mock.calls[0][0]
    }

    it('goes to an internal destination with its query string', async () => {
      expect(await acceptWithRedirect('/datalibrary?query=heart')).toBe('/datalibrary?query=heart')
    })

    it('goes to / for an external destination', async () => {
      expect(await acceptWithRedirect('//evil.example/path')).toBe('/')
    })
  })
})
