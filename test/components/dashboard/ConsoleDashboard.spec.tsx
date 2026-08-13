import React from 'react'
import '@testing-library/jest-dom/vitest'
import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ConsoleDashboard from 'src/components/dashboard/ConsoleDashboard'
import { ConsoleDashboardTile } from 'src/components/dashboard/ConsoleDashboardGrid'
import { ConsoleDashboardResource } from 'src/components/dashboard/ConsoleDashboardResources'
import {
  ConsoleDashboardTileMeta,
  useConsoleDashboardSummary,
} from 'src/components/dashboard/useConsoleDashboardSummary'
import { usePageTitle } from 'src/hooks/usePageTitle'
import { Storage } from 'src/libs/storage'
import { DuosUser } from 'src/types/model'

vi.mock('src/hooks/usePageTitle', () => ({
  usePageTitle: vi.fn(),
}))

vi.mock('src/libs/storage', () => ({
  Storage: { getCurrentUser: vi.fn() },
}))

vi.mock('src/components/dashboard/useConsoleDashboardSummary', async importOriginal => ({
  ...await importOriginal<typeof import('src/components/dashboard/useConsoleDashboardSummary')>(),
  useConsoleDashboardSummary: vi.fn(),
}))

vi.mock('src/components/dashboard/ConsoleDashboardTitle', () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <h1 data-testid="dashboard-title">{children}</h1>
  ),
}))

vi.mock('src/components/dashboard/ConsoleDashboardGrid', () => ({
  default: ({ tiles, isLoading }: { tiles: ConsoleDashboardTile[], isLoading: boolean }) => (
    <section data-testid="dashboard-grid" data-is-loading={isLoading}>
      {tiles.map(tile => <span key={tile.label}>{tile.label}</span>)}
    </section>
  ),
}))

vi.mock('src/components/dashboard/ConsoleDashboardResources', () => ({
  default: ({ heading, resources, currentUser }: {
    heading: string
    resources: ConsoleDashboardResource[]
    currentUser: DuosUser
  }) => (
    <section data-testid="dashboard-resources" data-user-id={currentUser.userId}>
      <h2>{heading}</h2>
      {resources.map(resource => <span key={resource.label}>{resource.label}</span>)}
    </section>
  ),
}))

vi.mock('src/components/dashboard/ConsoleDashboardPromo', () => ({
  default: ({ heading, paragraphs }: { heading: string, paragraphs: string[] }) => (
    <section data-testid="dashboard-promo">
      <h2>{heading}</h2>
      {paragraphs.map(paragraph => <p key={paragraph}>{paragraph}</p>)}
    </section>
  ),
}))

type Summary = { total: number }

const TileIcon = () => null
const currentUser = { userId: 42, isChairPerson: true } as unknown as DuosUser
const queryKey = ['test-dashboard-summary'] as const
const queryFn = vi.fn<() => Promise<Summary>>()
const visibleForUser = vi.fn(() => true)
const hiddenForUser = vi.fn(() => false)
const tileMeta: ConsoleDashboardTileMeta<Summary>[] = [
  {
    label: 'Always Visible',
    link: '/always-visible',
    icon: TileIcon,
    description: 'Visible to every user.',
    stats: [{ label: 'Total', value: summary => summary.total }],
  },
  {
    label: 'Role Visible',
    link: '/role-visible',
    icon: TileIcon,
    description: 'Visible to this user.',
    stats: [],
    isRenderedForUser: visibleForUser,
  },
  {
    label: 'Role Hidden',
    link: '/role-hidden',
    icon: TileIcon,
    description: 'Hidden from this user.',
    stats: [],
    isRenderedForUser: hiddenForUser,
  },
]
const resources: ConsoleDashboardResource[] = [{
  icon: TileIcon,
  label: 'User Guide',
  description: 'Learn how to use the console.',
  href: 'https://example.org/guide',
}]
const tiles: ConsoleDashboardTile[] = [{
  label: 'Resolved Tile',
  link: '/resolved',
  icon: TileIcon,
  description: 'Returned by the summary hook.',
  stats: [{ label: 'Total', value: 4 }],
}]

const renderDashboard = (consoleTitle?: string) => render(
  <ConsoleDashboard
    consoleTitle={consoleTitle}
    queryKey={queryKey}
    queryFn={queryFn}
    tileMeta={tileMeta}
    resourcesHeading="Helpful Resources"
    resources={resources}
    promoParagraphs={['Learn more about DUOS.']}
  />,
)

describe('ConsoleDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(Storage.getCurrentUser).mockReturnValue(currentUser)
    vi.mocked(useConsoleDashboardSummary).mockReturnValue({ tiles, isLoading: true })
  })

  it('filters role-gated tiles before loading the dashboard summary', () => {
    renderDashboard('Test Console')

    expect(Storage.getCurrentUser).toHaveBeenCalledTimes(1)
    expect(visibleForUser).toHaveBeenCalledWith(currentUser)
    expect(hiddenForUser).toHaveBeenCalledWith(currentUser)
    expect(useConsoleDashboardSummary).toHaveBeenCalledWith(queryKey, queryFn, [tileMeta[0], tileMeta[1]])
  })

  it('composes the title, resolved tiles, resources, and promotion', () => {
    renderDashboard('Test Console')

    expect(usePageTitle).toHaveBeenCalledWith('Dashboard')
    expect(screen.getByTestId('dashboard-title')).toHaveTextContent('Test Console')
    expect(screen.getByTestId('dashboard-grid')).toHaveAttribute('data-is-loading', 'true')
    expect(screen.getByText('Resolved Tile')).toBeInTheDocument()
    expect(screen.getByTestId('dashboard-resources')).toHaveAttribute('data-user-id', '42')
    expect(screen.getByRole('heading', { name: 'Helpful Resources' })).toBeInTheDocument()
    expect(screen.getByText('User Guide')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Get more out of DUOS' })).toBeInTheDocument()
    expect(screen.getByText('Learn more about DUOS.')).toBeInTheDocument()
  })

  it('omits the console title when one is not supplied', () => {
    renderDashboard()

    expect(screen.queryByTestId('dashboard-title')).not.toBeInTheDocument()
  })
})
