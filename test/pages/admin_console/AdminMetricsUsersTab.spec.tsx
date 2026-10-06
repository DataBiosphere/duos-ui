import React from 'react'
import { describe, expect, it, vi } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderWithRouter } from '../../test-utils'
import AdminMetrics from 'src/pages/admin_console/AdminMetrics'
import { DarMetrics } from 'src/libs/ajax/DarMetrics'

vi.mock('src/libs/ajax/DarMetrics', () => ({
  DarMetrics: { getUsers: vi.fn(), getInstitutions: vi.fn() },
}))

describe('AdminMetrics Users & Institutions tab', () => {
  it('opens from ?tab=users and loads both reports for the range', async () => {
    const range = { from: '2026-01-01', to: '2026-03-31', bucket: 'month' as const }
    const empty = { from: range.from, to: range.to, bucket: 'MONTH' as const, total: 0, buckets: [] }
    vi.mocked(DarMetrics.getUsers).mockResolvedValue({ ...empty, roles: [] })
    vi.mocked(DarMetrics.getInstitutions).mockResolvedValue(empty)

    renderWithRouter(
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <AdminMetrics />
      </QueryClientProvider>,
      { route: '/admin_console/metrics?tab=users&from=2026-01-01&to=2026-03-31&bucket=month' },
    )

    expect(screen.getByRole('tab', { name: 'Users & Institutions' })).toHaveAttribute('aria-selected', 'true')
    expect(await screen.findByText('No users or institutions were created in this range.')).toBeInTheDocument()
    expect(DarMetrics.getUsers).toHaveBeenCalledWith(range)
    expect(DarMetrics.getInstitutions).toHaveBeenCalledWith(range)
  })
})
