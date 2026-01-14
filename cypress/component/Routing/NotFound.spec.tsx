import React from 'react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import NotFound from 'src/pages/NotFound'

const StudyDetailsComponent = () => <div data-cy="study-details-page">Study Details Page</div>
const DatasetStatisticsComponent = () => <div data-cy="dataset-statistics-page">Dataset Statistics Page</div>
const HomeComponent = () => <div data-cy="home-page">Home Page</div>

interface LocationSpyProps {
  onLocationChange: (location: string) => void
}

const LocationSpy = ({ onLocationChange }: LocationSpyProps) => {
  const location = useLocation()
  React.useEffect(() => {
    onLocationChange(location.pathname + location.search)
  }, [location, onLocationChange])
  return null
}

describe('NotFound', () => {
  it('should display the 404 page for a generic unknown path', () => {
    cy.mount(
      <MemoryRouter initialEntries={['/some-unknown-path']}>
        <Routes>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </MemoryRouter>,
    )

    cy.contains('Sorry, the page you were looking for was not found.').should('be.visible')
    cy.get('#btn_back').should('have.attr', 'href', '/home')
  })

  it('should redirect from a DUOS-S path to the corresponding study details page', () => {
    const pageVisitStub = cy.stub()
    cy.mount(
      <MemoryRouter initialEntries={['/DUOS-S12345']}>
        <LocationSpy onLocationChange={pageVisitStub} />
        <Routes>
          <Route path="/studies/:studyId" element={<StudyDetailsComponent />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </MemoryRouter>,
    )

    cy.get('[data-cy="study-details-page"]').should('be.visible')
    cy.wrap(pageVisitStub).should('have.been.calledWith', '/studies/12345')
  })

  it('should redirect from a DUOS- path to the corresponding dataset statistics page', () => {
    const pageVisitStub = cy.stub()
    cy.mount(
      <MemoryRouter initialEntries={['/DUOS-000123']}>
        <LocationSpy onLocationChange={pageVisitStub} />
        <Routes>
          <Route path="/dataset/:datasetIdentifier" element={<DatasetStatisticsComponent />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </MemoryRouter>,
    )

    cy.get('[data-cy="dataset-statistics-page"]').should('be.visible')
    cy.wrap(pageVisitStub).should('have.been.calledWith', '/dataset/DUOS-000123')
  })

  it('should navigate to the home page when the "Back to Home" link is clicked', () => {
    const pageVisitStub = cy.stub()
    cy.mount(
      <MemoryRouter initialEntries={['/some-unknown-path']}>
        <LocationSpy onLocationChange={pageVisitStub} />
        <Routes>
          <Route path="/home" element={<HomeComponent />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </MemoryRouter>,
    )

    cy.get('#btn_back').click()
    cy.get('[data-cy="home-page"]').should('be.visible')
    cy.wrap(pageVisitStub).should('have.been.calledWith', '/home')
  })
})
