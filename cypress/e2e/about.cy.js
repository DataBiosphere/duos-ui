/* eslint-disable no-undef */

describe('About', function() {

  it('About page loads from home - Desktop', function() {
    cy.viewport(2000, 2000);
    cy.visit(Cypress.env('baseUrl'));
    cy.contains('About');
    cy.get('#link_about').should(
      'have.attr',
      'href',
      'https://support.terra.bio/hc/en-us/articles/28485372215579-About-DUOS'
    );
  });

  it('About page loads from home - Mobile', function() {
    cy.viewport(600, 600);
    cy.visit(Cypress.env('baseUrl'));
    cy.get('#navbar-menu-icon').click();
    cy.get('#link_about').should(
      'have.attr',
      'href',
      'https://support.terra.bio/hc/en-us/articles/28485372215579-About-DUOS'
    );
  });
});
