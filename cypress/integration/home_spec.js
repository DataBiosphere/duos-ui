/* eslint-disable no-undef */

describe('Home', function() {

  it('Home page loads correctly', function() {
    cy.visit('');
    cy.contains('DUOS');
    cy.contains('Start here!');
    cy.contains('What is DUOS?');
  });

});
