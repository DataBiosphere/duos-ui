import React from 'react'
import '@testing-library/jest-dom/vitest'
import { describe, it, expect, vi, beforeEach } from 'vitest'
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
    signOut: vi.fn().mockResolvedValue(undefined),
  },
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

  it('clicking the reject button calls Auth.signOut', async () => {
    const { Auth } = await import('src/libs/auth/auth')
    await renderComponent()
    await act(async () => {
      fireEvent.click(screen.getByText('Reject Terms of Service'))
    })
    await waitFor(() => expect(Auth.signOut).toHaveBeenCalledOnce())
    // Auth.signOut performs the full-page redirect home itself — no router navigation.
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
})
