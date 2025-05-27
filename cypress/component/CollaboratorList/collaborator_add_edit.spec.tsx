import React from 'react';
import { mount } from 'cypress/react';
import CollaboratorAddEdit from '../../../src/components/collaborator_list/CollaboratorAddEdit';
import {Collaborator} from "src/types/model";


describe('CollaboratorAddEdit - Component Tests', () => {
  const mockCollaborator: Collaborator = {
    name: 'John Doe',
    title: 'Researcher',
    email: 'john.doe@example.com',
    uuid: '123e4567-e89b-12d3-a456-426614174000',
    eraCommonsId: 'jdoe123',
    approverStatus: false
  };

  const mockCollaborators: Collaborator[] = [mockCollaborator];

  const defaultProps = {
    id: -1,
    collaboratorText: 'Collaborator',
    collaborators: mockCollaborators,
    closeAction: () => { },
    onCollaboratorChange: () => { }
  };

  it('renders the component correctly for adding a new collaborator', () => {
    mount(<CollaboratorAddEdit {...defaultProps} />);

    cy.contains('New Collaborator Information').should('be.visible');
    cy.contains('Collaborator Name').should('be.visible');
    cy.contains('Collaborator Title').should('be.visible');
    cy.contains('Collaborator Email').should('be.visible');
    cy.contains('Add').should('be.visible');
    cy.contains('Cancel').should('be.visible');
  });

  it('renders the component correctly for editing an existing collaborator', () => {
    mount(<CollaboratorAddEdit
      {...defaultProps}
      id={0}
      collaborator={mockCollaborator}
    />);

    cy.contains(`Edit ${mockCollaborator.name} Information`).should('be.visible');
    cy.get('#name').should('have.value', mockCollaborator.name);
    cy.get('#title').should('have.value', mockCollaborator.title);
    cy.get('#email').should('have.value', mockCollaborator.email);
    cy.contains('Save').should('be.visible');
  });

  it('calls closeAction when Cancel button is clicked', () => {
    const closeAction = cy.stub().as('closeAction');
    mount(<CollaboratorAddEdit {...defaultProps} closeAction={closeAction} />);

    cy.contains('Cancel').click();
    cy.get('@closeAction').should('have.been.calledOnce');
  });

  it('calls onCollaboratorChange when Save button is clicked for existing collaborator', () => {
    const onCollaboratorChange = cy.stub().as('onCollaboratorChange');
    mount(<CollaboratorAddEdit
      {...defaultProps}
      id={0}
      collaborator={mockCollaborator}
      onCollaboratorChange={onCollaboratorChange}
    />);

    cy.get('#name').clear();
    cy.get('#name').type('Jane Doe');
    cy.get('#title').clear();
    cy.get('#title').type('Senior Researcher');

    cy.contains('Save').click();

    cy.get('@onCollaboratorChange').should('have.been.calledOnce');
  });

  it('calls both onCollaboratorChange and closeAction when Add button is clicked', () => {
    const closeAction = cy.stub().as('closeAction');
    const onCollaboratorChange = cy.stub().as('onCollaboratorChange');

    mount(<CollaboratorAddEdit
      {...defaultProps}
      closeAction={closeAction}
      onCollaboratorChange={onCollaboratorChange}
    />);

    cy.get('#name').type('Test Name');
    cy.get('#title').type('Test Title');
    cy.get('#email').type('test@example.com');

    cy.contains('Add').click();

    cy.get('@onCollaboratorChange').should('have.been.calledOnce');
    cy.get('@closeAction').should('have.been.calledOnce');
  });

  it('updates form fields when typing', () => {
    mount(<CollaboratorAddEdit {...defaultProps} />);

    const name = 'Test Name';
    cy.get('#name').type(name);
    cy.get('#name').should('have.value', name);

    const title = 'Test Title';
    cy.get('#title').type(title);
    cy.get('#title').should('have.value', title);

    const email = 'test@example.com';
    cy.get('#email').type(email);
    cy.get('#email').should('have.value', email);
  });

  it('shows validation error for empty required fields', () => {
    mount(<CollaboratorAddEdit {...defaultProps} />);

    cy.get('#name').focus();
    cy.get('#name').blur();

    cy.get('#title').focus();
    cy.get('#title').blur();

    cy.get('#email').focus();
    cy.get('#email').blur();

    cy.get('#name').parent().find('.error-message').should('be.visible');
    cy.get('#title').parent().find('.error-message').should('be.visible');
    cy.get('#email').parent().find('.error-message').should('be.visible');
  });

  it('shows validation error for invalid email format', () => {
    mount(<CollaboratorAddEdit {...defaultProps} />);

    cy.get('#email').type('invalid');
    cy.get('#email').blur();

    cy.get('#email').parent().find('.error-message').should('be.visible');
  });
});
