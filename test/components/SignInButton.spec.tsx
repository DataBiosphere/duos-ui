import '@testing-library/jest-dom/vitest'
import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SignInButton from 'src/components/SignInButton'
import { Auth } from 'src/libs/auth/auth'
import { ServiceStatus } from 'src/libs/ajax/ServiceStatus'

/**
 * With the BFF, SignInButton is just the front door: clicking it calls
 * Auth.signIn(returnTo?), which POSTs /auth/login and full-page-redirects to
 * B2C. Everything that used to happen in the popup onSuccess handler (user
 * fetch, registration, ToS routing) now lives in src/libs/auth/postSignIn.ts
 * and is covered by test/libs/auth/postSignIn.spec.ts.
 */

const signInError = 'Unexpected error, please contact customer support.'

vi.mock('src/libs/auth/auth', () => ({
  Auth: {
    signIn: vi.fn(),
    signInError: vi.fn(() => signInError),
  },
}))
vi.mock('src/libs/ajax/ServiceStatus')

const signInText = 'Sign In'

const mountComponent = () => render(<SignInButton />)

describe('SignInButton', () => {
  beforeEach(() => {
    globalThis.history.replaceState({}, '', '/')
    vi.mocked(ServiceStatus.isConsentHealthy).mockResolvedValue(true)
    vi.mocked(ServiceStatus.isSamHealthy).mockResolvedValue(true)
    // Auth.signIn normally never resolves in the browser (the page navigates
    // away); resolving keeps the default happy-path tests simple.
    vi.mocked(Auth.signIn).mockResolvedValue(undefined)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('renders an enabled Sign In button', async () => {
    mountComponent()
    await waitFor(() => expect(screen.getByText(signInText)).toBeInTheDocument())
    const button = screen.getByRole('button')
    expect(button).not.toBeDisabled()
    // Button uses inline styles — white color and border are directly testable in jsdom
    expect(button).toHaveStyle({ color: 'rgb(255, 255, 255)' })
    expect(button).toHaveStyle({ border: '2px solid rgb(255, 255, 255)' })
  })

  it('starts the BFF login flow without a returnTo from the landing page', async () => {
    mountComponent()
    await waitFor(() => expect(screen.getByRole('button')).not.toBeDisabled())

    await userEvent.click(screen.getByRole('button'))

    await waitFor(() => expect(vi.mocked(Auth.signIn)).toHaveBeenCalledWith(undefined))
  })

  it('does not send /home as a returnTo either', async () => {
    globalThis.history.replaceState({}, '', '/home')
    mountComponent()
    await waitFor(() => expect(screen.getByRole('button')).not.toBeDisabled())

    await userEvent.click(screen.getByRole('button'))

    await waitFor(() => expect(vi.mocked(Auth.signIn)).toHaveBeenCalledWith(undefined))
  })

  it('passes the current pathname as returnTo from any other page', async () => {
    globalThis.history.replaceState({}, '', '/datalibrary')
    mountComponent()
    await waitFor(() => expect(screen.getByRole('button')).not.toBeDisabled())

    await userEvent.click(screen.getByRole('button'))

    await waitFor(() => expect(vi.mocked(Auth.signIn)).toHaveBeenCalledWith('/datalibrary'))
  })

  it('prefers a redirectTo query parameter over the current pathname', async () => {
    globalThis.history.replaceState({}, '', '/?redirectTo=/datalibrary')
    mountComponent()
    await waitFor(() => expect(screen.getByRole('button')).not.toBeDisabled())

    await userEvent.click(screen.getByRole('button'))

    await waitFor(() => expect(vi.mocked(Auth.signIn)).toHaveBeenCalledWith('/datalibrary'))
  })

  it('shows an error alert when the login request fails', async () => {
    vi.mocked(Auth.signIn).mockRejectedValue(new Error(signInError))
    mountComponent()
    await waitFor(() => expect(screen.getByRole('button')).not.toBeDisabled())

    await userEvent.click(screen.getByRole('button'))

    await waitFor(() => expect(screen.getByText(signInError)).toBeInTheDocument())
    expect(screen.getByText('Error')).toBeInTheDocument()
    expect(screen.queryByText(signInText)).not.toBeInTheDocument()
  })

  it('is disabled when SAM is unhealthy', async () => {
    vi.mocked(ServiceStatus.isSamHealthy).mockResolvedValue(false)
    mountComponent()
    await waitFor(() => expect(screen.getByRole('button')).toBeDisabled())
  })

  it('is disabled when Consent is unhealthy', async () => {
    vi.mocked(ServiceStatus.isConsentHealthy).mockResolvedValue(false)
    mountComponent()
    await waitFor(() => expect(screen.getByRole('button')).toBeDisabled())
  })
})
