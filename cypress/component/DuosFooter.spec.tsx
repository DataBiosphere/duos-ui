import React from 'react'

import DuosFooter from 'src/components/DuosFooter'
import { CookieUtils } from 'src/utils/CookieUtils'
import { BrowserRouter } from 'react-router-dom'

describe('DuosFooter', () => {
  it('renders the Broad Institute logo', () => {
    cy.stub(CookieUtils, 'getAcknowledged').returns(true)
    cy.mount(<BrowserRouter><DuosFooter /></BrowserRouter>)
    cy.get('#cookie_banner').should('not.be.visible')
    cy.get('img[alt="Broad Institute logo"]').should('exist')
  })

  it('renders all footer links', () => {
    cy.stub(CookieUtils, 'getAcknowledged').returns(true)
    cy.mount(<BrowserRouter><DuosFooter /></BrowserRouter>)
    cy.get('#cookie_banner').should('not.be.visible')
    cy.contains('© Broad Institute').should('exist')
    cy.contains('a', 'Privacy Policy').should('have.attr', 'href', '/privacy')
    cy.contains('a', 'Terms of Service').should('have.attr', 'href', '/tos')
    cy.contains('a', 'Cookie Policy').should('have.attr', 'href', '/cookie_policy')
    cy.contains('a', 'Status').should('have.attr', 'href', '/status')
  })

  it('shows Cookie Banner when cookies have not been acknowledged', () => {
    cy.stub(CookieUtils, 'getAcknowledged').returns(false)
    cy.mount(<BrowserRouter><DuosFooter /></BrowserRouter>)
    cy.get('#cookie_banner').should('be.visible')
  })
})
