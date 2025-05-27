import React from 'react';
import {mount} from 'cypress/react';
import LibraryCardTable, {LibraryCardTableProps} from 'src/components/library_card_table/LibraryCardTable';
import {LibraryCard as LibraryCardModel} from 'src/types/model';

describe('Library Card Table Tests', () => {

  const libraryCardList: LibraryCardModel[] = [
    {
      id: 1,
      userId: 1,
      userName: 'Test User 1',
      userEmail: 'test.user.1@test.com',
      createUserId: 2,
      createDate: new Date(),
    }
  ]

  beforeEach(() => {
    cy.viewport(1000, 800);
  });

  it('Should render the Library Card Table', () => {
    const props: LibraryCardTableProps = {
      libraryCards: libraryCardList,
      users: [],
    }
    mount(<LibraryCardTable {...props}/>);
    cy.get('[data-cy=manage-library-card-table]').should('exist');
    cy.get('[data-cy=add-library-card-button]').should('exist');
    // For each user in the list, teest that the row is deletable and removed from the table view
    libraryCardList.forEach((card) => {
      cy.get('[data-cy=manage-library-card-table]').should('contain', card.userName);
      cy.get('[data-cy=manage-library-card-table]').should('contain', card.userEmail);
      cy.get(`[id=show-delete-modal-${card.id}]`).should('exist');
      cy.get(`[id=show-delete-modal-${card.id}]`).click();
      cy.get('.confirmation-modal').should('exist');
      cy.get('.confirmation-modal').find('button[type="button"]').contains('Cancel').click();
      cy.get(`[id=show-delete-modal-${card.id}]`).click();
      cy.get('.confirmation-modal').find('button[type="button"]').contains('Confirm').click();
    });
    libraryCardList.forEach((card) => {
      cy.get('.table-data').should('not.contain', card.userName)
    });
  });

});
