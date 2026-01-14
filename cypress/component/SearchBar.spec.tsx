import React from 'react'
import SearchBar from 'src/components/SearchBar'

describe('SearchBar', () => {
  it('renders without clear icon initially', () => {
    const onChange = cy.stub().as('change')
    cy.mount(<SearchBar handleSearchChange={onChange} />)
    cy.get('[data-cy="search-bar"]').should('exist')
    cy.get('[data-cy="clear-search"]').should('not.exist')
    cy.get('[data-cy="search-icon"]').should('exist')
  })

  it('shows clear icon after typing and invokes handler', () => {
    const onChange = cy.stub().as('change')
    cy.mount(<SearchBar handleSearchChange={onChange} />)
    cy.get('[data-cy="search-bar"]').type('alpha')
    cy.get('[data-cy="clear-search"]').should('exist')
    cy.get('@change').should('have.been.calledWith', 'alpha')
  })

  it('clears value when clear icon clicked', () => {
    const onChange = cy.stub().as('change')
    cy.mount(<SearchBar handleSearchChange={onChange} />)
    cy.get('[data-cy="search-bar"]').type('beta')
    cy.get('[data-cy="clear-search"]').click()
    cy.get('[data-cy="search-bar"]').should('have.value', '')
    cy.get('[data-cy="clear-search"]').should('not.exist')
    cy.get('@change').should('have.been.calledWith', '')
  })

  it('maintains padding when clear icon toggles', () => {
    const onChange = cy.stub()
    cy.mount(<SearchBar handleSearchChange={onChange} />)
    cy.get('[data-cy="search-bar"]').type('x')
    cy.get('[data-cy="search-bar"]')
      .parent()
      .invoke('css', 'padding-right')
    cy.get('[data-cy="clear-search"]').click()
    cy.get('[data-cy="search-bar"]')
      .parent()
      .invoke('css', 'padding-right')
  })
})
