import {mount} from 'cypress/react';
import React from 'react';
import {Institution} from '../../../src/libs/ajax/Institution';
import AffiliationAndRole from '../../../src/pages/user_profile/AffiliationAndRoles.jsx';

const user = {
  userId: 1,
  institutionId: 1,
  roles: [
    {
      name: 'Researcher'
    },
    {
      name: 'Signing Official'
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
