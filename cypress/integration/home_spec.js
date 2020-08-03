/* eslint-disable no-undef */

describe('Home', function() {

  it('Home page loads correctly', function() {
    cy.visit('');
    cy.contains('DUOS');
    cy.contains('Sign in with Google');
    cy.contains('What is DUOS and how does it work?');
  });

});
