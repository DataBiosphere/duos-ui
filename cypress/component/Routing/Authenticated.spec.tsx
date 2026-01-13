import React from 'react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import Authenticated from 'src/routing/Authenticated'
import { Storage } from 'src/libs/storage'

const ProtectedComponent = () => <div data-cy="protected-content">Protected Content</div>
const HomeComponent = () => <div data-cy="home-content">Home Page</div>

interface LocationSpyProps {
  onLocationChange: (location: string) => void
}

describe('Authenticated', () => {
  it('should render the protected component if the user is logged in', () => {
    cy.stub(Storage, 'userIsLogged').returns(true)

    cy.mount(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route element={<Authenticated />}>
            <Route path="/protected" element={<ProtectedComponent />} />
          </Route>
          <Route path="/" element={<HomeComponent />} />
        </Routes>
      </MemoryRouter>,
    )

    cy.get('[data-cy="protected-content"]').should('be.visible')
    cy.get('[data-cy="home-content"]').should('not.exist')
  })

  it('should redirect to the home page if the user is not logged in', () => {
    cy.stub(Storage, 'userIsLogged').returns(false)

    cy.mount(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route element={<Authenticated />}>
            <Route path="/protected" element={<ProtectedComponent />} />
          </Route>
          <Route path="/" element={<HomeComponent />} />
        </Routes>
      </MemoryRouter>,
    )

    cy.get('[data-cy="home-content"]').should('be.visible')
    cy.get('[data-cy="protected-content"]').should('not.exist')
  })

  it.only('should redirect with a redirectTo query param if the user is not logged in', () => {
    cy.stub(Storage, 'userIsLogged').returns(false)
    const pageVisitStub = cy.stub()
    const LocationSpy = ({ onLocationChange }: LocationSpyProps) => {
      const location = useLocation()
      React.useEffect(() => {
        onLocationChange(location.pathname + location.search)
      }, [location, onLocationChange])
      return null
    }
    cy.mount(
      <MemoryRouter initialEntries={['/protected']}>
        <LocationSpy onLocationChange={pageVisitStub} />
        <Routes>
          <Route element={<Authenticated />}>
            <Route path="/protected" element={<ProtectedComponent />} />
          </Route>
          <Route path="/" element={<HomeComponent />} />
        </Routes>
      </MemoryRouter>,
    )
    cy.get('[data-cy="home-content"]').should('be.visible')
    cy.wrap(pageVisitStub).should('have.been.calledWith', '/protected')
    cy.wrap(pageVisitStub).should('have.been.calledWith', '/?redirectTo=/protected')
  })
})
