import React from 'react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { mount } from 'cypress/react'
import SOAcknowledged from 'src/routing/SOAcknowledged'
import { AcknowledgementService } from 'src/libs/acknowledgements'

const ProtectedComponent = () => <div data-cy="protected-content">Protected Content</div>

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

describe('SOAcknowledged', () => {
  it('should render the protected component if SO has accepted DAAs', () => {
    cy.stub(AcknowledgementService, 'hasSOAcceptedDAAs').resolves(true)
    const pageVisitStub = cy.stub()
    mount(
      <MemoryRouter initialEntries={['/protected']}>
        <LocationSpy onLocationChange={pageVisitStub} />
        <Routes>
          <Route element={<SOAcknowledged />}>
            <Route path="/protected" element={<ProtectedComponent />} />
          </Route>
        </Routes>
      </MemoryRouter>,
    )

    cy.get('[data-cy="protected-content"]').should('be.visible')
    cy.get('body').should('not.contain', 'Agree to Library Card Terms')
  })

  it('should redirect to SigningOfficialDaaAgreementWrapper if SO has not accepted DAAs', () => {
    cy.stub(AcknowledgementService, 'hasSOAcceptedDAAs').resolves(false)
    mount(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route element={<SOAcknowledged />}>
            <Route path="/protected" element={<ProtectedComponent />} />
          </Route>
        </Routes>
      </MemoryRouter>,
    )

    cy.get('body').should('contain', 'Agree to Library Card Terms')
    cy.get('[data-cy="protected-content"]').should('not.exist')
  })
})
