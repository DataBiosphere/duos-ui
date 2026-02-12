import React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { useLibraryUrlState } from 'src/hooks/useLibraryUrlState'
import { AssetType } from 'src/types/library'

const TestComponent = () => {
  const [state, updateState] = useLibraryUrlState()
  return (
    <div>
      <div id="library">{state.library}</div>
      <div id="tab">{state.tab}</div>
      <button id="update-tab" onClick={() => updateState({ tab: AssetType.DATASETS })}>Update Tab</button>
      <button id="update-library" onClick={() => updateState({ library: 'test' })}>Update Library</button>
      <button id="clear-library" onClick={() => updateState({ library: '' })}>Clear Library</button>
    </div>
  )
}

describe('useLibraryUrlState', () => {
  it('initializes with default values when no search params are present', () => {
    cy.mount(
      <MemoryRouter initialEntries={['/']}>
        <TestComponent />
      </MemoryRouter>,
    )
    cy.get('#library').should('have.text', 'duos')
    cy.get('#tab').should('have.text', AssetType.STUDIES)
  })

  it('initializes with values from search params', () => {
    cy.mount(
      <MemoryRouter initialEntries={['/?library=test&tab=datasets']}>
        <TestComponent />
      </MemoryRouter>,
    )
    cy.get('#library').should('have.text', 'test')
    cy.get('#tab').should('have.text', AssetType.DATASETS)
  })

  it('updates state via updateState', () => {
    cy.mount(
      <MemoryRouter initialEntries={['/']}>
        <TestComponent />
      </MemoryRouter>,
    )

    cy.get('#update-tab').click()
    cy.get('#tab').should('have.text', AssetType.DATASETS)

    cy.get('#update-library').click()
    cy.get('#library').should('have.text', 'test')

    // Test clearing a value (deleting from params)
    cy.get('#clear-library').click()
    cy.get('#library').should('have.text', 'duos') // back to default
  })
})
