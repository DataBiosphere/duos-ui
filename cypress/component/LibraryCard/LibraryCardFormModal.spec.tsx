import React from 'react'
import LibraryCardFormModal, { LibraryCardFormModalProps } from 'src/components/modals/LibraryCardFormModal'
import { Storage } from 'src/libs/storage'
import { Institution } from 'src/libs/ajax/Institution'

// Test helpers
const setupInstitutionMock = (domains: string[]) => {
  const duosUser = {
    isSigningOfficial: false,
  }
  const institution = {
    id: 1,
    name: 'Test Institution',
    signingOfficials: [],
    domains,
  }
  cy.stub(Storage, 'getCurrentUser').returns(duosUser)
  cy.stub(Institution, 'getById').returns(institution)
}

const switchToNewUserForm = () => {
  cy.contains('Add User').click()
}

const fillNewUserForm = (name: string, email: string) => {
  cy.get('input[placeholder="User Name"]').type(name)
  cy.get('input[placeholder="User Email"]').type(email)
}

const assertAddButtonDisabled = () => {
  cy.get('[id=Add-button]').should('have.css', 'opacity', '0.5')
}

const assertAddButtonEnabled = () => {
  cy.get('[id=Add-button]').should('have.css', 'opacity', '1')
}

const createDefaultProps = (): LibraryCardFormModalProps => ({
  showModal: true,
  createOnClick: cy.stub().as('createOnClick'),
  closeModal: cy.stub().as('closeModal'),
  users: [],
})

describe('Library Card Form Modal Select User Tests', () => {
  let props: LibraryCardFormModalProps

  beforeEach(() => {
    cy.viewport(1000, 800)
    props = createDefaultProps()
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
    const mergedProps = { ...props, users: userOptions }
    cy.mount(<LibraryCardFormModal {...mergedProps} />)
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

    const mergedProps = { ...props, users: userOptions }
    cy.mount(<LibraryCardFormModal {...mergedProps} />)
    cy.get('input').should('exist')

    // select the first option
    cy.get('input').type('Test User 1')
    cy.get('input').type('{enter}')

    // select the second option
    cy.get('input').type('Test User 2')
    cy.get('input').type('{enter}')

    // select the third option
    cy.get('input').type('Test User 3')
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
    const mergedProps = { ...props, users: userOptions }
    cy.mount(<LibraryCardFormModal {...mergedProps} />)
    cy.get('input').type('Random Name')
    cy.get('[data-cy=library-card-form-modal]').should('not.contain', userOptions[0].email)
  })
})

describe('Library Card Form Modal Add User Tests', () => {
  let props: LibraryCardFormModalProps

  beforeEach(() => {
    cy.viewport(1000, 800)
    props = createDefaultProps()
  })

  it('Should toggle between existing user selection and new user creation', () => {
    cy.mount(<LibraryCardFormModal {...props} />)

    cy.contains('Select Existing Users OR').should('exist')
    cy.get('[data-cy=library-card-form-modal]').should('contain', 'Select a DUOS User...')

    switchToNewUserForm()
    cy.contains('Add User OR').should('exist')
    cy.get('input[placeholder="User Name"]').should('exist')
    cy.get('input[placeholder="User Email"]').should('exist')

    cy.contains('Select Existing Users').click()
    cy.contains('Select Existing Users OR').should('exist')
  })

  it('Should validate new user name field is required', () => {
    cy.mount(<LibraryCardFormModal {...props} />)
    switchToNewUserForm()
    cy.get('input[placeholder="User Email"]').type('test@example.org')
    assertAddButtonDisabled()
  })

  it('Should validate new user email field is required', () => {
    cy.mount(<LibraryCardFormModal {...props} />)
    switchToNewUserForm()
    cy.get('input[placeholder="User Name"]').type('Test User')
    assertAddButtonDisabled()
  })

  it('Should validate new user email format', () => {
    cy.mount(<LibraryCardFormModal {...props} />)
    switchToNewUserForm()
    fillNewUserForm('Test User', 'invalid-email')
    assertAddButtonDisabled()
  })

  it('Should validate new user email domain', () => {
    cy.mount(<LibraryCardFormModal {...props} />)
    setupInstitutionMock(['example.org'])
    switchToNewUserForm()
    fillNewUserForm('Test User', 'test@sample.org')
    assertAddButtonDisabled()
  })

  it('Should enable Add button when new user form is valid', () => {
    cy.mount(<LibraryCardFormModal {...props} />)
    setupInstitutionMock(['example.org'])
    switchToNewUserForm()
    fillNewUserForm('Test User', 'test@example.org')
    assertAddButtonEnabled()
  })

  it('Should disable Add button when no users selected', () => {
    cy.mount(<LibraryCardFormModal {...props} />)
    assertAddButtonDisabled()
    switchToNewUserForm()
    assertAddButtonDisabled()
  })

  it('Should clear new user form when toggling to existing user selection', () => {
    cy.mount(<LibraryCardFormModal {...props} />)
    switchToNewUserForm()
    fillNewUserForm('Test User', 'test@example.org')
    cy.contains('Select Existing Users').click()
    switchToNewUserForm()
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
