import React from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { render, screen, within } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { DarMetrics } from 'src/libs/ajax/DarMetrics'
import { SoApprovalsSection } from 'src/components/dar_analytics/SoApprovalsSection'
import { DarAnalyticsRange } from 'src/components/dar_analytics/darAnalyticsRange'
import { DarSoApprovalReport, SoApproval, SoApprovalBucket } from 'src/types/darMetrics'

vi.mock('src/libs/ajax/DarMetrics', () => ({
  DarMetrics: { getSoApprovals: vi.fn() },
}))

const range: DarAnalyticsRange = { from: '2026-01-01', to: '2026-06-30', bucket: 'quarter' }
const Q1 = Date.parse('2026-01-01T00:00:00Z')

const bucket = (kind: SoApprovalBucket['kind'], status: SoApprovalBucket['status'], count: number): SoApprovalBucket =>
  ({ bucketStart: Q1, kind, status, count, unmeasured: 0 })

const buildReport = (buckets: SoApprovalBucket[], rows: SoApproval[] = []): DarSoApprovalReport => ({
  from: range.from,
  to: range.to,
  bucket: 'QUARTER',
  total: buckets.reduce((sum, b) => sum + b.count, 0),
  buckets,
  rows,
})

const renderSection = () => render(
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    <SoApprovalsSection range={range} />
  </QueryClientProvider>,
)

describe('SoApprovalsSection', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('counts each status across submission kinds and lists each submission', async () => {
    vi.mocked(DarMetrics.getSoApprovals).mockResolvedValue(buildReport(
      [
        bucket('ORIGINAL', 'APPROVED', 2),
        bucket('CLOSEOUT', 'APPROVED', 1),
        bucket('ORIGINAL', 'SKIPPED', 4),
        bucket('PROGRESS_REPORT', 'PENDING', 1),
      ],
      [{
        referenceId: 'ref-1',
        collectionId: 1,
        kind: 'CLOSEOUT',
        submissionDate: Date.parse('2026-02-01T12:00:00Z'),
        status: 'APPROVED',
        approvalDate: Date.parse('2026-02-04T12:00:00Z'),
        elapsedDays: 3,
      }],
    ))

    renderSection()

    await screen.findByRole('grid', { name: 'SO approval per submission' })
    expect(screen.getByText('Approved', { selector: 'dt' }).nextSibling).toHaveTextContent('3')
    expect(screen.getByText('Skipped', { selector: 'dt' }).nextSibling).toHaveTextContent('4')
    expect(screen.getByText('Pending', { selector: 'dt' }).nextSibling).toHaveTextContent('1')
    const row = within(screen.getByRole('grid', { name: 'SO approval per submission' }))
      .getByRole('gridcell', { name: 'Closeout' }).closest<HTMLElement>('[role="row"]')!
    expect(within(row).getAllByRole('gridcell').map(cell => cell.textContent))
      .toEqual(['Closeout', 'Feb 1, 2026', 'Approved', 'Feb 4, 2026', '3.0'])
    expect(DarMetrics.getSoApprovals).toHaveBeenCalledWith({ ...range, limit: 25, offset: 0 })
  })

  it('shows the empty state with the history caveat', async () => {
    vi.mocked(DarMetrics.getSoApprovals).mockResolvedValue(buildReport([]))

    renderSection()

    expect(await screen.findByText('Nothing was submitted in this range.')).toBeInTheDocument()
    expect(screen.getByText(/Pre-authorization skips are recorded from May 20, 2026/)).toBeInTheDocument()
  })
})
