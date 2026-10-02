import React from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { fireEvent, screen } from '@testing-library/react'
import { useLocation } from 'react-router'
import { renderWithRouter } from '../../test-utils'
import AdminMetrics from 'src/pages/admin_console/AdminMetrics'

vi.mock('src/pages/admin_console/metricsTabs', () => ({
  METRICS_TABS: [
    { key: 'decisions', label: 'Decisions', render: (range: { from: string }) => <p>Decisions from {range.from}</p> },
    { key: 'turnaround', label: 'DAC Turnaround', render: () => <p>Turnaround content</p> },
  ],
}))

const LocationProbe = () => <output data-testid="search">{useLocation().search}</output>

const renderPage = (search = '') =>
  renderWithRouter(<><AdminMetrics /><LocationProbe /></>, { route: `/admin_console/metrics${search}` })

describe('AdminMetrics', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows the first tab with the range from the URL', () => {
    renderPage('?from=2025-01-01&to=2025-06-30')

    expect(screen.getByRole('heading', { name: 'Metrics' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Decisions' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByText('Decisions from 2025-01-01')).toBeInTheDocument()
  })

  it('opens the tab the URL names', () => {
    renderPage('?tab=turnaround')

    expect(screen.getByText('Turnaround content')).toBeInTheDocument()
  })

  it('records a tab change in the URL', () => {
    renderPage()

    fireEvent.click(screen.getByRole('tab', { name: 'DAC Turnaround' }))

    expect(screen.getByText('Turnaround content')).toBeInTheDocument()
    expect(screen.getByTestId('search')).toHaveTextContent('tab=turnaround')
  })
})
