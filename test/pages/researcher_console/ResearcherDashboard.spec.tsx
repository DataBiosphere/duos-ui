import React from 'react'
import '@testing-library/jest-dom/vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ResearcherDashboard from 'src/pages/researcher_console/ResearcherDashboard'
import { Researcher, ResearcherDashboardSummary } from 'src/libs/ajax/Researcher'
import { Storage } from 'src/libs/storage'
import { Notifications } from 'src/libs/utils'
import { DuosUser } from 'src/types/model'

vi.mock('src/libs/ajax/Researcher', () => ({
  Researcher: { getDashboardSummary: vi.fn() },
}))

vi.mock('src/libs/storage', () => ({
  Storage: { getCurrentUser: vi.fn() },
}))

vi.mock('src/contexts/NavigationStateContext', () => ({
  useNavigationState: () => ({ activeTab: 4 }),
}))

vi.mock('src/components/modals/SupportRequestModal', () => ({
  SupportRequestModal: ({ showModal, url, onCloseRequest }: {
    showModal: boolean
    url?: string
    onCloseRequest: () => void
  }) => showModal
    ? (
        <div data-testid="support-modal" data-url={url}>
          <button type="button" onClick={onCloseRequest}>Close support</button>
        </div>
      )
    : null,
}))

// The dashboard only reads the role flags off these fixtures, so they stay minimal.
const researcher = { userId: 1, isResearcher: true, isDataSubmitter: false } as unknown as DuosUser
const dataSubmitter = { ...researcher, isDataSubmitter: true } as unknown as DuosUser

const summary: ResearcherDashboardSummary = {
  dataLibrary: { studies: 7, datasets: 12, models: 3, workspaces: 1 },
  darRequests: { total: 8, approved: 3, canceled: 1, inProcess: 4 },
  datasetApprovals: { active: 6, expiringSoon: 2, expired: 5 },
  dataSubmissions: { total: 9 },
}

const LocationStateProbe = () => {
  const location = useLocation()
  return <output data-testid="location-state">{JSON.stringify(location.state)}</output>
}

const renderDashboard = (
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } }),
) => render(
  <QueryClientProvider client={client}>
    <MemoryRouter>
      <ResearcherDashboard />
      <LocationStateProbe />
    </MemoryRouter>
  </QueryClientProvider>,
)

