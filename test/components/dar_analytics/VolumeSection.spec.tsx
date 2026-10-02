import React from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { render, screen, within } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { DarMetrics } from 'src/libs/ajax/DarMetrics'
import { VolumeSection } from 'src/components/dar_analytics/VolumeSection'
import { DarAnalyticsRange } from 'src/components/dar_analytics/darAnalyticsRange'
import { DarVolumeReport } from 'src/types/darMetrics'

vi.mock('src/libs/ajax/DarMetrics', () => ({
  DarMetrics: { getVolume: vi.fn() },
}))

const range: DarAnalyticsRange = { from: '2026-01-01', to: '2026-06-30', bucket: 'quarter' }
const Q1 = Date.parse('2026-01-01T00:00:00Z')
const Q2 = Date.parse('2026-04-01T00:00:00Z')

const report = (overrides: Partial<DarVolumeReport> = {}): DarVolumeReport => ({
  from: range.from,
  to: range.to,
  bucket: 'QUARTER',
  total: 0,
  buckets: [],
  rows: [],
  institutions: [],
  researchers: [],
  ...overrides,
})

const renderSection = () => render(
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    <VolumeSection range={range} />
  </QueryClientProvider>,
)

const figure = (label: string) => screen.getByText(label, { selector: 'dt' }).nextSibling

describe('VolumeSection', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('totals DARs, researchers, institutions and datasets and lists DARs by institution', async () => {
    vi.mocked(DarMetrics.getVolume).mockResolvedValue(report({
      total: 5,
      buckets: [
        { bucketStart: Q1, darCount: 3, researcherCount: 2, institutionCount: 2, datasetCount: 4 },
        { bucketStart: Q2, darCount: 2, researcherCount: 2, institutionCount: 1, datasetCount: 3 },
      ],
      institutions: [
        { institutionId: 7, institutionName: 'Broad Institute', darCount: 4, researcherCount: 2 },
        { darCount: 1, researcherCount: 1 },
      ],
      researchers: [{ userId: 1, darCount: 3 }, { userId: 2, darCount: 1 }, { userId: 3, darCount: 1 }],
    }))

    renderSection()

    const grid = await screen.findByRole('grid', { name: 'DARs by institution' })
    expect(figure('DARs submitted')).toHaveTextContent('5')
    expect(figure('Researchers')).toHaveTextContent('3')
    expect(figure('Institutions')).toHaveTextContent('1')
    expect(figure('Dataset requests')).toHaveTextContent('7')
    expect(within(grid).getByRole('gridcell', { name: 'Broad Institute' })).toBeInTheDocument()
    expect(within(grid).getByRole('gridcell', { name: 'No institution' })).toBeInTheDocument()
    expect(document.querySelector('[aria-label="DARs submitted per period"]'))
      .toHaveAccessibleDescription('2026 Q1: DARs submitted 3; 2026 Q2: DARs submitted 2')
    expect(DarMetrics.getVolume).toHaveBeenCalledWith({ ...range, limit: 1 })
  })

  it('shows the empty state with the institution caveat', async () => {
    vi.mocked(DarMetrics.getVolume).mockResolvedValue(report())

    renderSection()

    expect(await screen.findByText('No DARs were submitted in this range.')).toBeInTheDocument()
    expect(screen.getByText(/shows the institution recorded when it was submitted/)).toBeInTheDocument()
  })
})
