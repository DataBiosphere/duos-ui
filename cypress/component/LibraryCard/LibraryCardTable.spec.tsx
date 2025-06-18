import React from 'react';
import {mount} from 'cypress/react';
import LibraryCardTable, {LibraryCardTableProps} from 'src/components/library_card_table/LibraryCardTable';
import {LibraryCard as LibraryCardModel} from 'src/types/model';
import {UserOption} from 'src/components/modals/LibraryCardFormModal';
import {LibraryCard} from 'src/libs/ajax/LibraryCard';

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

  const userOptions: UserOption[] = [
    {userId: 1, displayName: 'Test User 1', email: 'user1@test.com', libraryCard: undefined},
    {userId: 2, displayName: 'Test User 2', email: 'user2@test.com', libraryCard: undefined},
    {userId: 3, displayName: 'Test User 3', email: 'user3@test.com', libraryCard: undefined}
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

  it('Should display an error message if a library card failed to create', () => {
    cy.stub(LibraryCard, 'createLibraryCard')
        .callsFake((card) => {
          return Promise.reject({
            response: {
              data: {
                message: `Failed to issue library card for ${card.userEmail}`
              }
            }
          });
        });

    const props: LibraryCardTableProps = {
      libraryCards: [],
      users: userOptions,
    }

    mount(<LibraryCardTable {...props}/>);
    cy.get('[data-cy=add-library-card-button]').click();
    cy.get('[data-cy=library-card-form-modal]').should('exist');

    cy.get('input[id^=react-select-]').should('exist');
    cy.get('input[id^=react-select-]').type('Test User');
    cy.get('[id$=option-1]').click(); // Test User 1

    cy.get('[id=Add-button]').click();
    cy.contains('Failed to issue library card for user1@test.com')
  });
});
