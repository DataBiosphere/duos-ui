import React from 'react'
import '@testing-library/jest-dom/vitest'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { act, render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter, Routes, Route, BrowserRouter } from 'react-router'
import { InstitutionDetails } from 'src/components/institution_table/InstitutionDetails'
import { Institution as InstitutionAPI } from 'src/libs/ajax/Institution'
import { Notifications } from 'src/libs/utils'
import { FORM_MODES } from 'src/components/institution_table/InstitutionFormMode'
import type { DuosUser, InstitutionInterface } from 'src/types/model'

vi.mock('src/libs/ajax/Institution', () => ({
  Institution: {
    list: vi.fn(),
    postInstitution: vi.fn(),
    patchInstitution: vi.fn(),
  },
}))

vi.mock('src/libs/utils', () => ({
  Notifications: {
    showError: vi.fn(),
    showSuccess: vi.fn(),
    showInformation: vi.fn(),
  },
}))

describe('Institution Details Tests', () => {
  const mockInstitution: InstitutionInterface = {
    id: 123,
    name: 'Broad Institute',
    domains: ['broadinstitute.org', 'broad.mit.edu'],
    signingOfficials: [
      {
        userId: 1,
        displayName: 'John Testerson',
        email: 'john@broad.mit.edu',
      },
    ],
    createDate: '2023-01-01',
    updateDate: '2023-02-01',
    createUserId: 1,
    createUser: { displayName: 'Admin User' } as DuosUser,
    updateUser: { displayName: 'Admin User' } as DuosUser,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  const renderInEditMode = async (id: number) => {
    await act(async () => {
      render(
        <MemoryRouter initialEntries={[`/admin_manage_institutions/institutions/${id}`]}>
          <Routes>
            <Route path="admin_manage_institutions/institutions/:institutionId" element={<InstitutionDetails formMode={FORM_MODES.editExisting} />} />
          </Routes>
        </MemoryRouter>,
      )
    })
  }

  it('should show a loading spinner', async () => {
    vi.mocked(InstitutionAPI.list).mockReturnValue(new Promise(() => {}))
    await act(async () => {
      render(<BrowserRouter><InstitutionDetails formMode={FORM_MODES.editExisting} /></BrowserRouter>)
    })
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('should render institution details', async () => {
    vi.mocked(InstitutionAPI.list).mockResolvedValue([mockInstitution])
    await renderInEditMode(123)

    expect(screen.getByText('Back to institutions')).toBeInTheDocument()
    expect(screen.getByText('Institution Name')).toBeInTheDocument()
    expect(document.querySelector('input[value="Broad Institute"]')).not.toBeNull()
    expect(screen.getByText('Domains')).toBeInTheDocument()
    expect(screen.getByText('Signing Officials')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Edit/i })).toBeInTheDocument()
  })

  it('should enter edit mode when Edit button is clicked', async () => {
    vi.mocked(InstitutionAPI.list).mockResolvedValue([mockInstitution])
    await renderInEditMode(123)

    fireEvent.click(screen.getByRole('button', { name: /Edit/i }))

    const input = document.querySelector('input[value="Broad Institute"]') as HTMLInputElement
    expect(input).not.toBeNull()
    expect(input.disabled).toBe(false)
    expect(screen.getByRole('button', { name: /Add/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Save/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Cancel/i })).toBeInTheDocument()
  })

  it('should cancel editing and revert changes', async () => {
    vi.mocked(InstitutionAPI.list).mockResolvedValue([mockInstitution])
    await renderInEditMode(123)

    fireEvent.click(screen.getByRole('button', { name: /Edit/i }))

    const input = document.querySelector('input[value="Broad Institute"]') as HTMLInputElement
    fireEvent.change(input, { target: { value: 'Broad Institute of MIT & Harvard' } })

    fireEvent.click(screen.getByRole('button', { name: /Cancel/i }))

    expect(document.querySelector('input[value="Broad Institute"]')).not.toBeNull()
    expect(document.querySelector('input[value="Broad Institute of MIT & Harvard"]')).toBeNull()
    expect(screen.getByRole('button', { name: /Edit/i })).toBeInTheDocument()
  })

  it('should save changes when Save button is clicked', async () => {
    vi.mocked(InstitutionAPI.list).mockResolvedValue([mockInstitution])
    vi.mocked(InstitutionAPI.patchInstitution).mockResolvedValue(mockInstitution)
    await renderInEditMode(123)

    fireEvent.click(screen.getByRole('button', { name: /Edit/i }))

    const input = document.querySelector('input[value="Broad Institute"]') as HTMLInputElement
    fireEvent.change(input, { target: { value: 'Broad Institute of MIT & Harvard' } })

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Save/i }))
    })

    expect(InstitutionAPI.patchInstitution).toHaveBeenCalledWith(123, {
      name: 'Broad Institute of MIT & Harvard',
      domains: mockInstitution.domains,
    })

    expect(screen.getByRole('button', { name: /Edit/i })).toBeInTheDocument()
  })

  it('should display error notification when saving fails with 409 conflict', async () => {
    const conflictError = new Error('This domain is already associated with another institution.')
    // @ts-expect-error simulate a 409 conflict error from the API
    conflictError.code = 409

    vi.mocked(InstitutionAPI.list).mockResolvedValue([mockInstitution])
    vi.mocked(InstitutionAPI.patchInstitution).mockRejectedValue(conflictError)
    await renderInEditMode(123)

    fireEvent.click(screen.getByRole('button', { name: /Edit/i }))

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Save/i }))
    })

    expect(Notifications.showError).toHaveBeenCalledWith({
      text: 'One or more of the domains specified is already used by another institution. A domain can only be associated with one institution.',
    })
  })

  it('should allow creating a new institution', async () => {
    const newInstitution = {
      name: 'The Broad Institute',
      domains: ['broadinstitute.org', 'broad.mit.edu'],
    }

    vi.mocked(InstitutionAPI.list).mockResolvedValue([])
    vi.mocked(InstitutionAPI.postInstitution).mockImplementation((institution) => {
      expect(institution.name).toBe('The Broad Institute')
      expect(institution.domains).toEqual(['broadinstitute.org', 'broad.mit.edu'])
      return Promise.resolve({ ...newInstitution, id: 999 } as InstitutionInterface)
    })

    await act(async () => {
      render(<BrowserRouter><InstitutionDetails formMode={FORM_MODES.createNew} /></BrowserRouter>)
    })

    expect(screen.getByText('Institution Name')).toBeInTheDocument()

    // Add institution name
    const nameInput = screen.getByPlaceholderText('Institution Name')
    fireEvent.change(nameInput, { target: { value: 'The Broad Institute' } })

    // Add domains
    expect(screen.getByText('Domains')).toBeInTheDocument()
    const domainInput = screen.getByPlaceholderText('e.g., example.com')
    fireEvent.change(domainInput, { target: { value: 'broadinstitute.org' } })
    fireEvent.click(screen.getByRole('button', { name: /Add/i }))

    await act(async () => {
      const domainInput2 = screen.getByPlaceholderText('e.g., example.com')
      fireEvent.change(domainInput2, { target: { value: 'broad.mit.edu' } })
      fireEvent.click(screen.getByRole('button', { name: /Add/i }))
    })

    expect(screen.getByText('broadinstitute.org')).toBeInTheDocument()
    expect(screen.getByText('broad.mit.edu')).toBeInTheDocument()

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Create/i }))
    })

    expect(Notifications.showSuccess).toHaveBeenCalledWith({ text: 'Institution created successfully' })
  })

  it('should disable the create/save button if the institution name is empty', async () => {
    vi.mocked(InstitutionAPI.list).mockResolvedValue([])
    await act(async () => {
      render(<BrowserRouter><InstitutionDetails formMode={FORM_MODES.createNew} /></BrowserRouter>)
    })

    // Create button should be disabled to start
    expect(screen.getByRole('button', { name: /Create/i })).toBeDisabled()

    const nameInput = screen.getByPlaceholderText('Institution Name')
    fireEvent.change(nameInput, { target: { value: 'The Broad Institute' } })
    expect(screen.getByRole('button', { name: /Create/i })).not.toBeDisabled()
  })

  describe('Institution Name Validation', () => {
    const existingInstitutions = [
      { id: 1, name: 'Broad Institute', domains: ['broadinstitute.org'] },
      { id: 2, name: 'MIT', domains: ['mit.edu'] },
      { id: 3, name: 'Harvard University', domains: ['harvard.edu'] },
    ] as InstitutionInterface[]

    it('should show error when institution name is empty', async () => {
      vi.mocked(InstitutionAPI.list).mockResolvedValue(existingInstitutions)
      await act(async () => {
        render(<BrowserRouter><InstitutionDetails formMode={FORM_MODES.createNew} /></BrowserRouter>)
      })

      const nameInput = screen.getByPlaceholderText('Institution Name')
      fireEvent.change(nameInput, { target: { value: 'Test' } })
      fireEvent.change(nameInput, { target: { value: '' } })

      expect(screen.getByText('Institution name is required')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Create/i })).toBeDisabled()
    })

    it('should show error when institution name already exists (case insensitive)', async () => {
      vi.mocked(InstitutionAPI.list).mockResolvedValue(existingInstitutions)
      await act(async () => {
        render(<BrowserRouter><InstitutionDetails formMode={FORM_MODES.createNew} /></BrowserRouter>)
      })

      const nameInput = screen.getByPlaceholderText('Institution Name')
      fireEvent.change(nameInput, { target: { value: 'broad institute' } })

      expect(screen.getByText('An institution with this name already exists')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Create/i })).toBeDisabled()
    })

    it('should show error when institution name already exists (exact match)', async () => {
      vi.mocked(InstitutionAPI.list).mockResolvedValue(existingInstitutions)
      await act(async () => {
        render(<BrowserRouter><InstitutionDetails formMode={FORM_MODES.createNew} /></BrowserRouter>)
      })

      const nameInput = screen.getByPlaceholderText('Institution Name')
      fireEvent.change(nameInput, { target: { value: 'MIT' } })

      expect(screen.getByText('An institution with this name already exists')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Create/i })).toBeDisabled()
    })

    it('should allow unique institution names', async () => {
      vi.mocked(InstitutionAPI.list).mockResolvedValue(existingInstitutions)
      await act(async () => {
        render(<BrowserRouter><InstitutionDetails formMode={FORM_MODES.createNew} /></BrowserRouter>)
      })

      const nameInput = screen.getByPlaceholderText('Institution Name')
      fireEvent.change(nameInput, { target: { value: 'Stanford University' } })

      expect(screen.queryByText('An institution with this name already exists')).toBeNull()
      expect(screen.getByRole('button', { name: /Create/i })).not.toBeDisabled()
    })

    it('should allow editing current institution name (same name)', async () => {
      vi.mocked(InstitutionAPI.list).mockResolvedValue(existingInstitutions)
      await renderInEditMode(1)

      fireEvent.click(screen.getByRole('button', { name: /Edit/i }))

      // Should not show error when keeping the same name
      const input = document.querySelector('input[value="Broad Institute"]') as HTMLInputElement
      expect(input).not.toBeNull()
      expect(input.classList.contains('Mui-error')).toBe(false)
      expect(screen.getByRole('button', { name: /Save/i })).not.toBeDisabled()
    })

    it('should prevent editing to another existing institution name', async () => {
      vi.mocked(InstitutionAPI.list).mockResolvedValue(existingInstitutions)
      await renderInEditMode(1)

      fireEvent.click(screen.getByRole('button', { name: /Edit/i }))

      const input = document.querySelector('input[value="Broad Institute"]') as HTMLInputElement
      fireEvent.change(input, { target: { value: 'MIT' } })

      expect(screen.getByText('An institution with this name already exists')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Save/i })).toBeDisabled()
    })

    it('should clear validation errors when canceling edit', async () => {
      vi.mocked(InstitutionAPI.list).mockResolvedValue(existingInstitutions)
      await renderInEditMode(1)

      fireEvent.click(screen.getByRole('button', { name: /Edit/i }))

      const input = document.querySelector('input[value="Broad Institute"]') as HTMLInputElement
      fireEvent.change(input, { target: { value: 'MIT' } })

      expect(screen.getByText('An institution with this name already exists')).toBeInTheDocument()

      fireEvent.click(screen.getByRole('button', { name: /Cancel/i }))

      expect(document.querySelector('.MuiFormHelperText-root')).toBeNull()
    })

    it('should validate name on every character input', async () => {
      vi.mocked(InstitutionAPI.list).mockResolvedValue(existingInstitutions)
      await act(async () => {
        render(<BrowserRouter><InstitutionDetails formMode={FORM_MODES.createNew} /></BrowserRouter>)
      })

      const nameInput = screen.getByPlaceholderText('Institution Name')

      // Start typing "MIT"
      fireEvent.change(nameInput, { target: { value: 'M' } })
      expect(screen.queryByText('An institution with this name already exists')).toBeNull()

      fireEvent.change(nameInput, { target: { value: 'MI' } })
      expect(screen.queryByText('An institution with this name already exists')).toBeNull()

      fireEvent.change(nameInput, { target: { value: 'MIT' } })
      expect(screen.getByText('An institution with this name already exists')).toBeInTheDocument()
    })

    it('should reject institution names with straight double quotes', async () => {
      vi.mocked(InstitutionAPI.list).mockResolvedValue(existingInstitutions)
      await act(async () => {
        render(<BrowserRouter><InstitutionDetails formMode={FORM_MODES.createNew} /></BrowserRouter>)
      })

      const nameInput = screen.getByPlaceholderText('Institution Name')
      fireEvent.change(nameInput, { target: { value: 'University "Research" Center' } })

      expect(screen.getByText('Institution name cannot contain double quotation marks (")')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Create/i })).toBeDisabled()
    })

    it('should reject institution names with double quotes', async () => {
      vi.mocked(InstitutionAPI.list).mockResolvedValue(existingInstitutions)
      await act(async () => {
        render(<BrowserRouter><InstitutionDetails formMode={FORM_MODES.createNew} /></BrowserRouter>)
      })

      const nameInput = screen.getByPlaceholderText('Institution Name')
      fireEvent.change(nameInput, { target: { value: 'University “Research” Center' } })

      expect(screen.getByText('Institution name cannot contain double quotation marks (")')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Create/i })).toBeDisabled()
    })

    it('should allow single quotes in institution names', async () => {
      vi.mocked(InstitutionAPI.list).mockResolvedValue(existingInstitutions)
      await act(async () => {
        render(<BrowserRouter><InstitutionDetails formMode={FORM_MODES.createNew} /></BrowserRouter>)
      })

      const nameInput = screen.getByPlaceholderText('Institution Name')
      fireEvent.change(nameInput, { target: { value: 'St. Mary\'s College' } })

      expect(screen.queryByText('Institution name cannot contain double quotation marks (")')).toBeNull()
      expect(screen.getByRole('button', { name: /Create/i })).not.toBeDisabled()
    })

    describe('Name Normalization', () => {
      it('should trim whitespace from institution names on blur', async () => {
        vi.mocked(InstitutionAPI.list).mockResolvedValue(existingInstitutions)
        await act(async () => {
          render(<BrowserRouter><InstitutionDetails formMode={FORM_MODES.createNew} /></BrowserRouter>)
        })

        const nameInput = screen.getByPlaceholderText('Institution Name') as HTMLInputElement

        // Type name with leading/trailing spaces
        fireEvent.change(nameInput, { target: { value: '   New University   ' } })

        // Should allow typing with spaces while editing
        expect(nameInput.value).toBe('   New University   ')

        // Blur the field to trigger normalization
        fireEvent.blur(nameInput)

        // Verify the trimmed value is set after blur
        expect(nameInput.value).toBe('New University')

        // Should not show validation error for unique name
        expect(screen.queryByText('An institution with this name already exists')).toBeNull()
        expect(screen.getByRole('button', { name: /Create/i })).not.toBeDisabled()
      })

      it('should replace curly single quotes with straight quotes on blur', async () => {
        vi.mocked(InstitutionAPI.list).mockResolvedValue(existingInstitutions)
        await act(async () => {
          render(<BrowserRouter><InstitutionDetails formMode={FORM_MODES.createNew} /></BrowserRouter>)
        })

        const nameInput = screen.getByPlaceholderText('Institution Name') as HTMLInputElement

        // Type name with curly single quotes
        fireEvent.change(nameInput, { target: { value: 'St. Mary’s College' } })

        // Should allow typing with curly quotes while editing
        expect(nameInput.value).toBe('St. Mary’s College')

        // Blur to trigger normalization
        fireEvent.blur(nameInput)

        // Verify curly quotes are replaced with straight quotes after blur
        expect(nameInput.value).toBe('St. Mary\'s College')

        expect(screen.getByRole('button', { name: /Create/i })).not.toBeDisabled()
      })

      it('should handle combined normalization (trim + single quote replacement) on blur', async () => {
        vi.mocked(InstitutionAPI.list).mockResolvedValue(existingInstitutions)
        await act(async () => {
          render(<BrowserRouter><InstitutionDetails formMode={FORM_MODES.createNew} /></BrowserRouter>)
        })

        const nameInput = screen.getByPlaceholderText('Institution Name') as HTMLInputElement

        // Type name with whitespace and curly single quotes (no double quotes since they're not allowed)
        fireEvent.change(nameInput, { target: { value: '   St. Mary’s College   ' } })

        // Should allow typing with both issues while editing
        expect(nameInput.value).toBe('   St. Mary’s College   ')

        // Blur to trigger normalization
        fireEvent.blur(nameInput)

        // Verify both normalization steps are applied after blur
        expect(nameInput.value).toBe('St. Mary\'s College')

        expect(screen.getByRole('button', { name: /Create/i })).not.toBeDisabled()
      })

      it('should detect duplicates after normalization on blur', async () => {
        const institutionsWithSpaces = [
          { id: 1, name: 'Research University', domains: ['ru.edu'] },
          { id: 2, name: 'MIT', domains: ['mit.edu'] },
        ] as InstitutionInterface[]

        vi.mocked(InstitutionAPI.list).mockResolvedValue(institutionsWithSpaces)
        await act(async () => {
          render(<BrowserRouter><InstitutionDetails formMode={FORM_MODES.createNew} /></BrowserRouter>)
        })

        const nameInput = screen.getByPlaceholderText('Institution Name') as HTMLInputElement

        // Type a name with extra spaces that will become a duplicate after trimming
        fireEvent.change(nameInput, { target: { value: '   Research University   ' } })

        // The input should still show the untrimmed version while typing
        expect(nameInput.value).toBe('   Research University   ')

        // Blur to trigger normalization
        fireEvent.blur(nameInput)

        // After normalization (trimming), should detect as duplicate and show trimmed value
        expect(nameInput.value).toBe('Research University')
        expect(screen.getByText('An institution with this name already exists')).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /Create/i })).toBeDisabled()
      })

      it('should normalize empty/whitespace-only names correctly on blur', async () => {
        vi.mocked(InstitutionAPI.list).mockResolvedValue(existingInstitutions)
        await act(async () => {
          render(<BrowserRouter><InstitutionDetails formMode={FORM_MODES.createNew} /></BrowserRouter>)
        })

        const nameInput = screen.getByPlaceholderText('Institution Name') as HTMLInputElement

        // Type only whitespace
        fireEvent.change(nameInput, { target: { value: '   ' } })

        // Blur to trigger normalization
        fireEvent.blur(nameInput)

        // Should show required error after normalization
        expect(screen.getByText('Institution name is required')).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /Create/i })).toBeDisabled()
      })

      it('should validate during typing with normalized name but not change input', async () => {
        const institutionsWithSimilarNames = [
          { id: 1, name: 'University Research Center', domains: ['urc.edu'] },
          { id: 2, name: 'MIT', domains: ['mit.edu'] },
        ] as InstitutionInterface[]

        vi.mocked(InstitutionAPI.list).mockResolvedValue(institutionsWithSimilarNames)
        await act(async () => {
          render(<BrowserRouter><InstitutionDetails formMode={FORM_MODES.createNew} /></BrowserRouter>)
        })

        const nameInput = screen.getByPlaceholderText('Institution Name') as HTMLInputElement

        // Start typing a name that will be a duplicate after normalization
        fireEvent.change(nameInput, { target: { value: 'University Research' } })
        // Input should still contain the raw value
        expect(nameInput.value).toBe('University Research')
        // But validation should not trigger yet for partial input
        expect(screen.queryByText('An institution with this name already exists')).toBeNull()

        // Complete the name
        fireEvent.change(nameInput, { target: { value: 'University Research Center' } })
        // Should trigger validation even while typing since it matches after normalization
        expect(screen.getByText('An institution with this name already exists')).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /Create/i })).toBeDisabled()
      })

      it('should notify user when institution name is normalized', async () => {
        vi.mocked(InstitutionAPI.list).mockResolvedValue([])
        await act(async () => {
          render(<BrowserRouter><InstitutionDetails formMode={FORM_MODES.createNew} /></BrowserRouter>)
        })

        const nameInput = screen.getByPlaceholderText('Institution Name') as HTMLInputElement

        // Test normalization with spaces that get trimmed
        fireEvent.change(nameInput, { target: { value: '  University of Test  ' } })
        fireEvent.blur(nameInput)

        expect(Notifications.showInformation).toHaveBeenCalledWith({
          text: 'Institution name has been automatically cleaned up: removed extra spaces.',
        })

        // Clear and test normalization with curly quotes
        fireEvent.change(nameInput, { target: { value: '' } })
        fireEvent.change(nameInput, { target: { value: 'University ‘Research’ Center' } })
        fireEvent.blur(nameInput)

        expect(Notifications.showInformation).toHaveBeenCalledWith({
          text: 'Institution name has been automatically cleaned up: converted curly quotes to straight quotes.',
        })

        // Clear and test with both spaces and quotes
        fireEvent.change(nameInput, { target: { value: '' } })
        fireEvent.change(nameInput, { target: { value: '  University ‘of’ Test  ' } })
        fireEvent.blur(nameInput)

        expect(Notifications.showInformation).toHaveBeenCalledWith({
          text: 'Institution name has been automatically cleaned up: removed extra spaces and converted curly quotes to straight quotes.',
        })
      })
    })
  })
})
