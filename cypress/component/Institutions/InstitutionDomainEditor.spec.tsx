import React from 'react';
import {mount} from 'cypress/react';
import {InstitutionDomainEditor} from 'src/components/institution_table/components/InstitutionDomainEditor';
import {Institution} from 'src/types/model';

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
        cy.contains('This domain is associated with another institution: Institution A').should('be.visible');
    });

    describe('Domain Format Validation', () => {
        const onDomainsChange = cy.stub().as('domainsChangeHandler');

        beforeEach(() => {
            cy.stub(onDomainsChange);
        });

        it('should reject invalid domain formats', () => {
            mount(
                <InstitutionDomainEditor
                    domains={[]}
                    isEditing={true}
                    onDomainsChange={onDomainsChange}
                    institutionList={[]}
                />
            );

            const invalidDomains = [
                'invalid',
                'invalid.',
                '.invalid',
                'invalid..com',
                'invalid-.com',
                '-invalid.com',
                'invalid.c',
                'toolongdomainnamethatshouldnotbeallowed.toolongdomainnamethatshouldnotbeallowed.toolongdomainnamethatshouldnotbeallowed.toolongdomainnamethatshouldnotbeallowed.toolongdomainnamethatshouldnotbeallowed.toolongdomainnamethatshouldnotbeallowed.toolongdomainnamethatshouldnotbeallowed.com',
                'spaces in domain.com',
                'under_score.com',
                'special@char.com',
                'http://domain.com',
                'https://domain.com',
                'ftp://domain.com'
            ];

            invalidDomains.forEach((invalidDomain) => {
                cy.get('input').clear().type(invalidDomain);
                cy.contains('button', 'Add').click();
                cy.get('@domainsChangeHandler').should('not.have.been.called');
                cy.get('.MuiFormHelperText-root').should('be.visible');
                cy.get('input').clear();
            });
        });

        it('should accept valid domain formats', () => {
            mount(
                <InstitutionDomainEditor
                    domains={[]}
                    isEditing={true}
                    onDomainsChange={onDomainsChange}
                    institutionList={[]}
                />
            );

            const validDomains = [
                'example.com',
                'subdomain.example.com',
                'test.edu',
                'university.ac.uk',
                'research.org',
                'institute.gov',
                'lab.net',
                'medical.int',
                'hospital.mil',
                'clinic.info',
                'center.biz',
                'science.name',
                'tech.museum',
                'bio.pro',
                'test-domain.com',
                'multi-word-domain.org',
                'numbers123.com',
                'domain123.test456.com',
                '123domain.com'
            ];

            let expectedDomains: string[] = [];
            validDomains.forEach((validDomain, index) => {
                expectedDomains.push(validDomain);
                cy.get('input').clear().type(validDomain);
                cy.contains('button', 'Add').click();
                cy.get('@domainsChangeHandler').should('have.been.calledWith', expectedDomains);
                cy.get('.MuiFormHelperText-root').should('not.exist');
            });
        });

        it('should handle international domain names (IDN)', () => {
            mount(
                <InstitutionDomainEditor
                    domains={[]}
                    isEditing={true}
                    onDomainsChange={onDomainsChange}
                    institutionList={[]}
                />
            );

            const internationalDomains = [
                'münchen.de',
                'test.测试',
                'università.it',
                'тест.рф'
            ];

            let expectedDomains: string[] = [];
            internationalDomains.forEach((domain) => {
                cy.get('input').clear().type(domain);
                cy.contains('button', 'Add').click();
                // Should convert to ASCII using punycode
                expectedDomains.push(domain); // The component should handle punycode conversion internally
                cy.get('@domainsChangeHandler').should('have.been.called');
            });
        });

        it('should validate domain on Enter key press', () => {
            mount(
                <InstitutionDomainEditor
                    domains={[]}
                    isEditing={true}
                    onDomainsChange={onDomainsChange}
                    institutionList={[]}
                />
            );

            cy.get('input').type('example.com{enter}');
            cy.get('@domainsChangeHandler').should('have.been.calledWith', ['example.com']);
        });

        it('should not add domain on Enter if validation fails', () => {
            mount(
                <InstitutionDomainEditor
                    domains={[]}
                    isEditing={true}
                    onDomainsChange={onDomainsChange}
                    institutionList={[]}
                />
            );

            cy.get('input').type('invalid{enter}');
            cy.get('@domainsChangeHandler').should('not.have.been.called');
            cy.get('.MuiFormHelperText-root').should('be.visible');
        });

        it('should clear error message when typing new domain after error', () => {
            mount(
                <InstitutionDomainEditor
                    domains={[]}
                    isEditing={true}
                    onDomainsChange={onDomainsChange}
                    institutionList={[]}
                />
            );

            // First add invalid domain
            cy.get('input').type('invalid');
            cy.contains('button', 'Add').click();
            cy.get('.MuiFormHelperText-root').should('be.visible');

            // Start typing new domain should clear error
            cy.get('input').clear().type('v');
            cy.get('.MuiFormHelperText-root').should('not.exist');
        });

        it('should show specific error messages for different validation failures', () => {
            mount(
                <InstitutionDomainEditor
                    domains={['existing.com']}
                    isEditing={true}
                    onDomainsChange={onDomainsChange}
                    institutionList={[]}
                />
            );

            // Test duplicate domain error
            cy.get('input').type('existing.com');
            cy.contains('button', 'Add').click();
            cy.contains('This domain has already been added').should('be.visible');

            // Test invalid format error
            cy.get('input').clear().type('invalid');
            cy.contains('button', 'Add').click();
            cy.contains('Please enter a valid domain name').should('be.visible');

            // Test empty domain error
            cy.get('input').clear().type('   ');
            cy.contains('button', 'Add').click();
            cy.contains('Domain cannot be empty').should('be.visible');
        });
    });
});
