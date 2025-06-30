import React from 'react';
import {mount} from 'cypress/react';
import {CloseoutReview} from 'src/pages/progress_reports/CloseoutReview';
import {Acknowledgement} from 'src/types/model';
import {User} from 'src/libs/ajax/User';

describe('CloseoutReview - Component Tests', () => {
  let onApproveSpy: () => void;
  let onReturnSpy: () => void;

  const mountComponent = (props = {}) => {
    const defaultProps = {
      onApprove: onApproveSpy,
      onReturn: onReturnSpy,
      referenceId: undefined,
      ...props
    };

    return mount(<CloseoutReview {...defaultProps} />);
  };

  beforeEach(() => {
    onApproveSpy = cy.stub().as('approveStub');
    onReturnSpy = cy.stub().as('returnStub');
  });

  it('renders the component correctly', () => {
    mountComponent();

    // Check for the main container
    cy.get('.progress-report-step-card').should('exist');

    // Check for the information icon
    cy.get('div').contains('i').should('be.visible');

    // Check for the text content
    cy.contains('Please note:').should('be.visible');
    cy.contains('If there are issues with the content in this closeout report, please contact the researcher.').should('be.visible');
  });

  it('displays both buttons with correct text', () => {
    mountComponent();

    cy.get('button').contains('Approve closeout').should('be.visible');
    cy.get('button').contains('Go to DAR Requests').should('be.visible');
  });

  it('calls onApprove when Approve closeout button is clicked', () => {
    mountComponent();

    cy.get('button').contains('Approve closeout').click();
    cy.get('@approveStub').should('have.been.calledOnce');
  });

  it('calls onReturn when Go to DAR Requests button is clicked', () => {
    mountComponent();

    cy.get('button').contains('Go to DAR Requests').click();
    cy.get('@returnStub').should('have.been.calledOnce');
  });

  it('maintains proper layout with icon, text, and buttons', () => {
    mountComponent();

    cy.get('.progress-report-step-card').within(() => {

      cy.get('div').contains('i').should('be.visible');

      cy.contains('Please note:').should('be.visible');

      cy.get('button').should('have.length', 2);
    });
  });

  it('displays "Please note:" text in bold', () => {
    mountComponent();

    cy.contains('Please note:')
      .should('have.css', 'font-weight', '700'); // bold
  });

  it('displays explanatory text with normal font weight', () => {
    mountComponent();

    cy.contains('If there are issues with the content in this closeout report, please contact the researcher.')
      .should('have.css', 'font-weight', '400'); // normal
  });

  it('displays closeout approve when no acknowledgement exists', () => {
    mountComponent();

    // Approve button should be visible
    cy.get('[data-cy="closeout-review"]').should('exist');
    cy.get('[data-cy="closeout-review-approve-button"]').should('exist');
  });

  it('displays closeout approval when acknowledgement exists', () => {
    const now = new Date();
    const acknowledgement = {
      userId: 1,
      ackKey: 'dar_closeout_chair_ref_DAR-UUID',
      firstAcknowledged: now.getTime(),
      lastAcknowledged: now.getTime(),
    } as Acknowledgement;
    cy.stub(User, 'getAcknowledgement').returns(acknowledgement);
    mountComponent({referenceId: 'DAR-UUID'});

    // Approved button with approved date should be visible
    cy.get('[data-cy="closeout-review"]').should('exist');
    cy.get('[data-cy="closeout-review-approved-button"]').should('exist');
    cy.contains(now.toISOString().substring(0, 10)).should('exist');
  });
});
