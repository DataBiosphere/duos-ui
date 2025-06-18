import React from 'react';
import {mount} from 'cypress/react';
import SigningOfficialTable from 'src/pages/signing_official_console/SigningOfficialTable';
import * as LibraryCardApi from 'src/libs/ajax/LibraryCard';

describe('SigningOfficialTable', () => {
  const mockSigningOfficial = {
    institutionId: 1,
    displayName: 'Test Signing Official',
  };

  const mockResearchers = [
    {
      userId: 1,
      email: 'existing.researcher1@test.com',
      displayName: 'Existing Researcher 1',
      roles: [{name: 'Researcher'}],
      libraryCard: null
    },
    {
      userId: 2,
      email: 'existing.researcher2@test.com',
      displayName: 'Existing Researcher 2',
      roles: [{name: 'Researcher'}],
      libraryCard: null
    },
    {
      userId: 3,
      email: 'researcher.with.card@test.com',
      displayName: 'Researcher With Card',
      roles: [{name: 'Researcher'}],
      libraryCard: {
        id: 'existing-card-1',
        userId: 3,
        userEmail: 'researcher.with.card@test.com',
        userName: 'Researcher With Card'
      }
    }
  ];

  beforeEach(() => {
    cy.viewport(1600, 1000);
  });

  it('should render the modal when Add Library Card button is clicked', () => {
    mount(<SigningOfficialTable researchers={mockResearchers} signingOfficial={mockSigningOfficial} />);

    cy.contains('Bulk Issue / Add Users').should('exist').click();
    cy.get('[data-cy=library-card-form-modal]').should('be.visible');
    cy.get('[data-cy=library-card-form-modal]').should('contain', 'Add Library Cards');
  });

  it('should display an error message issuing a library card fails', () => {
    // Stub to make all requests fail
    cy.stub(LibraryCardApi.LibraryCard, 'createLibraryCard')
      .callsFake((card) => {
        return Promise.reject({
          response: {
            data: {
              message: `Failed to issue library card for ${card.userEmail}`
            }
          }
        });
      });

    mount(<SigningOfficialTable researchers={mockResearchers} signingOfficial={mockSigningOfficial} />);

    cy.contains('Bulk Issue / Add Users').click();

    // Select users
    cy.get('input[id^=react-select-]').type('Existing Researcher 1');
    cy.get('[id$=option-1]').click();

    // Submit the form
    cy.get('[id=Add-button]').click();

    // Verify error notification is shown
    cy.contains('Error issuing library card').should('be.visible');

    // Verify the table did not change
    cy.contains('div[role="row"]', 'Existing Researcher 1').within(() => {
      cy.get('button[id="issue-card-existing.researcher1@test.com"]')
          .should('contain', 'Issue');
    });
  });

  it('should display a success message when issuing a library card succeeds', () => {
    // Stub to make the request succeed
    cy.stub(LibraryCardApi.LibraryCard, 'createLibraryCard')
        .callsFake((card) => {
          return Promise.resolve({
            id: 'new-card-id',
            userId: card.userId,
            userEmail: card.userEmail,
            userName: card.userName || 'New User',
          });
        });

    mount(<SigningOfficialTable researchers={mockResearchers} signingOfficial={mockSigningOfficial}/>);

    cy.contains('Bulk Issue / Add Users').click();

    // Select users
    cy.get('input[id^=react-select-]').type('Existing Researcher 1');
    cy.get('[id$=option-1]').click();

    // Submit the form
    cy.get('[id=Add-button]').click();

    // Verify success notification is shown
    cy.contains('Issued 1 library card').should('be.visible');

    // Verify the table updated with the new library card
    cy.contains('div[role="row"]', 'Existing Researcher 1').within(() => {
      cy.get('button[id="deactivate-card-new-card-id"]')
          .should('contain', 'Deactivate');

    });
  });

  it('should display a warning when some cards succeed and some fail', () => {
    // Stub to make some requests succeed and some fail
    cy.stub(LibraryCardApi.LibraryCard, 'createLibraryCard')
      .callsFake((card) => {
        if (card.userEmail === 'existing.researcher1@test.com') {
          return Promise.resolve({
            id: 'new-card-id',
            userId: card.userId,
            userEmail: card.userEmail,
            userName: card.userName || 'New User',
          });
        }
        return Promise.reject({
          response: {
            data: {
              message: `Failed to issue library card for ${card.userEmail}`
            }
          }
        });
        });
    mount(<SigningOfficialTable researchers={mockResearchers} signingOfficial={mockSigningOfficial} />);
    cy.contains('Bulk Issue / Add Users').click();
    // Select users
    cy.get('input[id^=react-select-]').type('Existing Researcher 1');
    cy.get('[id$=option-1]').click();
    cy.get('input[id^=react-select-]').type('Existing Researcher 2');
    cy.get('[id$=option-2]').click();
    // Submit the form
    cy.get('[id=Add-button]').click();
    // Verify warning notification is shown
    cy.contains('Issued 1 library card, but encountered errors issuing library cards to existing.researcher2@test.com').should('be.visible');
    // Verify the table updated with the new library card
    cy.contains('div[role="row"]', 'Existing Researcher 1').within(() => {
      cy.get('button[id="deactivate-card-new-card-id"]')
          .should('contain', 'Deactivate');
    });
    cy.contains('div[role="row"]', 'Existing Researcher 2').within(() => {
      cy.get('button[id="issue-card-existing.researcher2@test.com"]')
            .should('contain', 'Issue');
    });
  });
});
