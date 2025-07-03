import React from 'react';
import {mount} from 'cypress/react';
import {DataAccessAgreements} from 'src/pages/dar_application/DataAccessAgreements';
import {DAA} from 'src/libs/ajax/DAA';

describe('DataAccessAgreements Component Tests', () => {
  let saveSpy: () => void;
  let attestSpy: () => void;
  let cancelAttestSpy: () => void;

  const mountComponent = (customProps = {}) => {
    const defaultProps = {
      save: saveSpy,
      attest: attestSpy,
      isDraft: true,
      isAttested: false,
      cancelAttest: cancelAttestSpy,
      datasets: [],
      ...customProps
    };
    return mount(<DataAccessAgreements {...defaultProps} />);
  };

  beforeEach(() => {
    cy.initApplicationConfig();
    saveSpy = cy.stub().as('saveSpy');
    attestSpy = cy.stub().as('attestSpy');
    cancelAttestSpy = cy.stub().as('cancelAttestSpy');
    cy.stub(DAA, 'getDaas').returns([]);
    mountComponent();
  });

  it('renders the component with default props', () => {
    cy.get('.dar-step-card').should('exist');
    cy.get('[data-cy="attest-button"]').should('exist');
    cy.get('[data-cy="save-button"]').should('exist');
  });

  it('calls save when the save button is clicked', () => {
    cy.get('[data-cy="save-button"]').click();
    cy.get('@saveSpy').should('have.been.called');
  });

  it('calls attest when the attest button is clicked', () => {
    cy.get('[data-cy="attest-button"]').click();
    cy.get('@attestSpy').should('have.been.called');
  });

  it('calls cancelAttest when the cancel attest button is clicked', () => {
    mountComponent({isAttested: true});
    cy.get('[data-cy="cancel-button"]').should('exist');
    cy.get('[data-cy="cancel-button"]').click();
    cy.get('@cancelAttestSpy').should('have.been.called');
  });

});