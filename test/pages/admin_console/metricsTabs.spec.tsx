import React from 'react'
import { describe, expect, it, vi } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { DarMetrics } from 'src/libs/ajax/DarMetrics'
import { DAC_METRICS_TABS, METRICS_TABS } from 'src/pages/admin_console/metricsTabs'

vi.mock('src/libs/ajax/DarMetrics', () => ({
  DarMetrics: { getElections: vi.fn() },
}))

describe('metricsTabs', () => {
  it('gives DACs only the tabs consent scopes to DACs, in the admin order', () => {
    expect(DAC_METRICS_TABS.map(({ key }) => key)).toEqual(['decisions', 'turnaround', 'volume', 'expiration'])
    expect(METRICS_TABS.map(({ key }) => key)).toContain('so-approvals')
  })

  it('renders the Elections & Votes section for the range on the elections tab', async () => {
    const range = { from: '2026-01-01', to: '2026-03-31', bucket: 'month' as const }
    vi.mocked(DarMetrics.getElections).mockResolvedValue({
      from: range.from, to: range.to, bucket: 'MONTH', electionsOpened: 0, votesCast: 0, elections: [], votes: [],
    })
    const tab = METRICS_TABS.find(({ key }) => key === 'elections')

    render(
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        {tab?.render(range)}
      </QueryClientProvider>,
    )

    expect(tab?.label).toBe('Elections & Votes')
    expect(await screen.findByText('No elections were opened and no votes were cast in this range.')).toBeInTheDocument()
    expect(DarMetrics.getElections).toHaveBeenCalledWith(range)
  })
})
