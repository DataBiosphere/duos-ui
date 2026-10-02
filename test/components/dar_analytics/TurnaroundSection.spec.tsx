import React from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { DarMetrics } from 'src/libs/ajax/DarMetrics'
import { TurnaroundSection } from 'src/components/dar_analytics/TurnaroundSection'
import { DarAnalyticsRange } from 'src/components/dar_analytics/darAnalyticsRange'
import { TurnaroundBucket, TurnaroundReport } from 'src/types/darMetrics'

vi.mock('src/libs/ajax/DarMetrics', () => ({
  DarMetrics: {
    getDecisionTurnaround: vi.fn(),
    getDatasetDecisionTurnaround: vi.fn(),
  },
}))

const range: DarAnalyticsRange = { from: '2026-01-01', to: '2026-06-30', bucket: 'quarter' }
const Q1 = Date.parse('2026-01-01T00:00:00Z')
const Q2 = Date.parse('2026-04-01T00:00:00Z')

const buildReport = (buckets: TurnaroundBucket[], unmeasured = 0): TurnaroundReport<never> => ({
  from: range.from,
  to: range.to,
  bucket: 'QUARTER',
  total: buckets.reduce((sum, b) => sum + b.count, 0),
  unmeasured,
  buckets,
  rows: [],
})

const renderSection = () => render(
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    <TurnaroundSection range={range} />
  </QueryClientProvider>,
)

const cellsFor = (label: string) =>
  within(screen.getByRole('gridcell', { name: label }).closest<HTMLElement>('[role="row"]')!)
    .getAllByRole('gridcell')
    .map(cell => cell.textContent)

describe('TurnaroundSection', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows mean, median and mode per bucket and the unmeasured count as a caveat', async () => {
    vi.mocked(DarMetrics.getDecisionTurnaround).mockResolvedValue(buildReport([
      { bucketStart: Q1, count: 4, unmeasured: 1, meanDays: 12.25, medianDays: 10, modeDays: 9 },
      { bucketStart: Q2, count: 0, unmeasured: 1 },
    ], 2))

    renderSection()

    expect(await screen.findByRole('grid', { name: 'Turnaround per bucket' })).toBeInTheDocument()
    expect(cellsFor('2026 Q1')).toEqual(['2026 Q1', '4', '12.3', '10.0', '9'])
    expect(cellsFor('2026 Q2')).toEqual(['2026 Q2', '0', '–', '–', '–'])
    expect(screen.getByText(/left out of these figures: 2 in this range/)).toBeInTheDocument()
    expect(screen.getByRole('group', { name: 'Decided' })).toHaveTextContent('6')
    expect(screen.getByRole('group', { name: 'Unmeasured' })).toHaveTextContent('2')
    expect(DarMetrics.getDecisionTurnaround).toHaveBeenCalledWith({ ...range, limit: 1 })
  })

  it('switches to the per-dataset report', async () => {
    vi.mocked(DarMetrics.getDecisionTurnaround).mockResolvedValue(buildReport([
      { bucketStart: Q1, count: 2, unmeasured: 0, meanDays: 5, medianDays: 5, modeDays: 5 },
    ]))
    vi.mocked(DarMetrics.getDatasetDecisionTurnaround).mockResolvedValue(buildReport([
      { bucketStart: Q1, count: 6, unmeasured: 0, meanDays: 3, medianDays: 3, modeDays: 3 },
    ]))

    renderSection()
    await screen.findByRole('grid')
    fireEvent.click(screen.getByRole('button', { name: 'Per dataset' }))

    expect(await screen.findByText('6', { selector: '[role="gridcell"]' })).toBeInTheDocument()
    expect(DarMetrics.getDatasetDecisionTurnaround).toHaveBeenCalledWith({ ...range, limit: 1 })
  })

  it('shows the empty state, with the caveat, when nothing was decided', async () => {
    vi.mocked(DarMetrics.getDecisionTurnaround).mockResolvedValue(buildReport([]))

    renderSection()

    expect(await screen.findByText('No DARs submitted in this range have been decided.')).toBeInTheDocument()
    expect(screen.getByText(/left out of these figures: 0 in this range/)).toBeInTheDocument()
  })

  it('shows the figures, not the empty state, when every decision is unmeasured', async () => {
    vi.mocked(DarMetrics.getDecisionTurnaround).mockResolvedValue(buildReport([{ bucketStart: Q1, count: 0, unmeasured: 2 }], 2))

    renderSection()

    expect(await screen.findByRole('group', { name: 'Decided' })).toHaveTextContent('2')
    expect(screen.queryByText('No DARs submitted in this range have been decided.')).not.toBeInTheDocument()
  })

  it('keeps the level toggle when the per-DAR report is empty, so per-dataset figures stay reachable', async () => {
    vi.mocked(DarMetrics.getDecisionTurnaround).mockResolvedValue(buildReport([]))
    vi.mocked(DarMetrics.getDatasetDecisionTurnaround).mockResolvedValue(buildReport([
      { bucketStart: Q1, count: 6, unmeasured: 0, meanDays: 3, medianDays: 3, modeDays: 3 },
    ]))

    renderSection()
    await screen.findByText('No DARs submitted in this range have been decided.')
    fireEvent.click(screen.getByRole('button', { name: 'Per dataset' }))

    expect(await screen.findByText('6', { selector: '[role="gridcell"]' })).toBeInTheDocument()
    expect(screen.getByText(/on each dataset/)).toBeInTheDocument()
  })

  it('leaves out the unmeasured caveat until the report arrives', () => {
    vi.mocked(DarMetrics.getDecisionTurnaround).mockReturnValue(new Promise(() => {}))

    renderSection()

    expect(screen.queryByText(/left out of these figures/)).not.toBeInTheDocument()
  })

  it('hides the caveat while the other level is still on screen', async () => {
    vi.mocked(DarMetrics.getDecisionTurnaround).mockResolvedValue(buildReport([
      { bucketStart: Q1, count: 2, unmeasured: 0, meanDays: 5, medianDays: 5, modeDays: 5 },
    ], 3))
    vi.mocked(DarMetrics.getDatasetDecisionTurnaround).mockReturnValue(new Promise(() => {}))

    renderSection()
    await screen.findByText(/left out of these figures: 3 in this range/)
    fireEvent.click(screen.getByRole('button', { name: 'Per dataset' }))

    await waitFor(() => expect(screen.queryByText(/left out of these figures/)).not.toBeInTheDocument())
  })
})
