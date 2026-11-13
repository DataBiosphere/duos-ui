import React from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { render, screen, within } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { DarMetrics } from 'src/libs/ajax/DarMetrics'
import { DecisionFunnelSection } from 'src/components/dar_analytics/DecisionFunnelSection'
import { DarAnalyticsRange } from 'src/components/dar_analytics/darAnalyticsRange'
import { DarMetricsTargetContext } from 'src/components/dar_analytics/useDarMetricsReport'
import { DecisionBucketCount, DarMetricsReport, DarMetricsTarget } from 'src/types/darMetrics'

vi.mock('src/libs/ajax/DarMetrics', () => ({
  DarMetrics: {
    getDecisions: vi.fn(),
    getDatasetDecisions: vi.fn(),
  },
}))

const range: DarAnalyticsRange = { from: '2026-01-01', to: '2026-06-30', bucket: 'quarter' }
const Q1 = Date.parse('2026-01-01T00:00:00Z')
const Q2 = Date.parse('2026-04-01T00:00:00Z')

const buildReport = <B extends DecisionBucketCount = never>(buckets: B[]): DarMetricsReport<B, never> => ({
  from: range.from,
  to: range.to,
  bucket: 'QUARTER',
  total: buckets.reduce((sum, b) => sum + b.count, 0),
  buckets,
  rows: [],
})

const client = () => new QueryClient({ defaultOptions: { queries: { retry: false } } })
const section = (queryClient: QueryClient, shown = range) => (
  <QueryClientProvider client={queryClient}><DecisionFunnelSection range={shown} /></QueryClientProvider>
)
const renderSection = () => render(section(client()))

const countsFor = (label: string) =>
  within(screen.getByRole('gridcell', { name: label }).closest<HTMLElement>('[role="row"]')!)
    .getAllByRole('gridcell')
    .slice(1)
    .map(cell => cell.textContent)