describe('ResearcherDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(Storage.getCurrentUser).mockReturnValue(researcher)
    vi.mocked(Researcher.getDashboardSummary).mockResolvedValue(summary)
  })

  it('renders all section links, placeholders, and summary counts from one request', async () => {
    let resolveSummary: (value: ResearcherDashboardSummary) => void = () => undefined
    vi.mocked(Researcher.getDashboardSummary).mockReturnValue(
      new Promise(resolve => resolveSummary = resolve),
    )
    renderDashboard()

    // Data Library (4) + Data Access Requests (4) + My Dataset Approvals (3); the Data Submissions
    // tile is hidden for a researcher who is not a data submitter.
    expect(screen.getAllByText('–')).toHaveLength(11)
    expect(screen.getByRole('link', { name: /Data Access Requests/ })).toHaveAttribute(
      'href', '/researcher_console',
    )
    expect(screen.getByRole('link', { name: /My Dataset Approvals/ })).toHaveAttribute(
      'href', '/datasets',
    )

    resolveSummary(summary)
    await waitFor(() => expect(screen.queryByText('–')).not.toBeInTheDocument())
    expect(screen.getByLabelText('Studies: 7')).toBeInTheDocument()
    expect(screen.getByLabelText('Workspaces: 1')).toBeInTheDocument()
    expect(Researcher.getDashboardSummary).toHaveBeenCalledTimes(1)
  })

  it('labels DAR request counts with the statuses the system actually tracks', async () => {
    renderDashboard()

    expect(await screen.findByLabelText('Approved: 3')).toBeInTheDocument()
    expect(screen.getByLabelText('Canceled: 1')).toBeInTheDocument()
    expect(screen.getByLabelText('In Process: 4')).toBeInTheDocument()
    // The system records no denials, so the tile no longer claims to count them.
    expect(screen.queryByText('Denied')).not.toBeInTheDocument()
  })

  it('reports expired approvals alongside active ones', async () => {
    renderDashboard()

    expect(await screen.findByLabelText('Active: 6')).toBeInTheDocument()
    expect(screen.getByLabelText('Expiring in 30 Days: 2')).toBeInTheDocument()
    expect(screen.getByLabelText('Expired: 5')).toBeInTheDocument()
  })

  it('shows the Data Submissions tile only to data submitters', async () => {
    renderDashboard()
    await waitFor(() => expect(screen.queryByText('–')).not.toBeInTheDocument())
    expect(screen.queryByRole('link', { name: /Data Submissions/ })).not.toBeInTheDocument()

    vi.mocked(Storage.getCurrentUser).mockReturnValue(dataSubmitter)
    renderDashboard()

    expect(await screen.findByRole('link', { name: /Data Submissions/ })).toHaveAttribute(
      'href', '/dataset_submissions',
    )
  })

  it('preserves the Researcher Console tab context when navigating to a section', () => {
    renderDashboard()

    fireEvent.click(screen.getByRole('link', { name: /My Dataset Approvals/ }))

    expect(screen.getByTestId('location-state')).toHaveTextContent(
      JSON.stringify({ selectedMenuTab: 4 }),
    )
  })

  it('gives each placeholder an accessible name explaining why the count is missing', async () => {
    vi.mocked(Researcher.getDashboardSummary).mockRejectedValue(new Error('backend unavailable'))
    vi.spyOn(Notifications, 'showError').mockImplementation(() => undefined)
    renderDashboard()

    expect(await screen.findByLabelText('Active: unavailable')).toBeInTheDocument()
    expect(screen.getByLabelText('Studies: unavailable')).toBeInTheDocument()
  })

  it('notifies the user and exits loading when the summary request fails', async () => {
    const notification = vi.spyOn(Notifications, 'showError').mockImplementation(() => undefined)
    vi.mocked(Researcher.getDashboardSummary).mockRejectedValue(new Error('backend unavailable'))
    renderDashboard()

    await waitFor(() => expect(notification).toHaveBeenCalledWith({
      text: 'Error: Unable to load dashboard statistics: backend unavailable',
    }))
    expect(screen.getAllByText('–')).toHaveLength(11)
  })

  it('hides cached statistics while a mount refetch is pending and after it fails', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    client.setQueryData(['researcher-dashboard-summary'], summary)
    const notification = vi.spyOn(Notifications, 'showError').mockImplementation(() => undefined)
    let rejectSummary: (reason: Error) => void = () => undefined
    vi.mocked(Researcher.getDashboardSummary).mockReturnValue(
      new Promise((_resolve, reject) => rejectSummary = reject),
    )

    renderDashboard(client)

    expect(screen.getAllByText('–')).toHaveLength(11)
    expect(screen.queryByText('12')).not.toBeInTheDocument()

    rejectSummary(new Error('refresh failed'))
    await waitFor(() => expect(notification).toHaveBeenCalledWith({
      text: 'Error: Unable to load dashboard statistics: refresh failed',
    }))
    expect(screen.getAllByText('–')).toHaveLength(11)
  })

  it('opens safe external resource links and prepopulates Contact Us with the full URL', async () => {
    renderDashboard()

    const guide = await screen.findByRole('link', { name: /Researcher Guide/ })
    expect(guide).toHaveAttribute('target', '_blank')
    expect(guide).toHaveAttribute('rel', 'noopener noreferrer')

    fireEvent.click(screen.getByRole('button', { name: /Register Your Institution/ }))
    expect(screen.getByTestId('support-modal')).toHaveAttribute('data-url', window.location.href)
    fireEvent.click(screen.getByRole('button', { name: 'Close support' }))
    expect(screen.queryByTestId('support-modal')).not.toBeInTheDocument()
  })

  it('routes in-app resource cards through the router with the console tab context attached', async () => {
    renderDashboard()

    // Not an external link: no new tab, no "opens in new tab" icon, and the query string survives.
    const progressReports = await screen.findByRole('link', { name: /Progress Reports/ })
    expect(progressReports).toHaveAttribute('href', '/researcher_console')
    expect(progressReports).not.toHaveAttribute('target')

    fireEvent.click(progressReports)
    expect(screen.getByTestId('location-state')).toHaveTextContent(
      JSON.stringify({ selectedMenuTab: 4 }),
    )
  })

  it('offers the publications resource only to data submitters, who alone may open it', async () => {
    renderDashboard()
    await waitFor(() => expect(screen.queryByText('–')).not.toBeInTheDocument())
    // /dataset_submissions is RoleBAC-gated; advertising it to a plain researcher lands them on
    // Not Found.
    expect(screen.queryByRole('link', { name: /Promote Your Publications/ })).not.toBeInTheDocument()

    vi.mocked(Storage.getCurrentUser).mockReturnValue(dataSubmitter)
    renderDashboard()

    expect(await screen.findByRole('link', { name: /Promote Your Publications/ })).toHaveAttribute(
      'href', '/dataset_submissions?tab=publications',
    )
  })

  it('does not replay a cached failure as a toast when the dashboard is revisited', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const notification = vi.spyOn(Notifications, 'showError').mockImplementation(() => undefined)
    // A query that has loaded at least once keeps its data, so a later failure leaves both data
    // and error in the cache - the state react-query hands straight back to the next mount.
    client.setQueryData(['researcher-dashboard-summary'], summary)
    vi.mocked(Researcher.getDashboardSummary).mockRejectedValueOnce(new Error('backend unavailable'))

    const { unmount } = renderDashboard(client)
    await waitFor(() => expect(notification).toHaveBeenCalledTimes(1))
    unmount()

    // Coming back to the dashboard: the query is still cached in its failed state while the
    // mount refetch is in flight, and the old failure must not be announced again.
    let resolveSummary: (value: ResearcherDashboardSummary) => void = () => undefined
    vi.mocked(Researcher.getDashboardSummary).mockReturnValue(
      new Promise(resolve => resolveSummary = resolve),
    )
    renderDashboard(client)

    expect(notification).toHaveBeenCalledTimes(1)
    expect(screen.getAllByText('–')).toHaveLength(11)

    resolveSummary(summary)
    expect(await screen.findByLabelText('Studies: 7')).toBeInTheDocument()
    expect(notification).toHaveBeenCalledTimes(1)
  })

  it('renders placeholders rather than crashing when the payload omits a group', async () => {
    const partial = { darRequests: summary.darRequests } as unknown as ResearcherDashboardSummary
    vi.mocked(Researcher.getDashboardSummary).mockResolvedValue(partial)
    renderDashboard()

    expect(await screen.findByLabelText('Total: 8')).toBeInTheDocument()
    // A missing count reads as "unavailable", never as the literal string "undefined".
    expect(screen.getByLabelText('Studies: unavailable')).toBeInTheDocument()
    expect(screen.queryByLabelText(/undefined/)).not.toBeInTheDocument()
  })
})
