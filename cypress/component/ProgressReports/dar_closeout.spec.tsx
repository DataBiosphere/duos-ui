import React from 'react';
import { mount } from 'cypress/react';
import DarCloseout from 'src/pages/progress_reports/DarCloseout';

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
    cy.contains('Are you ready to finish work on this project?').should('be.visible');
    cy.get('#closeoutYesNo').should('exist');
  });

  it('handles closeout radio buttons', () => {
    cy.get('#closeoutYesNo_yes').click()
    cy.get('@formChangeStub').should('have.been.calledWith', { closeoutYesNo: true });

    cy.get('#closeoutYesNo_no').click()
    cy.get('@formChangeStub').should('have.been.calledWith', {
      closeoutOther: false,
      closeoutOtherText: "",
      closeoutProjectCompleted : false,
      closeoutProjectSuperseded: false,
      closeoutProjectTransferred: false,
      closeoutRequestorMovedInstitution: false,
      closeoutYesNo: false });
  });

  it('shows closeout options when "Yes" is selected', () => {
    mountComponent({ closeoutYesNo: true });
    cy.get('[data-cy=dar-closeout-details]').should('exist');
  });

  it('hides closeout options when "No" is selected', () => {
    mountComponent({ closeoutYesNo: false });
    cy.get('[data-cy=dar-closeout-details]').should('not.exist');
  });

  it('displays all closeout reason checkboxes when "Yes" is selected', () => {
    mountComponent({ closeoutYesNo: true });
    cy.get('[data-cy=dar-closeout-details]').should('exist');
    cy.contains('The Requestor has completed his/her project').should('exist');
    cy.contains('The Requestor has moved institutions').should('exist');
    cy.contains('The project is being transferred to a new Requestor at the same institution').should('exist');
    cy.contains('The project is being superseded by a new project').should('exist');
    cy.contains('Other').should('exist');
  });

  it('allows checking multiple closeout reasons', () => {
    mountComponent({ closeoutYesNo: true });
    cy.get('#closeoutProjectCompleted').click();

    // Verify selected checkbox option is selected
    cy.get('#closeoutProjectCompleted').should('be.checked');
    cy.get('#closeoutRequestorMovedInstitution').should('not.be.checked');
    cy.get('#closeoutProjectTransferred').should('not.be.checked');
    cy.get('#closeoutProjectSuperseded').should('not.be.checked');
    cy.get('#closeoutOther').should('not.be.checked');


    // Select a different option
    cy.get('#closeoutProjectTransferred').click();

    // Verify selected checkbox option is selected
    cy.get('#closeoutProjectCompleted').should('be.checked');
    cy.get('#closeoutRequestorMovedInstitution').should('not.be.checked');
    cy.get('#closeoutProjectTransferred').should('be.checked');
    cy.get('#closeoutProjectSuperseded').should('not.be.checked');
    cy.get('#closeoutOther').should('not.be.checked');
  });

  it('allows the component to be opened with the correct state', () => {
    mountComponent( {
      closeoutOther: true,
      closeoutOtherText: "My Other Text",
      closeoutProjectCompleted : true,
      closeoutProjectSuperseded: false,
      closeoutProjectTransferred: false,
      closeoutRequestorMovedInstitution: false,
      closeoutYesNo: true });
    cy.get('#closeoutProjectCompleted').should('be.checked');
    cy.get('#closeoutRequestorMovedInstitution').should('not.be.checked');
    cy.get('#closeoutProjectTransferred').should('not.be.checked');
    cy.get('#closeoutProjectSuperseded').should('not.be.checked');
    cy.get('#closeoutOther').should('be.checked');
    cy.get('#closeoutOtherText').should('be.visible');
    cy.get('#closeoutOtherText').contains('My Other Text');
  });
});