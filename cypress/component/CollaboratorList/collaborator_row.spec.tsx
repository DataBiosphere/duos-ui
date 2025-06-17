import React from 'react';
import { mount } from 'cypress/react';
import CollaboratorRow from 'src/components/collaborator_list/CollaboratorRow';
import { Collaborator } from 'src/types/model';

describe('CollaboratorRow - Component Tests', () => {
    const mockCollaborator: Collaborator = {
        name: 'John Doe',
        title: 'Researcher',
        email: 'john.doe@example.com',
        uuid: '123e4567-e89b-12d3-a456-426614174000',
        eraCommonsId: 'jdoe123',
        countryOfOperation: 'United States of America (the)',
        approverStatus: true
    };

    const mockCollaborators: Collaborator[] = [mockCollaborator];

    const columnsToShow = ['name', 'title', 'email'];

    const defaultProps = {
        id: 0,
        editMode: false,
        collaborator: mockCollaborator,
        collaboratorText: 'Collaborator',
        collaborators: mockCollaborators,
        columnsToShow: columnsToShow,
        countriesOfOperation: ['United States of America (the)', 'Canada', 'France'],
        editAction: () => { },
        deleteAction: () => { },
        closeAction: () => { },
        onCollaboratorChange: () => { },
        disabled: false
    };

    it('renders CollaboratorSummary when not in edit mode', () => {
        mount(<CollaboratorRow {...defaultProps} />);

        cy.contains(mockCollaborator.name).should('be.visible');
        cy.contains(mockCollaborator.title).should('be.visible');
        cy.contains(mockCollaborator.email).should('be.visible');

        cy.get('.glyphicon-pencil').should('exist');
        cy.get('.glyphicon-trash').should('exist');

        cy.contains('New Collaborator Information').should('not.exist');
        cy.contains('Edit Collaborator Information').should('not.exist');
    });

    it('renders CollaboratorAddEdit when in edit mode', () => {
        mount(<CollaboratorRow {...defaultProps} editMode={true} />);

        cy.contains(`Edit ${mockCollaborator.name} Information`).should('be.visible');
        cy.get('#name').should('have.value', mockCollaborator.name);
        cy.get('#title').should('have.value', mockCollaborator.title);
        cy.get('#email').should('have.value', mockCollaborator.email);
        cy.get('#countryOfOperation').should('contain', mockCollaborator.countryOfOperation);
        cy.get('#countryOfOperation').should('not.contain', 'France');

        cy.contains('Save').should('be.visible');
        cy.contains('Cancel').should('be.visible');

        cy.get('.glyphicon-pencil').should('not.exist');
        cy.get('.glyphicon-trash').should('not.exist');
    });

    it('passes editAction to CollaboratorSummary and triggers it on edit button click', () => {
        const editAction = cy.stub().as('editAction');

        mount(<CollaboratorRow
            {...defaultProps}
            editAction={editAction}
        />);

        cy.get('.glyphicon-pencil').parent('a').click({ force: true });

        cy.get('@editAction').should('have.been.calledOnce');
    });

    it('passes deleteAction to CollaboratorSummary and triggers it on delete confirmation', () => {
        const deleteAction = cy.stub().as('deleteAction');

        mount(<CollaboratorRow
            {...defaultProps}
            deleteAction={deleteAction}
        />);

        cy.get('.glyphicon-trash').parent('a').click({ force: true });

        cy.get('.delete-modal-primary-button').contains('Delete').click();

        cy.get('@deleteAction').should('have.been.calledOnce');
    });

    it('passes closeAction to CollaboratorAddEdit and triggers it on cancel', () => {
        const closeAction = cy.stub().as('closeAction');

        mount(<CollaboratorRow
            {...defaultProps}
            editMode={true}
            closeAction={closeAction}
        />);

        cy.contains('Cancel').click();

        cy.get('@closeAction').should('have.been.calledOnce');
    });

    it('passes onCollaboratorChange to CollaboratorAddEdit and triggers it on save', () => {
        const onCollaboratorChange = cy.stub().as('onCollaboratorChange');

        mount(<CollaboratorRow
            {...defaultProps}
            editMode={true}
            onCollaboratorChange={onCollaboratorChange}
        />);

        cy.get('#name').clear();
        cy.get('#name').type('Jane Doe');

        cy.contains('Save').click();

        cy.get('@onCollaboratorChange').should('have.been.calledOnce');
    });

    it('respects the disabled prop for CollaboratorSummary', () => {
        const editAction = cy.stub().as('editAction');
        const deleteAction = cy.stub().as('deleteAction');

        mount(<CollaboratorRow
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
    });

    it('renders CollaboratorAddEdit with new collaborator in edit mode with id=-1', () => {
        const newProps = {
            ...defaultProps,
            id: -1,
            collaborator: {countryOfOperation:'United States of America (the)'} as Collaborator,
            editMode: true
        };

        mount(<CollaboratorRow {...newProps} />);

        cy.contains('New Collaborator Information').should('be.visible');

        cy.get('#name').should('have.value', '');
        cy.get('#title').should('have.value', '');
        cy.get('#email').should('have.value', '');

        cy.contains('Add').should('be.visible');
        cy.contains('Cancel').should('be.visible');
    });
});
