import React from 'react'
import { mount } from 'cypress/react'
import SigningOfficialTable from 'src/pages/signing_official_console/SigningOfficialTable'
import * as LibraryCardApi from 'src/libs/ajax/LibraryCard'

describe('SigningOfficialTable', () => {
  const mockSigningOfficial = {
    institutionId: 1,
    displayName: 'Test Signing Official',
  }

  const mockResearcher1 = {
    userId: 1,
    email: 'existing.researcher1@test.com',
    displayName: 'Existing Researcher 1',
    roles: [{ name: 'Researcher' }],
    libraryCard: undefined,
  }

  const mockResearcher2 = {
    userId: 2,
    email: 'existing.researcher2@test.com',
    displayName: 'Existing Researcher 2',
    roles: [{ name: 'Researcher' }],
    libraryCard: undefined,
  }

  const mockResearcher3 = {
    userId: 3,
    email: 'researcher.with.card@test.com',
    displayName: 'Researcher With Card',
    roles: [{ name: 'Researcher' }],
    libraryCard: {
      id: 'existing-card-1',
      userId: 3,
      userEmail: 'researcher.with.card@test.com',
      userName: 'Researcher With Card',
    },
  }

  const mockResearcherList = [mockResearcher1, mockResearcher2, mockResearcher3]

  beforeEach(() => {
    cy.viewport(1600, 1000)
  })

  it('should render the modal when Add Users button is clicked', () => {
    mount(<SigningOfficialTable researchers={mockResearcherList} signingOfficial={mockSigningOfficial} />)

    cy.contains('Add Library Card').should('exist').click()
    cy.get('[data-cy=library-card-form-modal]').should('be.visible')
    cy.get('[data-cy=library-card-form-modal]').should('contain', 'Add Library Cards')
  })

  it('should display an error message when issuing a library card fails', () => {
    // Stub to make all requests fail
    cy.stub(LibraryCardApi.LibraryCard, 'createLibraryCard')
      .callsFake((card) => {
        return Promise.reject({
          response: {
            data: {
              message: `Failed to issue library card for ${card.userEmail}`,
            },
          },
        })
      })

    mount(<SigningOfficialTable researchers={mockResearcherList} signingOfficial={mockSigningOfficial} />)
    cy.contains('Add Library Card').click()

    // Select user
    cy.get('input[id^=react-select-]').type(mockResearcher1.displayName)
    cy.get('input[id^=react-select-]').type('{enter}')

    // Submit the form
    cy.get('[id=Add-button]').click()

    // Verify error notification is shown
    cy.contains('Error issuing library card').should('be.visible')

    // Verify the table still shows the issue button for the failed user
    cy.contains('div[role="row"]', mockResearcher1.displayName).within(() => {
      cy.get(`button[id="issue-card-${mockResearcher1.email}"]`)
        .should('contain', 'Issue')
    })
  })

  it('should display a success message when issuing a library card succeeds', () => {
    // Stub to make the request succeed
    const newCardId = 'new-card-id'
    cy.stub(LibraryCardApi.LibraryCard, 'createLibraryCard')
      .callsFake((card) => {
        return Promise.resolve({
          id: newCardId,
          userId: card.userId,
          userEmail: card.userEmail,
          userName: card.userName,
        })
      })

    mount(<SigningOfficialTable researchers={mockResearcherList} signingOfficial={mockSigningOfficial} />)

    cy.contains('Add Library Card').click()

    // Select user
    cy.get('input[id^=react-select-]').type(mockResearcher1.displayName)
    cy.get('input[id^=react-select-]').type('{enter}')

    // Submit the form
    cy.get('[id=Add-button]').click()

    // Verify success notification is shown
    cy.contains('Issued 1 library card').should('be.visible')

    // Verify the table was updated with the new library card
    cy.contains('div[role="row"]', mockResearcher1.displayName).within(() => {
      cy.get(`button[id="deactivate-card-${newCardId}"]`)
        .should('contain', 'Deactivate')
    })
  })

  it('should display a warning when there are both failures and successes bulk-issuing library cards', () => {
    // Stub to make some requests succeed and some fail
    const newCardId = 'new-card-id'
    cy.stub(LibraryCardApi.LibraryCard, 'createLibraryCard')
      .callsFake((card) => {
        if (card.userEmail === mockResearcher1.email) {
          return Promise.resolve({
            id: newCardId,
            userId: card.userId,
            userEmail: card.userEmail,
            userName: card.userName,
          })
        }
        return Promise.reject({
          response: {
            data: {
              message: `Failed to issue library card for ${card.userEmail}`,
            },
          },
        })
      })

    mount(<SigningOfficialTable researchers={mockResearcherList} signingOfficial={mockSigningOfficial} />)
    cy.contains('Add Library Card').click()

    // Select users
    cy.get('input[id^=react-select-]').type(mockResearcher1.displayName)
    cy.get('input[id^=react-select-]').type('{enter}')
    cy.get('input[id^=react-select-]').type(mockResearcher2.displayName)
    cy.get('input[id^=react-select-]').type('{enter}')

    // Submit the form
    cy.get('[id=Add-button]').click()

    // Verify warning notification is shown
    cy.contains(`Issued 1 library card, but encountered errors issuing library cards to ${mockResearcher2.email}`).should('be.visible')

    // Verify the table was updated with the new library card
    cy.contains('div[role="row"]', mockResearcher1.displayName).within(() => {
      cy.get(`button[id="deactivate-card-${newCardId}"]`)
        .should('contain', 'Deactivate')
    })

    // Verify the table still shows the issue button for the failed user
    cy.contains('div[role="row"]', mockResearcher2.displayName).within(() => {
      cy.get(`button[id="issue-card-${mockResearcher2.email}"]`)
        .should('contain', 'Issue')
    })
  })
})
