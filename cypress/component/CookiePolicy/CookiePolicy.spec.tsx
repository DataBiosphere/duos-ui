import React from 'react'
import { BrowserRouter } from 'react-router-dom'
import CookiePolicy from 'src/pages/CookiePolicy'

describe('Cookie Policy', () => {
  it('Renders the privacy policy page', () => {
    cy.mount(<BrowserRouter><CookiePolicy /></BrowserRouter>)
    cy.get('h1').should('contain', 'Cookie Policy')
    cy.get('h2').should('contain', 'What are cookies?')
    cy.get('h2').should('contain', 'What cookies do we use?')
    cy.get('h2').should('contain', 'Cookies consent and changing preferences')
    cy.get('h2').should('contain', 'Controlling all cookies')
    cy.get('h2').should('contain', 'Changes to this Policy')
    cy.get('h2').should('contain', 'Contact Us')
  })
})
