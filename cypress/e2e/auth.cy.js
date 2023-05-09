/* eslint-disable no-undef */

const roles = {
  ADMIN: 'ADMIN',
  CHAIR: 'CHAIR',
  MEMBER: 'MEMBER',
  RESEARCHER: 'RESEARCHER',
  SIGNING_OFFICIAL: 'SIGNING_OFFICIAL'
};

describe('Authentication', function() {

  it('Background Sign-in Admin', function() {
    cy.auth(roles.ADMIN).then(credentials => {
      cy.visit(Cypress.env('e2e').baseUrl + 'backgroundsignin');
      cy.get('textarea').type(credentials.access_token, {delay: 0});
      cy.get('form').submit();
      cy.contains('Admin Console');
      cy.get('[id="sel_user"]').click();
      cy.contains('Sign out').click();
    });
  });
});
