import React from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { DarMetrics } from 'src/libs/ajax/DarMetrics'
import { ExpirationRenewalSection } from 'src/components/dar_analytics/ExpirationRenewalSection'
import { DarAnalyticsRange } from 'src/components/dar_analytics/darAnalyticsRange'
import { DarExpirationReport, DarRenewalReport, ExpirationBucket, RenewalBucket } from 'src/types/darMetrics'

vi.mock('src/libs/ajax/DarMetrics', () => ({
  DarMetrics: { getExpirations: vi.fn(), getRenewals: vi.fn() },
}))

const range: DarAnalyticsRange = { from: '2026-01-01', to: '2026-06-30', bucket: 'quarter' }
const Q1 = Date.parse('2026-01-01T00:00:00Z')
const Q2 = Date.parse('2026-04-01T00:00:00Z')

const base = { from: range.from, to: range.to, bucket: 'QUARTER' as const, rows: [] }
const expirations = (buckets: ExpirationBucket[]): DarExpirationReport =>
  ({ ...base, total: buckets.reduce((sum, b) => sum + b.count, 0), buckets })
const renewals = (buckets: RenewalBucket[]): DarRenewalReport =>
  ({ ...base, total: buckets.reduce((sum, b) => sum + b.renewalCount, 0), buckets })

const section = (queryClient: QueryClient, shown = range) => (
  <QueryClientProvider client={queryClient}><ExpirationRenewalSection range={shown} /></QueryClientProvider>
)
const renderSection = () => render(section(new QueryClient({ defaultOptions: { queries: { retry: false } } })))

const cellsFor = (label: string) =>
  within(screen.getByRole('gridcell', { name: label }).closest<HTMLElement>('[role="row"]')!)
    .getAllByRole('gridcell')
    .map(cell => cell.textContent)

describe('ExpirationRenewalSection', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('lines up expirations, closeouts and renewals per period', async () => {
    vi.mocked(DarMetrics.getExpirations).mockResolvedValue(expirations([
      { bucketStart: Q1, reason: 'EXPIRED', count: 2 },
      { bucketStart: Q1, reason: 'CLOSED_OUT', count: 1 },
      { bucketStart: Q2, reason: 'EXPIRED', count: 3 },
    ]))
    vi.mocked(DarMetrics.getRenewals).mockResolvedValue(renewals([
      { bucketStart: Q2, renewalCount: 4, collectionCount: 2 },
    ]))

    renderSection()

    await screen.findByRole('grid', { name: 'Expiration and renewal per period' })
    expect(cellsFor('2026 Q1')).toEqual(['2026 Q1', '2', '1', '0'])
    expect(cellsFor('2026 Q2')).toEqual(['2026 Q2', '3', '0', '4'])
    expect(screen.getByRole('group', { name: 'Expired' })).toHaveTextContent('5')
    expect(screen.getByRole('group', { name: 'Closed out' })).toHaveTextContent('1')
    expect(screen.getByRole('group', { name: 'Datasets renewed' })).toHaveTextContent('4')
  })

  it('shows the empty state when nothing ended or was renewed', async () => {
    vi.mocked(DarMetrics.getExpirations).mockResolvedValue(expirations([]))
    vi.mocked(DarMetrics.getRenewals).mockResolvedValue(renewals([]))

    renderSection()

    expect(await screen.findByText('No access ended and nothing was renewed in this range.')).toBeInTheDocument()
  })

  it('waits for both reports on a new range rather than lining renewals up with old periods', async () => {
    const ended = expirations([{ bucketStart: Q1, reason: 'EXPIRED', count: 2 }])
    vi.mocked(DarMetrics.getExpirations).mockResolvedValueOnce(ended).mockResolvedValueOnce({ ...ended, bucket: 'MONTH' })
    vi.mocked(DarMetrics.getRenewals).mockResolvedValueOnce(renewals([{ bucketStart: Q1, renewalCount: 1, collectionCount: 1 }]))
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const { rerender } = render(section(queryClient))
    await screen.findByRole('grid')
    vi.mocked(DarMetrics.getRenewals).mockReturnValueOnce(new Promise(() => {}))

    rerender(section(queryClient, { ...range, bucket: 'month' }))

    expect(await screen.findByLabelText('Loading Expiration and renewal')).toBeInTheDocument()
  })

  it('waits when two quick range changes leave the reports on different old ranges', async () => {
    const ended = expirations([{ bucketStart: Q1, reason: 'EXPIRED', count: 2 }])
    vi.mocked(DarMetrics.getExpirations).mockResolvedValueOnce(ended).mockResolvedValueOnce({ ...ended, bucket: 'MONTH' })
      .mockReturnValueOnce(new Promise(() => {}))
    vi.mocked(DarMetrics.getRenewals).mockResolvedValueOnce(renewals([{ bucketStart: Q1, renewalCount: 1, collectionCount: 1 }]))
      .mockReturnValue(new Promise(() => {}))
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const { rerender } = render(section(queryClient))
    await screen.findByRole('grid')
    rerender(section(queryClient, { ...range, bucket: 'month' }))
    await waitFor(() => expect(DarMetrics.getExpirations).toHaveBeenCalledTimes(2))
    rerender(section(queryClient, { ...range, bucket: 'week' }))

    expect(await screen.findByLabelText('Loading Expiration and renewal')).toBeInTheDocument()
  })

  it('shows the error when either report fails', async () => {
    vi.mocked(DarMetrics.getExpirations).mockResolvedValue(expirations([]))
    vi.mocked(DarMetrics.getRenewals).mockRejectedValue({ message: 'Forbidden', code: 403 })

    renderSection()

    expect(await screen.findByRole('alert')).toHaveTextContent('Forbidden')
  })
})
