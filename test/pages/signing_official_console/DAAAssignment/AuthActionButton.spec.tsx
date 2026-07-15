import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { render, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AuthActionButton from 'src/pages/signing_official_console/DAAAssignment/AuthActionButton'
import { AuthStatus } from 'src/pages/signing_official_console/DAAAssignment/types'

describe('AuthActionButton', () => {
  let authorizeSpy: () => void
  let revokeSpy: () => void

  const mountButton = (status: AuthStatus, disabled = false) =>
    render(
      <AuthActionButton
        status={status}
        onAuthorize={authorizeSpy}
        onRevoke={revokeSpy}
        disabled={disabled}
      />,
    )

  beforeEach(() => {
    authorizeSpy = vi.fn()
    revokeSpy = vi.fn()
  })

  const renderCases = [
    { status: 'not_requested' as const, selector: 'auth-action-authorize', text: 'Pre-Authorize' },
    { status: 'authorized' as const, selector: 'auth-action-revoke', text: 'Revoke' },
    { status: 'revoked' as const, selector: 'auth-action-reauthorize', text: 'Re-authorize' },
  ]

  renderCases.forEach(({ status, selector, text }) => {
    it(`renders expected action for ${status} status`, () => {
      const { container } = mountButton(status)
      const el = container.querySelector(`[data-cy="${selector}"]`)
      expect(el).toBeInTheDocument()
      expect(el).toHaveTextContent(text)
    })
  })

  it('calls onAuthorize when Authorize is clicked', async () => {
    const user = userEvent.setup()
    const { container } = mountButton('not_requested')
    await user.click(container.querySelector('[data-cy="auth-action-authorize"]') as HTMLElement)
    expect(authorizeSpy).toHaveBeenCalledOnce()
    expect(revokeSpy).not.toHaveBeenCalled()
  })

  it('calls onRevoke when Revoke is clicked', async () => {
    const user = userEvent.setup()
    const { container } = mountButton('authorized')
    await user.click(container.querySelector('[data-cy="auth-action-revoke"]') as HTMLElement)
    expect(revokeSpy).toHaveBeenCalledOnce()
    expect(authorizeSpy).not.toHaveBeenCalled()
  })

  it('disables the button when disabled prop is true', () => {
    const { container } = mountButton('not_requested', true)
    expect(container.querySelector('[data-cy="auth-action-authorize"]')).toBeDisabled()
  })

  it('does not call handler when disabled button is clicked', () => {
    const { container } = mountButton('not_requested', true)
    fireEvent.click(container.querySelector('[data-cy="auth-action-authorize"]') as HTMLElement)
    expect(authorizeSpy).not.toHaveBeenCalled()
  })
})
