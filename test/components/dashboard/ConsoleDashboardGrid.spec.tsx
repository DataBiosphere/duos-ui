import React from 'react'
import '@testing-library/jest-dom/vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import ConsoleDashboardGrid, { ConsoleDashboardTile } from 'src/components/dashboard/ConsoleDashboardGrid'

vi.mock('src/contexts/NavigationStateContext', () => ({
  useNavigationState: () => ({ activeTab: 4 }),
}))

const TileIcon = () => <svg data-testid="tile-icon" />

const tiles: ConsoleDashboardTile[] = [
  {
    label: 'Data Library',
    link: '/datalibrary',
    icon: TileIcon,
    description: 'Browse and search datasets available in DUOS.',
    stats: [
      { label: 'Studies', value: 7 },
      // Zero is a real count, not a missing one: it must not fall back to the placeholder.
      { label: 'Datasets', value: 0 },
    ],
  },
  {
    label: 'Data Access Requests',
    link: '/researcher_console',
    icon: TileIcon,
    description: 'Track the data access requests you have submitted.',
    stats: [{ label: 'Total', value: null }],
  },
]

const LocationStateProbe = () => {
  const location = useLocation()
  return <output data-testid="location-state">{JSON.stringify(location.state)}</output>
}

const renderGrid = (props: { tiles?: ConsoleDashboardTile[], isLoading?: boolean } = {}) => render(
  <MemoryRouter>
    <ConsoleDashboardGrid tiles={props.tiles ?? tiles} isLoading={props.isLoading ?? false} />
    <LocationStateProbe />
  </MemoryRouter>,
)

describe('ConsoleDashboardGrid', () => {
  it('renders one card per tile, linking to that tile\'s section', () => {
    renderGrid()

    expect(screen.getAllByRole('link')).toHaveLength(2)
    expect(screen.getByRole('link', { name: /Data Library/ })).toHaveAttribute('href', '/datalibrary')
    expect(screen.getByRole('link', { name: /Data Access Requests/ })).toHaveAttribute(
      'href', '/researcher_console',
    )
  })

  it('renders each tile\'s icon and description', () => {
    renderGrid()

    expect(screen.getAllByTestId('tile-icon')).toHaveLength(2)
    expect(screen.getByText('Browse and search datasets available in DUOS.')).toBeInTheDocument()
    expect(screen.getByText('Track the data access requests you have submitted.')).toBeInTheDocument()
  })

  it('names every supplied count with its label, including a genuine zero', () => {
    renderGrid()

    expect(screen.getByLabelText('Studies: 7')).toHaveTextContent('7')
    expect(screen.getByLabelText('Datasets: 0')).toHaveTextContent('0')
    // The visible label is decorative; the count carries the accessible name.
    expect(screen.getByText('Studies')).toHaveAttribute('aria-hidden', 'true')
  })

  it('explains a missing count as unavailable once loading has finished', () => {
    renderGrid()

    expect(screen.getByLabelText('Total: unavailable')).toHaveTextContent('–')
    expect(screen.getAllByText('–')).toHaveLength(1)
  })

  it('withholds counts and announces loading while the request is in flight', () => {
    renderGrid({ isLoading: true })

    // Every stat blanks out, so stale and fresh numbers can never appear side by side.
    expect(screen.getAllByText('–')).toHaveLength(3)
    expect(screen.getByLabelText('Studies: loading')).toBeInTheDocument()
    expect(screen.getByLabelText('Datasets: loading')).toBeInTheDocument()
    expect(screen.getByLabelText('Total: loading')).toBeInTheDocument()
    expect(screen.queryByText('7')).not.toBeInTheDocument()
    expect(screen.queryByLabelText(/unavailable/)).not.toBeInTheDocument()
  })

  it('carries the console\'s active tab so it stays highlighted after navigating', () => {
    renderGrid()

    fireEvent.click(screen.getByRole('link', { name: /Data Library/ }))

    expect(screen.getByTestId('location-state')).toHaveTextContent(
      JSON.stringify({ selectedMenuTab: 4 }),
    )
  })

  it('renders no cards when there are no tiles to show', () => {
    renderGrid({ tiles: [] })

    expect(screen.queryByRole('link')).not.toBeInTheDocument()
  })

  it('renders a tile that reports no statistics at all', () => {
    renderGrid({
      tiles: [{
        label: 'Data Submissions',
        link: '/dataset_submissions',
        icon: TileIcon,
        description: 'Track the status of datasets you have registered.',
        stats: [],
      }],
    })

    expect(screen.getByRole('link', { name: /Data Submissions/ })).toBeInTheDocument()
    expect(screen.queryByText('–')).not.toBeInTheDocument()
  })
})
