/* eslint-disable no-undef */
import React from 'react';
import { mount } from 'cypress/react';
import { MemoryRouter } from 'react-router-dom';
import Home from '../../../src/pages/Home';

describe('Home Page - Tests', function() {
  beforeEach(() => {
    mount(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    );
  });

  it('renders the page header correctly', function() {
    cy.contains('Data Use Oversight System').should('be.visible');
    cy.contains('Expediting compliant data sharing').should('be.visible');
  });

  it('renders the Data Libraries section with correct header', function() {
    cy.contains('Data Libraries in DUOS').should('be.visible');
    cy.contains('Click the images below to view curated Data Libraries, and search and request access to data.')
      .should('be.visible');
  });

  /**
   * The native HTML title attribute creates a browser tooltip on hover, but these tooltips are not separate DOM elements - they're just a browser feature triggered by the attribute. That's why you don't see separate tooltip elements in the DOM. The test checks the presence of elements with the appropriate title attributes.
   */
  it('displays tooltips with correct text for data libraries', function() {
    cy.get('[data-for="anvil"]').find('span[title="AnVIL"]').should('exist');
    cy.get('[data-for="broad"]').find('span[title="Broad Institute"]').should('exist');
    cy.get('[data-for="hca"]').find('span[title="Human Cell Atlas"]').should('exist');
  });

  it('has correct navigation links for data libraries', function() {
    cy.get('a[href="/datalibrary/anvil"]').should('exist');
    cy.get('a[href="/datalibrary/broad"]').should('exist');
    cy.get('a[href="/datalibrary/HCA"]').should('exist');
  });
  
  it('displays logos horizontally on desktop', function() {
    cy.viewport(1200, 800);
    cy.get('.logo-grid').should('have.css', 'flex-direction', 'row');
    cy.get('.logo-card').should('have.length', 3);
  });
  
  it('displays logos vertically on mobile', function() {
    cy.viewport(600, 800);
    cy.get('.logo-grid').should('have.css', 'flex-direction', 'column');
    cy.get('.logo-card').should('have.length', 3);
  });
});