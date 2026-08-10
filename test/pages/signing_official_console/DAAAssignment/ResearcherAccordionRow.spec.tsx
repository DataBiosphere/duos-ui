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
})
