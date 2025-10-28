/* eslint-disable cypress/unsafe-to-chain-command */
import React from 'react'
import { mount } from 'cypress/react'
import { InstitutionDomainEditor } from 'src/components/institution_table/components/InstitutionDomainEditor'
import { InstitutionInterface } from 'src/types/model'

describe('Institution Domain Editor Tests', () => {
  const testDomains = ['example.com', 'test.edu', 'domain.org']

  beforeEach(() => {
    cy.viewport(1000, 600)
  })

  it('should render domains in view mode', () => {
    mount(<InstitutionDomainEditor domains={testDomains} isEditing={false} institutionList={[]} />)

    testDomains.forEach((domain) => {
      cy.contains(domain).should('exist')
    })

    cy.get('input').should('not.exist')
  })

  it('should show message when no domains in view mode', () => {
    mount(<InstitutionDomainEditor domains={[]} isEditing={false} institutionList={[]} />)

    cy.contains('This institution is not associated with any domains').should('be.visible')
  })

  it('should render domains and input field in edit mode', () => {
    mount(<InstitutionDomainEditor domains={testDomains} isEditing={true} institutionList={[]} />)

    testDomains.forEach((domain) => {
      cy.contains(domain).should('exist')
    })

    cy.get('input').should('exist')
    cy.contains('button', 'Add').should('exist')
  })

  it('should allow adding a new domain in edit mode', () => {
    const newDomain = 'newdomain.com'
    const onDomainsChange = cy.stub().as('domainsChangeHandler')

    mount(
      <InstitutionDomainEditor
        domains={testDomains}
        isEditing={true}
        onDomainsChange={onDomainsChange}
        institutionList={[]}
      />,
    )

    cy.get('input').type(newDomain)
    cy.contains('button', 'Add').click()

    cy.get('@domainsChangeHandler').should('have.been.calledWith', [...testDomains, newDomain])
  })

  it('should not add empty domains', () => {
    const onDomainsChange = cy.stub().as('domainsChangeHandler')

    mount(
      <InstitutionDomainEditor
        domains={testDomains}
        isEditing={true}
        onDomainsChange={onDomainsChange}
        institutionList={[]}
      />,
    )

    cy.get('input').type('   {enter}')
    cy.get('@domainsChangeHandler').should('not.have.been.called')
  })

  it('should trim whitespace when adding domains', () => {
    const newDomain = 'trimmed.com'
    const onDomainsChange = cy.stub().as('domainsChangeHandler')

    mount(
      <InstitutionDomainEditor
        domains={testDomains}
        isEditing={true}
        onDomainsChange={onDomainsChange}
        institutionList={[]}
      />,
    )

    cy.get('input').type(`   ${newDomain}   `)
    cy.contains('button', 'Add').click()

    cy.get('@domainsChangeHandler').should('have.been.calledWith', [...testDomains, newDomain])
  })

  it('should convert domain names to lowercase when adding', () => {
    const uppercaseDomain = 'UPPERCASE.COM'
    const expectedLowercaseDomain = 'uppercase.com'
    const onDomainsChange = cy.stub().as('domainsChangeHandler')

    mount(
      <InstitutionDomainEditor
        domains={testDomains}
        isEditing={true}
        onDomainsChange={onDomainsChange}
        institutionList={[]}
      />,
    )

    cy.get('input').type(uppercaseDomain)
    cy.contains('button', 'Add').click()

    // Verify that the domain was added in lowercase
    cy.get('@domainsChangeHandler').should('have.been.calledWith', [...testDomains, expectedLowercaseDomain])
  })

  it('should not add duplicate domains', () => {
    const existingDomain = testDomains[0]
    const onDomainsChange = cy.stub().as('domainsChangeHandler')

    mount(
      <InstitutionDomainEditor
        domains={testDomains}
        isEditing={true}
        onDomainsChange={onDomainsChange}
        institutionList={[]}
      />,
    )

    cy.get('input').type(existingDomain)
    cy.contains('button', 'Add').click()

    cy.get('@domainsChangeHandler').should('not.have.been.called')
    cy.contains('This domain has already been added').should('be.visible')
  })

  it('should allow deleting a domain in edit mode', () => {
    const domainToDelete = testDomains[1]
    const expectedDomains = testDomains.filter(domain => domain !== domainToDelete)
    const onDomainsChange = cy.stub().as('domainsChangeHandler')

    mount(
      <InstitutionDomainEditor
        domains={testDomains}
        isEditing={true}
        onDomainsChange={onDomainsChange}
        institutionList={[]}
      />,
    )

    cy.contains(domainToDelete)
      .parent()
      .find('svg') // Look for the delete icon
      .click()

    cy.get('@domainsChangeHandler').should('have.been.calledWith', expectedDomains)
  })

  it('should not show delete buttons in view mode', () => {
    mount(<InstitutionDomainEditor domains={testDomains} isEditing={false} institutionList={[]} />)

    cy.contains(testDomains[0])
      .parent()
      .find('svg')
      .should('not.exist')
  })

  // Tests the case when we have the institution list on-hand and
  // can do a global domain uniqueness check client-side
  it('should perform global domain uniqueness check across institutions', () => {
    const institutionList = [
      { id: 1, name: 'Institution A', domains: ['a.com', 'b.com'] },
      { id: 2, name: 'Institution B', domains: ['c.com'] },
      { id: 3, name: 'Institution C' },
    ] as InstitutionInterface[]
    const onDomainsChange = cy.stub().as('domainsChangeHandler')

    mount(
      <InstitutionDomainEditor
        domains={['d.com']}
        isEditing={true}
        onDomainsChange={onDomainsChange}
        institutionList={institutionList}
      />,
    )

    cy.get('input').type('a.com')
    cy.contains('button', 'Add').click()
    cy.get('@domainsChangeHandler').should('not.have.been.called')
    cy.contains('This domain is associated with another institution: Institution A').should('be.visible')
  })

  describe('Domain Format Validation', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let onDomainsChange: Cypress.Agent<any>

    beforeEach(() => {
      onDomainsChange = cy.stub().as('domainsChangeHandler')
    })

    it('should reject invalid domain formats', () => {
      mount(
        <InstitutionDomainEditor
          domains={[]}
          isEditing={true}
          onDomainsChange={onDomainsChange}
          institutionList={[]}
        />,
      )

      const invalidDomains = [
        { domain: 'invalid', expectedError: 'Please enter a valid domain name (e.g., example.com)' },
        { domain: 'invalid.', expectedError: 'Please enter a valid domain name (e.g., example.com)' },
        { domain: '.invalid', expectedError: 'Please enter a valid domain name (e.g., example.com)' },
        { domain: 'invalid..com', expectedError: 'Please enter a valid domain name (e.g., example.com)' },
        { domain: 'invalid-.com', expectedError: 'Please enter a valid domain name (e.g., example.com)' },
        { domain: '-invalid.com', expectedError: 'Please enter a valid domain name (e.g., example.com)' },
        { domain: 'invalid.c', expectedError: 'Please enter a valid domain name (e.g., example.com)' },
        { domain: 'a'.repeat(64) + '.com', expectedError: 'Please enter a valid domain name (e.g., example.com)' },
        { domain: 'spaces in domain.com', expectedError: 'Please enter a valid domain name (e.g., example.com)' },
        { domain: 'under_score.com', expectedError: 'Please enter a valid domain name (e.g., example.com)' },
        { domain: 'special@char.com', expectedError: 'Please enter a valid domain name (e.g., example.com)' },
        { domain: 'http://domain.com', expectedError: 'Please enter a valid domain name (e.g., example.com)' },
        { domain: 'https://domain.com', expectedError: 'Please enter a valid domain name (e.g., example.com)' },
        { domain: 'ftp://domain.com', expectedError: 'Please enter a valid domain name (e.g., example.com)' },
      ]

      invalidDomains.forEach(({ domain, expectedError }) => {
        cy.get('input').clear().type(domain)
        cy.contains('button', 'Add').click()
        cy.get('@domainsChangeHandler').should('not.have.been.called')
        // Look for the specific error message for this domain
        cy.contains(expectedError).should('be.visible')
        cy.get('input').clear()
        // Clear the error by clearing the input - this should remove the error message
        cy.contains(expectedError).should('not.exist')
      })
    })

    it('should accept valid domain formats', () => {
      mount(
        <InstitutionDomainEditor
          domains={[]}
          isEditing={true}
          onDomainsChange={onDomainsChange}
          institutionList={[]}
        />,
      )

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
        '123domain.com',
      ]

      validDomains.forEach((validDomain, _index) => {
        cy.get('input').clear().type(validDomain)
        cy.contains('button', 'Add').click()
        // Should be called for each valid domain
        cy.get('@domainsChangeHandler').should('have.been.called')
        // Reset the stub for the next iteration
        cy.wrap(onDomainsChange).invoke('resetHistory')
        // No error message should be visible
        cy.contains('Please enter a valid domain name (e.g., example.com)').should('not.exist')
      })
    })

    it('should handle international domain names (IDN)', () => {
      mount(
        <InstitutionDomainEditor
          domains={[]}
          isEditing={true}
          onDomainsChange={onDomainsChange}
          institutionList={[]}
        />,
      )

      const internationalDomains = [
        'münchen.de',
        'test.测试',
        'università.it',
        'тест.рф',
      ]

      internationalDomains.forEach((domain) => {
        cy.get('input').clear().type(domain)
        cy.contains('button', 'Add').click()
        cy.get('@domainsChangeHandler').should('have.been.called')
      })
    })

    it('should validate domain on Enter key press', () => {
      mount(
        <InstitutionDomainEditor
          domains={[]}
          isEditing={true}
          onDomainsChange={onDomainsChange}
          institutionList={[]}
        />,
      )

      cy.get('input').type('example.com{enter}')
      cy.get('@domainsChangeHandler').should('have.been.calledWith', ['example.com'])
    })

    it('should not add domain on Enter if validation fails', () => {
      mount(
        <InstitutionDomainEditor
          domains={[]}
          isEditing={true}
          onDomainsChange={onDomainsChange}
          institutionList={[]}
        />,
      )

      cy.get('input').type('invalid{enter}')
      cy.get('@domainsChangeHandler').should('not.have.been.called')
      cy.contains('Please enter a valid domain name (e.g., example.com)').should('be.visible')
    })

    it('should clear error message when typing new domain after error', () => {
      mount(
        <InstitutionDomainEditor
          domains={[]}
          isEditing={true}
          onDomainsChange={onDomainsChange}
          institutionList={[]}
        />,
      )

      // First add invalid domain
      cy.get('input').type('invalid')
      cy.contains('button', 'Add').click()
      cy.contains('Please enter a valid domain name (e.g., example.com)').should('be.visible')

      // Start typing new domain should clear error
      cy.get('input').clear().type('v')
      cy.contains('Please enter a valid domain name (e.g., example.com)').should('not.exist')
    })

    it('should show specific error messages for different validation failures', () => {
      mount(
        <InstitutionDomainEditor
          domains={['existing.com']}
          isEditing={true}
          onDomainsChange={onDomainsChange}
          institutionList={[]}
        />,
      )

      // Test duplicate domain error
      cy.get('input').type('existing.com')
      cy.contains('button', 'Add').click()
      cy.contains('This domain has already been added').should('be.visible')

      // Test invalid format error
      cy.get('input').clear().type('invalid')
      cy.contains('button', 'Add').click()
      cy.contains('Please enter a valid domain name (e.g., example.com)').should('be.visible')

      // Test empty domain - button should be disabled for empty input
      cy.get('input').clear()
      cy.contains('button', 'Add').should('be.disabled')
    })
  })
})
