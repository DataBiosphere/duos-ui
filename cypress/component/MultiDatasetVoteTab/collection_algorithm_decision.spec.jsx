import CollectionAlgorithmDecision from 'src/components/CollectionAlgorithmDecision'
import React from 'react'
import { formatDate } from 'src/libs/utils'

describe('CollectionAlgorithmDecision component', () => {
  it('renders a container with an id', () => {
    const id = 1
    const props = {
      algorithmResult: { id },
    }
    cy.mount(<CollectionAlgorithmDecision {...props} />)

    cy.get(`#collection-algorithm-id-${id}`).should('exist')
  })

  it('renders the decision label', () => {
    const id = 1
    const props = {
      algorithmResult: {
        result: 'No',
        id,
      },
    }
    cy.mount(<CollectionAlgorithmDecision {...props} />)

    cy.get(`#collection-${id}-decision-label`).should('exist')
    cy.get(`#collection-${id}-decision-label`).contains('Decision:')
  })

  it('renders the date label', () => {
    const id = 1
    const props = {
      algorithmResult: {
        result: 'No',
        id,
      },
    }
    cy.mount(<CollectionAlgorithmDecision {...props} />)

    cy.get(`#collection-${id}-date-label`).should('exist')
    cy.get(`#collection-${id}-date-label`).contains('Date:')
  })

  it('renders the component subtitle', () => {
    const id = 1
    const props = {
      algorithmResult: {
        result: 'No',
        id,
      },
    }
    cy.mount(<CollectionAlgorithmDecision {...props} />)

    cy.get(`#collection-${id}-subtitle`).should('exist')
    cy.get(`#collection-${id}-subtitle`).contains('DUOS Algorithm Decision')
  })

  it('renders "N/A" if no result is provided', () => {
    const id = 1
    const props = {
      algorithmResult: {
        result: undefined,
        id,
      },
    }
    cy.mount(<CollectionAlgorithmDecision {...props} />)

    cy.get(`#collection-${id}-decision-value`).should('exist')
    cy.get(`#collection-${id}-decision-value`).contains('N/A')
  })

  it('renders "YES" if provided by algorithmResult', () => {
    const id = 1
    const props = {
      algorithmResult: {
        result: 'Yes',
        id,
      },
    }
    cy.mount(<CollectionAlgorithmDecision {...props} />)

    cy.get(`#collection-${id}-decision-value`).should('exist')
    cy.get(`#collection-${id}-decision-value`).contains('YES')
  })
  it('renders "NO" if provided by algorithmResult', () => {
    const id = 1
    const props = {
      algorithmResult: {
        result: 'No',
        id,
      },
    }
    cy.mount(<CollectionAlgorithmDecision {...props} />)

    cy.get(`#collection-${id}-decision-value`).should('exist')
    cy.get(`#collection-${id}-decision-value`).contains('NO')
  })

  it('renders createDate if provided by algorithmResult', () => {
    const createDate = new Date()
    const expectedDate = formatDate(createDate)
    const id = 1
    const props = {
      algorithmResult: {
        result: 'No',
        id,
        createDate,
      },
    }
    cy.mount(<CollectionAlgorithmDecision {...props} />)

    cy.get(`#collection-${id}-date-value`).should('exist')
    cy.get(`#collection-${id}-date-value`).contains(expectedDate)
  })

  it('renders "N/A if createDate is not provided by algorithmResult', () => {
    const id = 1
    const props = {
      algorithmResult: {
        result: 'No',
        id,
      },
    }
    cy.mount(<CollectionAlgorithmDecision {...props} />)

    cy.get(`#collection-${id}-date-value`).should('exist')
    cy.get(`#collection-${id}-date-value`).contains('N/A')
  })
})
