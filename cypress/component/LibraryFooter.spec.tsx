import React from 'react'
import LibraryFooter from 'src/components/data_library/LibraryFooter'
import { Storage } from 'src/libs/storage'

describe('LibraryFooter', () => {
  it('should not be visible when no datasets are selected', () => {
    cy.mount(
      <LibraryFooter
        selectedDatasetIds={[]}
        selectedStudyIds={[]}
        onApplyForAccess={cy.spy()}
      />,
    )
    cy.get('[data-cy="library-footer"]').should('not.exist')
  })

  it('should be visible when datasets are selected', () => {
    cy.mount(
      <LibraryFooter
        selectedDatasetIds={[1]}
        selectedStudyIds={[101]}
        onApplyForAccess={cy.spy()}
      />,
    )
    cy.get('[data-cy="library-footer"]').should('be.visible')
    cy.contains('1 dataset selected from 1 study').should('be.visible')
  })

  it('should show correct counts for multiple selections', () => {
    cy.mount(
      <LibraryFooter
        selectedDatasetIds={[1, 2, 3]}
        selectedStudyIds={[101, 102]}
        onApplyForAccess={cy.spy()}
      />,
    )
    cy.get('[data-cy="library-footer"]').should('be.visible')
    cy.contains('3 datasets selected from 2 studies').should('be.visible')
  })

  it('should call onApplyForAccess when button is clicked', () => {
    const onApplyForAccess = cy.spy().as('onApplyForAccess')
    cy.window().then(() => {
      cy.stub(Storage, 'getCurrentUser').returns({
        libraryCard: { cardNumber: '12345' },
      })
      cy.mount(
        <LibraryFooter
          selectedDatasetIds={[1]}
          selectedStudyIds={[101]}
          onApplyForAccess={onApplyForAccess}
        />,
      )
    })
    cy.get('[data-cy="library-footer"]').find('button').contains('Apply for Access').click()
    cy.get('@onApplyForAccess').should('have.been.calledOnce')
  })

  it('should disable Apply for Access button when user has no library card', () => {
    cy.window().then(() => {
      cy.stub(Storage, 'getCurrentUser').returns({
        libraryCard: null,
      })
      cy.mount(
        <LibraryFooter
          selectedDatasetIds={[1]}
          selectedStudyIds={[101]}
          onApplyForAccess={cy.spy()}
        />,
      )
      cy.get('[data-cy="library-footer"]').find('button').contains('Apply for Access').should('be.disabled')
    })
  })

  it('should show tooltip when hovering over disabled button', () => {
    cy.window().then(() => {
      cy.stub(Storage, 'getCurrentUser').returns({
        libraryCard: null,
      })
      cy.mount(
        <LibraryFooter
          selectedDatasetIds={[1]}
          selectedStudyIds={[101]}
          onApplyForAccess={cy.spy()}
        />,
      )

      cy.get('[data-cy="library-footer"]')
        .find('button')
        .contains('Apply for Access')
        .parent('span')
        .trigger('mouseover')

      cy.get('[role="tooltip"]')
        .should('be.visible')
        .and('contain', 'A Library Card is required to apply for data access')
    })
  })

  it('should enable button when user has a library card', () => {
    cy.window().then(() => {
      cy.stub(Storage, 'getCurrentUser').returns({
        libraryCard: { cardNumber: '12345' },
      })
      cy.mount(
        <LibraryFooter
          selectedDatasetIds={[1]}
          selectedStudyIds={[101]}
          onApplyForAccess={cy.spy()}
        />,
      )
      cy.get('[data-cy="library-footer"]').find('button').contains('Apply for Access').should('not.be.disabled')
    })
  })
})
