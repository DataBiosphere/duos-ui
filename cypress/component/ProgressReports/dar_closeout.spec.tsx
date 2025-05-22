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
    cy.get('#closeoutYesNo').parent().contains('label', 'Yes').find('input[type="radio"]').click({force: true});
    cy.get('@formChangeStub').should('have.been.calledWith', { closeoutYesNo: true });

    cy.get('#closeoutYesNo').parent().contains('label', 'No').find('input[type="radio"]').click({force: true});
    cy.get('@formChangeStub').should('have.been.calledWith', { closeoutYesNo: false });
  });

  it('shows closeout options when "Yes" is selected', () => {
    mountComponent({ closeoutYesNo: true });
    cy.get('#closeoutSupplement').should('exist');
  });

  it('hides closeout options when "No" is selected', () => {
    mountComponent({ closeoutYesNo: false });
    cy.get('#closeoutSupplement').should('not.exist');
  });

  it('displays all closeout reason checkboxes when "Yes" is selected', () => {
    mountComponent({ closeoutYesNo: true });
    cy.get('#closeoutSupplement').should('exist');
    cy.contains('The Requestor has completed his/her project').should('exist');
    cy.contains('The Requestor has moved institutions').should('exist');
    cy.contains('The project is being transferred to a new Requestor at the same institution').should('exist');
    cy.contains('The project is being superseded by a new project').should('exist');
  });

  it('allows checking one closeout reason at a time', () => {
    mountComponent({ closeoutYesNo: true });
    cy.get('#closeoutSupplement_PROJECT_COMPLETED').click();

    // Verify selected radio option is selected
    cy.get('#closeoutSupplement_PROJECT_COMPLETED').should('be.checked');
    cy.get('#closeoutSupplement_REQUESTOR_MOVED_INSTITUTION').should('not.be.checked');
    cy.get('#closeoutSupplement_PROJECT_TRANSFERRED').should('not.be.checked');
    cy.get('#closeoutSupplement_PROJECT_SUPERSEDED').should('not.be.checked');


    // Select a different option
    cy.get('#closeoutSupplement_PROJECT_TRANSFERRED').click();

    // Verify selected radio option is selected
    cy.get('#closeoutSupplement_PROJECT_COMPLETED').should('not.be.checked');
    cy.get('#closeoutSupplement_REQUESTOR_MOVED_INSTITUTION').should('not.be.checked');
    cy.get('#closeoutSupplement_PROJECT_TRANSFERRED').should('be.checked');
    cy.get('#closeoutSupplement_PROJECT_SUPERSEDED').should('not.be.checked');
  });
});