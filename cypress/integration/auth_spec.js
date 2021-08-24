/* eslint-disable no-undef */

describe('Auth', function() {

  it('Auth', function() {
    cy.viewport(2000, 2000);
    cy.auth('admin');
  });
});