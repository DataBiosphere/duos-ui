import React from 'react'
import { MemoryRouter } from 'react-router-dom'
import Home from 'src/pages/Home'
import { getLibraryVersions } from 'src/libs/libraryVersions'

// Featured library count is derived from the real data (rather than hardcoded)
// so this spec doesn't go stale every time a library is added or removed.
const featuredLibraryCount = Object.values(getLibraryVersions(null, null))
  .filter(library => library.featured).length

// TODO: remove once viewport-driven responsive assertions are covered by
// @vitest/browser + Playwright (jsdom, used by test/pages/Home.spec.tsx,
// cannot evaluate real CSS media queries / computed layout at a given
// viewport size). Until then, this file is the only coverage for the
// desktop/mobile logo-grid reflow behavior.
describe('Home Page - Responsive Layout', function () {
  describe('When user is logged in', function () {
    beforeEach(() => {
      cy.mount(
        <MemoryRouter>
          <Home isLogged={true} />
        </MemoryRouter>,
      )
    })

    it('displays logos horizontally on desktop', function () {
      cy.viewport(1200, 800)
      cy.get('.logo-grid').should('have.css', 'flex-direction', 'row')
      cy.get('.logo-card').should('have.length', featuredLibraryCount)
    })

    it('displays logos responsively on mobile', function () {
      cy.viewport(600, 800)
      cy.get('.logo-grid').should('have.css', 'display', 'flex')
      cy.get('.logo-grid').should('have.css', 'flex-wrap', 'wrap')
      cy.get('.logo-card').should('have.length', featuredLibraryCount)
    })
  })

  describe('Featured libraries functionality', function () {
    it('handles responsive layout correctly', function () {
      cy.mount(
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
      cy.get('.logo-card').should('have.length', featuredLibraryCount)

      // Mobile
      cy.viewport(480, 800)
      cy.get('.logo-card').should('have.length', featuredLibraryCount)
    })
  })
})
