import React from 'react'
import { mount } from 'cypress/react'
import SectionHeading from 'src/components/collection_voting_slab/SectionHeading'

describe('SectionHeading', () => {
  it('renders the heading text', () => {
    mount(<SectionHeading isLoading={false} datasetCount={5} />)
    cy.contains('Datasets Requested').should('exist')
  })

  it('shows the dataset count when not loading', () => {
    mount(<SectionHeading isLoading={false} datasetCount={7} />)
    cy.get('[data-cy=dataset-count]').should('contain.text', '(7)')
  })

  it('does not show the dataset count when loading', () => {
    mount(<SectionHeading isLoading={true} datasetCount={3} />)
    cy.get('[data-cy=dataset-count]').should('not.exist')
  })
})
