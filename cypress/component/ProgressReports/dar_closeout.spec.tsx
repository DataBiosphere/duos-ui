import React from 'react';
import { mount } from 'cypress/react';
import DarCloseout from 'src/pages/progress_reports/DarCloseout';
import { FORM_TEXT_AREA_MAX_LENGTH } from 'src/components/forms/formConstants';

describe('DAR Closeout - Component Tests', () => {
  let onFormChangeSpy: () => void;
  
  const mountComponent = (customState = {}) => {
    const formState = { ...customState };
    
    const props = {
      readOnly: false,
      formState,
      onFormChange: onFormChangeSpy
    };
    
    return mount(<DarCloseout {...props} />);
  };
  
  beforeEach(() => {
    onFormChangeSpy = cy.stub().as('formChangeStub');
    mountComponent();
  });

  it('renders the component correctly', () => {
    cy.get('[data-cy=dar-closeout]').should('exist');
    cy.contains('Step 5: DAR Closeout').should('be.visible');
    cy.contains('5.1 Closeouts').should('be.visible');
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

  it('shows "Other" reason text area when state is true', () => {
    mountComponent({ closeoutOther: true });
    cy.get('#closeoutOtherContext').should('exist');
  });

  it('hides "Other" reason text area when state is false', () => {
    mountComponent({ closeoutOther: true });
    cy.get('#closeoutOtherContext').should('exist');

    mountComponent({ closeoutOther: false });
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
    mountComponent({ closeoutOther: true });
    
    const testDescription = 'This is a test description for the other closeout reason.';
    cy.get('#closeoutOtherContext').type(testDescription);
    cy.get('#closeoutOtherContext').should('have.value', testDescription);
  });

  it('enforces character limit on other closeout reason', () => {
    mountComponent({ closeoutOther: true });
    
    // Generate a string longer than the max length character limit
    const longText = 'A'.repeat(FORM_TEXT_AREA_MAX_LENGTH + 100);
    const expectedText = longText.substring(0, FORM_TEXT_AREA_MAX_LENGTH);
    
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