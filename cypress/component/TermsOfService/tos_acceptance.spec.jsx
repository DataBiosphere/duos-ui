import React from 'react'
import { Auth } from 'src/libs/auth/auth'
import TermsOfServiceAcceptance from 'src/pages/TermsOfServiceAcceptance'
import { Navigation } from 'src/libs/utils'
import { OAuth2 } from 'src/libs/ajax/OAuth2'
import { ToS } from 'src/libs/ajax/ToS'
import { Storage } from 'src/libs/storage'
import { BrowserRouter } from 'react-router-dom'

const text = 'TOS Text'

describe('Terms of Service Acceptance Page', function () {
  // Intercept configuration calls
  beforeEach(async () => {
    cy.initApplicationConfig()
    cy.stub(OAuth2, 'getConfig').returns({
      authorityEndpoint: 'authorityEndpoint',
      clientId: 'clientId',
    })
    await Auth.initialize()
  })
  it('Standard text loads correctly and buttons work', function () {
    cy.viewport(600, 300)
    cy.stub(ToS, 'getDUOSText').returns(text)
    cy.stub(ToS, 'acceptToS').as('acceptToS')
    cy.stub(Storage, 'getCurrentUser').returns({})
    cy.stub(Navigation, 'console').returns(true)
    cy.stub(Auth, 'signOut').as('signOut')
    cy.mount(<BrowserRouter><TermsOfServiceAcceptance /></BrowserRouter>)
    // Test that the reject button clicks and calls sign-out
    cy.contains('reject', { matchCase: false }).should('exist')
    cy.get('[id=tos-reject]').should('exist')
    cy.get('[id=tos-reject]').click()
    cy.get('@signOut').should('be.called')

    // Test that the accept button clicks and calls accept ToS
    cy.get('[id=tos-accept]').should('exist')
    cy.get('[id=tos-accept]').click()
    cy.get('@acceptToS').should('be.called')
  })
})
