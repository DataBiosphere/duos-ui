import React from 'react'
import { mount } from 'cypress/react'
import LibraryCardFormModal, { LibraryCardFormModalProps } from 'src/components/modals/LibraryCardFormModal'

describe('Library Card Form Modal Tests', () => {
  let props: LibraryCardFormModalProps

  beforeEach(() => {
    cy.viewport(1000, 800)
    props = {
      showModal: true,
      createOnClick: cy.stub().as('createOnClick'),
      closeModal: cy.stub().as('closeModal'),
      users: [],
    }
  })

  it('Should render the Library Card Form Modal', () => {
    mount(<LibraryCardFormModal {...props} />)
    cy.get('[data-cy=library-card-form-modal]').should('exist')
    cy.get('[data-cy=library-card-form-modal]').should('contain', 'Add Library Cards')
    cy.get('[id=Add-button]').click()
    cy.get('[id=Cancel-button]').should('exist');
    ['Broad Library Card Agreement',
      'NIH Library Card Agreement',
      'NIH Data Use Certification Agreement'].forEach((text) => {
      cy.get('[data-cy=library-card-form-modal]').should('contain', text)
    })
    cy.get('[id=Cancel-button]').click()
    cy.get('@closeModal').should('have.been.called')
  })

  it('Existing users should be visible in the user selection list', () => {
    const userOptions = [
      { userId: 1, displayName: 'Test User 1', email: 'user@test.com', libraryCard: undefined },
    ]
    const mergedProps = { ...props, ...{ users: userOptions } }
    mount(<LibraryCardFormModal {...mergedProps} />)
    cy.get('input').should('exist')
    cy.get('input').type(userOptions[0].displayName)
    cy.get('[data-cy=library-card-form-modal]').should('contain', userOptions[0].email)
    // select the second option since the first is always the 'New User...' option
    cy.get('[id$=option-1]').click()
    cy.get('[id=Add-button]').click()
    cy.get('@createOnClick').should('have.been.called')
  })

  it('Multiple users should be selectable in the user selection list', () => {
    const userOptions = [
      { userId: 1, displayName: 'Test User 1', email: 'user1@test.com', libraryCard: undefined },
      { userId: 2, displayName: 'Test User 2', email: 'user2@test.com', libraryCard: undefined },
      { userId: 3, displayName: 'Test User 3', email: 'user3@test.com', libraryCard: undefined },
    ]

    const mergedProps = { ...props, ...{ users: userOptions } }
    mount(<LibraryCardFormModal {...mergedProps} />)
    cy.get('input').should('exist')

    // select the first option
    cy.get('input').type('Test User')
    cy.get('[id$=option-1]').click()

    // select the second option
    cy.get('input').type('Test User')
    cy.get('[id$=option-2]').click()

    // select the third option
    cy.get('input').type('Test User')
    cy.get('[id$=option-3]').click()

    // click add and confirm the call was made with all selected users
    cy.get('[id=Add-button]').click()
    cy.get('@createOnClick').should('have.been.calledWith', [
      { userId: 1, userEmail: 'user1@test.com', userName: 'Test User 1' },
      { userId: 2, userEmail: 'user2@test.com', userName: 'Test User 2' },
      { userId: 3, userEmail: 'user3@test.com', userName: 'Test User 3' },
    ])
  })

  it('Non-existing users should NOT be visible in the user selection list', () => {
    const userOptions = [
      { userId: 1, displayName: 'Test User 1', email: 'user@test.com', libraryCard: undefined },
    ]
    const mergedProps = { ...props, ...{ users: userOptions } }
    mount(<LibraryCardFormModal {...mergedProps} />)
    cy.get('input').should('exist')
    cy.get('input').type('Random Name')
    cy.get('[data-cy=library-card-form-modal]').should('not.contain', userOptions[0].email)
  })
})
