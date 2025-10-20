import React from 'react'
import { mount } from 'cypress/react'
import { MemoryRouter } from 'react-router-dom'
import Home from 'src/pages/Home'
import * as libraryVersions from 'src/libs/libraryVersions'

describe('Home Page - Tests', function () {
  beforeEach(() => {
    // Stub getLibraryVersions to return consistent test data
    cy.stub(libraryVersions, 'getLibraryVersions').returns({
      'anvil': {
        query: { match_phrase: { 'study.description': 'anvil' } },
        icon: '/test-anvil-icon.svg',
        title: 'AnVIL Data Library',
        featured: true,
      },
      'broad': {
        query: { match_phrase: { 'submitter.institution.name': 'The Broad Institute of MIT and Harvard' } },
        icon: '/test-broad-icon.png',
        title: 'Broad Data Library',
        featured: true,
      },
      'hca': {
        query: { match_phrase: { 'study.description': 'hca dcp' } },
        icon: '/test-hca-icon.png',
        title: 'Human Cell Atlas Data Library',
        featured: true,
      },
      'scp': {
        query: { match_phrase: { 'study.description': 'Single Cell Portal' } },
        icon: '/test-scp-icon.png',
        title: 'Single Cell Portal Data Library',
        featured: false,
      },
      'terra': {
        query: null,
        icon: '/test-terra-icon.svg',
        title: 'Terra Data Library',
        featured: false,
      },
    })
  })

  afterEach(() => {
    cy.unstub(libraryVersions, 'getLibraryVersions')
  })

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
      cy.get('[data-for="broad"]').find('span[title="Please login to access Broad Data Library"]').should('exist')
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
      cy.get('[data-for="broad"]').find('span[title="Broad"]').should('exist')
      cy.get('[data-for="hca"]').find('span[title="Human Cell Atlas"]').should('exist')
      cy.get('[data-for="scp"]').find('span[title="Single Cell Portal"]').should('exist')
    })

    it('has direct navigation links when logged in', function () {
      cy.get('a[href="/datalibrary/anvil"]').should('exist')
      cy.get('a[href="/datalibrary/broad"]').should('exist')
      cy.get('a[href="/datalibrary/hca"]').should('exist')
      cy.get('a[href="/datalibrary/scp"]').should('exist')
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
      cy.get('.logo-card').should('have.length', 4)
    })

    it('displays logos vertically on mobile', function () {
      cy.viewport(600, 800)
      cy.get('.logo-grid').should('have.css', 'flex-direction', 'column')
      cy.get('.logo-card').should('have.length', 4)
    })
  })

  describe('Featured libraries functionality', function () {
    it('only displays libraries marked as featured', function () {
      mount(
        <MemoryRouter>
          <Home isLogged={true} />
        </MemoryRouter>,
      )

      // Should show 4 featured libraries
      cy.get('.logo-card').should('have.length', 4)

      // Should not display terra (featured: false)
      cy.get('[data-for="terra"]').should('not.exist')
    })

    it('displays featured libraries in alphabetical order', function () {
      mount(
        <MemoryRouter>
          <Home isLogged={true} />
        </MemoryRouter>,
      )

      cy.get('.logo-card').then(($cards) => {
        const ids = $cards.map((i, el) => {
          return Cypress.$(el).find('[data-for]').attr('data-for')
        }).get()

        // Should be sorted alphabetically: anvil, broad, hca, scp
        expect(ids).to.deep.equal(['anvil', 'broad', 'hca', 'scp'])
      })
    })

    it('uses special styling for Broad Institute logo', function () {
      mount(
        <MemoryRouter>
          <Home isLogged={true} />
        </MemoryRouter>,
      )

      // Find the Broad card
      cy.get('[data-for="broad"]').parent().parent().should('have.css', 'background-color', 'rgb(31, 59, 80)')
      cy.get('[data-for="broad"]').parent().parent().should('have.css', 'padding', '15px')
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
      cy.get('.logo-card').should('have.length', 4)

      // Mobile
      cy.viewport(480, 800)
      cy.get('.logo-card').should('have.length', 4)
    })
  })
})
