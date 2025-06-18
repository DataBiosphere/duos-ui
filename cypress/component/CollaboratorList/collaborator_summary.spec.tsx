import React from 'react';
import { mount } from 'cypress/react';
import CollaboratorSummary from 'src/components/collaborator_list/CollaboratorSummary';
import {Collaborator} from 'src/types/model';

type PartialCollaborator = {
  name: string;
  title?: string | null;
  institution?: string | null;
  email?: string | null;
  uuid?: string;
  eraCommonsId?: string;
}

describe('CollaboratorSummary - Component Tests', () => {
  const mockCollaborator: Collaborator = {
    name: 'John Doe',
    title: 'Researcher',
    email: 'john.doe@example.com',
    uuid: '123e4567-e89b-12d3-a456-426614174000',
    eraCommonsId: 'jdoe123',
    approverStatus: false,
    countryOfOperation: 'United States of America (the)'
  };

  const defaultProps = {
    collaborator: mockCollaborator,
    columnsToShow: ['name', 'title', 'email'],
    editAction: () => { },
    deleteAction: () => { },
    disabled: false
  };

  it('renders the component correctly with specified columns', () => {
    mount(<CollaboratorSummary {...defaultProps} />);

    cy.contains(mockCollaborator.name).should('be.visible');
    cy.contains(mockCollaborator.title).should('be.visible');
    cy.contains(mockCollaborator.email).should('be.visible');

    cy.get('.collaborator-summary-edit-delete-buttons').should('exist');
    cy.get('.glyphicon-pencil').should('exist');
    cy.get('.glyphicon-trash').should('exist');
  });

  it('renders different columns when columnsToShow changes', () => {
    const customProps = {
      ...defaultProps,
      columnsToShow: ['name', 'email']
    };

    mount(<CollaboratorSummary {...customProps} />);

    cy.contains(mockCollaborator.name).should('be.visible');

    cy.contains(mockCollaborator.title).should('not.exist');
    cy.contains(mockCollaborator.email).should('be.visible');
  });

  it('calls editAction when edit button is clicked', () => {
    const editAction = cy.stub().as('editAction');

    mount(<CollaboratorSummary
      {...defaultProps}
      editAction={editAction}
    />);

    cy.get('.glyphicon-pencil').parent('a').click({ force: true });
    cy.get('@editAction').should('have.been.calledOnce');
  });

  it('shows delete modal when delete button is clicked', () => {
    mount(<CollaboratorSummary {...defaultProps} />);

    cy.get('.delete-modal').should('not.exist');

    cy.get('.glyphicon-trash').parent('a').click({ force: true });

    cy.get('.delete-modal').should('be.visible');
    cy.get('.delete-modal-title').contains(mockCollaborator.name).should('be.visible');
  });

  it('calls deleteAction when confirming deletion', () => {
    const deleteAction = cy.stub().as('deleteAction');

    mount(<CollaboratorSummary
      {...defaultProps}
      deleteAction={deleteAction}
    />);

    cy.get('.glyphicon-trash').parent('a').click({ force: true });

    cy.get('.delete-modal-primary-button').contains('Delete').click();

    cy.get('@deleteAction').should('have.been.calledOnce');

    cy.get('.delete-modal').should('not.exist');
  });

  it('closes delete modal when cancel is clicked', () => {
    mount(<CollaboratorSummary {...defaultProps} />);

    cy.get('.glyphicon-trash').parent('a').click({ force: true });
    cy.get('.delete-modal').should('be.visible');

    cy.get('.delete-modal-secondary-button').contains('Cancel').click();

    cy.get('.delete-modal').should('not.exist');
  });

  it('disables interactions when disabled prop is true', () => {
    const editAction = cy.stub().as('editAction');
    const deleteAction = cy.stub().as('deleteAction');

    mount(<CollaboratorSummary
      {...defaultProps}
      editAction={editAction}
      deleteAction={deleteAction}
      disabled={true}
    />);

    cy.get('.glyphicon-pencil').parent().should('have.css', 'opacity', '0.5');
    cy.get('.glyphicon-trash').parent().should('have.css', 'opacity', '0.5');

    cy.get('.glyphicon-pencil').parent('a').click({ force: true });
    cy.get('.glyphicon-trash').parent('a').click({ force: true });

    cy.get('@editAction').should('not.have.been.called');
    cy.get('@deleteAction').should('not.have.been.called');

    cy.get('.delete-modal').should('not.exist');
  });

  it('displays null or undefined column values gracefully', () => {
    const incompleteCollaborator: PartialCollaborator = {
      name: 'Jane Doe',
      title: '',
      institution: undefined,
      email: null
    };

    mount(<CollaboratorSummary
      {...defaultProps}
      collaborator={incompleteCollaborator as Collaborator}
    />);

    cy.contains('Jane Doe').should('be.visible');

    cy.get('.collaborator-summary-card > div').should('have.length', 1 + 1); // 1 data div + buttons div
  });
});
