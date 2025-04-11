import {mount} from 'cypress/react';
import React from 'react';
import {Institution} from '../../../src/libs/ajax/Institution';
import AffiliationAndRole from '../../../src/pages/user_profile/AffiliationAndRoles';
import {DuosUser} from "src/types/model";

const user: DuosUser = {
  createDate: new Date(),
  displayName: 'Test User',
  email: 'email',
  emailPreference: false,
  userId: 1,
  institutionId: 1,
  isAdmin: false,
  isAlumni: false,
  isChairPerson: false,
  isDataSubmitter: false,
  isMember: false,
  isResearcher: true,
  isSigningOfficial: true,
  roles: [
    {
      roleId: 1,
      userId: 1,
      userRoleId: 1,
      name: 'Researcher'
    },
    {
      roleId: 2,
      userId: 1,
      userRoleId: 2,
      name: 'SigningOfficial'
    }
  ],
};

const institution = {
  id: 1,
  name: 'Test Institution',
  signingOfficials: []
}

describe('Affiliation And Role', () => {
  beforeEach(() => {
    cy.viewport(600, 600);
    cy.initApplicationConfig();
    cy.stub(Institution, 'getById').returns(institution);
  });

  it('Displays institution name when institution is present', () => {
    mount(<AffiliationAndRole user={user} />);
    cy.get('[ data-cy="institutional-affiliation"]').contains(institution.name);
  });

  it('Displays contact us text when no institution present', () => {
    const {institutionId, ...userWithoutInstitution} = user;
    mount(<AffiliationAndRole user={userWithoutInstitution} />);
    cy.get('[ data-cy="institutional-affiliation"]').contains('Please use the Contact Us form to request an institutional affiliation');
  });

  it('Displays all role names for user', () => {
    mount(<AffiliationAndRole user={user} />);
    user.roles.forEach((role) => {
      cy.get('[ data-cy="user-roles"]').contains(role.name);
    });
  });

});
