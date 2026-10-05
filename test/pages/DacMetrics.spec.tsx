import React, { useContext } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { fireEvent, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useLocation } from 'react-router'
import { renderWithRouter } from '../test-utils'
import DacMetrics from 'src/pages/DacMetrics'
import { DarMetricsScope } from 'src/components/dar_analytics/useDarMetricsReport'
import { DAC } from 'src/libs/ajax/DAC'
import { Storage } from 'src/libs/storage'
import { DuosUser } from 'src/types/model'

vi.mock('src/libs/storage', () => ({
  Storage: { getCurrentUser: vi.fn() },
}))

vi.mock('src/libs/ajax/DAC', () => ({
  DAC: { list: vi.fn() },
}))

const ScopeProbe = () => <p>Scoped to {JSON.stringify(useContext(DarMetricsScope)) ?? 'their current DACs'}</p>

vi.mock('src/pages/admin_console/metricsTabs', () => ({
  DAC_METRICS_TABS: [
    { key: 'decisions', label: 'Decisions', render: () => <ScopeProbe /> },
    { key: 'volume', label: 'Volume', render: () => <p>Volume content</p> },
  ],
}))

const LocationProbe = () => <output data-testid="search">{useLocation().search}</output>

const userWithRoles = (roles: { name: string, dacId?: number }[]) => ({ roles } as unknown as DuosUser)

const renderPage = (search = '') => renderWithRouter(
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    <DacMetrics />
    <LocationProbe />
  </QueryClientProvider>,
  { route: `/dac_console/metrics${search}` },
)

describe('DacMetrics', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(Storage.getCurrentUser).mockReturnValue(userWithRoles([
      { name: 'Chairperson', dacId: 4 },
      { name: 'Member', dacId: 6 },
      { name: 'Member', dacId: 4 },
      { name: 'Admin' },
      { name: 'Researcher' },
    ]))
    vi.mocked(DAC.list).mockResolvedValue([
      { dacId: 4, name: 'Zebrafish DAC' },
      { dacId: 6, name: 'Cardio DAC' },
      { dacId: 9, name: 'Other DAC' },
    ])
  })

  it('leaves a chair or member\'s default scope to consent, which reads their current DACs', () => {
    renderPage()

    expect(screen.getByRole('heading', { name: 'Metrics' })).toBeInTheDocument()
    expect(screen.getByText('Scoped to their current DACs')).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Volume' })).toBeInTheDocument()
  })

  it('names an admin\'s DACs, once each, so the page doesn\'t cover every DAC', () => {
    vi.mocked(Storage.getCurrentUser).mockReturnValue({
      ...userWithRoles([{ name: 'Chairperson', dacId: 4 }, { name: 'Member', dacId: 6 }, { name: 'Member', dacId: 4 }]),
      isAdmin: true,
    })
    renderPage()

    expect(screen.getByText('Scoped to [4,6]')).toBeInTheDocument()
  })

  it('lets a user on several DACs narrow the reports to one, recorded in the URL', async () => {
    renderPage('?tab=decisions')

    fireEvent.mouseDown(screen.getByRole('combobox', { name: 'DAC' }))
    await screen.findByRole('option', { name: 'Cardio DAC' })
    const options = screen.getAllByRole('option')
    expect(options.map(option => option.textContent)).toEqual(['All my DACs', 'Cardio DAC', 'Zebrafish DAC'])
    fireEvent.click(screen.getByRole('option', { name: 'Cardio DAC' }))

    expect(screen.getByText('Scoped to [6]')).toBeInTheDocument()
    expect(screen.getByTestId('search')).toHaveTextContent('?tab=decisions&dac=6')
  })

  it('falls back to all of the user\'s DACs for a DAC they are not on', () => {
    renderPage('?dac=9')

    expect(screen.getByText('Scoped to their current DACs')).toBeInTheDocument()
  })

  it('shows no picker to a user on one DAC', () => {
    vi.mocked(Storage.getCurrentUser).mockReturnValue(userWithRoles([{ name: 'Member', dacId: 4 }]))
    renderPage()

    expect(screen.getByText('Scoped to their current DACs')).toBeInTheDocument()
    expect(screen.queryByRole('combobox', { name: 'DAC' })).not.toBeInTheDocument()
    expect(DAC.list).not.toHaveBeenCalled()
  })
})
