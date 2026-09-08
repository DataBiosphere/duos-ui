import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ResearcherAccordionRow from 'src/pages/signing_official_console/DAAAssignment/ResearcherAccordionRow'
import { DuosUser } from 'src/types/model'
import { DAARowData } from 'src/pages/signing_official_console/DAAAssignment/types'
import { makeDaa, makeResearcher } from './fixtures'

const mockResearcher: DuosUser = makeResearcher({
  userId: 42,
  displayName: 'Test User Gamma',
  email: 'test.user.gamma@test.org',
  daaDetails: [{ daaId: 1 }],
  institutionName: 'Institution Gamma',
})

const mockDaaRows: DAARowData[] = [
  {
    daa: makeDaa({ daaId: 1, fileName: 'Default DUOS DAA' }),
    dacName: 'NHGRI DAC',
    status: 'authorized',
  },
  {
    daa: makeDaa({ daaId: 2, fileName: 'GTEx Agreement' }),
    dacName: 'GTEx DAC',
    status: 'not_requested',
  },
]

describe('ResearcherAccordionRow', () => {
  let authorizeSpy: (daaId: number) => void
  let revokeSpy: (daaId: number) => void
  let toggleSpy: () => void
  let approveAllSpy: (daaIds: number[]) => void
  let removeAllSpy: (daaIds: number[]) => void

  beforeEach(() => {
    authorizeSpy = vi.fn()
    revokeSpy = vi.fn()
    toggleSpy = vi.fn()
    approveAllSpy = vi.fn()
    removeAllSpy = vi.fn()
  })

  const mount = (overrides: Partial<React.ComponentProps<typeof ResearcherAccordionRow>> = {}) =>
    render(
      <ResearcherAccordionRow
        researcher={mockResearcher}
        daaRows={mockDaaRows}
        authorizedCount={1}
        isExpanded={false}
        onToggle={toggleSpy}
        onAuthorize={authorizeSpy}
        onRevoke={revokeSpy}
        onApproveAll={approveAllSpy}
        onRemoveAll={removeAllSpy}
        {...overrides}
      />,
    )

  it('renders the researcher name and email', () => {
    const { container } = mount()
    expect(container.querySelector('[data-cy="researcher-row-42"]')).toHaveTextContent('Test User Gamma')
    expect(container.querySelector('[data-cy="researcher-row-42"]')).toHaveTextContent('test.user.gamma@test.org')
  })

  // ── Institution ───────────────────────────────────────────────────────────

  it('does not show the institution by default', () => {
    const { container } = mount()
    expect(container.querySelector('[data-cy="researcher-institution-42"]')).not.toBeInTheDocument()
    expect(container.querySelector('[data-cy="researcher-row-42"]')).not.toHaveTextContent('Institution Gamma')
  })

  it('shows the institution when asked', () => {
    const { container } = mount({ showInstitution: true })
    expect(container.querySelector('[data-cy="researcher-institution-42"]')).toHaveTextContent('Institution Gamma')
  })

  it('shows a dash when the researcher has no institution', () => {
    const withoutInstitution = makeResearcher({
      userId: 42,
      displayName: 'Test User Gamma',
      email: 'test.user.gamma@test.org',
    })
    const { container } = mount({ researcher: withoutInstitution, showInstitution: true })
    expect(container.querySelector('[data-cy="researcher-institution-42"]')).toHaveTextContent('—')
  })

  it('shows authorized badge when authorizedCount > 0', () => {
    const { container } = mount()
    expect(container.querySelector('[data-cy="researcher-authorized-badge-42"]')).toHaveTextContent('1 pre-authorized')
  })

  it('shows no pre-auth status when authorizedCount is 0', () => {
    const { container } = mount({ authorizedCount: 0 })
    expect(container.querySelector('[data-cy="researcher-no-status-42"]')).toHaveTextContent('No pre-auth status')
  })

  it('calls onToggle when the header is clicked', async () => {
    const user = userEvent.setup()
    const { container } = mount()
    await user.click(container.querySelector('[data-cy="researcher-row-toggle-42"]') as HTMLElement)
    expect(toggleSpy).toHaveBeenCalledOnce()
  })

  // The header is a role="button" Box, so keyboard support is not free — and on
  // the read-only admin page it is the only control on the card.
  it('is reachable by keyboard and toggles on Enter and Space', async () => {
    const user = userEvent.setup()
    const { container } = mount()
    const header = container.querySelector('[data-cy="researcher-row-toggle-42"]') as HTMLElement

    expect(header).toHaveAttribute('tabindex', '0')
    header.focus()
    expect(header).toHaveFocus()

    await user.keyboard('{Enter}')
    expect(toggleSpy).toHaveBeenCalledTimes(1)
    await user.keyboard(' ')
    expect(toggleSpy).toHaveBeenCalledTimes(2)
  })

  it('ignores other keys on the header', async () => {
    const user = userEvent.setup()
    const { container } = mount()
    const header = container.querySelector('[data-cy="researcher-row-toggle-42"]') as HTMLElement
    header.focus()

    await user.keyboard('{Escape}a{ArrowDown}')
    expect(toggleSpy).not.toHaveBeenCalled()
  })

  it('does not render the DAA subtable when collapsed', () => {
    const { container } = mount({ isExpanded: false })
    expect(container.querySelector('[data-cy="daa-subtable"]')).not.toBeInTheDocument()
  })

  it('renders the DAA subtable when expanded', () => {
    const { container } = mount({ isExpanded: true })
    expect(container.querySelector('[data-cy="daa-subtable"]')).toBeInTheDocument()
    expect(container.querySelector('[data-cy="daa-row-1"]')).toBeInTheDocument()
    expect(container.querySelector('[data-cy="daa-row-2"]')).toBeInTheDocument()
  })

  // ── Bulk actions ──────────────────────────────────────────────────────────

  it('calls onApproveAll with only the unauthorized DAA ids, without toggling', async () => {
    const user = userEvent.setup()
    const { container } = mount()
    await user.click(container.querySelector('[data-cy="bulk-approve-all-researcher-42"]') as HTMLElement)
    expect(approveAllSpy).toHaveBeenCalledWith([2])
    expect(toggleSpy).not.toHaveBeenCalled()
  })

  it('calls onRemoveAll with only the authorized DAA ids, without toggling', async () => {
    const user = userEvent.setup()
    const { container } = mount()
    await user.click(container.querySelector('[data-cy="bulk-remove-all-researcher-42"]') as HTMLElement)
    expect(removeAllSpy).toHaveBeenCalledWith([1])
    expect(toggleSpy).not.toHaveBeenCalled()
  })

  // Enter/Space on a bulk button bubbles to the header's keydown handler, which
  // must leave it alone: the button activates itself and the card stays put.
  it('activates a focused bulk button by keyboard, without toggling', async () => {
    const user = userEvent.setup()
    const { container } = mount()
    const approveAll = container.querySelector('[data-cy="bulk-approve-all-researcher-42"]') as HTMLElement

    approveAll.focus()
    await user.keyboard('{Enter}')
    expect(approveAllSpy).toHaveBeenCalledWith([2])
    expect(toggleSpy).not.toHaveBeenCalled()

    const removeAll = container.querySelector('[data-cy="bulk-remove-all-researcher-42"]') as HTMLElement
    removeAll.focus()
    await user.keyboard(' ')
    expect(removeAllSpy).toHaveBeenCalledWith([1])
    expect(toggleSpy).not.toHaveBeenCalled()
  })

  it('disables Approve All when every DAA is already authorized', () => {
    const allAuthorized = mockDaaRows.map(r => ({ ...r, status: 'authorized' as const }))
    const { container } = mount({ daaRows: allAuthorized })
    expect(container.querySelector('[data-cy="bulk-approve-all-researcher-42"]')).toBeDisabled()
    expect(container.querySelector('[data-cy="bulk-remove-all-researcher-42"]')).not.toBeDisabled()
  })

  it('disables Remove All when no DAA is authorized', () => {
    const noneAuthorized = mockDaaRows.map(r => ({ ...r, status: 'not_requested' as const }))
    const { container } = mount({ daaRows: noneAuthorized })
    expect(container.querySelector('[data-cy="bulk-remove-all-researcher-42"]')).toBeDisabled()
    expect(container.querySelector('[data-cy="bulk-approve-all-researcher-42"]')).not.toBeDisabled()
  })

  it('a disabled bulk button does nothing when clicked', async () => {
    // pointerEventsCheck off: MUI disabled buttons set pointer-events:none.
    const user = userEvent.setup({ pointerEventsCheck: 0 })
    const allAuthorized = mockDaaRows.map(r => ({ ...r, status: 'authorized' as const }))
    const { container } = mount({ daaRows: allAuthorized })
    await user.click(container.querySelector('[data-cy="bulk-approve-all-researcher-42"]') as HTMLElement)
    expect(approveAllSpy).not.toHaveBeenCalled()
  })

  // ── Read-only mode ────────────────────────────────────────────────────────

  describe('read-only mode', () => {
    it('renders no bulk action buttons in the header', () => {
      const { container } = mount({ readOnly: true })
      expect(container.querySelector('[data-cy="bulk-approve-all-researcher-42"]')).not.toBeInTheDocument()
      expect(container.querySelector('[data-cy="bulk-remove-all-researcher-42"]')).not.toBeInTheDocument()
    })

    it('still renders the header content and authorized count badge', () => {
      const { container } = mount({ readOnly: true })
      expect(container.querySelector('[data-cy="researcher-row-42"]')).toHaveTextContent('Test User Gamma')
      expect(container.querySelector('[data-cy="researcher-authorized-badge-42"]')).toHaveTextContent('1 pre-authorized')
    })

    it('renders the sub-table without action buttons when expanded', () => {
      const { container } = mount({ readOnly: true, isExpanded: true })
      expect(container.querySelector('[data-cy="daa-subtable"]')).toBeInTheDocument()
      expect(container.querySelector('[data-cy="daa-row-1"]')).toBeInTheDocument()
      expect(container.querySelector('[data-cy="auth-action-revoke"]')).not.toBeInTheDocument()
      expect(container.querySelector('[data-cy="auth-action-authorize"]')).not.toBeInTheDocument()
    })

    it('still toggles when the header is clicked', async () => {
      const user = userEvent.setup()
      const { container } = mount({ readOnly: true })
      await user.click(container.querySelector('[data-cy="researcher-row-toggle-42"]') as HTMLElement)
      expect(toggleSpy).toHaveBeenCalledOnce()
    })
  })
})
