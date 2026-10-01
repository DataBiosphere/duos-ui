import React from 'react'
import '@testing-library/jest-dom/vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import AdminDashboard from 'src/pages/admin_console/AdminDashboard'
import { Admin, AdminDashboardSummary } from 'src/libs/ajax/Admin'
import { ADMIN_CONSOLE_SECTIONS } from 'src/pages/admin_console/adminConsoleRoutes'

vi.mock('src/libs/ajax/Admin', () => ({
  Admin: { getDashboardSummary: vi.fn() },
}))

vi.mock('src/contexts/NavigationStateContext', () => ({
  useNavigationState: () => ({ activeTab: 1 }),
}))

const summary: AdminDashboardSummary = {
  darRequests: { total: 714, approved: 287, canceled: 166, inProcess: 261 },
  dacs: { total: 12 },
  users: { total: 950 },
  institutions: { total: 40, withoutSigningOfficial: 6 },
  libraryCards: { total: 300 },
  daaAssociations: { agreements: 8, researchersApproved: 120 },
  metrics: {
    from: '2026-07-04',
    to: '2026-10-01',
    decisions: { submitted: 24, pending: 9, approved: 12, denied: 3 },
    turnaround: { decided: 15, unmeasured: 0, medianDays: 12.46, modeDays: 9 },
    soApprovals: { approved: 5, pending: 2, skipped: 7 },
    volume: { dars: 24, researchers: 19, institutions: 11 },
    expiration: { expired: 4, closedOut: 1, renewals: 6 },
  },
}

const renderDashboard = () => render(
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    <MemoryRouter>
      <AdminDashboard />
    </MemoryRouter>
  </QueryClientProvider>,
)

const tile = (name: string) => screen.getByRole('link', { name: new RegExp(`^${name}`) })

describe('AdminDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(Admin.getDashboardSummary).mockResolvedValue(summary)
  })

  it.each(ADMIN_CONSOLE_SECTIONS.map(section => [section.label, section.link]))(
    'links the %s tile to %s',
    (label, link) => {
      renderDashboard()

      expect(tile(label)).toHaveAttribute('href', link)
    },
  )

  it.each([
    ['Decisions', 'decisions'],
    ['DAC Turnaround', 'turnaround'],
    ['SO Approvals', 'so-approvals'],
    ['Volume', 'volume'],
    ['Expiration & Renewal', 'expiration'],
  ])('opens the %s tile on its Metrics tab', (label, tab) => {
    renderDashboard()

    expect(tile(label)).toHaveAttribute('href', `/admin_console/metrics?tab=${tab}`)
  })

  it('shows section counts and the 90-day metrics from one summary request', async () => {
    renderDashboard()

    expect(await within(tile('Data Access Requests')).findByLabelText('Total: 714')).toBeInTheDocument()
    expect(within(tile('Institutions')).getByLabelText('Without an SO: 6')).toBeInTheDocument()
    expect(within(tile('DAC Turnaround')).getByLabelText('Median Days: 12.5')).toBeInTheDocument()
    expect(within(tile('SO Approvals')).getByLabelText('Skipped: 7')).toBeInTheDocument()
    expect(within(tile('Expiration & Renewal')).getByLabelText('Renewals: 6')).toBeInTheDocument()
    expect(Admin.getDashboardSummary).toHaveBeenCalledTimes(1)
  })

  it('shows turnaround as unavailable when nothing was measured', async () => {
    vi.mocked(Admin.getDashboardSummary).mockResolvedValue({
      ...summary,
      metrics: { ...summary.metrics, turnaround: { decided: 0, unmeasured: 0 } },
    })

    renderDashboard()

    expect(await within(tile('DAC Turnaround')).findByLabelText('Median Days: unavailable')).toBeInTheDocument()
  })

  it('titles the page as the Admin Console with no promotion', () => {
    renderDashboard()

    expect(screen.getByText('Admin Console')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Get more out of DUOS' })).not.toBeInTheDocument()
  })
})
