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
    libraryCardList.forEach((card) => {
      cy.get('[data-cy=manage-library-card-table]').should('contain', card.userName);
      cy.get('[data-cy=manage-library-card-table]').should('contain', card.userEmail);
      cy.get(`[id=show-delete-modal-${card.id}]`).should('exist');
    });
  });

});
