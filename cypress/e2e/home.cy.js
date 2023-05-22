/* eslint-disable no-undef */

describe('Home', function() {

  it('Home page loads correctly', function() {
    cy.visit('');
    cy.contains('DUOS');
    cy.contains('Sign-in/Register');
    cy.contains('What is DUOS and how does it work?');
    cy.contains('DUOS for DACs');
    cy.contains('Institutional Oversight');
    cy.contains('Looking for data');
    cy.contains('Overview of DUOS');
    cy.contains('Machine Readable Consent Guidance.');
    cy.get('#zendesk-dac-link').should(
      'have.attr',
      'href',
      'https://broad-duos.zendesk.com/hc/en-us/articles/360060401131-Data-Access-Committee-User-Guide'
    );
    cy.get('#zendesk-so-link').should(
      'have.attr',
      'href',
      'https://broad-duos.zendesk.com/hc/en-us/articles/360060402751-Signing-Official-User-Guide'
    );

    cy.get('#zendesk-researcher-link').should(
      'have.attr',
      'href',
      'https://broad-duos.zendesk.com/hc/en-us/articles/360060402551-Researcher-User-Guide'
    );
  });

});
