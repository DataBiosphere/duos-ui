/* eslint-disable no-undef */

const headers = ['Consent', 'Ontology'];

describe('Status', function() {

  it('Status page loads from home', function() {
    cy.visit(Cypress.env('e2e').baseUrl);
    cy.contains('Status').click();
    cy.url().should('include', 'status');
  });

  it('All statuses should complete', function() {
    cy.visit(Cypress.env('e2e').baseUrl);
    cy.contains('Status').click();
    headers.forEach((h) => {
      cy.contains(h).parent().children().next('svg')
        .should('have.attr', 'fill')
        .and('match', /(red|green)/);
    });
  });

});
