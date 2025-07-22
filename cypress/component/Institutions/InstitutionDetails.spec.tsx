import React from 'react';
import {mount} from 'cypress/react';
import {InstitutionDetails} from 'src/components/institution_table/InstitutionDetails';
import {Institution as InstitutionAPI} from 'src/libs/ajax/Institution';
import {BrowserRouter} from 'react-router-dom';
import {FORM_MODES} from 'src/components/institution_table/InstitutionFormMode';

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
        mount(<BrowserRouter><InstitutionDetails match={{params: {institutionId: 123}}} formMode={FORM_MODES.editExisting}/></BrowserRouter>);
        cy.contains('Loading').should('be.visible');
    });

    it('should render institution details', () => {
        cy.stub(InstitutionAPI, 'list').returns(Promise.resolve([mockInstitution]));

        mount(<BrowserRouter><InstitutionDetails match={{params: {institutionId: 123}}} formMode={FORM_MODES.editExisting}/></BrowserRouter>);

        cy.contains('Back to institutions').should('be.visible');
        cy.contains('Institution Name').should('be.visible');
        cy.get('input[value="Broad Institute"]').should('exist');
        cy.contains('Domains').should('be.visible');
        cy.contains('Signing Officials').should('be.visible');
        cy.get('button').contains('Edit').should('exist');
    });

    it('should enter edit mode when Edit button is clicked', () => {
        cy.stub(InstitutionAPI, 'list').returns(Promise.resolve([mockInstitution]));

        mount(<BrowserRouter><InstitutionDetails match={{params: {institutionId: 123}}} formMode={FORM_MODES.editExisting}/></BrowserRouter>);

        cy.get('button').contains('Edit').click();

        cy.get('input[value="Broad Institute"]').should('not.be.disabled');
        cy.contains('button', 'Add').should('exist');
        cy.contains('button', 'Save').should('exist');
        cy.contains('button', 'Cancel').should('exist');
    });

    it('should cancel editing and revert changes', () => {
        cy.stub(InstitutionAPI, 'list').returns(Promise.resolve([mockInstitution]));

        mount(<BrowserRouter><InstitutionDetails match={{params: {institutionId: 123}}} formMode={FORM_MODES.editExisting}/></BrowserRouter>);

        cy.get('button').contains('Edit').click();
        cy.get('input[value="Broad Institute"]').type(' of MIT & Harvard');
        cy.contains('button', 'Cancel').click();

        cy.get('input[value="Broad Institute"]').should('exist');
        cy.get('input[value="Broad Institute of MIT & Harvard"]').should('not.exist');
        cy.contains('button', 'Edit').should('exist');
    });

    it('should save changes when Save button is clicked', () => {
        cy.stub(InstitutionAPI, 'list').returns(Promise.resolve([mockInstitution]));
        cy.stub(InstitutionAPI, 'patchInstitution').returns(Promise.resolve(mockInstitution))

        mount(<BrowserRouter><InstitutionDetails match={{params: {institutionId: 123}}} formMode={FORM_MODES.editExisting}/></BrowserRouter>);

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

        cy.stub(InstitutionAPI, 'list').returns(Promise.resolve([mockInstitution]));
        cy.stub(InstitutionAPI, 'patchInstitution').rejects(conflictError);

        mount(<BrowserRouter><InstitutionDetails match={{params: {institutionId: 123}}} formMode={FORM_MODES.editExisting}/></BrowserRouter>);

        cy.get('button').contains('Edit').click();
        cy.contains('button', 'Save').click();

        cy.contains('An error occurred when trying to update the institution: This domain is already associated with another institution.').should('be.visible');
    });

    it('should allow creating a new institution', () => {
        const newInstitution = {
            name: 'The Broad Institute',
            domains: ['broadinstitute.org', 'broad.mit.edu']
        };

        cy.stub(InstitutionAPI, 'list').returns(Promise.resolve([]));
        cy.stub(InstitutionAPI, 'postInstitution').callsFake((institution) => {
            expect(institution.name).to.equal('The Broad Institute');
            expect(institution.domains).to.deep.equal(['broadinstitute.org', 'broad.mit.edu']);
            return Promise.resolve(newInstitution);
        });

        mount(<BrowserRouter><InstitutionDetails formMode={FORM_MODES.createNew} match={{params: {}}}/></BrowserRouter>);

        cy.contains('Institution Name').should('be.visible');

        // Add institution name
        cy.get('input[placeholder="Institution Name"]')
            .should('be.visible')
            .type('The Broad Institute');

        // Add domains
        cy.contains('Domains').should('be.visible');
        cy.get('input[placeholder="e.g., example.com"]')
            .should('be.visible')
            .type('broadinstitute.org');
        cy.contains('button', 'Add').click();
        cy.get('input[placeholder="e.g., example.com"]')
            .should('be.visible')
            .type('broad.mit.edu');
        cy.contains('button', 'Add').click();


        cy.contains('broadinstitute.org').should('be.visible');
        cy.contains('broad.mit.edu').should('be.visible');

        cy.contains('button', 'Create').click();

        cy.contains('Institution created successfully').should('be.visible');
    });

    it('should disable the create/save button if the institution name is empty', () => {
        mount(<BrowserRouter><InstitutionDetails formMode={FORM_MODES.createNew} match={{params: {}}}/></BrowserRouter>);

        // Create button should be disabled to start
        cy.contains('button', 'Create').should('be.disabled');

        cy.get('input[placeholder="Institution Name"]').type('The Broad Institute');
        cy.contains('button', 'Create').should('not.be.disabled');
    });

    describe('Institution Name Validation', () => {
        const existingInstitutions = [
            { id: 1, name: 'Broad Institute', domains: ['broadinstitute.org'] },
            { id: 2, name: 'MIT', domains: ['mit.edu'] },
            { id: 3, name: 'Harvard University', domains: ['harvard.edu'] }
        ];

        it('should show error when institution name is empty', () => {
            cy.stub(InstitutionAPI, 'list').returns(Promise.resolve(existingInstitutions));
            mount(<BrowserRouter><InstitutionDetails formMode={FORM_MODES.createNew} match={{params: {}}}/></BrowserRouter>);

            cy.get('input[placeholder="Institution Name"]').type('Test').clear();
            cy.contains('Institution name is required').should('be.visible');
            cy.contains('button', 'Create').should('be.disabled');
        });

        it('should show error when institution name already exists (case insensitive)', () => {
            cy.stub(InstitutionAPI, 'list').returns(Promise.resolve(existingInstitutions));
            mount(<BrowserRouter><InstitutionDetails formMode={FORM_MODES.createNew} match={{params: {}}}/></BrowserRouter>);

            cy.get('input[placeholder="Institution Name"]').type('broad institute');
            cy.contains('An institution with this name already exists').should('be.visible');
            cy.contains('button', 'Create').should('be.disabled');
        });

        it('should show error when institution name already exists (exact match)', () => {
            cy.stub(InstitutionAPI, 'list').returns(Promise.resolve(existingInstitutions));
            mount(<BrowserRouter><InstitutionDetails formMode={FORM_MODES.createNew} match={{params: {}}}/></BrowserRouter>);

            cy.get('input[placeholder="Institution Name"]').type('MIT');
            cy.contains('An institution with this name already exists').should('be.visible');
            cy.contains('button', 'Create').should('be.disabled');
        });

        it('should allow unique institution names', () => {
            cy.stub(InstitutionAPI, 'list').returns(Promise.resolve(existingInstitutions));
            mount(<BrowserRouter><InstitutionDetails formMode={FORM_MODES.createNew} match={{params: {}}}/></BrowserRouter>);

            cy.get('input[placeholder="Institution Name"]').type('Stanford University');
            cy.contains('An institution with this name already exists').should('not.exist');
            cy.contains('button', 'Create').should('not.be.disabled');
        });

        it('should allow editing current institution name (same name)', () => {
            cy.stub(InstitutionAPI, 'list').returns(Promise.resolve(existingInstitutions));
            mount(<BrowserRouter><InstitutionDetails match={{params: {institutionId: 1}}} formMode={FORM_MODES.editExisting}/></BrowserRouter>);

            cy.get('button').contains('Edit').click();

            // Should not show error when keeping the same name
            cy.get('input[value="Broad Institute"]').should('not.have.class', 'Mui-error');
            cy.contains('button', 'Save').should('not.be.disabled');
        });

        it('should prevent editing to another existing institution name', () => {
            cy.stub(InstitutionAPI, 'list').returns(Promise.resolve(existingInstitutions));
            mount(<BrowserRouter><InstitutionDetails match={{params: {institutionId: 1}}} formMode={FORM_MODES.editExisting}/></BrowserRouter>);

            cy.get('button').contains('Edit').click();
            cy.get('input[value="Broad Institute"]').clear().type('MIT');

            cy.contains('An institution with this name already exists').should('be.visible');
            cy.contains('button', 'Save').should('be.disabled');
        });

        it('should clear validation errors when canceling edit', () => {
            cy.stub(InstitutionAPI, 'list').returns(Promise.resolve(existingInstitutions));
            mount(<BrowserRouter><InstitutionDetails match={{params: {institutionId: 1}}} formMode={FORM_MODES.editExisting}/></BrowserRouter>);

            cy.get('button').contains('Edit').click();
            cy.get('input[value="Broad Institute"]').clear().type('MIT');
            cy.contains('An institution with this name already exists').should('be.visible');

            cy.contains('button', 'Cancel').click();
            cy.get('.MuiFormHelperText-root').should('not.exist');
        });

        it('should validate name on every character input', () => {
            cy.stub(InstitutionAPI, 'list').returns(Promise.resolve(existingInstitutions));
            mount(<BrowserRouter><InstitutionDetails formMode={FORM_MODES.createNew} match={{params: {}}}/></BrowserRouter>);

            // Start typing "MIT"
            cy.get('input[placeholder="Institution Name"]').type('M');
            cy.contains('An institution with this name already exists').should('not.exist');

            cy.get('input[placeholder="Institution Name"]').type('I');
            cy.contains('An institution with this name already exists').should('not.exist');

            cy.get('input[placeholder="Institution Name"]').type('T');
            cy.contains('An institution with this name already exists').should('be.visible');
        });
    });
});
