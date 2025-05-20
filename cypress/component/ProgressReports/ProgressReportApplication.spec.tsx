import React from 'react';
import {mount} from 'cypress/react';
import ProgressReportApplication from 'src/pages/dar_application/ProgressReportApplication';
import 'src/index.css';
import 'src/styles/buttons.css';
import {DuosUser} from "src/types/model";

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
const mockLocation: Location = {
  pathname: '/progress-report-application',
  search: '',
  hash: ''
}

const mockResearcher: DuosUser = {
  createDate: new Date(),
  displayName: 'Test User',
  email: 'user@test.com',
  emailPreference: true,
  eraCommonsId: 'commons-id',
  isAdmin: false,
  isAlumni: false,
  isChairPerson: false,
  isDataSubmitter: false,
  isMember: false,
  isResearcher: true,
  isSigningOfficial: false,
  roles: [{
    roleId: 1,
    name: 'Researcher',
    userId: 1,
    userRoleId: 1,
  }],
  userId: 1
};

describe('ProgressReportApplication tests', () => {
  beforeEach(() => {
        cy.initApplicationConfig();
        cy.viewport(600, 300);
      }
  );

  it('Should show a Progress Report Application with Populated eRA Commons Info', () => {
    const mergedResearcher = {...mockResearcher,   properties: [
        {
          propertyId: 1,
          userId: 1,
          propertyKey: 'eraAuthorized',
          propertyValue: 'true'
        },
        {
          propertyId: 2,
          userId: 1,
          propertyKey: 'eraExpiration',
          // 86400000 = 1 day in milliseconds
          propertyValue: (new Date().getTime() + 86400000).toString(),
        }
      ]
    }
    mount(<ProgressReportApplication
      parentDar={undefined}
      datasets={[]}
      readOnlyMode={false}
      location={mockLocation}
      researcher={mergedResearcher}
    />);
    cy.get('[data-cy=researcher-identification]').should('exist');
    cy.get('[data-cy=researcher-identification]').should(($p) => {
      expect($p).to.contain(mergedResearcher.eraCommonsId);
    })
  });

  it('Should show a Progress Report Application with Unpopulated eRA Commons Info', () => {
    mount(<ProgressReportApplication
      parentDar={undefined}
      datasets={[]}
      readOnlyMode={false}
      location={mockLocation}
      researcher={mockResearcher}
    />);
    cy.get('[data-cy=researcher-identification]').should('exist');
    cy.get('[data-cy=researcher-identification]').should(($p) => {
      expect($p).to.contain('Authenticate your account');
    })
  });

});