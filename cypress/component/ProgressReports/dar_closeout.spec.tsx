import React from 'react';
import { mount } from 'cypress/react';
import DarCloseout from 'src/pages/progress_reports/DarCloseout';
import { User } from 'src/libs/ajax/User';

describe('DAR Closeout - Component Tests', () => {
  let onFormChangeSpy: () => void;

  const mockSigningOfficials = [
    { userId: 1, displayName: 'John Doe', email: 'john.doe@example.com' },
    { userId: 2, displayName: 'Jane Smith', email: 'jane.smith@example.com' },
    { userId: 3, displayName: 'Bob Johnson', email: '' }
  ];

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
    cy.stub(User, 'getSOsForCurrentUser').resolves(mockSigningOfficials);
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
      closeoutOtherText: '',
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
      closeoutOtherText: 'My Other Text',
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

  it('displays signing official dropdown when closeout is enabled', () => {
    mountComponent({ closeoutYesNo: true });
    cy.get('[data-cy=dar-closeout-details]').should('exist');
    cy.contains('I certify that the individual listed below is my institutional Signing Official').should('be.visible');
    cy.get('#closeoutSigningOfficial').should('exist');
  });

  it('does not display signing official dropdown when closeout is disabled', () => {
    mountComponent({ closeoutYesNo: false });
    cy.get('#closeoutSigningOfficial').should('not.exist');
  });

  it('populates signing official options correctly with email', () => {
    mountComponent({ closeoutYesNo: true });
    cy.get('#closeoutSigningOfficial').should('exist');
    cy.get('#closeoutSigningOfficial').click();
    cy.contains('John Doe (john.doe@example.com)').should('exist');
    cy.contains('Jane Smith (jane.smith@example.com)').should('exist');
  });
});
