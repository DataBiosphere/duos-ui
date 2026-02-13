import React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { DataLibrary } from 'src/pages/DataLibrary'

describe('DataLibrary', () => {
  it('renders the data library page', () => {
    cy.mount(
      <MemoryRouter initialEntries={['/']}>
        <DataLibrary />
      </MemoryRouter>,
    )

    cy.contains('DUOS Data Library').should('be.visible')
    cy.contains('Search, filter, and select datasets').should('be.visible')
    cy.get('input[placeholder="Enter search terms"]').should('exist')
  })

  it('initializes tab based on URL search params', () => {
    cy.mount(
      <MemoryRouter initialEntries={['/?tab=datasets']}>
        <DataLibrary />
      </MemoryRouter>,
    )

    // Should be on Datasets tab (bold font-weight: 700)
    cy.get('button').contains('Datasets').should('have.css', 'font-weight', '700')
    cy.get('button').contains('Studies').should('have.css', 'font-weight', '400')
  })

  it('switches tabs and updates URL state', () => {
    cy.mount(
      <MemoryRouter initialEntries={['/']}>
        <DataLibrary />
      </MemoryRouter>,
    )

    // Initially on Studies
    cy.get('button').contains('Studies').should('have.css', 'font-weight', '700')

    // Click Datasets
    cy.get('button').contains('Datasets').click()

    // Now on Datasets
    cy.get('button').contains('Datasets').should('have.css', 'font-weight', '700')
    cy.get('button').contains('Studies').should('have.css', 'font-weight', '400')
  })
})
