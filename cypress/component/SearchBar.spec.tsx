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

  it('applies wider padding to input when clear icon is visible', () => {
    const onChange = cy.stub()
    cy.mount(<SearchBar handleSearchChange={onChange} />)

    // Without text: input should not have the wider right-padding class
    cy.get('[data-cy="search-bar"]')
      .closest('.MuiInputBase-root')
      .should('not.have.attr', 'data-show-clear')

    cy.get('[data-cy="search-bar"]').type('x')

    // With text: clear icon appears and the input shifts to accommodate it
    cy.get('[data-cy="clear-search"]').should('exist')
    cy.get('[data-cy="search-bar"]').then(($input) => {
      const paddingRight = parseFloat(getComputedStyle($input[0]).paddingRight)
      expect(paddingRight).to.be.greaterThan(0)
    })
  })

  describe('debounce', () => {
    it('does not call handler on mount', () => {
      const onChange = cy.stub().as('change')
      cy.mount(<SearchBar handleSearchChange={onChange} />)
      cy.get('[data-cy="search-bar"]').should('exist')
      cy.get('@change').should('not.have.been.called')
    })

    it('debounces rapid keystrokes into a single call with the final value', () => {
      const onChange = cy.stub().as('change')
      cy.mount(<SearchBar handleSearchChange={onChange} />)
      // type() fires one change event per character — all within a few ms
      cy.get('[data-cy="search-bar"]').type('hello')
      // Handler should eventually be called exactly once with the full value
      cy.get('@change').should('have.been.calledOnce')
      cy.get('@change').should('have.been.calledWith', 'hello')
    })

    it('calls handler with updated value after further input', () => {
      const onChange = cy.stub().as('change')
      cy.mount(<SearchBar handleSearchChange={onChange} />)
      cy.get('[data-cy="search-bar"]').type('foo')
      cy.get('@change').should('have.been.calledWith', 'foo')
      cy.get('[data-cy="search-bar"]').type('bar')
      cy.get('@change').should('have.been.calledWith', 'foobar')
    })
  })

  describe('initialValue prop', () => {
    it('pre-populates the input', () => {
      const onChange = cy.stub()
      cy.mount(<SearchBar handleSearchChange={onChange} initialValue="prefilled" />)
      cy.get('[data-cy="search-bar"]').should('have.value', 'prefilled')
    })

    it('shows clear icon when initialValue is non-empty', () => {
      const onChange = cy.stub()
      cy.mount(<SearchBar handleSearchChange={onChange} initialValue="something" />)
      cy.get('[data-cy="clear-search"]').should('exist')
    })

    it('does not call handler on mount even with a non-empty initialValue', () => {
      const onChange = cy.stub().as('change')
      cy.mount(<SearchBar handleSearchChange={onChange} initialValue="pre" />)
      cy.get('[data-cy="search-bar"]').should('have.value', 'pre')
      cy.get('@change').should('not.have.been.called')
    })

    it('clears the pre-populated value when clear is clicked', () => {
      const onChange = cy.stub().as('change')
      cy.mount(<SearchBar handleSearchChange={onChange} initialValue="preset" />)
      cy.get('[data-cy="clear-search"]').click()
      cy.get('[data-cy="search-bar"]').should('have.value', '')
      cy.get('[data-cy="clear-search"]').should('not.exist')
      cy.get('@change').should('have.been.calledWith', '')
    })
  })

  describe('placeholder prop', () => {
    it('renders the default placeholder when none is provided', () => {
      cy.mount(<SearchBar handleSearchChange={cy.stub()} />)
      cy.get('[data-cy="search-bar"]').should('have.attr', 'placeholder', 'Enter search terms')
    })

    it('renders a custom placeholder when provided', () => {
      cy.mount(<SearchBar handleSearchChange={cy.stub()} placeholder="Search datasets..." />)
      cy.get('[data-cy="search-bar"]').should('have.attr', 'placeholder', 'Search datasets...')
    })
  })
})
