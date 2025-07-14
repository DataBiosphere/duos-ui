import React from 'react';
import {mount} from 'cypress/react';
import {InstitutionDomainEditor} from 'src/components/institution_table/components/InstitutionDomainEditor';
import {Institution} from "src/types/model";

describe('Institution Domain Editor Tests', () => {
    const testDomains = ['example.com', 'test.edu', 'domain.org'];

    beforeEach(() => {
        cy.viewport(1000, 600);
    });

    it('should render domains in view mode', () => {
        mount(<InstitutionDomainEditor domains={testDomains} isEditing={false} institutionList={[]}/>);

        testDomains.forEach((domain) => {
            cy.contains(domain).should('exist');
        });

        cy.get('input').should('not.exist');
    });

    it('should show message when no domains in view mode', () => {
        mount(<InstitutionDomainEditor domains={[]} isEditing={false} institutionList={[]}/>);

        cy.contains('This institution is not associated with any domains').should('be.visible');
    });

    it('should render domains and input field in edit mode', () => {
        mount(<InstitutionDomainEditor domains={testDomains} isEditing={true} institutionList={[]}/>);

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
                isEditing={true}
                onDomainsChange={onDomainsChange}
                institutionList={[]}
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
                isEditing={true}
                onDomainsChange={onDomainsChange}
                institutionList={[]}
            />
        );

        cy.get('input').type('   {enter}');
        cy.get('@domainsChangeHandler').should('not.have.been.called');
    });

    it('should trim whitespace when adding domains', () => {
        const newDomain = 'trimmed.com';
        const onDomainsChange = cy.stub().as('domainsChangeHandler');

        mount(
            <InstitutionDomainEditor
                domains={testDomains}
                isEditing={true}
                onDomainsChange={onDomainsChange}
                institutionList={[]}
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
                isEditing={true}
                onDomainsChange={onDomainsChange}
                institutionList={[]}
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
                isEditing={true}
                onDomainsChange={onDomainsChange}
                institutionList={[]}
            />
        );

        cy.contains(domainToDelete)
            .parent()
            .find('svg') // Look for the delete icon
            .click();

        cy.get('@domainsChangeHandler').should('have.been.calledWith', expectedDomains);
    });

    it('should not show delete buttons in view mode', () => {
        mount(<InstitutionDomainEditor domains={testDomains} isEditing={false} institutionList={[]}/>);

        cy.contains(testDomains[0])
            .parent()
            .find('svg')
            .should('not.exist');
    });

    // Tests the case when we have the institution list on-hand and
    // can do a global domain uniqueness check client-side
    it('should perform global domain uniqueness check across institutions', () => {
        const institutionList = [
            { id: 1, name: 'Institution A', domains: ['a.com', 'b.com'] },
            { id: 2, name: 'Institution B', domains: ['c.com'] },
            { id: 3, name: 'Institution C' },
        ] as Institution[];
        const onDomainsChange = cy.stub().as('domainsChangeHandler');

        mount(
            <InstitutionDomainEditor
                domains={['d.com']}
                isEditing={true}
                onDomainsChange={onDomainsChange}
                institutionList={institutionList}
            />
        );

        cy.get('input').type('a.com');
        cy.contains('button', 'Add').click();
        cy.get('@domainsChangeHandler').should('not.have.been.called');
        cy.contains('This domain is associated with another institution').should('be.visible');
    });
});
