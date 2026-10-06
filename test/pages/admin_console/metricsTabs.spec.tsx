import React from 'react'
import { describe, expect, it, vi } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { DarMetrics } from 'src/libs/ajax/DarMetrics'
import { DAC_METRICS_TABS, METRICS_TABS } from 'src/pages/admin_console/metricsTabs'

vi.mock('src/libs/ajax/DarMetrics', () => ({
  DarMetrics: { getDarTerms: vi.fn() },
}))

describe('metricsTabs', () => {
  it('gives DACs only the tabs consent scopes to DACs, in the admin order', () => {
    expect(DAC_METRICS_TABS.map(({ key }) => key)).toEqual(['decisions', 'turnaround', 'volume', 'expiration'])
    expect(METRICS_TABS.map(({ key }) => key)).toContain('so-approvals')
  })

  it('renders the Research Terms section for the range on the terms tab', async () => {
    const range = { from: '2026-01-01', to: '2026-03-31', bucket: 'month' as const }
    vi.mocked(DarMetrics.getDarTerms).mockResolvedValue({ from: range.from, to: range.to, terms: [] })
    const tab = METRICS_TABS.find(({ key }) => key === 'terms')

    render(
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        {tab?.render(range)}
      </QueryClientProvider>,
    )

    expect(tab?.label).toBe('Research Terms')
    expect(await screen.findByText('No DAR submitted in this range cited an ontology term.')).toBeInTheDocument()
    expect(DarMetrics.getDarTerms).toHaveBeenCalledWith({ from: range.from, to: range.to, limit: 10 })
  })
})
