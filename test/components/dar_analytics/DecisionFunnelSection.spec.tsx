import React from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { render, screen, within } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { DarMetrics } from 'src/libs/ajax/DarMetrics'
import { DecisionFunnelSection } from 'src/components/dar_analytics/DecisionFunnelSection'
import { DarAnalyticsRange } from 'src/components/dar_analytics/darAnalyticsRange'
import { DecisionBucketCount, DarMetricsReport } from 'src/types/darMetrics'

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

  it('shows the error when either report fails', async () => {
    vi.mocked(DarMetrics.getDecisions).mockResolvedValue(buildReport([]))
    vi.mocked(DarMetrics.getDatasetDecisions).mockRejectedValue({ message: 'Forbidden', code: 403 })

    renderSection()

    expect(await screen.findByRole('alert')).toHaveTextContent('Forbidden')
  })

  it('waits for both reports on a new range rather than mixing ranges', async () => {
    vi.mocked(DarMetrics.getDecisions).mockResolvedValue(buildReport([{ bucketStart: Q1, state: 'APPROVED', count: 1 }]))
    vi.mocked(DarMetrics.getDatasetDecisions).mockResolvedValueOnce(buildReport([{ bucketStart: Q1, state: 'APPROVED', count: 1 }]))
    const queryClient = client()
    const { rerender } = render(section(queryClient))
    await screen.findByRole('grid')
    vi.mocked(DarMetrics.getDatasetDecisions).mockReturnValueOnce(new Promise(() => {}))

    rerender(section(queryClient, { ...range, bucket: 'month' }))

    expect(await screen.findByLabelText('Loading Decision funnel')).toBeInTheDocument()
  })
})
