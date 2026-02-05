import React from 'react'
import LibraryCardFormModal, { LibraryCardFormModalProps } from 'src/components/modals/LibraryCardFormModal'
import { Storage } from 'src/libs/storage'
import { Institution } from 'src/libs/ajax/Institution'

describe('Library Card Form Modal Select User Tests', () => {
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
    cy.mount(<LibraryCardFormModal {...props} />)
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
    cy.mount(<LibraryCardFormModal {...mergedProps} />)
    cy.get('input').should('exist')
    cy.get('input').type(userOptions[0].displayName)
    cy.get('[data-cy=library-card-form-modal]').should('contain', userOptions[0].email)
    // select the first option
    cy.get('input').type('{enter}')
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
    cy.mount(<LibraryCardFormModal {...mergedProps} />)
    cy.get('input').should('exist')

    // select the first option
    cy.get('input').type('Test User')
    cy.get('input').type('{enter}')

    // select the second option
    cy.get('input').type('Test User')
    cy.get('input').type('{enter}')

    // select the third option
    cy.get('input').type('Test User')
    cy.get('input').type('{enter}')

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
    cy.mount(<LibraryCardFormModal {...mergedProps} />)
    cy.get('input').should('exist')
    cy.get('input').type('Random Name')
    cy.get('[data-cy=library-card-form-modal]').should('not.contain', userOptions[0].email)
  })
})

describe('Library Card Form Modal Add User Tests', () => {
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

  it('Should toggle between existing user selection and new user creation', () => {
    cy.mount(<LibraryCardFormModal {...props} />)

    // Initially should show existing user selection
    cy.contains('Select Existing Users OR').should('exist')
    cy.get('input').should('exist')
    cy.get('[data-cy=library-card-form-modal]').should('contain', 'Select a DUOS User...')

    // Click "Add User" link to switch to new user form
    cy.contains('Add User').click()

    // Should now show new user form
    cy.contains('Add User OR').should('exist')
    cy.get('input[placeholder="User Name"]').should('exist')
    cy.get('input[placeholder="User Email"]').should('exist')

    // Click "Select Existing Users" link to switch back
    cy.contains('Select Existing Users').click()

    // Should show existing user selection again
    cy.contains('Select Existing Users OR').should('exist')
    cy.get('input').should('exist')
    cy.get('[data-cy=library-card-form-modal]').should('contain', 'Select a DUOS User...')
  })

  it('Should validate new user name field is required', () => {
    cy.mount(<LibraryCardFormModal {...props} />)

    // Switch to new user form
    cy.contains('Add User').click()

    // Enter only email, leave name empty
    cy.get('input[placeholder="User Email"]').type('test@example.org')

    // Try to submit without name
    cy.get('[id=Add-button]').should('have.css', 'opacity', '0.5')
  })

  it('Should validate new user email field is required', () => {
    cy.mount(<LibraryCardFormModal {...props} />)

    // Switch to new user form
    cy.contains('Add User').click()

    // Enter only name, leave email empty
    cy.get('input[placeholder="User Name"]').type('Test User')

    // Try to submit without email
    cy.get('[id=Add-button]').should('have.css', 'opacity', '0.5')
  })

  it('Should validate new user email format', () => {
    cy.mount(<LibraryCardFormModal {...props} />)

    // Switch to new user form
    cy.contains('Add User').click()

    // Enter invalid email
    cy.get('input[placeholder="User Name"]').type('Test User')
    cy.get('input[placeholder="User Email"]').type('invalid-email')

    // Button should be disabled due to invalid email
    cy.get('[id=Add-button]').should('have.css', 'opacity', '0.5')
  })

  it('Should validate new user email domain', () => {
    cy.mount(<LibraryCardFormModal {...props} />)

    const duosUser = {
      isSigningOfficial: false,
    }
    const institution = {
      id: 1,
      name: 'Test Institution',
      signingOfficials: [],
      domains: ['example.org'],
    }
    cy.stub(Storage, 'getCurrentUser').returns(duosUser)
    cy.stub(Institution, 'getById').returns(institution)

    // Switch to new user form
    cy.contains('Add User').click()

    // Enter valid name and email
    cy.get('input[placeholder="User Name"]').type('Test User')
    cy.get('input[placeholder="User Email"]').type('test@sample.org')

    // Add button should be disabled due to invalid email domain
    cy.get('[id=Add-button]').should('have.css', 'opacity', '0.5')
  })

  it('Should enable Add button when new user form is valid', () => {
    cy.mount(<LibraryCardFormModal {...props} />)

    const duosUser = {
      isSigningOfficial: false,
    }
    const institution = {
      id: 1,
      name: 'Test Institution',
      signingOfficials: [],
      domains: ['example.org'],
    }
    cy.stub(Storage, 'getCurrentUser').returns(duosUser)
    cy.stub(Institution, 'getById').returns(institution)

    // Switch to new user form
    cy.contains('Add User').click()

    // Enter valid name and email
    cy.get('input[placeholder="User Name"]').type('Test User')
    cy.get('input[placeholder="User Email"]').type('test@example.org')

    // Add button should be enabled
    cy.get('[id=Add-button]').should('have.css', 'opacity', '1')
  })

  it('Should disable Add button when no users selected', () => {
    cy.mount(<LibraryCardFormModal {...props} />)

    // Add button should be disabled with no selection in existing user mode
    cy.get('[id=Add-button]').should('have.css', 'opacity', '0.5')

    // Switch to new user form - should still be disabled
    cy.contains('Add User').click()
    cy.get('[id=Add-button]').should('have.css', 'opacity', '0.5')
  })

  it('Should clear new user form when toggling to existing user selection', () => {
    cy.mount(<LibraryCardFormModal {...props} />)

    // Switch to new user form and enter data
    cy.contains('Add User').click()
    cy.get('input[placeholder="User Name"]').type('Test User')
    cy.get('input[placeholder="User Email"]').type('test@example.org')

    // Toggle back to existing user selection
    cy.contains('Select Existing Users').click()

    // Toggle back to new user form
    cy.contains('Add User').click()

    // Fields should be cleared
    cy.get('input[placeholder="User Name"]').should('have.value', '')
    cy.get('input[placeholder="User Email"]').should('have.value', '')
  })

  it('Should clear form after successful submission', () => {
    const userOptions = [
      { userId: 1, displayName: 'Test User 1', email: 'user@test.com', libraryCard: undefined },
    ]
    const mergedProps = {
      ...props,
      users: userOptions,
      createOnClick: cy.stub().as('createOnClick').resolves(),
    }

    cy.mount(<LibraryCardFormModal {...mergedProps} />)

    // Select a user
    cy.get('input').type('Test User')
    cy.get('input').type('{enter}')

    // Click Add
    cy.get('[id=Add-button]').click()

    // Wait for the operation
    cy.get('@createOnClick').should('have.been.called')

    // Form should be cleared
    cy.get('.select-autocomplete').should('not.contain', 'Test User 1')
  })
})