describe('DecisionFunnelSection', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('counts DARs by state, summing across how each was decided, with dataset counts beside them', async () => {
    vi.mocked(DarMetrics.getDecisions).mockResolvedValue(buildReport([
      { bucketStart: Q1, state: 'APPROVED', decidedVia: 'MANUAL', count: 3 },
      { bucketStart: Q1, state: 'APPROVED', decidedVia: 'RADAR', count: 1 },
      { bucketStart: Q1, state: 'MIXED', decidedVia: 'MANUAL', count: 1 },
      { bucketStart: Q2, state: 'PENDING', count: 2 },
      { bucketStart: Q2, state: 'CANCELED', count: 1 },
    ]))
    vi.mocked(DarMetrics.getDatasetDecisions).mockResolvedValue(buildReport([
      { bucketStart: Q1, state: 'APPROVED', decidedVia: 'MANUAL', count: 6 },
      { bucketStart: Q1, state: 'DENIED', decidedVia: 'MANUAL', count: 1 },
      { bucketStart: Q2, state: 'NO_ELECTION', count: 2 },
    ]))

    renderSection()

    expect(await screen.findByRole('grid', { name: 'Decision counts' })).toBeInTheDocument()
    expect(countsFor('Approved')).toEqual(['4', '6'])
    expect(countsFor('Denied')).toEqual(['0', '1'])
    expect(countsFor('Mixed')).toEqual(['1', '–'])
    expect(countsFor('Pending')).toEqual(['2', '0'])
    expect(countsFor('No election yet')).toEqual(['–', '2'])
    expect(countsFor('Canceled')).toEqual(['1', '0'])
    expect(countsFor('Total')).toEqual(['8', '9'])
    expect(document.querySelector('[aria-label="DARs by decision state per period"]')).toHaveAccessibleDescription(
      '2026 Q1: Pending 0, Approved 4, Denied 0, Mixed 1, Canceled 0; 2026 Q2: Pending 2, Approved 0, Denied 0, Mixed 0, Canceled 1')
  })

  it('asks for one row per report and shows the empty state when no DARs were submitted', async () => {
    vi.mocked(DarMetrics.getDecisions).mockResolvedValue(buildReport([]))
    vi.mocked(DarMetrics.getDatasetDecisions).mockResolvedValue(buildReport([]))

    renderSection()

    expect(await screen.findByText('No DARs were submitted in this range.')).toBeInTheDocument()
    expect(screen.queryByRole('grid')).not.toBeInTheDocument()
    expect(DarMetrics.getDecisions).toHaveBeenCalledWith({ ...range, limit: 1 })
    expect(DarMetrics.getDatasetDecisions).toHaveBeenCalledWith({ ...range, limit: 1 })
  })

  it('shows a failed report at once, without waiting for the other', async () => {
    vi.mocked(DarMetrics.getDecisions).mockReturnValue(new Promise(() => {}))
    vi.mocked(DarMetrics.getDatasetDecisions).mockRejectedValue({ message: 'Forbidden', code: 403 })

    renderSection()

    expect(await screen.findByRole('alert')).toHaveTextContent('Forbidden')
  })

  it('waits for both reports on a new range rather than mixing ranges', async () => {
    const approved = buildReport([{ bucketStart: Q1, state: 'APPROVED', count: 1 }])
    vi.mocked(DarMetrics.getDecisions).mockResolvedValueOnce(approved).mockResolvedValueOnce({ ...approved, bucket: 'MONTH' })
    vi.mocked(DarMetrics.getDatasetDecisions).mockResolvedValueOnce(buildReport([{ bucketStart: Q1, state: 'APPROVED', count: 1 }]))
    const queryClient = client()
    const { rerender } = render(section(queryClient))
    await screen.findByRole('grid')
    vi.mocked(DarMetrics.getDatasetDecisions).mockReturnValueOnce(new Promise(() => {}))

    rerender(section(queryClient, { ...range, bucket: 'month' }))

    expect(await screen.findByLabelText('Loading Decision funnel')).toBeInTheDocument()
  })

  /**
   * A DAR's overall decision also reflects its datasets in other studies, and consent doesn't
   * serve it for one study or dataset. So the per-DAR report is never asked for there, and nothing
   * on the page is counted per DAR.
   */
  describe('on a study\'s or dataset\'s page', () => {
    const target: DarMetricsTarget = { kind: 'study', id: '12' }
    const renderForTarget = () => render(
      <QueryClientProvider client={client()}>
        <DarMetricsTargetContext.Provider value={target}>
          <DecisionFunnelSection range={range} />
        </DarMetricsTargetContext.Provider>
      </QueryClientProvider>,
    )

    it('reports the decision on each dataset and never asks for the per-DAR report', async () => {
      vi.mocked(DarMetrics.getDatasetDecisions).mockResolvedValue(buildReport([
        { bucketStart: Q1, state: 'APPROVED', decidedVia: 'MANUAL', count: 4 },
        { bucketStart: Q1, state: 'APPROVED', decidedVia: 'RADAR', count: 2 },
        { bucketStart: Q1, state: 'DENIED', decidedVia: 'MANUAL', count: 1 },
        { bucketStart: Q2, state: 'PENDING', count: 3 },
        { bucketStart: Q2, state: 'NO_ELECTION', count: 2 },
      ]))

      renderForTarget()

      const grid = await screen.findByRole('grid', { name: 'Decision counts' })
      expect(within(grid).getAllByRole('columnheader').map(header => header.textContent))
        .toEqual(['State', 'Datasets on DARs'])
      expect(countsFor('Approved')).toEqual(['6'])
      expect(countsFor('Denied')).toEqual(['1'])
      expect(countsFor('Pending')).toEqual(['3'])
      expect(countsFor('No election yet')).toEqual(['2'])
      expect(countsFor('Canceled')).toEqual(['0'])
      expect(countsFor('Total')).toEqual(['12'])
      // "Mixed" is a DAR's state, never a dataset's
      expect(within(grid).queryByRole('gridcell', { name: 'Mixed' })).not.toBeInTheDocument()
      expect(screen.getByText('Dataset requests', { selector: 'dt' }).nextSibling).toHaveTextContent('12')
      expect(screen.getByText('Approved', { selector: 'dt' }).nextSibling).toHaveTextContent('6')
      expect(screen.queryByText('DARs submitted')).not.toBeInTheDocument()
      expect(document.querySelector('[aria-label="Dataset requests by decision state per period"]'))
        .toHaveAccessibleDescription(
          '2026 Q1: Pending 0, No election yet 0, Approved 6, Denied 1, Canceled 0; '
          + '2026 Q2: Pending 3, No election yet 2, Approved 0, Denied 0, Canceled 0')
      expect(screen.getByText(/Requests for this study's datasets/)).toBeInTheDocument()
      expect(DarMetrics.getDatasetDecisions).toHaveBeenCalledWith({ ...range, limit: 1, target })
      expect(DarMetrics.getDecisions).not.toHaveBeenCalled()
    })

    it('shows the empty state without waiting on the per-DAR report it never asks for', async () => {
      vi.mocked(DarMetrics.getDatasetDecisions).mockResolvedValue(buildReport([]))

      renderForTarget()

      expect(await screen.findByText('No DARs were submitted in this range.')).toBeInTheDocument()
      expect(DarMetrics.getDecisions).not.toHaveBeenCalled()
    })

    it('shows a failed report as an error', async () => {
      vi.mocked(DarMetrics.getDatasetDecisions).mockRejectedValue({ message: 'Forbidden', code: 403 })

      renderForTarget()

      expect(await screen.findByRole('alert')).toHaveTextContent('Forbidden')
      expect(DarMetrics.getDecisions).not.toHaveBeenCalled()
    })
  })
})
