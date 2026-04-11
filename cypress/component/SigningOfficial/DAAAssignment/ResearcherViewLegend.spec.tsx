import React from 'react'
import ResearcherViewLegend from 'src/pages/signing_official_console/DAAAssignment/ResearcherViewLegend'

describe('ResearcherViewLegend', () => {
  it('renders all legend labels', () => {
    cy.mount(<ResearcherViewLegend />)

    cy.get('[data-cy="researcher-view-legend"]').should('exist')
    cy.get('[data-cy="researcher-view-legend"]').should('contain.text', 'Pre-authorized')
    cy.get('[data-cy="researcher-view-legend"]').should('contain.text', 'Not pre-authorized')
  })

  it('renders one visual marker per legend item', () => {
    cy.mount(<ResearcherViewLegend />)

    cy.get('[data-cy="researcher-view-legend"]').children().should('have.length', 2)
  })
})
