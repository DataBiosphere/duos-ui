import React from 'react'
import LibraryFooter from 'src/components/data_library/LibraryFooter'
import { Storage } from 'src/libs/storage'

const stubWithLibraryCard = () => {
  cy.stub(Storage, 'getCurrentUser').returns({ libraryCard: { cardNumber: '12345' } })
}

const stubWithoutLibraryCard = () => {
  cy.stub(Storage, 'getCurrentUser').returns({ libraryCard: null })
}

describe('LibraryFooter', () => {
  describe('visibility', () => {
    it('does not render when no datasets are selected', () => {
      cy.mount(
        <LibraryFooter
          selectedDatasetIds={[]}
          selectedStudyIds={[]}
          onApplyForAccess={cy.spy()}
        />,
      )
      cy.get('[data-cy="library-footer"]').should('not.exist')
    })

    it('renders when at least one dataset is selected', () => {
      cy.mount(
        <LibraryFooter
          selectedDatasetIds={[1]}
          selectedStudyIds={[101]}
          onApplyForAccess={cy.spy()}
        />,
      )
      cy.get('[data-cy="library-footer"]').should('be.visible')
    })
  })

  describe('selection summary text', () => {
    it('displays singular "dataset" and "study" for single selections', () => {
      cy.mount(
        <LibraryFooter
          selectedDatasetIds={[1]}
          selectedStudyIds={[101]}
          onApplyForAccess={cy.spy()}
        />,
      )
      cy.get('[data-cy="library-footer"]').should('contain.text', '1 dataset selected from 1 study')
    })

    it('displays plural "datasets" and "studies" for multiple selections', () => {
      cy.mount(
        <LibraryFooter
          selectedDatasetIds={[1, 2, 3]}
          selectedStudyIds={[101, 102]}
          onApplyForAccess={cy.spy()}
        />,
      )
      cy.get('[data-cy="library-footer"]').should('contain.text', '3 datasets selected from 2 studies')
    })

    it('displays plural "studies" when there are multiple studies with a single dataset', () => {
      cy.mount(
        <LibraryFooter
          selectedDatasetIds={[1]}
          selectedStudyIds={[101, 102]}
          onApplyForAccess={cy.spy()}
        />,
      )
      cy.get('[data-cy="library-footer"]').should('contain.text', '1 dataset selected from 2 studies')
    })

    it('displays plural "datasets" when there are multiple datasets from a single study', () => {
      cy.mount(
        <LibraryFooter
          selectedDatasetIds={[1, 2]}
          selectedStudyIds={[101]}
          onApplyForAccess={cy.spy()}
        />,
      )
      cy.get('[data-cy="library-footer"]').should('contain.text', '2 datasets selected from 1 study')
    })
  })

  describe('Apply for Access button', () => {
    it('is enabled when the user has a library card', () => {
      cy.window().then(() => {
        stubWithLibraryCard()
        cy.mount(
          <LibraryFooter
            selectedDatasetIds={[1]}
            selectedStudyIds={[101]}
            onApplyForAccess={cy.spy()}
          />,
        )
        cy.get('[data-cy="library-footer"]')
          .contains('button', 'Apply for Access')
          .should('not.be.disabled')
      })
    })

    it('is disabled when the user has no library card', () => {
      cy.window().then(() => {
        stubWithoutLibraryCard()
        cy.mount(
          <LibraryFooter
            selectedDatasetIds={[1]}
            selectedStudyIds={[101]}
            onApplyForAccess={cy.spy()}
          />,
        )
        cy.get('[data-cy="library-footer"]')
          .contains('button', 'Apply for Access')
          .should('be.disabled')
      })
    })

    it('calls onApplyForAccess when clicked with a library card', () => {
      const onApplyForAccess = cy.spy().as('onApplyForAccess')
      cy.window().then(() => {
        stubWithLibraryCard()
        cy.mount(
          <LibraryFooter
            selectedDatasetIds={[1]}
            selectedStudyIds={[101]}
            onApplyForAccess={onApplyForAccess}
          />,
        )
        cy.get('[data-cy="library-footer"]')
          .contains('button', 'Apply for Access')
          .click()
        cy.get('@onApplyForAccess').should('have.been.calledOnce')
      })
    })

    it('does not call onApplyForAccess when disabled (no library card)', () => {
      const onApplyForAccess = cy.spy().as('onApplyForAccess')
      cy.window().then(() => {
        stubWithoutLibraryCard()
        cy.mount(
          <LibraryFooter
            selectedDatasetIds={[1]}
            selectedStudyIds={[101]}
            onApplyForAccess={onApplyForAccess}
          />,
        )
        cy.get('[data-cy="library-footer"]')
          .contains('button', 'Apply for Access')
          .click({ force: true })
        cy.get('@onApplyForAccess').should('not.have.been.called')
      })
    })
  })

  describe('tooltip', () => {
    it('shows a tooltip explaining that a library card is required when button is disabled', () => {
      cy.window().then(() => {
        stubWithoutLibraryCard()
        cy.mount(
          <LibraryFooter
            selectedDatasetIds={[1]}
            selectedStudyIds={[101]}
            onApplyForAccess={cy.spy()}
          />,
        )
        cy.get('[data-cy="library-footer"]')
          .contains('button', 'Apply for Access')
          .parent('span')
          .trigger('mouseover')
        cy.get('[role="tooltip"]')
          .should('be.visible')
          .and('contain.text', 'A Library Card is required to apply for data access')
      })
    })

    it('does not show a restricting tooltip when the user has a library card', () => {
      cy.window().then(() => {
        stubWithLibraryCard()
        cy.mount(
          <LibraryFooter
            selectedDatasetIds={[1]}
            selectedStudyIds={[101]}
            onApplyForAccess={cy.spy()}
          />,
        )
        cy.get('[data-cy="library-footer"]')
          .contains('button', 'Apply for Access')
          .parent('span')
          .trigger('mouseover')
        cy.get('[role="tooltip"]').should('not.exist')
      })
    })
  })
})
