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
      // Just check that the first few featured libraries have tooltips
      cy.get('[data-for="/datalibrary"]').find('span[title="Please login to access DUOS Data Library"]').should('exist')
      cy.get('[data-for="broad"]').find('span[title="Please login to access Broad Data Library"]').should('exist')
      cy.get('[data-for="elwazi"]').find('span[title="Please login to access eLwazi Data Library"]').should('exist')
    })

    it('interacts with library card links when not logged in', function () {
      cy.get('.logo-card').should('have.length', 20)
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
      cy.location('search').should('include', 'redirectTo=%2Fdatalibrary%2F%2Fdatalibrary')
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
      // Check first few featured libraries
      cy.get('[data-for="/datalibrary"]').find('span[title="DUOS"]').should('exist')
      cy.get('[data-for="broad"]').find('span[title="Broad"]').should('exist')
      cy.get('[data-for="elwazi"]').find('span[title="eLwazi"]').should('exist')
    })

    it('has direct navigation links when logged in', function () {
      // Check first few featured libraries
      cy.get('a[href="/datalibrary//datalibrary"]').should('exist')
      cy.get('a[href="/datalibrary/broad"]').should('exist')
      cy.get('a[href="/datalibrary/elwazi"]').should('exist')
    })

    it('navigates directly without calling handleSignIn when logged in', function () {
      cy.window().then((win) => {
        cy.spy(win.history, 'replaceState').as('replaceState')
      })
      cy.get('a[href="/datalibrary/broad"]').click({ force: true })
      cy.get('@replaceState').should('not.be.called')
    })

    it('displays logos horizontally on desktop', function () {
      cy.viewport(1200, 800)
      cy.get('.logo-grid').should('have.css', 'flex-direction', 'row')
      cy.get('.logo-card').should('have.length', 20)
    })

    it('displays logos responsively on mobile', function () {
      cy.viewport(600, 800)
      cy.get('.logo-grid').should('have.css', 'display', 'flex')
      cy.get('.logo-grid').should('have.css', 'flex-wrap', 'wrap')
      cy.get('.logo-card').should('have.length', 20)
    })
  })

  describe('Featured libraries functionality', function () {
    it('only displays libraries marked as featured', function () {
      mount(
        <MemoryRouter>
          <Home isLogged={true} />
        </MemoryRouter>,
      )

      // Should show 20 featured libraries
      cy.get('.logo-card').should('have.length', 20)

      // Should not display terra or mgb (featured: false)
      cy.get('[data-for="terra"]').should('not.exist')
      cy.get('[data-for="mgb"]').should('not.exist')
    })

    it('displays featured libraries in order', function () {
      mount(
        <MemoryRouter>
          <Home isLogged={true} />
        </MemoryRouter>,
      )

      cy.get('.logo-card').should('have.length', 20)

      // Verify first three libraries are in correct order
      cy.get('.logo-card').eq(0).find('img').should('have.attr', 'alt', 'DUOS')
      cy.get('.logo-card').eq(1).find('img').should('have.attr', 'alt', 'Broad')
      cy.get('.logo-card').eq(2).find('img').should('have.attr', 'alt', 'eLwazi')
    })

    it('uses special styling for Broad Institute logo', function () {
      mount(
        <MemoryRouter>
          <Home isLogged={true} />
        </MemoryRouter>,
      )

      // Find the Broad card by looking for the Broad image (alt="Broad", not "Broad Data Library")
      cy.get('.logo-card').filter(':has(img[alt="Broad"])')
        .should('have.css', 'background', 'rgb(31, 59, 80) none repeat scroll 0% 0% / auto padding-box border-box')
        .and('have.css', 'padding', '15px')
    })

    it('handles responsive layout correctly', function () {
      mount(
        <MemoryRouter>
          <Home isLogged={true} />
        </MemoryRouter>,
      )

      // Desktop
      cy.viewport(1200, 800)
      cy.get('.logo-grid').should('have.css', 'display', 'flex')
      cy.get('.logo-grid').should('have.css', 'justify-content', 'center')

      // Tablet
      cy.viewport(768, 1024)
      cy.get('.logo-card').should('have.length', 20)

      // Mobile
      cy.viewport(480, 800)
      cy.get('.logo-card').should('have.length', 20)
    })
  })
})
