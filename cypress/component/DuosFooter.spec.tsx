import React from 'react'
import { mount } from 'cypress/react'

import DuosFooter from 'src/components/DuosFooter'
import { CookieUtils } from 'src/utils/CookieUtils'
import { BrowserRouter } from 'react-router-dom'

describe('DuosFooter', () => {
  it('renders the Broad Institute logo', () => {
    cy.stub(CookieUtils, 'getAccepted').returns(true)
    mount(<BrowserRouter><DuosFooter /></BrowserRouter>)
    cy.get('#cookie_banner').should('not.exist')
    cy.get('img[alt="Broad Institute logo"]').should('exist')
  })

  it('renders all footer links', () => {
    cy.stub(CookieUtils, 'getAccepted').returns(true)
    mount(<BrowserRouter><DuosFooter /></BrowserRouter>)
    cy.get('#cookie_banner').should('not.exist')
    cy.contains('© Broad Institute').should('exist')
    cy.contains('a', 'Privacy Policy').should('have.attr', 'href', '/privacy')
    cy.contains('a', 'Terms of Service').should('have.attr', 'href', '/tos')
    cy.contains('a', 'Cookie Policy').should('have.attr', 'href', '/cookie_policy')
    cy.contains('a', 'Status').should('have.attr', 'href', '/status')
  })

  it('shows Cookie Banner when cookies have not been acknowledged', () => {
    cy.stub(CookieUtils, 'getAccepted').returns(false)
    mount(<BrowserRouter><DuosFooter /></BrowserRouter>)
    cy.get('#cookie_banner').should('be.visible')
  })
})
