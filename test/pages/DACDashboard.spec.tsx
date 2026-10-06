import React from 'react'
import '@testing-library/jest-dom/vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import DACDashboard from 'src/pages/DACDashboard'
import { DAC, DacDashboardSummary } from 'src/libs/ajax/DAC'
import { Storage } from 'src/libs/storage'
import { Notifications } from 'src/libs/utils'
import { DuosUser } from 'src/types/model'

vi.mock('src/libs/ajax/DAC', () => ({
  DAC: { getDashboardSummary: vi.fn() },
}))

vi.mock('src/libs/storage', () => ({
  Storage: { getCurrentUser: vi.fn() },
}))

vi.mock('src/contexts/NavigationStateContext', () => ({
  useNavigationState: () => ({ activeTab: 0 }),
}))

vi.mock('src/components/modals/SupportRequestModal', () => ({
  SupportRequestModal: () => null,
}))

const chair = { userId: 1, isChairPerson: true, isMember: false } as unknown as DuosUser
const member = { userId: 2, isChairPerson: false, isMember: true } as unknown as DuosUser

const summary: DacDashboardSummary = {
  darRequests: { total: 8, approved: 3, pending: 5, awaitingMyVote: 2 },
  dacs: { total: 4 },
  dacDatasets: { total: 6 },
  dataLibrary: { studies: 7, datasets: 12, models: 3, workspaces: 1 },
  metrics: {
    from: '2026-07-04',
    to: '2026-10-01',
    decisions: { submitted: 6, pending: 2, approved: 3, denied: 1, mixed: 0, canceled: 0 },
    turnaround: { decided: 4, unmeasured: 0, medianDays: 11.24, modeDays: 9 },
    volume: { dars: 6, researchers: 5, institutions: 4 },
    expiration: { expired: 1, closedOut: 0, renewals: 2 },
  },
}

const renderDashboard = (
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } }),
) => render(
  <QueryClientProvider client={client}>
    <MemoryRouter>
      <DACDashboard />
    </MemoryRouter>
  </QueryClientProvider>,
)

describe('DACDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(Storage.getCurrentUser).mockReturnValue(chair)
    vi.mocked(DAC.getDashboardSummary).mockResolvedValue(summary)
  })

  it('renders chair tiles, placeholders, and all counts from one request', async () => {
    let resolveSummary: (value: DacDashboardSummary) => void = () => undefined
    vi.mocked(DAC.getDashboardSummary).mockReturnValue(
      new Promise(resolve => resolveSummary = resolve),
    )
    renderDashboard()

    expect(screen.getAllByText('–')).toHaveLength(23)
    expect(screen.getByRole('link', { name: /Data Access Requests/ })).toHaveAttribute(
      'href', '/dac_console_dar_requests',
    )
    expect(screen.getByRole('link', { name: /Manage DACs/ })).toHaveAttribute(
      'href', '/dac_console/manage_dac',
    )
    expect(screen.getByRole('link', { name: /My DAC's Datasets/ })).toHaveAttribute('href', '/dac_datasets')

    resolveSummary(summary)
    await waitFor(() => expect(screen.queryByText('–')).not.toBeInTheDocument())
    expect(screen.getByLabelText('Studies: 7')).toBeInTheDocument()
    expect(screen.getByLabelText('DACs: 4')).toBeInTheDocument()
    expect(screen.getByLabelText('Datasets: 6')).toBeInTheDocument()
    expect(DAC.getDashboardSummary).toHaveBeenCalledTimes(1)
  })

  it('shows the 90-day metric tiles, each opening its DAC Metrics tab, without SO Approvals', async () => {
    renderDashboard()

    expect(await screen.findByLabelText('Median Days: 11.2')).toBeInTheDocument()
    expect(screen.getByLabelText('Renewals: 2')).toBeInTheDocument()
    await waitFor(() => expect(screen.getByRole('link', { name: /^Decisions/ })).toHaveAttribute(
      'href', '/dac_console/metrics?tab=decisions&from=2026-07-04&to=2026-10-01&bucket=week',
    ))
    expect(screen.getByRole('link', { name: /^Expiration & Renewal/ })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /^SO Approvals/ })).not.toBeInTheDocument()
  })

  it('shows meaningful DAR counts without the misleading Denied count', async () => {
    renderDashboard()

    expect(await screen.findByLabelText('Total: 8')).toBeInTheDocument()
    const darTile = within(screen.getByRole('link', { name: /^Data Access Requests/ }))
    expect(darTile.getByLabelText('Approved: 3')).toBeInTheDocument()
    expect(darTile.getByLabelText('Pending: 5')).toBeInTheDocument()
    expect(darTile.getByLabelText('Awaiting My Vote: 2')).toBeInTheDocument()
    expect(darTile.queryByText('Denied')).not.toBeInTheDocument()
  })

  it('hides chair-only tiles from members but still makes one summary request', async () => {
    vi.mocked(Storage.getCurrentUser).mockReturnValue(member)
    renderDashboard()

    expect(await screen.findByLabelText('Studies: 7')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /Manage DACs/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /My DAC's Datasets/ })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Data Library/ })).toHaveAttribute('href', '/datalibrary')
    expect(DAC.getDashboardSummary).toHaveBeenCalledTimes(1)
  })

  it('does not reveal chair-only tiles when the stored chair flag is missing', async () => {
    vi.mocked(Storage.getCurrentUser).mockReturnValue({ userId: 3 } as unknown as DuosUser)
    renderDashboard()

    expect(await screen.findByLabelText('Studies: 7')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /Manage DACs/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /My DAC's Datasets/ })).not.toBeInTheDocument()
  })

  it('notifies the user and leaves unavailable placeholders when the request fails', async () => {
    const notification = vi.spyOn(Notifications, 'showError').mockImplementation(() => undefined)
    vi.mocked(DAC.getDashboardSummary).mockRejectedValue(new Error('backend unavailable'))
    renderDashboard()

    await waitFor(() => expect(notification).toHaveBeenCalledWith({
      text: 'Error: Unable to load dashboard statistics: backend unavailable',
    }))
    expect(screen.getAllByText('–')).toHaveLength(23)
    expect(within(screen.getByRole('link', { name: /^Data Access Requests/ })).getByLabelText('Pending: unavailable')).toBeInTheDocument()
  })
})
