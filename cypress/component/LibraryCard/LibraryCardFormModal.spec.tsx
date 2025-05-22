import React from 'react';
import {mount} from 'cypress/react';
import LibraryCardFormModal, {LibraryCardFormModalProps} from 'src/components/modals/LibraryCardFormModal';
import {LibraryCard} from 'src/types/model';

describe('Library Card Form Modal Tests', () => {
  beforeEach(() => {
    cy.viewport(1000, 800);
  });

  it('Should render the Library Card Form Modal', () => {
    const props: LibraryCardFormModalProps = {
      showModal: true,
      createOnClick: cy.stub(),
      closeModal: cy.stub(),
      users: [],
      card: {} as LibraryCard
    };
    mount(<LibraryCardFormModal {...props} />);
    cy.get('[data-cy=library-card-form-modal]').should('exist');
    cy.get('[data-cy=library-card-form-modal]').should('contain', 'Add Library Card');
    cy.get('[id=Add-button]').should('exist');
    cy.get('[id=Cancel-button]').should('exist');
  });
});
