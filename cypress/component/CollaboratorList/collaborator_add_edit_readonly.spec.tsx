import React from 'react';
import { mount } from 'cypress/react';
import CollaboratorAddEdit from 'src/components/collaborator_list/CollaboratorAddEdit';
import { Collaborator } from 'src/types/model';

describe('CollaboratorAddEdit - Read-Only Mode Tests', () => {
    const mockCollaborator: Collaborator = {
        name: 'John Doe',
        title: 'Researcher',
        email: 'john.doe@example.com',
        uuid: '123e4567-e89b-12d3-a456-426614174001',
        eraCommonsId: 'jdoe123',
        countryOfOperation: 'Canada',
        approverStatus: true
    };

    const mockCollaborators: Collaborator[] = [mockCollaborator];

    const readOnlyProps = {
        id: 0,
        collaborator: mockCollaborator,
        collaboratorText: 'Internal Lab Staff',
        collaborators: mockCollaborators,
        closeAction: cy.stub().as('closeAction'),
        onCollaboratorChange: cy.stub().as('onCollaboratorChange'),
        showApproverStatus: true,
        readOnly: true,
        countriesOfOperation: ['Canada', 'United States of America (the)', 'France']
    };

    it('renders in read-only mode with correct header', () => {
        mount(<CollaboratorAddEdit {...readOnlyProps} />);

        // Should show "View" instead of "Edit" in the header
        cy.contains('View John Doe Information').should('be.visible');
        cy.contains('Edit John Doe Information').should('not.exist');
    });

    it('displays all form fields as disabled in read-only mode', () => {
        mount(<CollaboratorAddEdit {...readOnlyProps} />);

        // Verify all form fields are disabled
        cy.get('#name').should('be.disabled');
        cy.get('#eraCommonsId').should('be.disabled');
        cy.get('#title').should('be.disabled');
        cy.get('#email').should('be.disabled');
        cy.get('#countryOfOperation').should('be.disabled');
    });

    it('displays correct values in form fields', () => {
        mount(<CollaboratorAddEdit {...readOnlyProps} />);

        // Verify form fields show the correct values
        cy.get('#name').should('have.value', 'John Doe');
        cy.get('#eraCommonsId').should('have.value', 'jdoe123');
        cy.get('#title').should('have.value', 'Researcher');
        cy.get('#email').should('have.value', 'john.doe@example.com');
        cy.get('#countryOfOperation').should('have.value', 'Canada');
    });

    it('hides Save/Add button and shows Close button in read-only mode', () => {
        mount(<CollaboratorAddEdit {...readOnlyProps} />);

        // Verify no Save/Add button is present, only Close button
        cy.contains('button', 'Save').should('not.exist');
        cy.contains('button', 'Add').should('not.exist');
        cy.contains('Close').should('be.visible');
    });

    it('calls closeAction when Close button is clicked', () => {
        mount(<CollaboratorAddEdit {...readOnlyProps} />);

        cy.contains('Close').click();
        cy.get('@closeAction').should('have.been.calledOnce');
    });

    it('does not call onCollaboratorChange in read-only mode', () => {
        mount(<CollaboratorAddEdit {...readOnlyProps} />);

        // Try to interact with fields (though they should be disabled)
        cy.get('#name').should('be.disabled');
        
        // Verify onCollaboratorChange is not called
        cy.get('@onCollaboratorChange').should('not.have.been.called');
    });

    it('displays approver status in read-only mode when enabled', () => {
        mount(<CollaboratorAddEdit {...readOnlyProps} />);

        // The ApproverStatus component should be visible with the question text
        cy.contains('Are you requesting permission for this member').should('be.visible');
        
        // Radio buttons should be disabled in read-only mode
        cy.get('input[type="radio"][name="approverStatus"]').should('be.disabled');
    });

    it('renders correctly for new collaborator in read-only mode', () => {
        const newCollaboratorProps = {
            ...readOnlyProps,
            collaborator: { countryOfOperation: 'Canada' } as Collaborator
        };

        mount(<CollaboratorAddEdit {...newCollaboratorProps} />);

        // Should show "View" for new collaborator as well
        cy.contains('View  Information').should('be.visible');
        cy.contains('New Internal Lab Staff Information').should('not.exist');
    });

    it('form fields are not required in read-only mode', () => {
        const emptyCollaborator = { countryOfOperation: 'Canada' } as Collaborator;
        const emptyProps = {
            ...readOnlyProps,
            collaborator: emptyCollaborator
        };

        mount(<CollaboratorAddEdit {...emptyProps} />);

        // Fields should be empty but not show validation errors in read-only mode
        cy.get('#name').should('have.value', '');
        cy.get('#email').should('have.value', '');
        
        // No validation errors should be visible
        cy.get('.form-control-feedback').should('not.exist');
    });
});
