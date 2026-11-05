import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router'
import NotFound from 'src/pages/NotFound'
import { AssetCatalog } from 'src/libs/ajax/AssetCatalog'
import { useUserIsLogged } from 'src/hooks/useSession'
import { AssetLookup } from 'src/types/library'

vi.mock('src/libs/ajax/AssetCatalog', () => ({ AssetCatalog: { lookup: vi.fn() } }))
vi.mock('src/hooks/useSession', () => ({ useUserIsLogged: vi.fn() }))

const StudyDetailsComponent = () => <div data-testid="study-details-page">Study Details Page</div>
const DatasetStatisticsComponent = () => <div data-testid="dataset-statistics-page">Dataset Statistics Page</div>
const HomeComponent = () => <div data-testid="home-page">Home Page</div>

const LocationSpy = ({ onLocationChange }: { onLocationChange: (loc: string) => void }) => {
  const location = useLocation()
  React.useEffect(() => {
    onLocationChange(location.pathname + location.search)
  }, [location, onLocationChange])
  return null
}

describe('NotFound', () => {
  it('displays the 404 page for a generic unknown path', () => {
    render(
      <MemoryRouter initialEntries={['/some-unknown-path']}>
        <Routes>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </MemoryRouter>,
    )
    expect(screen.getByText('Sorry, the page you were looking for was not found.')).toBeVisible()
    expect(screen.getByRole('link', { name: 'Back to Home' })).toHaveAttribute('href', '/home')
  })

  it('redirects from a DUOS-S path to the study details page', () => {
    const onLocationChange = vi.fn()
    render(
      <MemoryRouter initialEntries={['/DUOS-S12345']}>
        <LocationSpy onLocationChange={onLocationChange} />
        <Routes>
          <Route path="/studies/:studyId" element={<StudyDetailsComponent />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </MemoryRouter>,
    )
    expect(screen.getByTestId('study-details-page')).toBeInTheDocument()
    expect(onLocationChange).toHaveBeenCalledWith('/studies/12345')
  })

  it('redirects from a DUOS- path to the dataset statistics page', () => {
    const onLocationChange = vi.fn()
    render(
      <MemoryRouter initialEntries={['/DUOS-000123']}>
        <LocationSpy onLocationChange={onLocationChange} />
        <Routes>
          <Route path="/dataset/:datasetIdentifier" element={<DatasetStatisticsComponent />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </MemoryRouter>,
    )
    expect(screen.getByTestId('dataset-statistics-page')).toBeInTheDocument()
    expect(onLocationChange).toHaveBeenCalledWith('/dataset/DUOS-000123')
  })

  it('navigates to the home page when the "Back to Home" link is clicked', async () => {
    const user = userEvent.setup()
    const onLocationChange = vi.fn()
    render(
      <MemoryRouter initialEntries={['/some-unknown-path']}>
        <LocationSpy onLocationChange={onLocationChange} />
        <Routes>
          <Route path="/home" element={<HomeComponent />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </MemoryRouter>,
    )
    await user.click(screen.getByRole('link', { name: 'Back to Home' }))
    expect(screen.getByTestId('home-page')).toBeInTheDocument()
    expect(onLocationChange).toHaveBeenCalledWith('/home')
  })
})

describe('NotFound — DUOS identifiers', () => {
  const lookup = vi.mocked(AssetCatalog.lookup)

  const renderAt = (path: string) => {
    const onLocationChange = vi.fn()
    render(
      <MemoryRouter initialEntries={[path]}>
        <LocationSpy onLocationChange={onLocationChange} />
        <Routes>
          <Route path="/" element={<HomeComponent />} />
          <Route path="/studies/:studyId" element={<StudyDetailsComponent />} />
          <Route path="/dataset/:datasetIdentifier" element={<DatasetStatisticsComponent />} />
          <Route path="/datalibrary" element={<div data-testid="data-library-page" />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </MemoryRouter>,
    )
    return onLocationChange
  }

  const buildLookup = (overrides: Partial<AssetLookup> = {}): AssetLookup =>
    ({ identifier: 'DUOS-M-000045', type: 'MODEL', status: 'LIVE', listed: true, assetId: 45, studyId: 7, ...overrides })

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useUserIsLogged).mockReturnValue(true)
  })

  it.each([
    ['/DUOS-M-000045', 'DUOS-M-000045', 'MODEL', 'models'],
    ['/duos-m-000045', 'DUOS-M-000045', 'MODEL', 'models'],
    ['/DUOS-W-000012', 'DUOS-W-000012', 'WORKSPACE', 'workspaces'],
    ['/duos-w-000012', 'DUOS-W-000012', 'WORKSPACE', 'workspaces'],
    ['/DUOS-B-000301', 'DUOS-B-000301', 'BIOSPECIMEN', 'biospecimens'],
    ['/duos-b-000301', 'DUOS-B-000301', 'BIOSPECIMEN', 'biospecimens'],
  ] as const)('opens %s on its Data Library tab, searched by identifier', async (path, identifier, type, tab) => {
    lookup.mockResolvedValue(buildLookup({ identifier, type }))
    const onLocationChange = renderAt(path)
    expect(await screen.findByTestId('data-library-page')).toBeInTheDocument()
    expect(lookup).toHaveBeenCalledWith(identifier)
    expect(onLocationChange).toHaveBeenLastCalledWith(`/datalibrary?tab=${tab}&query=${identifier}`)
  })

  it.each([
    [{ listed: false }, 'DUOS-M-000045 is not currently listed in the Data Library.'],
    [{ status: 'RETIRED' as const }, 'DUOS-M-000045 has been retired.'],
    [{ status: 'REMOVED' as const, identifier: undefined, listed: undefined }, 'DUOS-M-000045 has been removed.'],
  ])('shows the status of an identifier it cannot open: %o', async (overrides, message) => {
    lookup.mockResolvedValue(buildLookup(overrides))
    renderAt('/DUOS-M-000045')
    expect(await screen.findByText(message)).toBeVisible()
  })

  it('shows page not found when the lookup fails, as for an unknown identifier', async () => {
    lookup.mockRejectedValue(new Error('Request failed with status 404'))
    renderAt('/DUOS-M-999999')
    expect(await screen.findByText('Sorry, the page you were looking for was not found.')).toBeVisible()
  })

  it.each(['/DUOS-M-45', '/DUOS-M-000045/extra', '/DUOS-W-abcdef', '/DUOS-B-'])('shows page not found for malformed %s without a lookup', (path) => {
    renderAt(path)
    expect(screen.getByText('Sorry, the page you were looking for was not found.')).toBeVisible()
    expect(lookup).not.toHaveBeenCalled()
  })

  it('sends a signed-out visitor to sign in before looking up', () => {
    vi.mocked(useUserIsLogged).mockReturnValue(false)
    const onLocationChange = renderAt('/duos-m-000045')
    expect(screen.getByTestId('home-page')).toBeInTheDocument()
    expect(onLocationChange).toHaveBeenLastCalledWith('/?redirectTo=/duos-m-000045')
    expect(lookup).not.toHaveBeenCalled()
  })

  it.each([
    ['/DUOS-000123', '/dataset/DUOS-000123'],
    ['/duos-000123', '/dataset/DUOS-000123'],
    ['/DUOS-D12', '/dataset/DUOS-D12'],
    ['/duos-d12', '/dataset/DUOS-D12'],
    ['/DUOS-S12', '/studies/12'],
    ['/duos-s12', '/studies/12'],
  ])('still routes %s to %s without a lookup', (path, target) => {
    const onLocationChange = renderAt(path)
    expect(onLocationChange).toHaveBeenLastCalledWith(target)
    expect(lookup).not.toHaveBeenCalled()
  })
})
