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
    cy.viewport(2000, 2000);
    cy.auth(roles.ADMIN).then(credentials => {
      cy.visit('/backgroundsignin');
      cy.get('textarea').type(credentials.access_token, {delay: 0});
      cy.get('form').submit();
    });
  });
});