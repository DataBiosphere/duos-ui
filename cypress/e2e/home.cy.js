/* eslint-disable no-undef */

describe('Home', function() {

  it('Home page loads correctly', function() {
    cy.visit(Cypress.env('baseUrl'));
    cy.contains('DUOS');
    cy.contains('Sign-in/Register');
    cy.contains('What is DUOS and how does it work?');
    cy.contains('DUOS for DACs');
    cy.contains('Institutional Oversight');
    cy.contains('Looking for data');
    cy.contains('Overview of DUOS');
    cy.contains('Machine Readable Consent Guidance.');
    cy.get('#terra-support-dac-link').should(
      'have.attr',
      'href',
      'https://support.terra.bio/hc/en-us/articles/28513346337179-Overview-DUOS-for-Data-Access-Committees-DACs'
    );
    cy.get('#terra-support-so-link').should(
      'have.attr',
      'href',
      'https://support.terra.bio/hc/en-us/articles/28512587249051-How-to-Pre-Authorize-Researchers-to-Submit-Data-Access-Requests-in-DUOS'
    );

    cy.get('#terra-support-researcher-link').should(
      'have.attr',
      'href',
      'https://support.terra.bio/hc/en-us/articles/28510385779099-Overview-DUOS-for-Researchers'
    );
  });

});
