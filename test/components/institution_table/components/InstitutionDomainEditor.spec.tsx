import React from 'react'
import '@testing-library/jest-dom/vitest'
import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { InstitutionDomainEditor } from 'src/components/institution_table/components/InstitutionDomainEditor'
import { InstitutionInterface } from 'src/types/model'

describe('Institution Domain Editor Tests', () => {
  const testDomains = ['example.com', 'test.edu', 'domain.org']

  it('should render domains in view mode', () => {
    const { container } = render(
      <InstitutionDomainEditor domains={testDomains} isEditing={false} institutionList={[]} />,
    )

    for (const domain of testDomains) {
      expect(screen.getByText(domain)).toBeInTheDocument()
    }

    expect(container.querySelector('input')).not.toBeInTheDocument()
  })

  it('should show message when no domains in view mode', () => {
    render(
      <InstitutionDomainEditor domains={[]} isEditing={false} institutionList={[]} />,
    )

    expect(screen.getByText('This institution is not associated with any domains')).toBeInTheDocument()
  })

  it('should render domains and input field in edit mode', () => {
    render(
      <InstitutionDomainEditor domains={testDomains} isEditing={true} institutionList={[]} />,
    )

    for (const domain of testDomains) {
      expect(screen.getByText(domain)).toBeInTheDocument()
    }

    expect(screen.getByRole('textbox')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Add/i })).toBeInTheDocument()
  })

  it('should allow adding a new domain in edit mode', () => {
    const newDomain = 'newdomain.com'
    const onDomainsChange = vi.fn()

    render(
      <InstitutionDomainEditor
        domains={testDomains}
        isEditing={true}
        onDomainsChange={onDomainsChange}
        institutionList={[]}
      />,
    )

    fireEvent.change(screen.getByRole('textbox'), { target: { value: newDomain } })
    fireEvent.click(screen.getByRole('button', { name: /Add/i }))

    expect(onDomainsChange).toHaveBeenCalledWith([...testDomains, newDomain])
  })

  it('should not add empty domains', () => {
    const onDomainsChange = vi.fn()

    render(
      <InstitutionDomainEditor
        domains={testDomains}
        isEditing={true}
        onDomainsChange={onDomainsChange}
        institutionList={[]}
      />,
    )

    // Type only spaces and press Enter — the Add button is disabled when input is blank
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '   ' } })
    fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Enter' })

    expect(onDomainsChange).not.toHaveBeenCalled()
  })

  it('should trim whitespace when adding domains', () => {
    const newDomain = 'trimmed.com'
    const onDomainsChange = vi.fn()

    render(
      <InstitutionDomainEditor
        domains={testDomains}
        isEditing={true}
        onDomainsChange={onDomainsChange}
        institutionList={[]}
      />,
    )

    fireEvent.change(screen.getByRole('textbox'), { target: { value: `   ${newDomain}   ` } })
    fireEvent.click(screen.getByRole('button', { name: /Add/i }))

    expect(onDomainsChange).toHaveBeenCalledWith([...testDomains, newDomain])
  })

  it('should convert domain names to lowercase when adding', () => {
    const uppercaseDomain = 'UPPERCASE.COM'
    const expectedLowercaseDomain = 'uppercase.com'
    const onDomainsChange = vi.fn()

    render(
      <InstitutionDomainEditor
        domains={testDomains}
        isEditing={true}
        onDomainsChange={onDomainsChange}
        institutionList={[]}
      />,
    )

    fireEvent.change(screen.getByRole('textbox'), { target: { value: uppercaseDomain } })
    fireEvent.click(screen.getByRole('button', { name: /Add/i }))

    expect(onDomainsChange).toHaveBeenCalledWith([...testDomains, expectedLowercaseDomain])
  })

  it('should not add duplicate domains', () => {
    const existingDomain = testDomains[0]
    const onDomainsChange = vi.fn()

    render(
      <InstitutionDomainEditor
        domains={testDomains}
        isEditing={true}
        onDomainsChange={onDomainsChange}
        institutionList={[]}
      />,
    )

    fireEvent.change(screen.getByRole('textbox'), { target: { value: existingDomain } })
    fireEvent.click(screen.getByRole('button', { name: /Add/i }))

    expect(onDomainsChange).not.toHaveBeenCalled()
    expect(screen.getByText('This domain has already been added')).toBeInTheDocument()
  })

  it('should allow deleting a domain in edit mode', () => {
    const domainToDelete = testDomains[1]
    const expectedDomains = testDomains.filter(d => d !== domainToDelete)
    const onDomainsChange = vi.fn()

    render(
      <InstitutionDomainEditor
        domains={testDomains}
        isEditing={true}
        onDomainsChange={onDomainsChange}
        institutionList={[]}
      />,
    )

    const chipLabel = screen.getByText(domainToDelete)
    const chipRoot = chipLabel.closest('.MuiChip-root')
    const deleteIcon = chipRoot?.querySelector('[data-testid="CancelIcon"]')
    expect(deleteIcon).toBeInTheDocument()
    fireEvent.click(deleteIcon!)

    expect(onDomainsChange).toHaveBeenCalledWith(expectedDomains)
  })

  it('should not show delete buttons in view mode', () => {
    const { container } = render(
      <InstitutionDomainEditor domains={testDomains} isEditing={false} institutionList={[]} />,
    )

    expect(container.querySelector('[data-testid="CancelIcon"]')).not.toBeInTheDocument()
  })

  it('should perform global domain uniqueness check across institutions', () => {
    const institutionList: InstitutionInterface[] = [
      { id: 1, name: 'Institution A', domains: ['a.com', 'b.com'] } as unknown as InstitutionInterface,
      { id: 2, name: 'Institution B', domains: ['c.com'] } as unknown as InstitutionInterface,
      { id: 3, name: 'Institution C' } as unknown as InstitutionInterface,
    ]
    const onDomainsChange = vi.fn()

    render(
      <InstitutionDomainEditor
        domains={['d.com']}
        isEditing={true}
        onDomainsChange={onDomainsChange}
        institutionList={institutionList}
      />,
    )

    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'a.com' } })
    fireEvent.click(screen.getByRole('button', { name: /Add/i }))

    expect(onDomainsChange).not.toHaveBeenCalled()
    expect(
      screen.getByText('This domain is associated with another institution: Institution A'),
    ).toBeInTheDocument()
  })

  describe('Domain Format Validation', () => {
    let onDomainsChange: Mock

    beforeEach(() => {
      onDomainsChange = vi.fn()
    })

    it('should reject invalid domain formats', () => {
      render(
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

      const input = screen.getByRole('textbox')
      const addButton = screen.getByRole('button', { name: /Add/i })

      for (const { domain, expectedError } of invalidDomains) {
        fireEvent.change(input, { target: { value: domain } })
        fireEvent.click(addButton)

        expect(onDomainsChange).not.toHaveBeenCalled()
        expect(screen.getByText(expectedError)).toBeInTheDocument()

        // Clearing the input clears the error (the onChange handler calls setErrorMessage(''))
        fireEvent.change(input, { target: { value: '' } })
        expect(screen.queryByText(expectedError)).not.toBeInTheDocument()
      }
    })

    it('should accept valid domain formats', () => {
      render(
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

      const input = screen.getByRole('textbox')
      const addButton = screen.getByRole('button', { name: /Add/i })

      for (const validDomain of validDomains) {
        fireEvent.change(input, { target: { value: validDomain } })
        fireEvent.click(addButton)

        expect(onDomainsChange).toHaveBeenCalled()
        onDomainsChange.mockClear()

        expect(screen.queryByText('Please enter a valid domain name (e.g., example.com)')).not.toBeInTheDocument()
      }
    })

    it('should handle international domain names (IDN)', () => {
      render(
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

      const input = screen.getByRole('textbox')
      const addButton = screen.getByRole('button', { name: /Add/i })

      for (const domain of internationalDomains) {
        fireEvent.change(input, { target: { value: domain } })
        fireEvent.click(addButton)
        expect(onDomainsChange).toHaveBeenCalled()
      }
    })

    it('should validate domain on Enter key press', () => {
      render(
        <InstitutionDomainEditor
          domains={[]}
          isEditing={true}
          onDomainsChange={onDomainsChange}
          institutionList={[]}
        />,
      )

      const input = screen.getByRole('textbox')
      fireEvent.change(input, { target: { value: 'example.com' } })
      fireEvent.keyDown(input, { key: 'Enter' })

      expect(onDomainsChange).toHaveBeenCalledWith(['example.com'])
    })

    it('should not add domain on Enter if validation fails', () => {
      render(
        <InstitutionDomainEditor
          domains={[]}
          isEditing={true}
          onDomainsChange={onDomainsChange}
          institutionList={[]}
        />,
      )

      const input = screen.getByRole('textbox')
      fireEvent.change(input, { target: { value: 'invalid' } })
      fireEvent.keyDown(input, { key: 'Enter' })

      expect(onDomainsChange).not.toHaveBeenCalled()
      expect(
        screen.getByText('Please enter a valid domain name (e.g., example.com)'),
      ).toBeInTheDocument()
    })

    it('should clear error message when typing new domain after error', () => {
      render(
        <InstitutionDomainEditor
          domains={[]}
          isEditing={true}
          onDomainsChange={onDomainsChange}
          institutionList={[]}
        />,
      )

      const input = screen.getByRole('textbox')

      // Trigger an error
      fireEvent.change(input, { target: { value: 'invalid' } })
      fireEvent.click(screen.getByRole('button', { name: /Add/i }))
      expect(
        screen.getByText('Please enter a valid domain name (e.g., example.com)'),
      ).toBeInTheDocument()

      // Typing a new character clears the error
      fireEvent.change(input, { target: { value: 'v' } })
      expect(
        screen.queryByText('Please enter a valid domain name (e.g., example.com)'),
      ).not.toBeInTheDocument()
    })

    it('should show specific error messages for different validation failures', () => {
      render(
        <InstitutionDomainEditor
          domains={['existing.com']}
          isEditing={true}
          onDomainsChange={onDomainsChange}
          institutionList={[]}
        />,
      )

      const input = screen.getByRole('textbox')
      const addButton = screen.getByRole('button', { name: /Add/i })

      // Duplicate domain error
      fireEvent.change(input, { target: { value: 'existing.com' } })
      fireEvent.click(addButton)
      expect(screen.getByText('This domain has already been added')).toBeInTheDocument()

      // Invalid format error (clearing the input first clears the previous error)
      fireEvent.change(input, { target: { value: '' } })
      fireEvent.change(input, { target: { value: 'invalid' } })
      fireEvent.click(addButton)
      expect(
        screen.getByText('Please enter a valid domain name (e.g., example.com)'),
      ).toBeInTheDocument()

      // Empty input — Add button should be disabled
      fireEvent.change(input, { target: { value: '' } })
      expect(screen.getByRole('button', { name: /Add/i })).toBeDisabled()
    })
  })
})
