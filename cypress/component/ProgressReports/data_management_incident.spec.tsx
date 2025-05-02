import React from 'react';
import { mount } from 'cypress/react';
import DataManagementIncident from '../../../src/pages/progress_reports/DataManagementIncident';

describe('Data Management Incident - Component Tests', () => {
  beforeEach(() => {
    mount(<DataManagementIncident />);
  });

  it('renders the component correctly', () => {
    cy.get('[data-cy=data-management-incident]').should('exist');
    cy.contains('Step 3: Data Management Incident').should('be.visible');
    cy.contains('3.1 Data Management Incident').should('be.visible');
    cy.contains('Have there been any incidents related to mismanagement or misuse of data?').should('be.visible');
  });

  it('initially does not show incident details form', () => {
    cy.contains('Please select any of the following that describe the nature of this Data Management Incident').should('not.exist');
    cy.get('#dmiCombination').should('not.exist');
    cy.get('#dmiDescription').should('not.exist');
  });

  it('shows incident details form when "Yes" is selected', () => {
    cy.get('#dmiYesNo_yes').click();
    
    cy.contains('Please select any of the following that describe the nature of this Data Management Incident').should('be.visible');
    cy.get('#dmiCombination').should('exist');
    cy.get('#dmiIdentification').should('exist');
    cy.get('#dmiSharing').should('exist');
    cy.get('#dmiSecurity').should('exist');
    cy.get('#dmiAcknowledgement').should('exist');
    cy.get('#dmiPublication').should('exist');
    cy.get('#dmiFalsification').should('exist');
    cy.get('#dmiOther').should('exist');
    cy.get('#dmiDescription').should('exist');
  });

  it('hides incident details form when "No" is selected', () => {
    // First select Yes to show the form
    cy.get('#dmiYesNo_yes').click();
    cy.get('#dmiCombination').should('exist');
    
    // Then select No to hide the form
    cy.get('#dmiYesNo_no').click();
    cy.get('#dmiCombination').should('not.exist');
    cy.get('#dmiDescription').should('not.exist');
  });

  it('allows checking multiple incident types', () => {
    cy.get('#dmiYesNo_yes').click();
    
    cy.get('#dmiCombination').click();
    cy.get('#dmiIdentification').click();
    cy.get('#dmiSharing').click();
    
    // Verify checkboxes are selected
    cy.get('#dmiCombination').should('be.checked');
    cy.get('#dmiIdentification').should('be.checked');
    cy.get('#dmiSharing').should('be.checked');
  });

  it('allows entering incident description text', () => {
    cy.get('#dmiYesNo_yes').click();
    
    const testDescription = 'This is a test description of a data management incident.';
    cy.get('#dmiDescription').type(testDescription);
    cy.get('#dmiDescription').should('have.value', testDescription);
  });

  it('enforces character limit on incident description', () => {
    cy.get('#dmiYesNo_yes').click();
    
    // Generate a string longer than the 2200 character limit
    const longText = 'A'.repeat(2300);
    const expectedText = longText.substring(0, 2200);
    
    cy.get('#dmiDescription').type(longText, { delay: 0 });
    cy.get('#dmiDescription').should('have.value', expectedText);
  });

  it('allows toggling checkboxes on and off', () => {
    cy.get('#dmiYesNo_yes').click();
    
    cy.get('#dmiCombination').click();
    cy.get('#dmiCombination').should('be.checked');
    
    cy.get('#dmiCombination').click();
    cy.get('#dmiCombination').should('not.be.checked');
  });
});