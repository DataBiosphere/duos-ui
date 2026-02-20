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
      <div id="filters">{JSON.stringify(state.filters)}</div>
      <div id="page">{state.page}</div>
      <div id="pageSize">{state.pageSize}</div>
      <div id="sortField">{state.sortField || 'none'}</div>
      <div id="sortOrder">{state.sortOrder || 'none'}</div>
      <button id="update-tab" onClick={() => updateState({ tab: AssetType.DATASETS })}>Update Tab</button>
      <button id="update-library" onClick={() => updateState({ library: 'test' })}>Update Library</button>
      <button id="clear-library" onClick={() => updateState({ library: '' })}>Clear Library</button>
      <button id="update-pagination" onClick={() => updateState({ page: 1, pageSize: 50 })}>Update Pagination</button>
      <button id="update-sort" onClick={() => updateState({ sortField: 'studyName', sortOrder: 'asc' })}>Update Sort</button>
      <button id="clear-sort" onClick={() => updateState({ sortField: undefined, sortOrder: undefined })}>Clear Sort</button>
      <button
        id="update-filters"
        onClick={() => updateState({
          filters: {
            accessManagement: ['controlled'],
            dataUse: [],
            dataType: [],
            dac: [],
            participantCount: { min: 10 },
          },
        })}
      >Update Filters
      </button>
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
    cy.get('#tab').should('have.text', AssetType.DATASETS)
    cy.get('#filters').then(($el) => {
      const filters = JSON.parse($el.text())
      expect(filters.accessManagement).to.have.length(0)
      expect(filters.participantCount.min).to.be.equal(undefined)
    })
  })

  it('initializes with values from search params', () => {
    cy.mount(
      <MemoryRouter initialEntries={['/?library=test&tab=datasets&access=controlled,open&minParticipants=5']}>
        <TestComponent />
      </MemoryRouter>,
    )
    cy.get('#library').should('have.text', 'test')
    cy.get('#tab').should('have.text', AssetType.DATASETS)
    cy.get('#filters').then(($el) => {
      const filters = JSON.parse($el.text())
      expect(filters.accessManagement).to.deep.equal(['controlled', 'open'])
      expect(filters.participantCount.min).to.equal(5)
    })
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

    cy.get('#update-filters').click()
    cy.get('#filters').then(($el) => {
      const filters = JSON.parse($el.text())
      expect(filters.accessManagement).to.deep.equal(['controlled'])
      expect(filters.participantCount.min).to.equal(10)
    })

    // Test clearing a value (deleting from params)
    cy.get('#clear-library').click()
    cy.get('#library').should('have.text', 'duos') // back to default
  })

  it('initializes with pagination and sort from search params', () => {
    cy.mount(
      <MemoryRouter initialEntries={['/?page=2&pageSize=100&sort=studyName&order=desc']}>
        <TestComponent />
      </MemoryRouter>,
    )
    cy.get('#page').should('have.text', '2')
    cy.get('#pageSize').should('have.text', '100')
    cy.get('#sortField').should('have.text', 'studyName')
    cy.get('#sortOrder').should('have.text', 'desc')
  })

  it('updates pagination via updateState', () => {
    cy.mount(
      <MemoryRouter initialEntries={['/']}>
        <TestComponent />
      </MemoryRouter>,
    )

    cy.get('#update-pagination').click()
    cy.get('#page').should('have.text', '1')
    cy.get('#pageSize').should('have.text', '50')
  })
})
