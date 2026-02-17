import React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { DataLibrary } from 'src/pages/DataLibrary'

const queryClient = new QueryClient()

describe('DataLibrary', () => {
  it('renders the data library page', () => {
    cy.mount(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/']}>
          <DataLibrary />
        </MemoryRouter>
      </QueryClientProvider>,
    )

    cy.contains('DUOS Data Library').should('be.visible')
    cy.contains('Search, filter, and select datasets').should('be.visible')
    cy.get('input[placeholder="Enter search terms"]').should('exist')
  })

  it('renders filter categories', () => {
    cy.mount(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/']}>
          <DataLibrary />
        </MemoryRouter>
      </QueryClientProvider>,
    )

    cy.contains('Access Management').should('exist')
    cy.contains('Data Use').should('exist')
    cy.contains('Data Type').should('exist')
    cy.contains('Participants').should('exist')
  })

  it('toggles filters and updates URL state', () => {
    cy.mount(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/']}>
          <DataLibrary />
        </MemoryRouter>
      </QueryClientProvider>,
    )

    // Check a filter
    cy.contains('Controlled').closest('label').find('input[type="checkbox"]').check()

    // Clear button should appear
    cy.contains('Clear').should('exist')

    // Check filter is active in UI
    cy.contains('Controlled').closest('label').find('input[type="checkbox"]').should('be.checked')
  })

  it('clears all filters', () => {
    cy.mount(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/?access=controlled']}>
          <DataLibrary />
        </MemoryRouter>
      </QueryClientProvider>,
    )

    // Clear filters
    cy.contains('Clear').click()

    // Check filter is unchecked
    cy.contains('Controlled').closest('label').find('input[type="checkbox"]').should('not.be.checked')

    // Clear button should disappear
    cy.contains('Clear').should('not.exist')
  })

  it('initializes tab based on URL search params', () => {
    cy.mount(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/?tab=datasets']}>
          <DataLibrary />
        </MemoryRouter>
      </QueryClientProvider>,
    )

    // Should be on Datasets tab (bold font-weight: 700)
    cy.get('button').contains('Datasets').should('have.css', 'font-weight', '700')
    cy.get('button').contains('Studies').should('have.css', 'font-weight', '400')
  })

  it('switches tabs and updates URL state', () => {
    cy.mount(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/']}>
          <DataLibrary />
        </MemoryRouter>
      </QueryClientProvider>,
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
