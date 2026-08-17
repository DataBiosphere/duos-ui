import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import DAAAccordionRow from 'src/pages/signing_official_console/DAAAssignment/DAAAccordionRow'
import { DAAResearcherRowData } from 'src/pages/signing_official_console/DAAAssignment/types'
import { DAAObject, DuosUser } from 'src/types/model'

const makeResearcher = (userId: number, displayName: string, email: string): DuosUser => ({
  userId,
  displayName,
  email,
  createDate: new Date('2020-01-01'),
  emailPreference: true,
  isAdmin: false,
  isAlumni: false,
  isChairPerson: false,
  isDataSubmitter: false,
  isMember: false,
  isResearcher: true,
  isSigningOfficial: false,
  roles: [],
})

const mockDaa: DAAObject = {
  daaId: 5,
  createUserId: 1,
  createDate: '2024-03-01',
  updateUserId: 1,
  updateDate: '2024-03-01',
  initialDacId: 10,
  file: {
    fileStorageObjectId: 5,
    entityId: 'entity-5',
    fileName: 'Default DUOS DAA',
    category: 'dataAccessAgreement',
    mediaType: 'application/pdf',
    createUserId: 1,
    createDate: 1709251200,
  },
  dacs: [{ dacId: 10, name: 'NHGRI DAC' }],
}

const recentDaa: DAAObject = {
  ...mockDaa,
  daaId: 6,
  updateDate: new Date().toISOString(),
  file: { ...mockDaa.file!, fileStorageObjectId: 6, fileName: 'Updated Agreement' },
}

const mockDaaWithEpochCreateDate: DAAObject = {
  ...mockDaa,
  daaId: 7,
  createDate: 1709251200 as unknown as string,
  file: { ...mockDaa.file!, fileStorageObjectId: 7, fileName: 'Epoch DAA' },
}

const mockRows: DAAResearcherRowData[] = [
  { researcher: makeResearcher(1, 'Test User Lambda', 'test.user.lambda@test.org'), status: 'authorized' },
  { researcher: makeResearcher(2, 'Test User Mu', 'test.user.mu@test.org'), status: 'not_requested' },
]

