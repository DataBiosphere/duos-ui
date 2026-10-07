import React from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { DarMetrics } from 'src/libs/ajax/DarMetrics'
import { ElectionsVotesSection } from 'src/components/dar_analytics/ElectionsVotesSection'
import { DarAnalyticsRange } from 'src/components/dar_analytics/darAnalyticsRange'
import { ElectionReport } from 'src/types/darMetrics'

vi.mock('src/libs/ajax/DarMetrics', () => ({
  DarMetrics: { getElections: vi.fn() },
}))

const range: DarAnalyticsRange = { from: '2026-01-01', to: '2026-06-30', bucket: 'quarter' }
const Q1 = Date.parse('2026-01-01T00:00:00Z')
const Q2 = Date.parse('2026-04-01T00:00:00Z')

const report = (overrides: Partial<ElectionReport> = {}): ElectionReport => ({
  from: range.from,
  to: range.to,
  bucket: 'QUARTER',
  electionsOpened: 0,
  votesCast: 0,
  elections: [],
  votes: [],
  ...overrides,
})

const renderSection = () => render(
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    <ElectionsVotesSection range={range} />
  </QueryClientProvider>,
)

const figure = (label: string) => screen.getByText(label, { selector: 'dt' }).nextSibling
const chart = (title: string) => document.querySelector(`[aria-label="${title}"]`)

describe('ElectionsVotesSection', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('totals elections and votes, and charts only the statuses and types that occur', async () => {
    vi.mocked(DarMetrics.getElections).mockResolvedValue(report({
      electionsOpened: 4,
      votesCast: 6,
      elections: [
        { bucketStart: Q1, status: 'Closed', count: 2 },
        { bucketStart: Q2, status: 'Canceled', count: 1 },
        { bucketStart: Q2, status: 'Open', count: 1 },
      ],
      votes: [
        { bucketStart: Q1, type: 'DAC', count: 4 },
        { bucketStart: Q2, type: 'RADAR_APPROVE', count: 2 },
      ],
    }))

    renderSection()

    expect(await screen.findByText('Elections opened', { selector: 'dt' })).toBeInTheDocument()
    expect(figure('Elections opened')).toHaveTextContent('4')
    expect(figure('Votes cast')).toHaveTextContent('6')
    expect(chart('Elections opened per period by status')).toHaveAccessibleDescription(
      '2026 Q1: Open 0, Closed 2, Canceled 0; 2026 Q2: Open 1, Closed 0, Canceled 1',
    )
    expect(chart('Votes cast per period by type')).toHaveAccessibleDescription(
      '2026 Q1: DAC member 4, RADAR auto-approval 0; 2026 Q2: DAC member 0, RADAR auto-approval 2',
    )
    expect(DarMetrics.getElections).toHaveBeenCalledWith(range)
  })

  it('labels every status and vote type consent sends, adding up repeated rows', async () => {
    vi.mocked(DarMetrics.getElections).mockResolvedValue(report({
      electionsOpened: 6,
      votesCast: 6,
      elections: ['Open', 'Closed', 'Canceled', 'Final', 'PendingApproval', 'Open']
        .map(status => ({ bucketStart: Q1, status, count: 1 })),
      votes: ['DAC', 'FINAL', 'Chairperson', 'AGREEMENT', 'RADAR_APPROVE', 'DAC']
        .map(type => ({ bucketStart: Q1, type, count: 1 })),
    }))

    renderSection()

    expect(await screen.findByText('Elections opened', { selector: 'dt' })).toBeInTheDocument()
    expect(chart('Elections opened per period by status')).toHaveAccessibleDescription(
      '2026 Q1: Open 2, Closed 1, Canceled 1, Final 1, Pending approval 1; '
      + '2026 Q2: Open 0, Closed 0, Canceled 0, Final 0, Pending approval 0',
    )
    expect(chart('Votes cast per period by type')).toHaveAccessibleDescription(
      '2026 Q1: DAC member 2, Final (chair) 1, Chairperson 1, Agreement 1, RADAR auto-approval 1; '
      + '2026 Q2: DAC member 0, Final (chair) 0, Chairperson 0, Agreement 0, RADAR auto-approval 0',
    )
  })

  it('says so in place of a chart with nothing in the range', async () => {
    vi.mocked(DarMetrics.getElections).mockResolvedValue(report({
      votesCast: 2,
      votes: [{ bucketStart: Q2, type: 'DAC', count: 2 }],
    }))

    renderSection()

    expect(await screen.findByText('No elections were opened in this range.')).toBeInTheDocument()
    expect(chart('Elections opened per period by status')).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Votes cast per period by type' })).toBeInTheDocument()
  })

  it('charts a status it does not know under its own name', async () => {
    vi.mocked(DarMetrics.getElections).mockResolvedValue(report({
      electionsOpened: 1,
      elections: [{ bucketStart: Q2, status: 'Archived', count: 1 }],
    }))

    renderSection()

    expect(await screen.findByText('Elections opened', { selector: 'dt' })).toBeInTheDocument()
    expect(chart('Elections opened per period by status')).toHaveAccessibleDescription(
      '2026 Q1: Archived 0; 2026 Q2: Archived 1',
    )
  })

  it('shows the empty state with the status caveat', async () => {
    vi.mocked(DarMetrics.getElections).mockResolvedValue(report())

    renderSection()

    expect(await screen.findByText('No elections were opened and no votes were cast in this range.')).toBeInTheDocument()
    expect(screen.getByText(/counts under the status it has now/)).toBeInTheDocument()
  })

  it('shows a failed report as an error', async () => {
    vi.mocked(DarMetrics.getElections).mockRejectedValue({ message: 'Forbidden', code: 403 })

    renderSection()

    expect(await screen.findByText('Unable to load Elections & Votes: Forbidden')).toBeInTheDocument()
  })
})
