import React from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { DarMetrics } from 'src/libs/ajax/DarMetrics'
import { DatasetsStudiesSection } from 'src/components/dar_analytics/DatasetsStudiesSection'
import { DarAnalyticsRange } from 'src/components/dar_analytics/darAnalyticsRange'
import { DatasetReport, StudyReport } from 'src/types/darMetrics'

vi.mock('src/libs/ajax/DarMetrics', () => ({
  DarMetrics: { getDatasets: vi.fn(), getStudies: vi.fn() },
}))

const range: DarAnalyticsRange = { from: '2026-01-01', to: '2026-06-30', bucket: 'quarter' }
const Q2 = Date.parse('2026-04-01T00:00:00Z')

const datasetReport = (overrides: Partial<DatasetReport> = {}): DatasetReport => ({
  from: range.from, to: range.to, bucket: 'QUARTER', total: 0, dacApproved: 0, buckets: [], ...overrides,
})
const studyReport = (overrides: Partial<StudyReport> = {}): StudyReport => ({
  from: range.from, to: range.to, bucket: 'QUARTER', total: 0, buckets: [], ...overrides,
})

const renderSection = () => render(
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    <DatasetsStudiesSection range={range} />
  </QueryClientProvider>,
)

const figure = (label: string) => screen.getByText(label, { selector: 'dt' }).nextSibling

describe('DatasetsStudiesSection', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('totals what was created and approved, and charts each period', async () => {
    vi.mocked(DarMetrics.getDatasets).mockResolvedValue(datasetReport({
      total: 5,
      dacApproved: 3,
      buckets: [{ bucketStart: Q2, count: 5, dacApproved: 3 }],
    }))
    vi.mocked(DarMetrics.getStudies).mockResolvedValue(studyReport({
      total: 2,
      buckets: [{ bucketStart: Q2, count: 2 }],
    }))

    renderSection()

    expect(await screen.findByText('Datasets created', { selector: 'dt' })).toBeInTheDocument()
    expect(figure('Datasets created')).toHaveTextContent('5')
    expect(figure('DAC approved')).toHaveTextContent('3')
    expect(figure('Studies created')).toHaveTextContent('2')
    expect(document.querySelector('[aria-label="Datasets and studies created per period"]'))
      .toHaveAccessibleDescription(
        '2026 Q1: Datasets created 0, DAC approved 0, Studies created 0; '
        + '2026 Q2: Datasets created 5, DAC approved 3, Studies created 2',
      )
    expect(DarMetrics.getDatasets).toHaveBeenCalledWith(range)
    expect(DarMetrics.getStudies).toHaveBeenCalledWith(range)
  })

  it('shows the empty state with the approval caveat', async () => {
    vi.mocked(DarMetrics.getDatasets).mockResolvedValue(datasetReport())
    vi.mocked(DarMetrics.getStudies).mockResolvedValue(studyReport())

    renderSection()

    expect(await screen.findByText('No datasets or studies were created in this range.')).toBeInTheDocument()
    expect(screen.getByText(/DAC approval is as it stands now/)).toBeInTheDocument()
  })

  it('waits while the two reports cover different ranges', async () => {
    vi.mocked(DarMetrics.getDatasets).mockResolvedValue(datasetReport({ total: 2 }))
    vi.mocked(DarMetrics.getStudies).mockResolvedValue(studyReport({ from: '2025-01-01', total: 1 }))

    renderSection()

    expect(await screen.findByLabelText('Loading Datasets & Studies')).toBeInTheDocument()
    expect(screen.queryByText('Datasets created', { selector: 'dt' })).not.toBeInTheDocument()
  })

  it('shows either failed report as an error', async () => {
    vi.mocked(DarMetrics.getDatasets).mockResolvedValue(datasetReport())
    vi.mocked(DarMetrics.getStudies).mockRejectedValue({ message: 'Forbidden', code: 403 })

    renderSection()

    expect(await screen.findByText('Unable to load Datasets & Studies: Forbidden')).toBeInTheDocument()
  })
})