describe('DAAAccordionRow', () => {
  let authorizeSpy: (researcherId: number) => void
  let revokeSpy: (researcherId: number) => void
  let toggleSpy: () => void
  let approveAllSpy: (researcherIds: number[]) => void
  let removeAllSpy: (researcherIds: number[]) => void

  beforeEach(() => {
    authorizeSpy = vi.fn()
    revokeSpy = vi.fn()
    toggleSpy = vi.fn()
    approveAllSpy = vi.fn()
    removeAllSpy = vi.fn()
  })

  const mount = (overrides: Partial<React.ComponentProps<typeof DAAAccordionRow>> = {}) =>
    render(
      <DAAAccordionRow
        daa={mockDaa}
        dacName="NHGRI DAC"
        researcherRows={mockRows}
        authorizedCount={1}
        isRecentlyUpdated={false}
        isExpanded={false}
        onToggle={toggleSpy}
        onAuthorize={authorizeSpy}
        onRevoke={revokeSpy}
        onApproveAll={approveAllSpy}
        onRemoveAll={removeAllSpy}
        {...overrides}
      />,
    )

  it('renders the DAA name and DAC name', () => {
    const { container } = mount()
    expect(container.querySelector('[data-cy="daa-accordion-row-5"]')).toHaveTextContent('Default DUOS DAA')
    expect(container.querySelector('[data-cy="daa-accordion-row-5"]')).toHaveTextContent('NHGRI DAC')
  })

  it('shows the authorized count badge when authorizedCount > 0', () => {
    const { container } = mount()
    expect(container.querySelector('[data-cy="daa-authorized-badge-5"]')).toHaveTextContent('1 pre-authorized')
  })

  it('formats epoch effective date as yyyy-mm-dd in the header', () => {
    const { container } = mount({ daa: mockDaaWithEpochCreateDate, authorizedCount: 0 })
    const row = container.querySelector('[data-cy="daa-accordion-row-7"]')
    expect(row).toHaveTextContent('Effective 2024-03-01')
    expect(row).not.toHaveTextContent('1709251200')
  })

  it('does not show authorized badge when authorizedCount is 0', () => {
    const { container } = mount({ authorizedCount: 0 })
    expect(container.querySelector('[data-cy="daa-authorized-badge-5"]')).not.toBeInTheDocument()
  })

  it('does not show Recently Updated chip when isRecentlyUpdated is false', () => {
    const { container } = mount()
    expect(container.querySelector('[data-cy="daa-recently-updated-chip-5"]')).not.toBeInTheDocument()
  })

  it('shows the Recently Updated chip when isRecentlyUpdated is true', () => {
    const { container } = mount({ daa: recentDaa, isRecentlyUpdated: true, authorizedCount: 0 })
    expect(container.querySelector('[data-cy="daa-recently-updated-chip-6"]')).toBeInTheDocument()
  })

  it('calls onToggle when the header is clicked', async () => {
    const user = userEvent.setup()
    const { container } = mount()
    await user.click(container.querySelector('[data-cy="daa-accordion-toggle-5"]') as HTMLElement)
    expect(toggleSpy).toHaveBeenCalledOnce()
  })

  // The header is a role="button" Box, so keyboard support is not free — and on
  // the read-only admin page it is the only control on the card.
  it('is reachable by keyboard and toggles on Enter and Space', async () => {
    const user = userEvent.setup()
    const { container } = mount()
    const header = container.querySelector('[data-cy="daa-accordion-toggle-5"]') as HTMLElement

    expect(header).toHaveAttribute('tabindex', '0')
    header.focus()
    expect(header).toHaveFocus()

    await user.keyboard('{Enter}')
    expect(toggleSpy).toHaveBeenCalledTimes(1)
    await user.keyboard(' ')
    expect(toggleSpy).toHaveBeenCalledTimes(2)
  })

  it('does not render the researcher subtable when collapsed', () => {
    const { container } = mount({ isExpanded: false })
    expect(container.querySelector('[data-cy="daa-researcher-subtable"]')).not.toBeInTheDocument()
  })

  it('renders the researcher subtable when expanded', () => {
    const { container } = mount({ isExpanded: true })
    expect(container.querySelector('[data-cy="daa-researcher-subtable"]')).toBeInTheDocument()
    expect(container.querySelector('[data-cy="daa-researcher-row-1"]')).toBeInTheDocument()
    expect(container.querySelector('[data-cy="daa-researcher-row-2"]')).toBeInTheDocument()
  })

  it('shows the recently-updated warning banner inside expanded content', () => {
    const { container } = mount({ daa: recentDaa, isRecentlyUpdated: true, isExpanded: true, authorizedCount: 0 })
    expect(container.querySelector('[data-cy="daa-recently-updated-banner-6"]')).toBeInTheDocument()
  })

  it('does not show the warning banner when not recently updated', () => {
    const { container } = mount({ isExpanded: true })
    expect(container.querySelector('[data-cy="daa-recently-updated-banner-5"]')).not.toBeInTheDocument()
  })

  // ── Bulk actions ──────────────────────────────────────────────────────────

  it('calls onApproveAll with only the unauthorized researcher ids, without toggling', async () => {
    const user = userEvent.setup()
    const { container } = mount()
    await user.click(container.querySelector('[data-cy="bulk-approve-all-daa-5"]') as HTMLElement)
    expect(approveAllSpy).toHaveBeenCalledWith([2])
    expect(toggleSpy).not.toHaveBeenCalled()
  })

  it('calls onRemoveAll with only the authorized researcher ids, without toggling', async () => {
    const user = userEvent.setup()
    const { container } = mount()
    await user.click(container.querySelector('[data-cy="bulk-remove-all-daa-5"]') as HTMLElement)
    expect(removeAllSpy).toHaveBeenCalledWith([1])
    expect(toggleSpy).not.toHaveBeenCalled()
  })

  it('disables Approve All when every researcher is already authorized', () => {
    const allAuthorized = mockRows.map(r => ({ ...r, status: 'authorized' as const }))
    const { container } = mount({ researcherRows: allAuthorized })
    expect(container.querySelector('[data-cy="bulk-approve-all-daa-5"]')).toBeDisabled()
    expect(container.querySelector('[data-cy="bulk-remove-all-daa-5"]')).not.toBeDisabled()
  })

  it('disables Remove All when no researcher is authorized', () => {
    const noneAuthorized = mockRows.map(r => ({ ...r, status: 'not_requested' as const }))
    const { container } = mount({ researcherRows: noneAuthorized })
    expect(container.querySelector('[data-cy="bulk-remove-all-daa-5"]')).toBeDisabled()
    expect(container.querySelector('[data-cy="bulk-approve-all-daa-5"]')).not.toBeDisabled()
  })

  // ── Read-only mode ────────────────────────────────────────────────────────

  describe('read-only mode', () => {
    it('renders no bulk action buttons in the header', () => {
      const { container } = mount({ readOnly: true })
      expect(container.querySelector('[data-cy="bulk-approve-all-daa-5"]')).not.toBeInTheDocument()
      expect(container.querySelector('[data-cy="bulk-remove-all-daa-5"]')).not.toBeInTheDocument()
    })

    it('still renders the header content and authorized count badge', () => {
      const { container } = mount({ readOnly: true })
      const row = container.querySelector('[data-cy="daa-accordion-row-5"]')
      expect(row).toHaveTextContent('Default DUOS DAA')
      expect(container.querySelector('[data-cy="daa-authorized-badge-5"]')).toHaveTextContent('1 pre-authorized')
    })

    it('renders the sub-table without action buttons when expanded', () => {
      const { container } = mount({ readOnly: true, isExpanded: true })
      expect(container.querySelector('[data-cy="daa-researcher-subtable"]')).toBeInTheDocument()
      expect(container.querySelector('[data-cy="daa-researcher-row-1"]')).toBeInTheDocument()
      expect(container.querySelector('[data-cy="auth-action-revoke"]')).not.toBeInTheDocument()
      expect(container.querySelector('[data-cy="auth-action-authorize"]')).not.toBeInTheDocument()
    })

    it('still toggles when the header is clicked', async () => {
      const user = userEvent.setup()
      const { container } = mount({ readOnly: true })
      await user.click(container.querySelector('[data-cy="daa-accordion-toggle-5"]') as HTMLElement)
      expect(toggleSpy).toHaveBeenCalledOnce()
    })

    // An admin has neither an institution nor the authorize control the SO copy
    // tells them to use.
    it('drops the authorize-oriented wording from the recently-updated banner', () => {
      const { container } = mount({
        daa: recentDaa,
        isRecentlyUpdated: true,
        isExpanded: true,
        authorizedCount: 0,
        readOnly: true,
      })
      const banner = container.querySelector('[data-cy="daa-recently-updated-banner-6"]') as HTMLElement
      expect(banner).toHaveTextContent('This DAA has been updated within the last year.')
      expect(banner).not.toHaveTextContent('before authorizing new researchers')
      expect(banner).not.toHaveTextContent('your institution')
    })

    it('keeps the authorize-oriented banner wording when not read-only', () => {
      const { container } = mount({
        daa: recentDaa,
        isRecentlyUpdated: true,
        isExpanded: true,
        authorizedCount: 0,
      })
      const banner = container.querySelector('[data-cy="daa-recently-updated-banner-6"]') as HTMLElement
      expect(banner).toHaveTextContent('before authorizing new researchers')
    })
  })

  it('exposes aria-expanded on the header from first render', () => {
    const { container } = mount()
    expect(container.querySelector('[data-cy="daa-accordion-toggle-5"]')).toHaveAttribute('aria-expanded', 'false')
  })

  it('a disabled bulk button does nothing when clicked', async () => {
    // pointerEventsCheck off: MUI disabled buttons set pointer-events:none.
    const user = userEvent.setup({ pointerEventsCheck: 0 })
    const noneAuthorized = mockRows.map(r => ({ ...r, status: 'not_requested' as const }))
    const { container } = mount({ researcherRows: noneAuthorized })
    await user.click(container.querySelector('[data-cy="bulk-remove-all-daa-5"]') as HTMLElement)
    expect(removeAllSpy).not.toHaveBeenCalled()
  })
})
