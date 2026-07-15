import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ResearcherViewConfirmDialog from 'src/pages/signing_official_console/DAAAssignment/ResearcherViewConfirmDialog'
import { ConfirmDialogState } from 'src/pages/signing_official_console/DAAAssignment/types'

describe('ResearcherViewConfirmDialog', () => {
  const mount = (dialog: ConfirmDialogState | null, onConfirm = vi.fn(), onCancel = vi.fn()) =>
    render(
      <ResearcherViewConfirmDialog
        dialog={dialog}
        onConfirm={onConfirm}
        onCancel={onCancel}
      />,
    )

  const dialog = () => document.body.querySelector('[data-cy="confirm-dialog"]')
  const dialogConfirm = () => document.body.querySelector('[data-cy="confirm-dialog-confirm"]')
  const dialogCancel = () => document.body.querySelector('[data-cy="confirm-dialog-cancel"]')

  it('does not render when dialog is null', () => {
    mount(null)
    expect(dialog()).not.toBeInTheDocument()
  })

  it('renders authorize dialog content', () => {
    mount({
      daaId: 1,
      researcherId: 101,
      researcherName: 'Test User Delta',
      daaLabel: 'Default DUOS DAA',
      action: 'authorize',
    })
    expect(dialog()).toBeInTheDocument()
    expect(dialog()).toHaveTextContent('Authorize Test User Delta?')
    expect(dialog()).toHaveTextContent('Default DUOS DAA')
    expect(dialogConfirm()).toHaveTextContent('Authorize')
  })

  it('renders revoke dialog content', () => {
    mount({
      daaId: 2,
      researcherId: 102,
      researcherName: 'Test User Epsilon',
      daaLabel: 'GTEx Agreement',
      action: 'revoke',
    })
    expect(dialog()).toHaveTextContent('Revoke access for Test User Epsilon?')
    expect(dialogConfirm()).toHaveTextContent('Revoke Access')
  })

  it('calls cancel and confirm handlers', async () => {
    const user = userEvent.setup()
    const onConfirm = vi.fn()
    const onCancel = vi.fn()

    mount({
      daaId: 3,
      researcherId: 103,
      researcherName: 'Test User Zeta',
      daaLabel: 'eMERGE DAA',
      action: 'authorize',
    }, onConfirm, onCancel)

    await user.click(dialogCancel() as HTMLElement)
    expect(onCancel).toHaveBeenCalledOnce()

    await user.click(dialogConfirm() as HTMLElement)
    expect(onConfirm).toHaveBeenCalledOnce()
  })
})
