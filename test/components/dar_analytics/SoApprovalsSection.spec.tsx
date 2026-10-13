import React from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
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

const section = (queryClient: QueryClient, shown = range) => (
  <QueryClientProvider client={queryClient}><SoApprovalsSection range={shown} /></QueryClientProvider>
)
const renderSection = () => render(section(new QueryClient({ defaultOptions: { queries: { retry: false } } })))

describe('SoApprovalsSection', () => {
  beforeEach(() => {
    vi.resetAllMocks()
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
        submissionDate: new Date(2026, 1, 1, 12).getTime(),
        status: 'APPROVED',
        approvalDate: new Date(2026, 1, 4, 12).getTime(),
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

  it('shows pending and skipped rows with no approval date, and a status it does not know as sent', async () => {
    const submitted = new Date(2026, 1, 1, 12).getTime()
    vi.mocked(DarMetrics.getSoApprovals).mockResolvedValue(buildReport([bucket('ORIGINAL', 'PENDING', 3)], [
      { referenceId: 'ref-1', collectionId: 1, kind: 'ORIGINAL', submissionDate: submitted, status: 'PENDING', approvalDate: null, elapsedDays: null },
      { referenceId: 'ref-2', collectionId: 2, kind: 'PROGRESS_REPORT', submissionDate: submitted, status: 'SKIPPED' },
      { referenceId: 'ref-3', collectionId: 3, kind: 'ORIGINAL', submissionDate: submitted, status: 'ESCALATED' as SoApproval['status'] },
    ]))

    renderSection()

    const grid = await screen.findByRole('grid', { name: 'SO approval per submission' })
    const cells = (status: string) => within(within(grid).getByRole('gridcell', { name: status }).closest<HTMLElement>('[role="row"]')!)
      .getAllByRole('gridcell').map(cell => cell.textContent)
    expect(cells('Pending')).toEqual(['DAR', 'Feb 1, 2026', 'Pending', '–', '–'])
    expect(cells('Skipped')).toEqual(['Progress report', 'Feb 1, 2026', 'Skipped', '–', '–'])
    expect(cells('ESCALATED')).toEqual(['DAR', 'Feb 1, 2026', 'ESCALATED', '–', '–'])
  })

  it('offers a retry when a later page fails, rather than stranding the user', async () => {
    const rows: SoApproval[] = Array.from({ length: 25 }, (_, i) => ({
      referenceId: `ref-${i}`, collectionId: i, kind: 'ORIGINAL', submissionDate: new Date(2026, 1, 1, 12).getTime(), status: 'PENDING',
    }))
    const firstPage = buildReport([bucket('ORIGINAL', 'PENDING', 30)], rows)
    vi.mocked(DarMetrics.getSoApprovals)
      .mockResolvedValueOnce(firstPage)
      .mockRejectedValueOnce({ message: 'Bad gateway', code: 502 })
      .mockResolvedValueOnce({ ...firstPage, rows: rows.slice(0, 5) })

    renderSection()
    fireEvent.click(await screen.findByRole('button', { name: 'Go to next page' }))
    expect(await screen.findByText('Unable to load SO approvals: Bad gateway')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }))

    expect(await screen.findByRole('grid', { name: 'SO approval per submission' })).toBeInTheDocument()
    expect(DarMetrics.getSoApprovals).toHaveBeenLastCalledWith({ ...range, limit: 25, offset: 25 })
  })

  it('shows the empty state with the history caveat', async () => {
    vi.mocked(DarMetrics.getSoApprovals).mockResolvedValue(buildReport([]))

    renderSection()

    expect(await screen.findByText('Nothing was submitted in this range.')).toBeInTheDocument()
    expect(screen.getByText(/Pre-authorization skips are recorded from May 20, 2026/)).toBeInTheDocument()
  })

  it('pages through submissions and starts again from the first page when the range changes', async () => {
    const rows: SoApproval[] = Array.from({ length: 25 }, (_, i) => ({
      referenceId: `ref-${i}`, collectionId: i, kind: 'ORIGINAL', submissionDate: new Date(2026, 1, 1, 12).getTime(), status: 'PENDING',
    }))
    vi.mocked(DarMetrics.getSoApprovals).mockResolvedValue(buildReport([bucket('ORIGINAL', 'PENDING', 30)], rows))
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const { rerender } = render(section(queryClient))

    fireEvent.click(await screen.findByRole('button', { name: 'Go to next page' }))
    await waitFor(() => expect(DarMetrics.getSoApprovals).toHaveBeenLastCalledWith({ ...range, limit: 25, offset: 25 }))
    rerender(section(queryClient, { ...range, from: '2026-02-01' }))

    await waitFor(() => expect(DarMetrics.getSoApprovals).toHaveBeenLastCalledWith({ ...range, from: '2026-02-01', limit: 25, offset: 0 }))
  })
})
