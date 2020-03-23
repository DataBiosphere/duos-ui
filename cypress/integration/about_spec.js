/* eslint-disable no-undef */

describe('About', function() {

  it('About page loads from home', function() {
    cy.visit('');
    cy.contains('About');
    cy.contains('About').click();
    cy.url().should('include', 'home_about');
  });

  it('About page shows content', function() {
    cy.visit('/home_about');
    cy.contains('Overview of the system and development');
  });

});
