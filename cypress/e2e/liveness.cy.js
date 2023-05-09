/* eslint-disable no-undef */


describe('Status', function() {

  it('Liveness successfully loads', function() {
    cy.visit(Cypress.env('baseUrl') + 'liveness');
    cy.contains('DUOS is healthy!');
  });

});
