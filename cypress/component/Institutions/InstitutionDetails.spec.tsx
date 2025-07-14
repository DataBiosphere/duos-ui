import React from 'react';
import {mount} from 'cypress/react';
import {InstitutionDetails} from 'src/components/institution_table/InstitutionDetails';
import {Institution as InstitutionAPI} from 'src/libs/ajax/Institution';
import {BrowserRouter} from 'react-router-dom';

describe('Institution Details Tests', () => {
    const mockInstitution = {
        id: 123,
        name: 'Broad Institute',
        domains: ['broadinstitute.org', 'broad.mit.edu'],
        signingOfficials: [
            {
                userId: '1',
                displayName: 'John Testerson',
                email: 'john@broad.mit.edu'
            }
        ],
        createDate: '2023-01-01',
        updateDate: '2023-02-01',
        createUser: {
            displayName: 'Admin User'
        },
        updateUser: {
            displayName: 'Admin User'
        }
    };

    beforeEach(() => {
        cy.viewport(1000, 800);
    });

    it('should show a loading spinner', () => {
        mount(<BrowserRouter><InstitutionDetails match={{params: {institutionId: 123}}} /></BrowserRouter>);
        cy.contains('Loading').should('be.visible');
    });

    it('should render institution details', () => {
        cy.stub(InstitutionAPI, 'getById').returns(Promise.resolve(mockInstitution));

        mount(<BrowserRouter><InstitutionDetails match={{params: {institutionId: 123}}} /></BrowserRouter>);

        cy.contains('Back to institutions').should('be.visible');
        cy.contains('Institution Name').should('be.visible');
        cy.get('input[value="Broad Institute"]').should('exist');
        cy.contains('Domains').should('be.visible');
        cy.contains('Signing Officials').should('be.visible');
        cy.get('button').contains('Edit').should('exist');
    });

    it('should enter edit mode when Edit button is clicked', () => {
        cy.stub(InstitutionAPI, 'getById').returns(Promise.resolve(mockInstitution));

        mount(<BrowserRouter><InstitutionDetails match={{params: {institutionId: 123}}} /></BrowserRouter>);

        cy.get('button').contains('Edit').click();

        cy.get('input[value="Broad Institute"]').should('not.be.disabled');
        cy.contains('button', 'Add').should('exist');
        cy.contains('button', 'Save').should('exist');
        cy.contains('button', 'Cancel').should('exist');
    });

    it('should cancel editing and revert changes', () => {
        cy.stub(InstitutionAPI, 'getById').returns(Promise.resolve(mockInstitution));

        mount(<BrowserRouter><InstitutionDetails match={{params: {institutionId: 123}}} /></BrowserRouter>);

        cy.get('button').contains('Edit').click();
        cy.get('input[value="Broad Institute"]').type(' of MIT & Harvard');
        cy.contains('button', 'Cancel').click();

        cy.get('input[value="Broad Institute"]').should('exist');
        cy.get('input[value="Broad Institute of MIT & Harvard"]').should('not.exist');
        cy.contains('button', 'Edit').should('exist');
    });

    it('should save changes when Save button is clicked', () => {
        cy.stub(InstitutionAPI, 'getById').returns(Promise.resolve(mockInstitution));
        cy.stub(InstitutionAPI, 'patchInstitution').returns(Promise.resolve(mockInstitution))

        mount(<BrowserRouter><InstitutionDetails match={{params: {institutionId: 123}}} /></BrowserRouter>);

        cy.get('button').contains('Edit').click();
        cy.get('input[value="Broad Institute"]').type(' of MIT & Harvard');
        cy.contains('button', 'Save').click();

        cy.wrap(InstitutionAPI.patchInstitution).should('have.been.calledWith', 123, {
            name: 'Broad Institute of MIT & Harvard',
            domains: mockInstitution.domains
        });

        cy.contains('button', 'Edit').should('exist');
    });


    it('should display error notification when saving fails with 409 conflict', () => {

        const conflictError = {
            response: {
                status: 409,
                data: { message: 'This domain is already associated with another institution.' }
            }
        };

        cy.stub(InstitutionAPI, 'getById').returns(Promise.resolve(mockInstitution));
        cy.stub(InstitutionAPI, 'patchInstitution').rejects(conflictError);

        mount(<BrowserRouter><InstitutionDetails match={{params: {institutionId: 123}}} /></BrowserRouter>);

        cy.get('button').contains('Edit').click();
        cy.contains('button', 'Save').click();

        cy.contains('An error occurred when trying to update the institution: This domain is already associated with another institution.').should('be.visible');
    });
});
