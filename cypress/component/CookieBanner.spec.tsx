import React from 'react'
import { mount } from 'cypress/react'

import { CookieBanner } from 'src/components/CookieBanner'
import { BrowserRouter } from 'react-router-dom'
import { CookieUtils } from 'src/utils/CookieUtils'

describe('CookieBanner', () => {
  it('renders the banner text and close button', () => {
    mount(<BrowserRouter><CookieBanner visible={true} /></BrowserRouter>)
    cy.contains('We care about your privacy').should('exist')
    cy.get('button').should('exist')
  })

  it('hides banner and sets accepted when close button is clicked', () => {
    cy.stub(CookieUtils, 'setAccepted').as('setAcceptedStub')
    mount(<BrowserRouter><CookieBanner visible={true} /></BrowserRouter>)
    cy.get('#cookie_banner').should('be.visible')
    cy.get('button').click()
    cy.get('#cookie_banner').should('not.be.visible')
    cy.get('@setAcceptedStub').should('have.been.calledOnce')
  })

  it('does not render the banner text when visible is set false', () => {
    mount(<BrowserRouter><CookieBanner visible={false} /></BrowserRouter>)
    cy.get('#cookie_banner').should('not.be.visible')
  })
})
