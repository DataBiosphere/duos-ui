import React from 'react'
import { mount } from 'cypress/react'

import DuosFooter from 'src/components/DuosFooter'

describe('DuosFooter', () => {
  beforeEach(() => {
    mount(<DuosFooter />)
  })

  it('renders the Broad Institute logo', () => {
    cy.get('img[alt="Broad Institute logo"]').should('exist')
  })

  it('renders all footer links', () => {
    cy.contains('© Broad Institute').should('exist')
    cy.contains('a', 'Privacy Policy').should('have.attr', 'href', '/privacy')
    cy.contains('a', 'Terms of Service').should('have.attr', 'href', '/tos')
    cy.contains('a', 'Cookie Policy').should('have.attr', 'href', '/cookie_policy')
    cy.contains('a', 'Status').should('have.attr', 'href', '/status')
  })
})
