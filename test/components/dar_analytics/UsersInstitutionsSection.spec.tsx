import React from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { render, screen, within } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { DarMetrics } from 'src/libs/ajax/DarMetrics'
import { UsersInstitutionsSection } from 'src/components/dar_analytics/UsersInstitutionsSection'
import { DarAnalyticsRange } from 'src/components/dar_analytics/darAnalyticsRange'
import { InstitutionReport, UserReport } from 'src/types/darMetrics'

vi.mock('src/libs/ajax/DarMetrics', () => ({
  DarMetrics: { getUsers: vi.fn(), getInstitutions: vi.fn() },
}))

const range: DarAnalyticsRange = { from: '2026-01-01', to: '2026-06-30', bucket: 'quarter' }
const Q2 = Date.parse('2026-04-01T00:00:00Z')

const userReport = (overrides: Partial<UserReport> = {}): UserReport => ({
  from: range.from, to: range.to, bucket: 'QUARTER', total: 0, buckets: [], roles: [], ...overrides,
})
const institutionReport = (overrides: Partial<InstitutionReport> = {}): InstitutionReport => ({
  from: range.from, to: range.to, bucket: 'QUARTER', total: 0, buckets: [], ...overrides,
})

const renderSection = () => render(
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    <UsersInstitutionsSection range={range} />
  </QueryClientProvider>,
)

const figure = (label: string) => screen.getByText(label, { selector: 'dt' }).nextSibling

describe('UsersInstitutionsSection', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('totals what was created, charts each period, and lists users by role', async () => {
    vi.mocked(DarMetrics.getUsers).mockResolvedValue(userReport({
      total: 4,
      buckets: [{ bucketStart: Q2, count: 4 }],
      roles: [{ role: 'Researcher', userCount: 4 }, { role: 'Signing Official', userCount: 1 }],
    }))
    vi.mocked(DarMetrics.getInstitutions).mockResolvedValue(institutionReport({
      total: 1,
      buckets: [{ bucketStart: Q2, count: 1 }],
    }))

    renderSection()

    const grid = await screen.findByRole('grid', { name: 'Users created by role' })
    expect(figure('Users created')).toHaveTextContent('4')
    expect(figure('Institutions created')).toHaveTextContent('1')
    expect(within(grid).getByRole('gridcell', { name: 'Signing Official' })).toBeInTheDocument()
    expect(document.querySelector('[aria-label="Users and institutions created per period"]'))
      .toHaveAccessibleDescription(
        '2026 Q1: Users created 0, Institutions created 0; 2026 Q2: Users created 4, Institutions created 1',
      )
    expect(DarMetrics.getUsers).toHaveBeenCalledWith(range)
    expect(DarMetrics.getInstitutions).toHaveBeenCalledWith(range)
  })

  it('shows the empty state with the accounts-created caveat', async () => {
    vi.mocked(DarMetrics.getUsers).mockResolvedValue(userReport())
    vi.mocked(DarMetrics.getInstitutions).mockResolvedValue(institutionReport())

    renderSection()

    expect(await screen.findByText('No users or institutions were created in this range.')).toBeInTheDocument()
    expect(screen.getByText(/these are accounts created, not active users/)).toBeInTheDocument()
  })

  it('waits while the two reports cover different ranges', async () => {
    vi.mocked(DarMetrics.getUsers).mockResolvedValue(userReport({ total: 2 }))
    vi.mocked(DarMetrics.getInstitutions).mockResolvedValue(institutionReport({ from: '2025-01-01', total: 1 }))

    renderSection()

    expect(await screen.findByLabelText('Loading Users & Institutions')).toBeInTheDocument()
    expect(screen.queryByRole('grid')).not.toBeInTheDocument()
  })

  it('shows either failed report as an error', async () => {
    vi.mocked(DarMetrics.getUsers).mockResolvedValue(userReport())
    vi.mocked(DarMetrics.getInstitutions).mockRejectedValue({ message: 'Forbidden', code: 403 })

    renderSection()

    expect(await screen.findByText('Unable to load Users & Institutions: Forbidden')).toBeInTheDocument()
  })
})
