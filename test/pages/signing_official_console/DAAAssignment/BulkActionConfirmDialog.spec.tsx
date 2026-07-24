import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import BulkActionConfirmDialog from 'src/pages/signing_official_console/DAAAssignment/BulkActionConfirmDialog'
import { BulkConfirmState } from 'src/pages/signing_official_console/DAAAssignment/types'

describe('BulkActionConfirmDialog', () => {
  let confirmSpy: () => void
  let cancelSpy: () => void

  beforeEach(() => {
    confirmSpy = vi.fn()
    cancelSpy = vi.fn()
  })

  const mount = (dialog: BulkConfirmState | null) =>
    render(
      <BulkActionConfirmDialog
        dialog={dialog}
        onConfirm={confirmSpy}
        onCancel={cancelSpy}
      />,
    )

  it('renders nothing when dialog is null', () => {
    mount(null)
    expect(document.body.querySelector('[data-cy="bulk-confirm-dialog"]')).not.toBeInTheDocument()
  })

  it('shows the approve title/count for a researcher card (DAA noun)', () => {
    mount({ scope: 'researcher', mode: 'approve', targetId: 1, targetLabel: 'Jane Doe', count: 7, ids: [1, 2, 3, 4, 5, 6, 7] })
    const dialog = document.body.querySelector('[data-cy="bulk-confirm-dialog"]')
    expect(dialog).toHaveTextContent('Approve pre-authorization for all 7 remaining DAAs for Jane Doe?')
    expect(document.body.querySelector('[data-cy="bulk-confirm-dialog-confirm"]')).toHaveTextContent('Approve All')
  })

  it('shows the remove title/count for a DAA card (researcher noun)', () => {
    mount({ scope: 'daa', mode: 'remove', targetId: 5, targetLabel: 'DAA-x', count: 12, ids: Array.from({ length: 12 }, (_, i) => i + 1) })
    const dialog = document.body.querySelector('[data-cy="bulk-confirm-dialog"]')
    expect(dialog).toHaveTextContent('Remove pre-authorization for all 12 researchers under DAA-x?')
    expect(document.body.querySelector('[data-cy="bulk-confirm-dialog-confirm"]')).toHaveTextContent('Remove All')
  })

  it('uses the singular noun when count is 1', () => {
    mount({ scope: 'researcher', mode: 'approve', targetId: 1, targetLabel: 'Jane Doe', count: 1, ids: [3] })
    expect(document.body.querySelector('[data-cy="bulk-confirm-dialog"]')).toHaveTextContent('all 1 remaining DAA for Jane Doe?')
  })

  it('calls onConfirm when the confirm button is clicked', async () => {
    const user = userEvent.setup()
    mount({ scope: 'researcher', mode: 'approve', targetId: 1, targetLabel: 'Jane Doe', count: 2, ids: [1, 2] })
    await user.click(document.body.querySelector('[data-cy="bulk-confirm-dialog-confirm"]') as HTMLElement)
    expect(confirmSpy).toHaveBeenCalledOnce()
  })

  it('calls onCancel when the cancel button is clicked', async () => {
    const user = userEvent.setup()
    mount({ scope: 'daa', mode: 'remove', targetId: 5, targetLabel: 'DAA-x', count: 2, ids: [1, 2] })
    await user.click(document.body.querySelector('[data-cy="bulk-confirm-dialog-cancel"]') as HTMLElement)
    expect(cancelSpy).toHaveBeenCalledOnce()
  })
})
