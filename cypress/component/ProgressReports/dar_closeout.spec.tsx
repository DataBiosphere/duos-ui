import React from 'react';
import { mount } from 'cypress/react';
import DarCloseout from '../../../src/pages/progress_reports/DarCloseout';

const props = {
  state: 'step4',
};

describe('DAR Closeout - Component Tests', () => {
  beforeEach(() => {
    mount(<DarCloseout {...props}/>);
  });

  it('renders the component correctly', () => {
    cy.get('[data-cy=dar-closeout]').should('exist');
    cy.contains('Step 4: DAR Closeout').should('be.visible');
    cy.contains('4.1 Closeouts').should('be.visible');
    cy.contains('If you are ready to finish work on this project').should('be.visible');
  });

  it('displays all closeout reason checkboxes', () => {
    cy.get('#closeoutCompleted').should('exist');
    cy.get('#closeoutMoved').should('exist');
    cy.get('#closeoutTransferred').should('exist');
    cy.get('#closeoutSuperceded').should('exist');
    cy.get('#closeoutOther').should('exist');
  });

  it('initially does not show "Other" reason text area', () => {
    cy.get('#closeoutOtherContext').should('not.exist');
  });

  it('shows "Other" reason text area when "Other" checkbox is selected', () => {
    cy.get('#closeoutOther').click();
    cy.get('#closeoutOtherContext').should('exist');
  });

  it('hides "Other" reason text area when "Other" checkbox is unselected', () => {
    // First select the checkbox to show the text area
    cy.get('#closeoutOther').click();
    cy.get('#closeoutOtherContext').should('exist');
    
    // Then unselect to hide the text area
    cy.get('#closeoutOther').click();
    cy.get('#closeoutOtherContext').should('not.exist');
  });

  it('allows checking multiple closeout reasons', () => {
    cy.get('#closeoutCompleted').click();
    cy.get('#closeoutMoved').click();
    cy.get('#closeoutTransferred').click();
    
    // Verify checkboxes are selected
    cy.get('#closeoutCompleted').should('be.checked');
    cy.get('#closeoutMoved').should('be.checked');
    cy.get('#closeoutTransferred').should('be.checked');
  });

  it('allows entering other closeout reason text', () => {
    cy.get('#closeoutOther').click();
    
    const testDescription = 'This is a test description for the other closeout reason.';
    cy.get('#closeoutOtherContext').type(testDescription);
    cy.get('#closeoutOtherContext').should('have.value', testDescription);
  });

  it('enforces character limit on other closeout reason', () => {
    cy.get('#closeoutOther').click();
    
    // Generate a string longer than the 2200 character limit
    const longText = 'A'.repeat(2300);
    const expectedText = longText.substring(0, 2200);
    
    cy.get('#closeoutOtherContext').type(longText, { delay: 0 });
    cy.get('#closeoutOtherContext').should('have.value', expectedText);
  });

  it('allows toggling checkboxes on and off', () => {
    cy.get('#closeoutCompleted').click();
    cy.get('#closeoutCompleted').should('be.checked');
    
    cy.get('#closeoutCompleted').click();
    cy.get('#closeoutCompleted').should('not.be.checked');
  });
});