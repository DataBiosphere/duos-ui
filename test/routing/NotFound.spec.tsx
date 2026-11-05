import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation, useNavigate, useNavigationType } from 'react-router'
import { renderWithRouter } from '../test-utils'
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
  const NOT_FOUND = 'Sorry, the page you were looking for was not found.'

  const NavigationSpy = ({ onNavigate }: { onNavigate: (loc: string, type: string) => void }) => {
    const location = useLocation()
    const type = useNavigationType()
    React.useEffect(() => {
      onNavigate(location.pathname + location.search, type)
    }, [location, type, onNavigate])
    return null
  }

  const GoTo = ({ to }: { to: string }) => {
    const navigate = useNavigate()
    return <button type="button" onClick={() => navigate(to)}>Go</button>
  }

  const renderAt = async (route: string, goTo = '/') => {
    const onNavigate = vi.fn()
    await act(async () => {
      renderWithRouter(
        <>
          <NavigationSpy onNavigate={onNavigate} />
          <GoTo to={goTo} />
          <Routes>
            <Route path="/" element={<HomeComponent />} />
            <Route path="/studies/:studyId" element={<StudyDetailsComponent />} />
            <Route path="/dataset/:datasetIdentifier" element={<DatasetStatisticsComponent />} />
            <Route path="/datalibrary" element={<div data-testid="data-library-page" />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </>,
        { route },
      )
    })
    return onNavigate
  }

  const buildLookup = (overrides: Partial<AssetLookup> = {}): AssetLookup =>
    ({ identifier: 'DUOS-M-000045', type: 'MODEL', status: 'LIVE', listed: true, assetId: 45, studyId: 7, ...overrides })

  const httpError = (status: number) => Object.assign(new Error(`Request failed with status ${status}`), { response: { status } })

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
    ['/duos-b-000301/', 'DUOS-B-000301', 'BIOSPECIMEN', 'biospecimens'],
  ] as const)('replaces %s with its Data Library tab, searched by identifier', async (path, identifier, type, tab) => {
    lookup.mockResolvedValue(buildLookup({ identifier, type }))
    const onNavigate = await renderAt(path)
    expect(await screen.findByTestId('data-library-page')).toBeInTheDocument()
    expect(lookup).toHaveBeenCalledWith(identifier)
    expect(onNavigate).toHaveBeenLastCalledWith(`/datalibrary?tab=${tab}&query=${identifier}`, 'REPLACE')
  })

  it.each([
    [{ listed: false }, 'DUOS-M-000045 is not currently listed in the Data Library.'],
    [{ status: 'RETIRED' as const }, 'DUOS-M-000045 has been retired.'],
    [{ status: 'REMOVED' as const, identifier: undefined, listed: undefined }, 'DUOS-M-000045 has been removed.'],
  ])('shows the status of an identifier it cannot open: %o', async (overrides, message) => {
    lookup.mockResolvedValue(buildLookup(overrides))
    await renderAt('/DUOS-M-000045')
    expect(await screen.findByRole('alert')).toHaveTextContent(message)
    expect(screen.queryByText(NOT_FOUND)).not.toBeInTheDocument()
  })

  it('shows page not found for a status it does not know', async () => {
    lookup.mockResolvedValue(buildLookup({ status: 'PENDING' as AssetLookup['status'] }))
    await renderAt('/DUOS-M-000045')
    expect(await screen.findByText(NOT_FOUND)).toBeVisible()
  })

  it('shows page not found when the catalog answers 404', async () => {
    lookup.mockRejectedValue(httpError(404))
    await renderAt('/DUOS-M-999999')
    expect(await screen.findByText(NOT_FOUND)).toBeVisible()
  })

  it.each([429, 500, undefined])('asks to try again, rather than not found, when the lookup fails with %s', async (status) => {
    lookup.mockRejectedValue(status ? httpError(status) : new Error('Network down'))
    await renderAt('/DUOS-W-000012')
    expect(await screen.findByRole('alert')).toHaveTextContent('DUOS-W-000012 could not be looked up right now. Please try again later.')
    expect(screen.queryByText(NOT_FOUND)).not.toBeInTheDocument()
  })

  it.each(['/DUOS-M-45', '/DUOS-M-000045/extra', '/DUOS-W-abcdef', '/DUOS-B-'])('shows page not found for malformed %s without a lookup', async (path) => {
    await renderAt(path)
    expect(screen.getByText(NOT_FOUND)).toBeVisible()
    expect(lookup).not.toHaveBeenCalled()
  })

  it('renders nothing and looks nothing up while the session is unknown', async () => {
    vi.mocked(useUserIsLogged).mockReturnValue(undefined)
    await renderAt('/DUOS-M-000045')
    expect(screen.queryByText(NOT_FOUND)).not.toBeInTheDocument()
    expect(screen.queryByTestId('home-page')).not.toBeInTheDocument()
    expect(lookup).not.toHaveBeenCalled()
  })

  it('sends a signed-out visitor to sign in, replacing the identifier, before looking up', async () => {
    vi.mocked(useUserIsLogged).mockReturnValue(false)
    const onNavigate = await renderAt('/duos-m-000045')
    expect(screen.getByTestId('home-page')).toBeInTheDocument()
    expect(onNavigate).toHaveBeenLastCalledWith('/?redirectTo=/duos-m-000045', 'REPLACE')
    expect(lookup).not.toHaveBeenCalled()
  })

  it('shows only the current identifier\'s answer when an earlier lookup settles late', async () => {
    let settleFirst: (value: AssetLookup) => void = () => {}
    lookup
      .mockReturnValueOnce(new Promise((resolve) => { settleFirst = resolve }))
      .mockResolvedValueOnce(buildLookup({ identifier: 'DUOS-W-000012', type: 'WORKSPACE', status: 'RETIRED' }))
    await renderAt('/DUOS-M-000045', '/DUOS-W-000012')

    await userEvent.setup().click(screen.getByRole('button', { name: 'Go' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('DUOS-W-000012 has been retired.')
    await act(async () => settleFirst(buildLookup({ listed: false })))

    expect(screen.getByRole('alert')).toHaveTextContent('DUOS-W-000012 has been retired.')
    expect(screen.queryByText(/DUOS-M-000045/)).not.toBeInTheDocument()
  })

  it('shows nothing for the next identifier until its own lookup answers', async () => {
    lookup
      .mockResolvedValueOnce(buildLookup({ listed: false }))
      .mockReturnValueOnce(new Promise(() => {}))
    await renderAt('/DUOS-M-000045', '/DUOS-W-000012')
    expect(await screen.findByRole('alert')).toHaveTextContent('DUOS-M-000045 is not currently listed')

    await userEvent.setup().click(screen.getByRole('button', { name: 'Go' }))

    expect(lookup).toHaveBeenLastCalledWith('DUOS-W-000012')
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it.each([
    ['/DUOS-000123', '/dataset/DUOS-000123'],
    ['/duos-000123', '/dataset/DUOS-000123'],
    ['/DUOS-D12', '/dataset/DUOS-D12'],
    ['/duos-d12', '/dataset/DUOS-D12'],
    ['/DUOS-S12', '/studies/12'],
    ['/duos-s12', '/studies/12'],
  ])('still routes %s to %s without a lookup', async (path, target) => {
    const onNavigate = await renderAt(path)
    expect(onNavigate).toHaveBeenLastCalledWith(target, 'REPLACE')
    expect(lookup).not.toHaveBeenCalled()
  })
})
