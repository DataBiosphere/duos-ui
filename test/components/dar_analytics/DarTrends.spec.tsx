import React from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { DarMetrics } from 'src/libs/ajax/DarMetrics'
import { DarTrends } from 'src/components/dar_analytics/DarTrends'
import { defaultRange } from 'src/components/dar_analytics/darAnalyticsRange'
import { DarMetricsTarget } from 'src/types/darMetrics'

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

const range = defaultRange(dayjs())
const empty = {
  from: range.from,
  to: range.to,
  bucket: 'QUARTER' as const,
  total: 0,
  unmeasured: 0,
  buckets: [],
  rows: [],
  institutions: [],
  researchers: [],
}
const study: DarMetricsTarget = { kind: 'study', id: '12' }

const trends = (target: DarMetricsTarget) => (
  <DarTrends target={target} />
)
const renderTrends = (target: DarMetricsTarget = study) => render(
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    {trends(target)}
  </QueryClientProvider>,
)

const openTab = (name: string) => fireEvent.click(screen.getByRole('tab', { name }))

describe('DarTrends', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    Object.values(DarMetrics).forEach(report => vi.mocked(report).mockResolvedValue(empty as never))
  })

  it('offers the four reports as tabs, opening on volume for the last two years by quarter', async () => {
    renderTrends()

    expect(screen.getAllByRole('tab').map(tab => tab.textContent))
      .toEqual(['Volume', 'Decisions', 'Expiration & Renewal', 'DAC Turnaround'])
    expect(screen.getByRole('tab', { name: 'Volume' })).toHaveAttribute('aria-selected', 'true')
    // Named by its title, which is not a heading here: see AnalyticsSection
    expect(await screen.findByRole('region', { name: 'Volume' })).toBeInTheDocument()
    expect(screen.queryByRole('heading')).not.toBeInTheDocument()
    await waitFor(() => expect(DarMetrics.getVolume).toHaveBeenCalledWith({ ...range, limit: 1, target: study }))
    expect(screen.getByLabelText('From')).toHaveValue(range.from)
    expect(screen.getByLabelText('To')).toHaveValue(range.to)
  })

  it('asks only for the report on the open tab, each for the study', async () => {
    renderTrends()
    await waitFor(() => expect(DarMetrics.getVolume).toHaveBeenCalled())
    expect(DarMetrics.getDatasetDecisions).not.toHaveBeenCalled()

    openTab('Decisions')
    await waitFor(() =>
      expect(DarMetrics.getDatasetDecisions).toHaveBeenCalledWith({ ...range, limit: 1, target: study }))

    openTab('Expiration & Renewal')
    await waitFor(() => expect(DarMetrics.getExpirations).toHaveBeenCalledWith({ ...range, limit: 1, target: study }))
    expect(DarMetrics.getRenewals).toHaveBeenCalledWith({ ...range, limit: 1, target: study })

    openTab('DAC Turnaround')
    await waitFor(() =>
      expect(DarMetrics.getDatasetDecisionTurnaround).toHaveBeenCalledWith({ ...range, limit: 1, target: study }))
  })

  /** Consent doesn't serve the per-DAR reports for a study or dataset, and nothing here offers them. */
  it('never asks for a per-DAR report, and offers no per-DAR turnaround', async () => {
    renderTrends()
    openTab('Decisions')
    await waitFor(() => expect(DarMetrics.getDatasetDecisions).toHaveBeenCalled())
    openTab('DAC Turnaround')
    await waitFor(() => expect(DarMetrics.getDatasetDecisionTurnaround).toHaveBeenCalled())

    expect(screen.queryByRole('button', { name: 'Per DAR' })).not.toBeInTheDocument()
    expect(DarMetrics.getDecisions).not.toHaveBeenCalled()
    expect(DarMetrics.getDecisionTurnaround).not.toHaveBeenCalled()
  })

  it('applies a new grouping to the open report and keeps it across tabs', async () => {
    renderTrends()
    await waitFor(() => expect(DarMetrics.getVolume).toHaveBeenCalled())

    fireEvent.click(screen.getByRole('button', { name: 'Month' }))

    const monthly = { ...range, bucket: 'month' }
    await waitFor(() => expect(DarMetrics.getVolume).toHaveBeenCalledWith({ ...monthly, limit: 1, target: study }))
    openTab('Expiration & Renewal')
    await waitFor(() => expect(DarMetrics.getRenewals).toHaveBeenCalledWith({ ...monthly, limit: 1, target: study }))
  })

  it('reports on a dataset when the page is a dataset\'s', async () => {
    const dataset: DarMetricsTarget = { kind: 'dataset', id: 7 }

    renderTrends(dataset)

    await waitFor(() => expect(DarMetrics.getVolume).toHaveBeenCalledWith({ ...range, limit: 1, target: dataset }))
    expect(await screen.findByText(/that request this dataset\./)).toBeInTheDocument()
  })
})
