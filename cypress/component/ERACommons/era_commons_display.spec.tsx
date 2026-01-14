import React from 'react'
import { ERACommonsDisplay } from 'src/components/era_commons/ERACommonsDisplay'

describe ('ERA Commons Display - Component Tests', () => {
  it('renders the component correctly when an eRA Commons Id is passed', () => {
    cy.mount(<ERACommonsDisplay eraCommonsId="scoobydoo" />)
    cy.get('[data-cy=era-commons-display-id-value]').should('have.text', 'scoobydoo')
  })
  it('renders the component correctly when undefined is passed.', () => {
    cy.mount(<ERACommonsDisplay eraCommonsId={undefined} />)
    cy.get('[data-cy=era-commons-display-id-value]').should('have.text', '(not recorded at time of submission)')
  })
})
