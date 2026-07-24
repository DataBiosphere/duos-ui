import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import BulkActionButtons from 'src/pages/signing_official_console/DAAAssignment/BulkActionButtons'

describe('BulkActionButtons', () => {
  let approveSpy: () => void
  let removeSpy: () => void

  beforeEach(() => {
    approveSpy = vi.fn()
    removeSpy = vi.fn()
  })

  const mount = (overrides: Partial<React.ComponentProps<typeof BulkActionButtons>> = {}) =>
    render(
      <BulkActionButtons
        dataCyPrefix="researcher-7"
        approveAllDisabled={false}
        removeAllDisabled={false}
        onApproveAll={approveSpy}
        onRemoveAll={removeSpy}
        {...overrides}
      />,
    )

  it('renders both bulk buttons with prefixed data-cy hooks', () => {
    const { container } = mount()
    expect(container.querySelector('[data-cy="bulk-approve-all-researcher-7"]')).toHaveTextContent('Approve All')
    expect(container.querySelector('[data-cy="bulk-remove-all-researcher-7"]')).toHaveTextContent('Remove All')
  })

  it('calls onApproveAll when Approve All is clicked', async () => {
    const user = userEvent.setup()
    const { container } = mount()
    await user.click(container.querySelector('[data-cy="bulk-approve-all-researcher-7"]') as HTMLElement)
    expect(approveSpy).toHaveBeenCalledOnce()
  })

  it('calls onRemoveAll when Remove All is clicked', async () => {
    const user = userEvent.setup()
    const { container } = mount()
    await user.click(container.querySelector('[data-cy="bulk-remove-all-researcher-7"]') as HTMLElement)
    expect(removeSpy).toHaveBeenCalledOnce()
  })

  it('stops click propagation so an enclosing toggle does not fire', async () => {
    const user = userEvent.setup()
    const parentClick = vi.fn()
    const { container } = render(
      <div onClick={parentClick}>
        <BulkActionButtons
          dataCyPrefix="researcher-7"
          approveAllDisabled={false}
          removeAllDisabled={false}
          onApproveAll={approveSpy}
          onRemoveAll={removeSpy}
        />
      </div>,
    )
    await user.click(container.querySelector('[data-cy="bulk-approve-all-researcher-7"]') as HTMLElement)
    expect(approveSpy).toHaveBeenCalledOnce()
    expect(parentClick).not.toHaveBeenCalled()
  })

  it('renders a disabled Approve All that does not fire when clicked', async () => {
    // pointerEventsCheck off: MUI disabled buttons set pointer-events:none, which
    // otherwise makes userEvent throw before we can assert the click is a no-op.
    const user = userEvent.setup({ pointerEventsCheck: 0 })
    const { container } = mount({ approveAllDisabled: true })
    const btn = container.querySelector('[data-cy="bulk-approve-all-researcher-7"]') as HTMLElement
    expect(btn).toBeDisabled()
    await user.click(btn)
    expect(approveSpy).not.toHaveBeenCalled()
  })

  it('renders a disabled Remove All that does not fire when clicked', async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 })
    const { container } = mount({ removeAllDisabled: true })
    const btn = container.querySelector('[data-cy="bulk-remove-all-researcher-7"]') as HTMLElement
    expect(btn).toBeDisabled()
    await user.click(btn)
    expect(removeSpy).not.toHaveBeenCalled()
  })
})
