import React from 'react';
import { mount } from 'cypress/react';
import CollaboratorList from '../../../src/components/collaborator_list/CollaboratorList';

// Define the Collaborator interface to match the component's expectations
interface Collaborator {
    name: string;
    title: string;
    institution: string;
    email: string;
}

describe('CollaboratorList - Component Tests', () => {
    const mockCollaborators: Collaborator[] = [
        {
            name: 'John Doe',
            title: 'Researcher',
            institution: 'Research Institute',
            email: 'john.doe@example.com'
        },
        {
            name: 'Jane Smith',
            title: 'Professor',
            institution: 'University',
            email: 'jane.smith@example.com'
        }
    ];

    const defaultProps = {
        collaborators: mockCollaborators,
        collaboratorText: 'Collaborator',
        columnsToShow: ['name', 'title', 'email'],
        onCollaboratorChange: () => { },
        disabled: false
    };

    it('renders the component with a list of collaborators', () => {
        mount(<CollaboratorList {...defaultProps} />);

        cy.get('button').contains('Add Collaborator').should('be.visible');

        cy.contains(mockCollaborators[0].name).should('be.visible');
        cy.contains(mockCollaborators[0].title).should('be.visible');
        cy.contains(mockCollaborators[0].email).should('be.visible');

        cy.contains(mockCollaborators[1].name).should('be.visible');
        cy.contains(mockCollaborators[1].title).should('be.visible');
        cy.contains(mockCollaborators[1].email).should('be.visible');

        cy.get('.collaborator-summary-card').should('have.length', 2);
    });

    it('opens the add form when Add button is clicked', () => {
        mount(<CollaboratorList {...defaultProps} />);

        cy.contains('New Collaborator Information').should('not.exist');

        cy.contains('Add Collaborator').click();

        cy.contains('New Collaborator Information').should('be.visible');
    });

    it('switches to edit mode when edit button is clicked for a collaborator', () => {
        mount(<CollaboratorList {...defaultProps} />);

        cy.contains(mockCollaborators[0].name).should('be.visible');
        cy.get('.collaborator-summary-card').first().within(() => {
            cy.get('.glyphicon-pencil').should('exist');
        });

        cy.get('.glyphicon-pencil').first().parent('a').click({ force: true });

        cy.contains(`Edit ${mockCollaborators[0].name} Information`).should('be.visible');
        cy.get('#name').should('have.value', mockCollaborators[0].name);
        cy.get('#title').should('have.value', mockCollaborators[0].title);
    });

    it('deletes a collaborator when delete is confirmed', () => {
        const onCollaboratorChange = cy.stub().as('onCollaboratorChange');

        mount(<CollaboratorList
            {...defaultProps}
            onCollaboratorChange={onCollaboratorChange}
        />);

        cy.get('.collaborator-summary-card').should('have.length', 2);

        cy.get('.glyphicon-trash').first().parent('a').click({ force: true });

        cy.get('.delete-modal-primary-button').contains('Delete').click();

        cy.get('@onCollaboratorChange').should('have.been.calledOnce');
    });

    it('adds a new collaborator when adding through the form', () => {
        const onCollaboratorChange = cy.stub().as('onCollaboratorChange');

        mount(<CollaboratorList
            {...defaultProps}
            onCollaboratorChange={onCollaboratorChange}
        />);

        cy.contains('Add Collaborator').click();

        cy.get('#name').type('New Person').blur();
        cy.get('#title').type('New Title').blur();
        cy.get('#institution').type('New Institution').blur();
        cy.get('#email').type('new.person@example.com').blur();

        cy.get('.collaborator-form-add-save-button').click({ force: true });

        cy.get('@onCollaboratorChange').should('be.called');
    });

    it('updates a collaborator when editing through the form', () => {
        const onCollaboratorChange = cy.stub().as('onCollaboratorChange');

        mount(<CollaboratorList
            {...defaultProps}
            onCollaboratorChange={onCollaboratorChange}
        />);

        cy.get('.glyphicon-pencil').first().parent('a').click({ force: true });

        const updatedName = 'Updated Name';
        cy.get('#name').clear().type(updatedName);

        cy.contains('Save').click();

        cy.get('@onCollaboratorChange').should('have.been.calledOnce');
    });

    it('closes the add form when Cancel is clicked', () => {
        mount(<CollaboratorList {...defaultProps} />);

        cy.contains('Add Collaborator').click();
        cy.contains('New Collaborator Information').should('be.visible');

        cy.contains('Cancel').click();

        cy.contains('New Collaborator Information').should('not.exist');
    });

    it('disables the Add button when disabled prop is true', () => {
        mount(<CollaboratorList {...defaultProps} disabled={true} />);

        cy.contains('Add Collaborator').should('be.disabled');

        cy.contains('Add Collaborator').click({ force: true });

        cy.contains('New Collaborator Information').should('not.exist');
    });

    it('passes disabled prop to CollaboratorRow components', () => {
        mount(<CollaboratorList {...defaultProps} disabled={true} />);

        cy.get('.glyphicon-pencil').parent().should('have.css', 'opacity', '0.5');
        cy.get('.glyphicon-trash').parent().should('have.css', 'opacity', '0.5');
    });

    it('renders correctly with empty collaborators list', () => {
        mount(<CollaboratorList
            {...defaultProps}
            collaborators={[]}
        />);

        cy.contains('Add Collaborator').should('be.visible');

        cy.get('.collaborator-summary-card').should('not.exist');
    });

    it('renders correctly with custom columnsToShow', () => {
        mount(<CollaboratorList
            {...defaultProps}
            columnsToShow={['name', 'institution']}
        />);

        cy.contains(mockCollaborators[0].name).should('be.visible');
        cy.contains(mockCollaborators[0].institution).should('be.visible');
        cy.contains(mockCollaborators[0].title).should('not.exist');
        cy.contains(mockCollaborators[0].email).should('not.exist');
    });

    it('clears edit state after a successful edit', () => {
        mount(<CollaboratorList {...defaultProps} />);

        cy.get('.glyphicon-pencil').first().parent('a').click({ force: true });
        cy.contains(`Edit ${mockCollaborators[0].name} Information`).should('be.visible');

        cy.contains('Save').click();

        cy.contains(`Edit ${mockCollaborators[0].name} Information`).should('not.exist');
        cy.contains(mockCollaborators[0].name).should('be.visible');
    });

    it('maintains proper edit state when editing multiple collaborators', () => {
        mount(<CollaboratorList {...defaultProps} />);

        cy.get('.glyphicon-pencil').first().parent('a').click({ force: true });
        cy.contains(`Edit ${mockCollaborators[0].name} Information`).should('be.visible');

        cy.contains(mockCollaborators[1].name).should('be.visible');

        cy.contains('Cancel').click();

        cy.contains(mockCollaborators[0].name).should('be.visible');
        cy.contains(mockCollaborators[1].name).should('be.visible');

        cy.get('.glyphicon-pencil').eq(1).parent('a').click({ force: true });

        cy.contains(mockCollaborators[0].name).should('be.visible');
        cy.contains(`Edit ${mockCollaborators[1].name} Information`).should('be.visible');
    });
});
