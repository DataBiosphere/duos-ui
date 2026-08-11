import React from 'react'
import '@testing-library/jest-dom/vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ConsoleDashboardResources, { ConsoleDashboardResource } from 'src/components/dashboard/ConsoleDashboardResources'
import { Storage } from 'src/libs/storage'
import { DuosUser } from 'src/types/model'

vi.mock('src/libs/storage', () => ({
  Storage: { getCurrentUser: vi.fn() },
}))

vi.mock('src/contexts/NavigationStateContext', () => ({
  useNavigationState: () => ({ activeTab: 4 }),
}))

// Rendered even while closed, so a test can tell "modal shut" from "modal never mounted".
vi.mock('src/components/modals/SupportRequestModal', () => ({
  SupportRequestModal: ({ showModal, url, onCloseRequest }: {
    showModal: boolean
    url?: string
    onCloseRequest: () => void
  }) => (
    <div data-testid="support-modal" data-open={String(showModal)} data-url={url}>
      <button type="button" onClick={onCloseRequest}>Close support</button>
    </div>
  ),
}))

const ResourceIcon = () => <svg data-testid="resource-icon" />

// Only the role flags the gating predicates read matter here.
const researcher = { userId: 1, isDataSubmitter: false } as unknown as DuosUser
const dataSubmitter = { ...researcher, isDataSubmitter: true } as unknown as DuosUser

const externalResource: ConsoleDashboardResource = {
  icon: ResourceIcon,
  label: 'Researcher Guide',
  description: 'A walkthrough of the Researcher role.',
  href: 'https://duos.blog/help/researcherguide/',
}

const inAppResource: ConsoleDashboardResource = {
  icon: ResourceIcon,
  label: 'Progress Reports',
  description: 'Submit and manage progress reports.',
  to: '/researcher_console?tab=reports',
}

const contactUsResource: ConsoleDashboardResource = {
  icon: ResourceIcon,
  label: 'Register Your Institution',
  description: 'Contact us if your institution is not yet registered.',
  action: 'contactUs',
}

const LocationStateProbe = () => {
  const location = useLocation()
  return <output data-testid="location-state">{JSON.stringify(location.state)}</output>
}

const renderResources = (resources: ConsoleDashboardResource[]) => render(
  <MemoryRouter>
    <ConsoleDashboardResources heading="Helpful Resources for Researchers" resources={resources} />
    <LocationStateProbe />
  </MemoryRouter>,
)

describe('ConsoleDashboardResources', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(Storage.getCurrentUser).mockReturnValue(researcher)
  })

  it('renders the section heading and one card per resource', () => {
    renderResources([externalResource, inAppResource, contactUsResource])

    expect(screen.getByRole('heading', { level: 2, name: 'Helpful Resources for Researchers' }))
      .toBeInTheDocument()
    expect(screen.getAllByTestId('resource-icon')).toHaveLength(3)
    expect(screen.getByText('A walkthrough of the Researcher role.')).toBeInTheDocument()
  })

  it('opens an external resource in a new tab without leaking the referrer', () => {
    const { container } = renderResources([externalResource])

    const link = screen.getByRole('link', { name: /Researcher Guide/ })
    expect(link).toHaveAttribute('href', 'https://duos.blog/help/researcherguide/')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
    // The new tab is advertised visually as well as behaviorally.
    expect(container.querySelector('svg[data-testid="OpenInNewOutlinedIcon"]')).toBeInTheDocument()
  })

  it('routes an in-app resource through the router, keeping the tab context and query string', () => {
    const { container } = renderResources([inAppResource])

    const link = screen.getByRole('link', { name: /Progress Reports/ })
    expect(link).toHaveAttribute('href', '/researcher_console?tab=reports')
    expect(link).not.toHaveAttribute('target')
    // No new-tab icon: this card does not leave the app.
    expect(container.querySelector('svg[data-testid="OpenInNewOutlinedIcon"]')).not.toBeInTheDocument()

    fireEvent.click(link)
    expect(screen.getByTestId('location-state')).toHaveTextContent(
      JSON.stringify({ selectedMenuTab: 4 }),
    )
  })

  it('renders a contact-us resource as a button that opens and closes the support modal', () => {
    renderResources([contactUsResource])

    expect(screen.queryByRole('link', { name: /Register Your Institution/ })).not.toBeInTheDocument()
    expect(screen.getByTestId('support-modal')).toHaveAttribute('data-open', 'false')

    fireEvent.click(screen.getByRole('button', { name: /Register Your Institution/ }))
    expect(screen.getByTestId('support-modal')).toHaveAttribute('data-open', 'true')
    expect(screen.getByTestId('support-modal')).toHaveAttribute('data-url', window.location.href)

    fireEvent.click(screen.getByRole('button', { name: 'Close support' }))
    expect(screen.getByTestId('support-modal')).toHaveAttribute('data-open', 'false')
  })

  it('does not mount the support modal when no visible resource can open it', () => {
    renderResources([externalResource, inAppResource])

    expect(screen.queryByTestId('support-modal')).not.toBeInTheDocument()
  })

  it('does not mount the support modal when the only contact-us card is hidden from this user', () => {
    renderResources([
      externalResource,
      { ...contactUsResource, isRenderedForUser: user => user?.isDataSubmitter === true },
    ])

    expect(screen.queryByRole('button', { name: /Register Your Institution/ })).not.toBeInTheDocument()
    expect(screen.queryByTestId('support-modal')).not.toBeInTheDocument()
  })

  it('hides a role-gated resource from a user who cannot reach its destination', () => {
    const gated: ConsoleDashboardResource = {
      ...inAppResource,
      label: 'Promote Your Publications',
      to: '/dataset_submissions?tab=publications',
      isRenderedForUser: user => user?.isDataSubmitter === true,
    }

    renderResources([externalResource, gated])

    expect(screen.queryByRole('link', { name: /Promote Your Publications/ })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Researcher Guide/ })).toBeInTheDocument()
  })

  it('shows a role-gated resource to a user whose role allows it', () => {
    vi.mocked(Storage.getCurrentUser).mockReturnValue(dataSubmitter)
    const gated: ConsoleDashboardResource = {
      ...inAppResource,
      label: 'Promote Your Publications',
      to: '/dataset_submissions?tab=publications',
      isRenderedForUser: user => user?.isDataSubmitter === true,
    }

    renderResources([gated])

    expect(screen.getByRole('link', { name: /Promote Your Publications/ })).toHaveAttribute(
      'href', '/dataset_submissions?tab=publications',
    )
  })

  it('renders no card for a resource with no destination rather than a dead link', () => {
    // The prop type forbids this, but a malformed entry must not become a card that looks
    // clickable and goes nowhere.
    const malformed = {
      icon: ResourceIcon,
      label: 'Nowhere',
      description: 'No destination at all.',
    } as unknown as ConsoleDashboardResource

    renderResources([malformed, externalResource])

    expect(screen.queryByText('No destination at all.')).not.toBeInTheDocument()
    expect(screen.getAllByRole('link')).toHaveLength(1)
  })

  it('renders only the heading when there are no resources', () => {
    renderResources([])

    expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument()
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
})
