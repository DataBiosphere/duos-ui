import React from 'react'
import PrivacyPolicy from 'src/pages/PrivacyPolicy'
import { BrowserRouter } from 'react-router-dom'

describe('Privacy Policy', () => {
  it('Renders the privacy policy page', () => {
    cy.mount(<BrowserRouter><PrivacyPolicy /></BrowserRouter>)
    cy.get('h1').should('contain', 'DUOS Privacy Policy')
    cy.get('h2').should('contain', 'Information DUOS May Collect From You')
  })
})
