import React from 'react';
import {mount} from 'cypress/react';
import {InstitutionDomainEditor} from 'src/components/institution_table/components/InstitutionDomainEditor';

describe('Institution Domain Editor Tests', () => {
    const testDomains = ['example.com', 'test.edu', 'domain.org'];

    beforeEach(() => {
        cy.viewport(1000, 600);
    });

    it('should render domains in view mode', () => {
        mount(<InstitutionDomainEditor domains={testDomains} editMode={false} />);

        testDomains.forEach((domain) => {
            cy.contains(domain).should('exist');
        });

        cy.get('input').should('not.exist');
    });

    it('should show message when no domains in view mode', () => {
        mount(<InstitutionDomainEditor domains={[]} editMode={false} />);

        cy.contains('This institution is not associated with any domains').should('be.visible');
    });

    it('should render domains and input field in edit mode', () => {
        mount(<InstitutionDomainEditor domains={testDomains} editMode={true} />);

        testDomains.forEach((domain) => {
            cy.contains(domain).should('exist');
        });

        cy.get('input').should('exist');
        cy.contains('button', 'Add').should('exist');
    });

    it('should allow adding a new domain in edit mode', () => {
        const newDomain = 'newdomain.com';
        const onDomainsChange = cy.stub().as('domainsChangeHandler');

        mount(
            <InstitutionDomainEditor
                domains={testDomains}
                editMode={true}
                onDomainsChange={onDomainsChange}
            />
        );

        cy.get('input').type(newDomain);
        cy.contains('button', 'Add').click();

        cy.get('@domainsChangeHandler').should('have.been.calledWith', [...testDomains, newDomain]);
    });

    it('should not add empty domains', () => {
        const onDomainsChange = cy.stub().as('domainsChangeHandler');

        mount(
            <InstitutionDomainEditor
                domains={testDomains}
                editMode={true}
                onDomainsChange={onDomainsChange}
            />
        );

        // Try to add empty domain
        cy.get('input').type('   {enter}');

        // Verify callback was not called
        cy.get('@domainsChangeHandler').should('not.have.been.called');
    });

    it('should trim whitespace when adding domains', () => {
        const newDomain = 'trimmed.com';
        const onDomainsChange = cy.stub().as('domainsChangeHandler');

        mount(
            <InstitutionDomainEditor
                domains={testDomains}
                editMode={true}
                onDomainsChange={onDomainsChange}
            />
        );

        cy.get('input').type(`   ${newDomain}   `);
        cy.contains('button', 'Add').click();

        cy.get('@domainsChangeHandler').should('have.been.calledWith', [...testDomains, newDomain]);
    });

    it('should not add duplicate domains', () => {
        const existingDomain = testDomains[0];
        const onDomainsChange = cy.stub().as('domainsChangeHandler');

        mount(
            <InstitutionDomainEditor
                domains={testDomains}
                editMode={true}
                onDomainsChange={onDomainsChange}
            />
        );

        cy.get('input').type(existingDomain);
        cy.contains('button', 'Add').click();

        cy.get('@domainsChangeHandler').should('not.have.been.called');
        cy.contains('This domain has already been added').should('be.visible');
    });

    it('should allow deleting a domain in edit mode', () => {
        const domainToDelete = testDomains[1];
        const expectedDomains = testDomains.filter(domain => domain !== domainToDelete);
        const onDomainsChange = cy.stub().as('domainsChangeHandler');

        mount(
            <InstitutionDomainEditor
                domains={testDomains}
                editMode={true}
                onDomainsChange={onDomainsChange}
            />
        );

        // Find the domain chip and click its delete button
        cy.contains(domainToDelete)
            .parent()
            .find('svg') // The delete icon
            .click();

        // Verify callback was called with updated domains (without the deleted one)
        cy.get('@domainsChangeHandler').should('have.been.calledWith', expectedDomains);
    });

    it('should not show delete buttons in view mode', () => {
        mount(<InstitutionDomainEditor domains={testDomains} editMode={false} />);

        // No delete icons should be visible on the chips
        cy.contains(testDomains[0])
            .parent()
            .find('svg')
            .should('not.exist');
    });
});
