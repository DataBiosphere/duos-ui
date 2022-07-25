/* eslint-disable no-undef */


describe('Status', function() {

  it('Liveness successfully loads', function() {
    cy.visit('liveness');
    cy.contains('DUOS is healthy!')
  });

});
