/* eslint-disable no-undef */
import React from 'react';
import { mount } from 'cypress/react';
import { MemoryRouter } from 'react-router-dom';
import Home from '../../../src/pages/Home';

describe('Home Page - Tests', function() {
  describe('When user is not logged in', function() {
    beforeEach(() => {
      mount(
        <MemoryRouter>
          <Home isLogged={false} />
        </MemoryRouter>
      );
    });

    it('renders the page header correctly', function() {
      cy.contains('Data Use Oversight System').should('be.visible');
      cy.contains('Expediting compliant data sharing').should('be.visible');
    });

    it('renders the Data Libraries section with login message', function() {
      cy.contains('Data Libraries in DUOS').should('be.visible');
      cy.contains('Login to view curated Data Libraries').should('be.visible');
    });

    it('displays tooltips with login required message for data libraries', function() {
      cy.get('[data-for="anvil"]').find('span[title="Please login to access AnVIL Data Library"]').should('exist');
      cy.get('[data-for="broad"]').find('span[title="Please login to access Broad Institute Data Library"]').should('exist');
      cy.get('[data-for="hca"]').find('span[title="Please login to access Human Cell Atlas Data Library"]').should('exist');
    });

    it('does not have navigation links for data libraries', function() {
      cy.get('a[href="/datalibrary/anvil"]').should('not.exist');
      cy.get('a[href="/datalibrary/broad"]').should('not.exist');
      cy.get('a[href="/datalibrary/HCA"]').should('not.exist');
    });
    
    it('displays disabled logo cards', function() {
      cy.get('.logo-card').should('have.length', 3);
      cy.get('.logo-card').first().should('have.css', 'opacity', '0.8');
      cy.get('.logo-card').first().should('have.css', 'cursor', 'not-allowed');
    });
  });

  describe('When user is logged in', function() {
    beforeEach(() => {
      mount(
        <MemoryRouter>
          <Home isLogged={true} />
        </MemoryRouter>
      );
    });

    it('renders the page header correctly', function() {
      cy.contains('Data Use Oversight System').should('be.visible');
      cy.contains('Expediting compliant data sharing').should('be.visible');
    });

    it('renders the Data Libraries section with clickable message', function() {
      cy.contains('Data Libraries in DUOS').should('be.visible');
      cy.contains('Click the images below to view curated Data Libraries').should('be.visible');
    });

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
});