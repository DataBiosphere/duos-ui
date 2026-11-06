import React from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { DarMetrics } from 'src/libs/ajax/DarMetrics'
import DarTrends from 'src/components/dar_analytics/DarTrends'
import { defaultRange } from 'src/components/dar_analytics/darAnalyticsRange'

vi.mock('src/libs/ajax/DarMetrics', () => ({
  DarMetrics: {
    getVolume: vi.fn(),
    getDecisions: vi.fn(),
    getDatasetDecisions: vi.fn(),
    getDecisionTurnaround: vi.fn(),
    getDatasetDecisionTurnaround: vi.fn(),
    getExpirations: vi.fn(),
    getRenewals: vi.fn(),
  },
}))

const subject = { type: 'dataset' as const, id: 42 }

const report = (query: { from: string, to: string, bucket?: string }) => Promise.resolve({
  from: query.from, to: query.to, bucket: (query.bucket ?? 'quarter').toUpperCase(),
  total: 0, unmeasured: 0, buckets: [], rows: [],
})

const renderTrends = () => render(
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    <DarTrends subject={subject} />
  </QueryClientProvider>,
)

describe('DarTrends', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    Object.values(DarMetrics).forEach(fetchReport => vi.mocked(fetchReport).mockImplementation(report as never))
  })

  it('starts on volume over the Metrics page\'s default range, scoped to the subject', async () => {
    renderTrends()

    expect(await screen.findByRole('heading', { name: 'Volume' })).toBeInTheDocument()
    expect(DarMetrics.getVolume).toHaveBeenCalledWith({ ...defaultRange(dayjs()), limit: 1, subject })
    expect(DarMetrics.getDecisions).not.toHaveBeenCalled()
  })

  it('switches report from the tabs', async () => {
    renderTrends()
    await screen.findByRole('heading', { name: 'Volume' })

    fireEvent.click(screen.getByRole('tab', { name: 'Decisions' }))
    expect(await screen.findByRole('heading', { name: 'Decision funnel' })).toBeInTheDocument()
    expect(DarMetrics.getDatasetDecisions).toHaveBeenCalledWith(expect.objectContaining({ subject }))

    fireEvent.click(screen.getByRole('tab', { name: 'Expiration and renewal' }))
    expect(await screen.findByRole('heading', { name: 'Expiration and renewal' })).toBeInTheDocument()
    expect(DarMetrics.getExpirations).toHaveBeenCalledWith(expect.objectContaining({ subject }))

    fireEvent.click(screen.getByRole('tab', { name: 'Turnaround' }))
    expect(await screen.findByRole('heading', { name: 'DAC turnaround' })).toBeInTheDocument()
    expect(DarMetrics.getDatasetDecisionTurnaround).toHaveBeenCalledWith(expect.objectContaining({ subject }))
  })

  // A DAR's overall decision and turnaround also reflect datasets on other studies.
  it('reports decisions per dataset only, never per DAR', async () => {
    const Q = Date.parse(`${defaultRange(dayjs()).from}T00:00:00Z`)
    vi.mocked(DarMetrics.getDatasetDecisions).mockImplementation(query => report(query).then(r => ({
      ...r,
      total: 3,
      buckets: [
        { bucketStart: Q, state: 'APPROVED', decidedVia: 'MANUAL', count: 2 },
        { bucketStart: Q, state: 'NO_ELECTION', count: 1 },
      ],
    })) as never)
    renderTrends()
    await screen.findByRole('heading', { name: 'Volume' })

    fireEvent.click(screen.getByRole('tab', { name: 'Decisions' }))
    const grid = await screen.findByRole('grid', { name: 'Decision counts' })
    expect(screen.getByText('Dataset requests', { selector: 'dt' }).nextSibling).toHaveTextContent('3')
    expect(screen.getByText('Approved', { selector: 'dt' }).nextSibling).toHaveTextContent('2')
    expect(screen.queryByText('DARs submitted', { selector: 'dt' })).not.toBeInTheDocument()
    expect(within(grid).queryByRole('columnheader', { name: 'DARs' })).not.toBeInTheDocument()
    expect(within(grid).queryByRole('gridcell', { name: 'Mixed' })).not.toBeInTheDocument()
    expect(within(grid).getByRole('gridcell', { name: 'No election yet' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('tab', { name: 'Turnaround' }))
    expect(await screen.findByRole('heading', { name: 'DAC turnaround' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Per DAR' })).not.toBeInTheDocument()

    expect(DarMetrics.getDecisions).not.toHaveBeenCalled()
    expect(DarMetrics.getDecisionTurnaround).not.toHaveBeenCalled()
  })

  it('regroups the report from the range controls', async () => {
    renderTrends()
    await screen.findByRole('heading', { name: 'Volume' })

    fireEvent.click(screen.getByRole('button', { name: 'Month' }))

    await waitFor(() => expect(DarMetrics.getVolume).toHaveBeenLastCalledWith(
      expect.objectContaining({ bucket: 'month', subject }),
    ))
  })

  it('leaves out who requested the data', async () => {
    renderTrends()
    await screen.findByText('No DARs were submitted in this range.')

    expect(screen.queryByText(/institution recorded when it was submitted/)).not.toBeInTheDocument()
  })
})
