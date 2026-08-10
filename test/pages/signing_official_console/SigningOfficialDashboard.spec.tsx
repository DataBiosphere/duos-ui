import React from 'react'
import '@testing-library/jest-dom/vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import SigningOfficialDashboard from 'src/pages/signing_official_console/SigningOfficialDashboard'
import { SigningOfficial, SigningOfficialDashboardSummary } from 'src/libs/ajax/SigningOfficial'
import { Notifications } from 'src/libs/utils'

vi.mock('src/libs/ajax/SigningOfficial', () => ({
  SigningOfficial: { getDashboardSummary: vi.fn() },
}))

vi.mock('src/contexts/NavigationStateContext', () => ({
  useNavigationState: () => ({ activeTab: 2 }),
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

const summary: SigningOfficialDashboardSummary = {
  researcherStatus: { active: 3, inactive: 2 },
  darRequests: { total: 8, approved: 4, canceled: 1, inProcess: 3 },
  darApprovals: { total: 5, awaitingSoAction: 2 },
  dataSubmitters: { approved: 6 },
  institutionLibrary: { datasets: 12, studies: 7 },
  daaAssociations: { agreements: 9, researchersApproved: 4 },
}

const LocationStateProbe = () => {
  const location = useLocation()
  return <output data-testid="location-state">{JSON.stringify(location.state)}</output>
}

const renderDashboard = (
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } }),
) => {
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <SigningOfficialDashboard />
        <LocationStateProbe />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('SigningOfficialDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(SigningOfficial.getDashboardSummary).mockResolvedValue(summary)
  })

  it('renders all section links, placeholders, and summary counts from one request', async () => {
    let resolveSummary: (value: SigningOfficialDashboardSummary) => void = () => undefined
    vi.mocked(SigningOfficial.getDashboardSummary).mockReturnValue(
      new Promise(resolve => resolveSummary = resolve),
    )
    renderDashboard()

    expect(screen.getAllByText('–')).toHaveLength(13)
    expect(screen.getByRole('link', { name: /Researcher Status/ })).toHaveAttribute(
      'href', '/signing_official_console/library_cards',
    )
    expect(screen.getByRole('link', { name: /DAA Associations/ })).toHaveAttribute(
      'href', '/signing_official_console/researchers_daa_associations',
    )

    resolveSummary(summary)
    await waitFor(() => expect(screen.queryByText('–')).not.toBeInTheDocument())
    expect(screen.getByText('12')).toBeInTheDocument()
    expect(screen.getByText('7')).toBeInTheDocument()
    expect(SigningOfficial.getDashboardSummary).toHaveBeenCalledTimes(1)
  })

  it('labels DAR request counts with the same statuses as the DAR Requests page', async () => {
    renderDashboard()

    // Canceled/In Process match DarCollectionStatus; the page has no "Denied" status.
    expect(await screen.findByLabelText('Canceled: 1')).toBeInTheDocument()
    expect(screen.getByLabelText('In Process: 3')).toBeInTheDocument()
    expect(screen.getByLabelText('Approved: 4')).toBeInTheDocument()
    expect(screen.queryByText('Denied')).not.toBeInTheDocument()
    expect(screen.queryByText('Pending')).not.toBeInTheDocument()
  })

  it('gives each placeholder an accessible name explaining why the count is missing', async () => {
    vi.mocked(SigningOfficial.getDashboardSummary).mockRejectedValue(new Error('backend unavailable'))
    vi.spyOn(Notifications, 'showError').mockImplementation(() => undefined)
    renderDashboard()

    expect(await screen.findByLabelText('Canceled: unavailable')).toBeInTheDocument()
    expect(screen.getByLabelText('Active: unavailable')).toBeInTheDocument()
  })

  it('preserves the SO Console tab context when navigating to a dashboard section', () => {
    renderDashboard()

    fireEvent.click(screen.getByRole('link', { name: /My Institution's Data Library/ }))

    expect(screen.getByTestId('location-state')).toHaveTextContent(
      JSON.stringify({ selectedMenuTab: 2 }),
    )
  })

  it('opens safe external resource links and prepopulates Contact Us with the full URL', async () => {
    renderDashboard()
    expect(await screen.findByRole('link', { name: /Signing Official Guide/ })).toHaveAttribute('target', '_blank')
    expect(screen.getByRole('link', { name: /Signing Official Guide/ })).toHaveAttribute('rel', 'noopener noreferrer')

    fireEvent.click(screen.getByRole('button', { name: 'Contact Us' }))
    expect(screen.getByTestId('support-modal')).toHaveAttribute('data-url', window.location.href)
    fireEvent.click(screen.getByRole('button', { name: 'Close support' }))
    expect(screen.queryByTestId('support-modal')).not.toBeInTheDocument()
  })

  it('notifies the user and exits loading when the summary request fails', async () => {
    const notification = vi.spyOn(Notifications, 'showError').mockImplementation(() => undefined)
    vi.mocked(SigningOfficial.getDashboardSummary).mockRejectedValue(new Error('backend unavailable'))
    renderDashboard()

    await waitFor(() => expect(notification).toHaveBeenCalledWith({
      text: 'Error: Unable to load dashboard statistics: backend unavailable',
    }))
    expect(screen.getAllByText('–')).toHaveLength(13)
  })

  it('hides cached statistics while a mount refetch is pending and after it fails', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    client.setQueryData(['signing-official-dashboard-summary'], summary)
    const notification = vi.spyOn(Notifications, 'showError').mockImplementation(() => undefined)
    let rejectSummary: (reason: Error) => void = () => undefined
    vi.mocked(SigningOfficial.getDashboardSummary).mockReturnValue(
      new Promise((_resolve, reject) => rejectSummary = reject),
    )

    renderDashboard(client)

    expect(screen.getAllByText('–')).toHaveLength(13)
    expect(screen.queryByText('12')).not.toBeInTheDocument()

    rejectSummary(new Error('refresh failed'))
    await waitFor(() => expect(notification).toHaveBeenCalledWith({
      text: 'Error: Unable to load dashboard statistics: refresh failed',
    }))
    expect(screen.getAllByText('–')).toHaveLength(13)
    expect(screen.queryByText('12')).not.toBeInTheDocument()
  })
})
