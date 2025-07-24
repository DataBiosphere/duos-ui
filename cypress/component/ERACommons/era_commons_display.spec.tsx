import React from 'react'
import { ERACommonsDisplay } from 'src/components/era_commons/ERACommonsDisplay'
import { mount } from 'cypress/react'

describe ('ERA Commons Display - Component Tests', () => {
  it('renders the component correctly when an eRA Commons Id is passed', () => {
    mount(<ERACommonsDisplay eraCommonsId="scoobydoo" />)
    cy.get('[data-cy=era-commons-display-id-value]').should('have.text', 'scoobydoo')
  })
  it('renders the component correctly when undefined is passed.', () => {
    mount(<ERACommonsDisplay eraCommonsId={undefined} />)
    cy.get('[data-cy=era-commons-display-id-value]').should('have.text', '(not recorded at time of submission)')
  })
})
