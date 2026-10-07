import React from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { render, screen, within } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { DarMetrics } from 'src/libs/ajax/DarMetrics'
import { ResearchTermsSection, shortTermId } from 'src/components/dar_analytics/ResearchTermsSection'
import { DarAnalyticsRange } from 'src/components/dar_analytics/darAnalyticsRange'
import { TermReport } from 'src/types/darMetrics'

vi.mock('src/libs/ajax/DarMetrics', () => ({
  DarMetrics: { getDarTerms: vi.fn() },
}))

const range: DarAnalyticsRange = { from: '2026-01-01', to: '2026-06-30', bucket: 'quarter' }
const PURL = 'http://purl.obolibrary.org/obo/'

const report = (terms: TermReport['terms'] = []): TermReport => ({ from: range.from, to: range.to, terms })

const renderSection = () => render(
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    <ResearchTermsSection range={range} />
  </QueryClientProvider>,
)

describe('ResearchTermsSection', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('ranks the top ten terms with their DAR counts and short ids', async () => {
    vi.mocked(DarMetrics.getDarTerms).mockResolvedValue(report([
      { id: `${PURL}MONDO_0004992`, label: 'cancer', darCount: 4 },
      { id: `${PURL}MONDO_0004979`, label: 'asthma', darCount: 1 },
      { id: `${PURL}MONDO_0005015`, darCount: 1 },
      { id: `${PURL}HP_0001250`, label: ' ', darCount: 1 },
    ]))

    renderSection()

    const list = await screen.findByRole('list', { name: 'Most cited terms' })
    const [first, second, third] = within(list).getAllByRole('listitem')
    expect(first.textContent).toBe('1cancerMONDO:00049924 DARs')
    expect(second.textContent).toBe('2asthmaMONDO:00049791 DAR')
    expect(third.textContent).toBe('2MONDO:00050151 DAR')
    expect(within(list).getAllByRole('listitem')[3].textContent).toBe('2HP:00012501 DAR')
    expect(DarMetrics.getDarTerms).toHaveBeenCalledWith({ from: range.from, to: range.to, limit: 10 })
  })

  it('draws each bar against the most cited term', async () => {
    vi.mocked(DarMetrics.getDarTerms).mockResolvedValue(report([
      { id: 'a', label: 'a', darCount: 4 },
      { id: 'b', label: 'b', darCount: 1 },
    ]))

    renderSection()

    const items = within(await screen.findByRole('list')).getAllByRole('listitem')
    const bar = (item: HTMLElement) => item.querySelector('[aria-hidden="true"] > div')
    expect(bar(items[0])).toHaveStyle({ width: '100%' })
    expect(bar(items[1])).toHaveStyle({ width: '25%' })
  })

  it('does not refetch when only the grouping changes', async () => {
    vi.mocked(DarMetrics.getDarTerms).mockResolvedValue(report([{ id: 'a', label: 'a', darCount: 1 }]))
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const { rerender } = render(
      <QueryClientProvider client={client}><ResearchTermsSection range={range} /></QueryClientProvider>,
    )
    await screen.findByRole('list')

    rerender(
      <QueryClientProvider client={client}><ResearchTermsSection range={{ ...range, bucket: 'month' }} /></QueryClientProvider>,
    )

    expect(await screen.findByRole('list')).toBeInTheDocument()
    expect(DarMetrics.getDarTerms).toHaveBeenCalledTimes(1)
  })

  it('shows the empty state with the counting caveat', async () => {
    vi.mocked(DarMetrics.getDarTerms).mockResolvedValue(report())

    renderSection()

    expect(await screen.findByText('No DAR submitted in this range cited an ontology term.')).toBeInTheDocument()
    expect(screen.getByText(/a DAR counts once per term/)).toBeInTheDocument()
  })

  it('shows a failed report as an error', async () => {
    vi.mocked(DarMetrics.getDarTerms).mockRejectedValue({ message: 'Forbidden', code: 403 })

    renderSection()

    expect(await screen.findByText('Unable to load Research Terms: Forbidden')).toBeInTheDocument()
  })
})

describe('shortTermId', () => {
  it.each([
    [`${PURL}MONDO_0005015`, 'MONDO:0005015'],
    ['MONDO:0005015', 'MONDO:0005015'],
    [`${PURL}NCIT_C3262`, 'NCIT:C3262'],
    ['custom-term', 'custom-term'],
  ])('shortens %s to %s', (id, expected) => {
    expect(shortTermId(id)).toBe(expected)
  })
})
