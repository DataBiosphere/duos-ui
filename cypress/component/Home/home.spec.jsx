import React from 'react'
import { mount } from 'cypress/react'
import { MemoryRouter } from 'react-router-dom'
import Home from 'src/pages/Home'

describe('Home Page - Tests', function () {
  describe('When user is not logged in', function () {
    beforeEach(() => {
      mount(
        <MemoryRouter>
          <Home isLogged={false} />
        </MemoryRouter>,
      )
    })

    it('renders the page header correctly', function () {
      cy.contains('Data Use Oversight System').should('be.visible')
      cy.contains('Get data faster').should('be.visible')
    })

    it('renders the Data Libraries section with consistent message', function () {
      cy.contains('Data Libraries in DUOS').should('be.visible')
      cy.contains('Explore curated Data Libraries for studies').should('be.visible')
    })

    it('displays tooltips with login required message for data libraries', function () {
      cy.get('[data-for="anvil"]').find('span[title="Please login to access AnVIL Data Library"]').should('exist')
      cy.get('[data-for="broad"]').find('span[title="Please login to access Broad Institute Data Library"]').should('exist')
      cy.get('[data-for="hca"]').find('span[title="Please login to access Human Cell Atlas Data Library"]').should('exist')
    })

    it('interacts with library card links when not logged in', function () {
      cy.get('.logo-card').should('have.length', 3)
      cy.get('.logo-card').each(($card) => {
        cy.wrap($card).find('a').should('exist')
      })

      // Create a spy on replaceState to check if URL parameters are updated
      cy.window().then((win) => {
        cy.spy(win.history, 'replaceState').as('replaceState')
      })

      // Stub document.querySelectorAll to simulate no sign-in button found (fallback case)
      cy.window().then((win) => {
        cy.stub(win.document, 'querySelectorAll').returns([])
      })

      // Also stub scrollTo for the fallback behavior
      cy.window().then((win) => {
        cy.stub(win, 'scrollTo').as('scrollTo')
      })

      cy.get('.logo-card').first().find('a').click({ force: true })

      cy.get('@replaceState').should('be.called')
      cy.get('@scrollTo').should('be.called')

      // URL should contain the redirectTo parameter
      cy.location('search').should('include', 'redirectTo=%2Fdatalibrary%2Fanvil')
    })
  })

  describe('When user is logged in', function () {
    beforeEach(() => {
      mount(
        <MemoryRouter>
          <Home isLogged={true} />
        </MemoryRouter>,
      )
    })

    it('renders the page header correctly', function () {
      cy.contains('Data Use Oversight System').should('be.visible')
      cy.contains('Get data faster').should('be.visible')
    })

    it('renders the Data Libraries section with clickable message', function () {
      cy.contains('Data Libraries in DUOS').should('be.visible')
      cy.contains('Explore curated Data Libraries for studies').should('be.visible')
    })

    it('displays tooltips with correct text for data libraries', function () {
      cy.get('[data-for="anvil"]').find('span[title="AnVIL"]').should('exist')
      cy.get('[data-for="broad"]').find('span[title="Broad Institute"]').should('exist')
      cy.get('[data-for="hca"]').find('span[title="Human Cell Atlas"]').should('exist')
    })

    it('has direct navigation links when logged in', function () {
      cy.get('a[href="/datalibrary/anvil"]').should('exist')
      cy.get('a[href="/datalibrary/broad"]').should('exist')
      cy.get('a[href="/datalibrary/HCA"]').should('exist')
    })

    it('navigates directly without calling handleSignIn when logged in', function () {
      cy.window().then((win) => {
        cy.spy(win.history, 'replaceState').as('replaceState')
      })
      cy.get('a[href="/datalibrary/anvil"]').click({ force: true })
      cy.get('@replaceState').should('not.be.called')
    })

    it('displays logos horizontally on desktop', function () {
      cy.viewport(1200, 800)
      cy.get('.logo-grid').should('have.css', 'flex-direction', 'row')
      cy.get('.logo-card').should('have.length', 3)
    })

    it('displays logos vertically on mobile', function () {
      cy.viewport(600, 800)
      cy.get('.logo-grid').should('have.css', 'flex-direction', 'column')
      cy.get('.logo-card').should('have.length', 3)
    })
  })
})
