import React from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { DarMetrics } from 'src/libs/ajax/DarMetrics'
import { DarTrends } from 'src/components/dar_analytics/DarTrends'
import { defaultRange } from 'src/components/dar_analytics/darAnalyticsRange'
import { RequestActivityAccess } from 'src/components/dar_analytics/requestActivityAccess'
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

/** As an admin sees it, unless told what else the reader is offered. */
const renderTrends = (target: DarMetricsTarget = study, requestActivity: RequestActivityAccess = 'all') => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const trends = (offered: RequestActivityAccess) => (
    <QueryClientProvider client={client}>
      <DarTrends target={target} requestActivity={offered} />
    </QueryClientProvider>
  )
  const view = render(trends(requestActivity))
  return { ...view, offer: (offered: RequestActivityAccess) => view.rerender(trends(offered)) }
}

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

  /**
   * Volume, decisions and turnaround count requests that were denied or are still pending. Consent
   * serves them to admins and the DAC in charge alone, so no one else is offered them or asks.
   */
  describe('for a reader who is neither an admin nor on the DAC in charge', () => {
    it('shows when granted access ended or was renewed, with no tabs to choose from', async () => {
      renderTrends(study, 'none')

      expect(await screen.findByRole('region', { name: 'Expiration and renewal' })).toBeInTheDocument()
      expect(screen.queryByRole('tablist')).not.toBeInTheDocument()
      expect(screen.queryByRole('tab')).not.toBeInTheDocument()
      await waitFor(() => expect(DarMetrics.getExpirations).toHaveBeenCalledWith({ ...range, limit: 1, target: study }))
      expect(DarMetrics.getRenewals).toHaveBeenCalledWith({ ...range, limit: 1, target: study })
      // The range and grouping still apply
      expect(screen.getByLabelText('From')).toHaveValue(range.from)
      expect(screen.getByRole('button', { name: 'Month' })).toBeInTheDocument()
    })

    it('never asks consent for the reports on denied and pending requests', async () => {
      renderTrends(study, 'none')
      await waitFor(() => expect(DarMetrics.getRenewals).toHaveBeenCalled())
      fireEvent.click(screen.getByRole('button', { name: 'Month' }))
      await waitFor(() => expect(DarMetrics.getRenewals).toHaveBeenCalledTimes(2))

      expect(DarMetrics.getVolume).not.toHaveBeenCalled()
      expect(DarMetrics.getDatasetDecisions).not.toHaveBeenCalled()
      expect(DarMetrics.getDatasetDecisionTurnaround).not.toHaveBeenCalled()
      expect(DarMetrics.getDecisions).not.toHaveBeenCalled()
      expect(DarMetrics.getDecisionTurnaround).not.toHaveBeenCalled()
    })

    /** Roles are read once the page's datasets load, so the answer can change under an open tab. */
    it('closes an open report on denied and pending requests when it is withdrawn', async () => {
      const { offer } = renderTrends(study, 'all')
      openTab('Decisions')
      await waitFor(() => expect(DarMetrics.getDatasetDecisions).toHaveBeenCalled())

      offer('none')

      expect(await screen.findByRole('region', { name: 'Expiration and renewal' })).toBeInTheDocument()
      expect(screen.queryByRole('region', { name: 'Decision funnel' })).not.toBeInTheDocument()
      expect(screen.queryByRole('tab')).not.toBeInTheDocument()
    })

    it('opens on volume once the other reports are on offer, when none was chosen', async () => {
      const { offer } = renderTrends(study, 'none')
      await screen.findByRole('region', { name: 'Expiration and renewal' })

      offer('own-dacs')

      expect(await screen.findByRole('tab', { name: 'Volume' })).toHaveAttribute('aria-selected', 'true')
      expect(screen.getAllByRole('tab')).toHaveLength(4)
    })
  })

  /**
   * Consent narrows a chair's or member's request-activity reports to the datasets their own DACs
   * are in charge of, and says nothing in the response. A study can be shared between DACs, so
   * the page says what those figures cover, beside a report that covers the whole study.
   */
  describe('the scope of a chair\'s or member\'s figures', () => {
    const scopeNote = /count requests for the datasets your DACs are in charge of/

    it('is stated on a study\'s page', async () => {
      renderTrends(study, 'own-dacs')

      expect(await screen.findByText(scopeNote)).toHaveTextContent(
        'Expiration & Renewal covers every dataset in the study.',
      )
      // Read in place, not announced: it reports nothing that just happened
      expect(screen.getByRole('note').textContent).toMatch(scopeNote)
      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
      expect(screen.getAllByRole('tab')).toHaveLength(4)
    })

    it('needs no stating for an admin, whose figures cover the whole study', async () => {
      renderTrends(study, 'all')
      await screen.findByRole('tab', { name: 'Volume' })

      expect(screen.queryByText(scopeNote)).not.toBeInTheDocument()
    })

    it('needs no stating for a reader who is offered none of them', async () => {
      renderTrends(study, 'none')
      await screen.findByRole('region', { name: 'Expiration and renewal' })

      expect(screen.queryByText(scopeNote)).not.toBeInTheDocument()
    })

    it('needs no stating on a dataset\'s page, which one DAC is in charge of', async () => {
      renderTrends({ kind: 'dataset', id: 7 }, 'own-dacs')
      await screen.findByRole('tab', { name: 'Volume' })

      expect(screen.queryByText(scopeNote)).not.toBeInTheDocument()
    })
  })

  it('reports on a dataset when the page is a dataset\'s', async () => {
    const dataset: DarMetricsTarget = { kind: 'dataset', id: 7 }

    renderTrends(dataset)

    await waitFor(() => expect(DarMetrics.getVolume).toHaveBeenCalledWith({ ...range, limit: 1, target: dataset }))
    expect(await screen.findByText(/that request this dataset\./)).toBeInTheDocument()
  })
})
