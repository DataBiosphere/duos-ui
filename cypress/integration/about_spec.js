/* eslint-disable no-undef */

describe('About', function() {

  it('About page loads from home - Desktop', function() {
    cy.viewport(2000, 2000);
    cy.visit('');
    cy.contains('About');
    cy.contains('About').click();
    cy.url().should('include', 'home_about');
  });

  it('About page loads from home - Mobile', function() {
    cy.viewport(600, 600);
    cy.visit('');
    cy.get('#navbar-menu-icon').click();
    cy.get('#menu-link-About').click();
    cy.url().should('include', 'home_about');
  });

  it('About page shows content - Desktop', function() {
    cy.viewport(2000, 2000);
    cy.visit('');
    cy.contains('About');
    cy.contains('About').click();
    cy.contains('Data Use Oversight System');
  });

  it('About page shows content - Mobile', function() {
    cy.viewport(600, 600);
    cy.visit('');
    cy.get('#navbar-menu-icon').click();
    cy.get('#menu-link-About').click();
    cy.contains('Data Use Oversight System');
  });
});
