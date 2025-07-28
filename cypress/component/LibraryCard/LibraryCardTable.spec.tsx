import React from 'react'
import { mount } from 'cypress/react'
import LibraryCardTable, { LibraryCardTableProps } from 'src/components/library_card_table/LibraryCardTable'
import { LibraryCard as LibraryCardModel } from 'src/types/model'

describe('Library Card Table Tests', () => {
  const libraryCardList: LibraryCardModel[] = [
    {
      id: 1,
      userId: 1,
      userName: 'foo foo',
      userEmail: 'test.user.1@test.com',
      createUserId: 2,
      createDate: new Date(),
    },
    {
      id: 2,
      userId: 2,
      userName: 'bar bar',
      userEmail: 'test.user.2@test.com',
      createUserId: 2,
      createDate: new Date(),
    },
    {
      id: 3,
      userId: 3,
      userName: 'baz baz',
      userEmail: 'test.user.3@test.com',
      createUserId: 2,
      createDate: new Date(),
    },
  ]

  beforeEach(() => {
    cy.viewport(1000, 800)
  })

  it('should render the Library Card Table with a list of users', () => {
    const props: LibraryCardTableProps = {
      libraryCards: libraryCardList,
    }
    mount(<LibraryCardTable {...props} />)
    cy.get('[data-cy=manage-library-card-table]').should('exist')
    // For each user in the list, test that the row is visible
    libraryCardList.forEach((card) => {
      cy.get('[data-cy=manage-library-card-table]').should('contain', card.userName)
      cy.get('[data-cy=manage-library-card-table]').should('contain', card.userEmail)
    })
  })

  it('should allow deleting a library card', () => {
    const props: LibraryCardTableProps = {
      libraryCards: libraryCardList,
    }

    mount(<LibraryCardTable {...props} />)

    cy.get('[data-cy=manage-library-card-table]').should('contain', libraryCardList[0].userName)
    cy.get(`[id=show-delete-modal-1]`).click()
    cy.get('.confirmation-modal').find('button[type="button"]').contains('Confirm').click()

    // Verify that the card is removed from the table
    cy.get('[data-cy=manage-library-card-table]').should('not.contain', libraryCardList[0].userName)

    // Verify that the remaining cards are still present
    libraryCardList.slice(1).forEach((card) => {
      cy.get('[data-cy=manage-library-card-table]').should('contain', card.userName)
      cy.get('[data-cy=manage-library-card-table]').should('contain', card.userEmail)
    })
  })

  it('should allow searching for a library card by email', () => {
    const props: LibraryCardTableProps = {
      libraryCards: libraryCardList,
    }

    mount(<LibraryCardTable {...props} />)

    cy.get('[data-cy=search-bar]').type(libraryCardList[0].userEmail)

    // Verify that only the matching card is displayed
    cy.get('[data-cy=manage-library-card-table]').should('contain', libraryCardList[0].userName)

    // Remaining cards should not be displayed
    libraryCardList.slice(1).forEach((card) => {
      cy.get('[data-cy=manage-library-card-table]').should('not.contain', card.userName)
      cy.get('[data-cy=manage-library-card-table]').should('not.contain', card.userEmail)
    })
  })

  it('should allow searching for a library card by user name', () => {
    const props: LibraryCardTableProps = {
      libraryCards: libraryCardList,
    }

    mount(<LibraryCardTable {...props} />)

    cy.get('[data-cy=search-bar]').type(libraryCardList[0].userName)

    // Verify that only the matching card is displayed
    cy.get('[data-cy=manage-library-card-table]').should('contain', libraryCardList[0].userName)

    // Remaining cards should not be displayed
    libraryCardList.slice(1).forEach((card) => {
      cy.get('[data-cy=manage-library-card-table]').should('not.contain', card.userName)
      cy.get('[data-cy=manage-library-card-table]').should('not.contain', card.userEmail)
    })
  })
})
