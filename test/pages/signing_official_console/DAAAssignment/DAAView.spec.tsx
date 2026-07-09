import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { render, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import DAAView from 'src/pages/signing_official_console/DAAAssignment/DAAView'
import {
  buildDAAViewRows,
  isRecentlyUpdated,
} from 'src/pages/signing_official_console/DAAAssignment/researcherViewHelpers'
import { DAA } from 'src/libs/ajax/DAA'
import { User } from 'src/libs/ajax/User'
import { DuosUser, DAAObject } from 'src/types/model'
import { makeDaa, makeResearcher } from './fixtures'

const mockDaas: DAAObject[] = [
  makeDaa({ broadDaa: true, daaId: 1, fileName: 'Default DUOS DAA', dacId: 10 }),
  makeDaa({ broadDaa: false, daaId: 2, fileName: 'GTEx Access Agreement', dacId: 20 }),
]

const recentDaa = makeDaa({ broadDaa: false, daaId: 3, fileName: 'Recent Agreement', dacId: 30 })
const recentDaaWithDate: DAAObject = {
  ...recentDaa,
  updateDate: new Date().toISOString(),
}

const mockResearchers: DuosUser[] = [
  makeResearcher({
    userId: 1,
    displayName: 'Test User Alpha',
    email: 'test.user.alpha@test.org',
    daaDetails: [{ daaId: 1, authorizedBy: 'so@test.org' }],
  }),
  makeResearcher({
    userId: 2,
    displayName: 'Test User Beta',
    email: 'test.user.beta@test.org',
  }),
]

// ── Pure helper unit tests ─────────────────────────────────────────────────────

describe('DAAView pure helpers', () => {
  describe('isRecentlyUpdated', () => {
    it('returns true when updateDate is within the last year', () => {
      const daa = { ...mockDaas[0], updateDate: new Date().toISOString() }
      expect(isRecentlyUpdated(daa)).toBe(true)
    })

    it('returns false when updateDate is more than a year ago', () => {
      const daa = { ...mockDaas[0], updateDate: '2020-01-01' }
      expect(isRecentlyUpdated(daa)).toBe(false)
    })

    it('returns false when updateDate is null/undefined', () => {
      const daa = { ...mockDaas[0], updateDate: undefined }
      expect(isRecentlyUpdated(daa as unknown as DAAObject)).toBe(false)
    })

    it('returns false when updateDate is not a valid date string', () => {
      const daa = { ...mockDaas[0], updateDate: 'not-a-date' }
      expect(isRecentlyUpdated(daa)).toBe(false)
    })
  })

  describe('buildDAAViewRows', () => {
    it('returns one row per unique DAA', () => {
      const rows = buildDAAViewRows(mockDaas, mockResearchers)
      expect(rows).toHaveLength(2)
    })

    it('deduplicates DAAs with the same daaId', () => {
      const rows = buildDAAViewRows([...mockDaas, mockDaas[0]], mockResearchers)
      expect(rows).toHaveLength(2)
    })

    it('counts authorized researchers correctly per DAA', () => {
      const rows = buildDAAViewRows(mockDaas, mockResearchers)
      const row1 = rows.find(r => r.daa.daaId === 1)
      const row2 = rows.find(r => r.daa.daaId === 2)
      expect(row1?.authorizedCount).toBe(1)
      expect(row2?.authorizedCount).toBe(0)
    })

    it('includes all researchers in each DAA row', () => {
      const rows = buildDAAViewRows(mockDaas, mockResearchers)
      rows.forEach((row) => {
        expect(row.researcherRows).toHaveLength(mockResearchers.length)
      })
    })

    it('sets isRecentlyUpdated correctly', () => {
      const daasWithRecent = [...mockDaas, recentDaaWithDate]
      const rows = buildDAAViewRows(daasWithRecent, mockResearchers)
      const oldRow = rows.find(r => r.daa.daaId === 1)
      const recentRow = rows.find(r => r.daa.daaId === 3)
      expect(oldRow?.isRecentlyUpdated).toBe(false)
      expect(recentRow?.isRecentlyUpdated).toBe(true)
    })

    it('returns empty array when daas is empty', () => {
      expect(buildDAAViewRows([], mockResearchers)).toEqual([])
    })

    it('returns rows with empty researcherRows when researchers is empty', () => {
      const rows = buildDAAViewRows(mockDaas, [])
      rows.forEach((row) => {
        expect(row.researcherRows).toHaveLength(0)
        expect(row.authorizedCount).toBe(0)
      })
    })
  })
})

// ── Component tests ────────────────────────────────────────────────────────────

describe('DAAView', () => {
  let refreshSpy: (updated: DuosUser[]) => void

  beforeEach(() => {
    refreshSpy = vi.fn()
    vi.spyOn(User, 'list').mockResolvedValue(mockResearchers)
  })

  afterEach(() => vi.restoreAllMocks())

  const mount = (overrides: Partial<React.ComponentProps<typeof DAAView>> = {}) =>
    render(
      <DAAView
        researchers={mockResearchers}
        daas={mockDaas}
        isLoading={false}
        onResearchersRefresh={refreshSpy}
        {...overrides}
      />,
    )

  it('renders an accordion row for each DAA', () => {
    const { container } = mount()
    expect(container.querySelector('[data-cy="daa-accordion-row-1"]')).toBeInTheDocument()
    expect(container.querySelector('[data-cy="daa-accordion-row-2"]')).toBeInTheDocument()
  })

  it('shows a loading spinner when isLoading is true', () => {
    const { container } = mount({ isLoading: true })
    expect(container.querySelector('[data-cy="daa-view-loading"]')).toBeInTheDocument()
    expect(container.querySelector('[data-cy="daa-view"]')).not.toBeInTheDocument()
  })

  it('shows empty message when there are no DAA rows', () => {
    const { container } = mount({ daas: [] })
    expect(container.querySelector('[data-cy="daa-empty-message"]')).toBeInTheDocument()
  })

  it('renders the toolbar with search and expand/collapse controls', () => {
    const { container } = mount()
    expect(container.querySelector('[data-cy="daa-view-toolbar"]')).toBeInTheDocument()
    expect(container.querySelector('[data-cy="daa-search"]')).toBeInTheDocument()
    expect(container.querySelector('[data-cy="daa-expand-collapse-all"]')).toBeInTheDocument()
  })

  it('filters rows by DAA filename', async () => {
    const user = userEvent.setup()
    const { container } = mount()
    await user.type(container.querySelector('[data-cy="daa-search"] input') as HTMLElement, 'GTEx')
    expect(container.querySelector('[data-cy="daa-accordion-row-1"]')).not.toBeInTheDocument()
    expect(container.querySelector('[data-cy="daa-accordion-row-2"]')).toBeInTheDocument()
  })

  it('filters rows by DAC name', async () => {
    const user = userEvent.setup()
    const { container } = mount()
    await user.type(container.querySelector('[data-cy="daa-search"] input') as HTMLElement, 'DAC-10')
    expect(container.querySelector('[data-cy="daa-accordion-row-1"]')).toBeInTheDocument()
    expect(container.querySelector('[data-cy="daa-accordion-row-2"]')).not.toBeInTheDocument()
  })

  it('shows empty message when search has no matches', async () => {
    const user = userEvent.setup()
    const { container } = mount()
    await user.type(container.querySelector('[data-cy="daa-search"] input') as HTMLElement, 'xyznotfound')
    expect(container.querySelector('[data-cy="daa-empty-message"]')).toBeInTheDocument()
  })

  it('is case-insensitive when filtering', async () => {
    const user = userEvent.setup()
    const { container } = mount()
    await user.type(container.querySelector('[data-cy="daa-search"] input') as HTMLElement, 'gtex')
    expect(container.querySelector('[data-cy="daa-accordion-row-2"]')).toBeInTheDocument()
  })

  it('does not show researcher subtables by default (all collapsed)', () => {
    const { container } = mount()
    expect(container.querySelector('[data-cy="daa-researcher-subtable"]')).not.toBeInTheDocument()
  })

  it('expands a single row when its header is clicked', async () => {
    const user = userEvent.setup()
    const { container } = mount()
    await user.click(container.querySelector('[data-cy="daa-accordion-toggle-1"]') as HTMLElement)
    expect(container.querySelector('[data-cy="daa-accordion-row-1"] [data-cy="daa-researcher-subtable"]')).toBeInTheDocument()
    expect(container.querySelector('[data-cy="daa-accordion-row-2"] [data-cy="daa-researcher-subtable"]')).not.toBeInTheDocument()
  })

  it('collapses an expanded row when its header is clicked again', async () => {
    const user = userEvent.setup()
    const { container } = mount()
    await user.click(container.querySelector('[data-cy="daa-accordion-toggle-1"]') as HTMLElement)
    await user.click(container.querySelector('[data-cy="daa-accordion-toggle-1"]') as HTMLElement)
    expect(container.querySelector('[data-cy="daa-researcher-subtable"]')).not.toBeInTheDocument()
  })

  it.each([
    ['expands all rows', 1, (c: HTMLElement) => expect(c.querySelectorAll('[data-cy="daa-researcher-subtable"]')).toHaveLength(mockDaas.length)],
    ['relabels button to Collapse All', 1, (c: HTMLElement) => expect(c.querySelector('[data-cy="daa-expand-collapse-all"]')).toHaveTextContent('Collapse All')],
    ['collapses all rows on second click', 2, (c: HTMLElement) => expect(c.querySelector('[data-cy="daa-researcher-subtable"]')).not.toBeInTheDocument()],
  ] as const)('expand/collapse all — %s', async (_label, clicks, assert) => {
    const user = userEvent.setup()
    const { container } = mount()
    const btn = container.querySelector('[data-cy="daa-expand-collapse-all"]') as HTMLElement
    for (let i = 0; i < clicks; i++) await user.click(btn)
    assert(container)
  })

  it('opens confirm dialog when Pre-Authorize is clicked for an un-authorized researcher', async () => {
    const user = userEvent.setup()
    const { container } = mount()
    await user.click(container.querySelector('[data-cy="daa-accordion-toggle-1"]') as HTMLElement)
    await user.click(container.querySelector('[data-cy="daa-researcher-row-2"] [data-cy="auth-action-authorize"]') as HTMLElement)
    expect(document.body.querySelector('[data-cy="confirm-dialog"]')).toBeInTheDocument()
    expect(document.body.querySelector('[data-cy="confirm-dialog"]')).toHaveTextContent('Authorize')
  })

  it('closes the confirm dialog when Cancel is clicked', async () => {
    const user = userEvent.setup()
    const { container } = mount()
    await user.click(container.querySelector('[data-cy="daa-accordion-toggle-1"]') as HTMLElement)
    await user.click(container.querySelector('[data-cy="daa-researcher-row-2"] [data-cy="auth-action-authorize"]') as HTMLElement)
    await user.click(document.body.querySelector('[data-cy="confirm-dialog-cancel"]') as HTMLElement)
    expect(document.body.querySelector('[data-cy="confirm-dialog"]')).not.toBeInTheDocument()
  })

  it('calls createDaaLcLink and refreshes when authorize is confirmed', async () => {
    vi.spyOn(DAA, 'createDaaLcLink').mockResolvedValue(undefined as unknown as DAAObject)
    const user = userEvent.setup()
    const { container } = mount()
    await user.click(container.querySelector('[data-cy="daa-accordion-toggle-1"]') as HTMLElement)
    await user.click(container.querySelector('[data-cy="daa-researcher-row-2"] [data-cy="auth-action-authorize"]') as HTMLElement)
    await user.click(document.body.querySelector('[data-cy="confirm-dialog-confirm"]') as HTMLElement)
    await waitFor(() => expect(DAA.createDaaLcLink).toHaveBeenCalledWith(1, 2))
    await waitFor(() => expect(User.list).toHaveBeenCalled())
  })

  it('opens revoke confirm dialog when Revoke is clicked for an authorized researcher', async () => {
    const user = userEvent.setup()
    const { container } = mount()
    await user.click(container.querySelector('[data-cy="daa-accordion-toggle-1"]') as HTMLElement)
    await user.click(container.querySelector('[data-cy="daa-researcher-row-1"] [data-cy="auth-action-revoke"]') as HTMLElement)
    expect(document.body.querySelector('[data-cy="confirm-dialog"]')).toBeInTheDocument()
    expect(document.body.querySelector('[data-cy="confirm-dialog"]')).toHaveTextContent('Revoke')
  })

  it('calls deleteDaaLcLink and refreshes when revoke is confirmed', async () => {
    vi.spyOn(DAA, 'deleteDaaLcLink').mockResolvedValue(0)
    const user = userEvent.setup()
    const { container } = mount()
    await user.click(container.querySelector('[data-cy="daa-accordion-toggle-1"]') as HTMLElement)
    await user.click(container.querySelector('[data-cy="daa-researcher-row-1"] [data-cy="auth-action-revoke"]') as HTMLElement)
    await user.click(document.body.querySelector('[data-cy="confirm-dialog-confirm"]') as HTMLElement)
    await waitFor(() => expect(DAA.deleteDaaLcLink).toHaveBeenCalledWith(1, 1))
    await waitFor(() => expect(User.list).toHaveBeenCalled())
  })

  it('shows authorizedBy email for an authorized researcher in the expanded subtable', async () => {
    const user = userEvent.setup()
    const { container } = mount()
    await user.click(container.querySelector('[data-cy="daa-accordion-toggle-1"]') as HTMLElement)
    expect(container.querySelector('[data-cy="daa-authorized-by-1"]')).toHaveTextContent('so@test.org')
  })

  it('shows a dash in the Pre-authorized By cell for an unauthorized researcher', async () => {
    const user = userEvent.setup()
    const { container } = mount()
    await user.click(container.querySelector('[data-cy="daa-accordion-toggle-1"]') as HTMLElement)
    expect(container.querySelector('[data-cy="daa-authorized-by-2"]')).toHaveTextContent('—')
  })
})
