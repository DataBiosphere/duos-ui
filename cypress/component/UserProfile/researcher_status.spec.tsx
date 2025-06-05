import {mount} from 'cypress/react';
import React from 'react';
import ResearcherStatus, {ResearcherStatusProps} from '../../../src/pages/user_profile/ResearcherStatus';
import {DAAObject, DuosUser, FileStorageObject, SimplifiedDuosUser} from 'src/types/model';
import {User} from "src/libs/ajax/User";
import {DAA} from "src/libs/ajax/DAA";

describe('ResearcherStatus', () => {
  const user: DuosUser = {
    userId: 2,
    displayName: 'Test User',
    createDate: new Date(),
    email: 'test.user@test.com',
    emailPreference: false,
    isAdmin: false,
    isAlumni: false,
    isChairPerson: false,
    isDataSubmitter: false,
    isMember: false,
    isResearcher: true,
    isSigningOfficial: false,
    roles: [
      {
        roleId: 1,
        userId: 1,
        userRoleId: 1,
        name: 'Researcher'
      }
    ]
  };

  const signingOfficialUser: SimplifiedDuosUser = {
    userId: 3,
    displayName: 'Signing Official',
    email: 'so@test.com'
  }

  const fso: FileStorageObject = {
    fileStorageObjectId: 1,
    entityId: 'id',
    fileName: 'name',
    category: 'irbCollaborationLetter',
    mediaType: 'image/pdf',
    createUserId: 3,
    createDate: new Date().getDate()
  }

  const daa: DAAObject = {
    daaId: 1,
    createUserId: 3,
    createDate: new Date().toISOString(),
    updateUserId: 3,
    updateDate: new Date().toISOString(),
    initialDacId: 1,
    file: fso,
    dacs: [],
  }

  beforeEach(() => {
    cy.initApplicationConfig();
    cy.stub(DAA, 'getDaaById').resolves(daa);
    cy.stub(User, 'getSOsForCurrentUser').resolves([signingOfficialUser]);
    cy.viewport(800, 600);
  });

  it('Renders the Researcher Status With Library Card Info', () => {
    const pageProps = {location: {}} as ResearcherStatusProps['pageProps'];
    const userWithCard = {
      ...user, ...{
        libraryCard: {
          id: 1,
          userId: 1,
          userName: 'Test User',
          userEmail: 'test.usre@test.com',
          createDate: new Date(),
          createUserId: 3,
          daaIds: [1]
        }
      }
    }
    cy.stub(User, 'getMe').resolves(userWithCard);

    mount(<ResearcherStatus user={userWithCard} pageProps={pageProps}/>);
    cy.contains('Researcher Status');
    cy.contains('eRA Commons Account');
    cy.contains('Library Cards issued to you');
    cy.contains('Issued on: ' + userWithCard.libraryCard?.createDate.toISOString().slice(0, 10));
    cy.contains('Issued by: ' + signingOfficialUser.displayName);
  });

  it('Renders the Researcher Status Without Library Card Info', () => {
    const pageProps = {location: {}} as ResearcherStatusProps['pageProps'];
    cy.stub(User, 'getMe').resolves(user);

    mount(<ResearcherStatus user={user} pageProps={pageProps}/>);
    cy.contains('No Library Card Found');
  });
});
