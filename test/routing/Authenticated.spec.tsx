import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router'
import Authenticated from 'src/routing/Authenticated'
import { useUserIsLogged } from 'src/hooks/useSession'

vi.mock('src/hooks/useSession', () => ({
  useUserIsLogged: vi.fn(),
}))

const ProtectedComponent = () => <div data-testid="protected-content">Protected Content</div>
const HomeComponent = () => <div data-testid="home-content">Home Page</div>

interface LocationSpyProps {
  onLocationChange: (location: string) => void
}

const renderRoutes = (extra?: React.ReactNode) =>
  render(
    <MemoryRouter initialEntries={['/protected']}>
      {extra}
      <Routes>
        <Route element={<Authenticated />}>
          <Route path="/protected" element={<ProtectedComponent />} />
        </Route>
        <Route path="/" element={<HomeComponent />} />
      </Routes>
    </MemoryRouter>,
  )

describe('Authenticated', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render nothing while the session probe is in flight', () => {
    vi.mocked(useUserIsLogged).mockReturnValue(undefined)

    renderRoutes()

    // Neither the protected content nor a redirect to home — just wait.
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument()
    expect(screen.queryByTestId('home-content')).not.toBeInTheDocument()
  })

  it('should render the protected component if the user is logged in', () => {
    vi.mocked(useUserIsLogged).mockReturnValue(true)

    renderRoutes()

    expect(screen.getByTestId('protected-content')).toBeInTheDocument()
    expect(screen.queryByTestId('home-content')).not.toBeInTheDocument()
  })

  it('should redirect to the home page if the user is not logged in', () => {
    vi.mocked(useUserIsLogged).mockReturnValue(false)

    renderRoutes()

    expect(screen.getByTestId('home-content')).toBeInTheDocument()
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument()
  })

  it('should redirect with a redirectTo query param if the user is not logged in', () => {
    vi.mocked(useUserIsLogged).mockReturnValue(false)
    const pageVisitStub = vi.fn()
    const LocationSpy = ({ onLocationChange }: LocationSpyProps) => {
      const location = useLocation()
      React.useEffect(() => {
        onLocationChange(location.pathname + location.search)
      }, [location, onLocationChange])
      return null
    }

    renderRoutes(<LocationSpy onLocationChange={pageVisitStub} />)

    expect(screen.getByTestId('home-content')).toBeInTheDocument()
    expect(pageVisitStub).toHaveBeenCalledWith('/protected')
    expect(pageVisitStub).toHaveBeenCalledWith('/?redirectTo=/protected')
  })
})
