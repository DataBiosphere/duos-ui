/* eslint-disable no-undef */

describe('Home', function() {

  it('Home page loads correctly', function() {
    cy.visit('');
    cy.contains('DUOS');
    cy.contains('Sign in with Google');
    cy.contains('What is DUOS and how does it work?');
    cy.contains('Are you a DAC member?');
    cy.contains('Are you a Signing Official?');
    cy.contains('Are you a researcher?');
    cy.contains('Overview of DUOS');
    cy.contains('Machine Readable Consent Guidance.')
  });

});
