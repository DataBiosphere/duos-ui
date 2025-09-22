import { mount } from 'cypress/react'
import React from 'react'
import LibraryCard from 'src/pages/user_profile/LibraryCard'

describe('LibraryCard', () => {
  beforeEach(() => {
    cy.viewport(600, 600)
    cy.initApplicationConfig()
  })

  it('renders issuedOn and issuedBy props', () => {
    const issuedOn = '2024-06-01'
    const issuedBy = 'John Doe'

    mount(<LibraryCard issuedOn={issuedOn} issuedBy={issuedBy} />)

    cy.contains(`Issued on: ${issuedOn}`).should('exist')
    cy.contains(`Issued by: ${issuedBy}`).should('exist')
    cy.contains('Yes').should('exist')
  })
})
