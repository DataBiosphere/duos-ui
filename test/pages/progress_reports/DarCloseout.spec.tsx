import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import DarCloseout from 'src/pages/progress_reports/DarCloseout'
import { FormState } from 'src/pages/progress_reports/ProgressReportFormState'
import { SigningOfficialUserWithData } from 'src/types/model'

vi.mock('src/libs/ajax/User', () => ({
  User: {
    getSOsForInstitution: vi.fn(),
    getSOsForCurrentUser: vi.fn(),
  },
}))

vi.mock('src/components/forms/forms', () => ({
  FormField: ({ id, disabled, defaultValue }: { id: string; disabled?: boolean; defaultValue?: unknown }) => (
    <div data-testid={`form-field-${id}`} data-disabled={String(disabled)}>
      {defaultValue != null && typeof defaultValue === 'object' && 'displayText' in (defaultValue as object)
        ? String((defaultValue as { displayText: string }).displayText)
        : null}
    </div>
  ),
  FormFieldTypes: {
    YESNORADIOGROUP: 'yesnoradiogroup',
    SELECT: 'select',
    CHECKBOX: 'checkbox',
    TEXTAREA: 'textarea',
  },
  FormValidators: { REQUIRED: 'required' },
}))

import { User } from 'src/libs/ajax/User'

const soWithData: SigningOfficialUserWithData = {
  userId: 55,
  displayName: 'Jane SO',
  email: 'jane.so@broad.mit.edu',
  institutionName: 'Broad Institute',
  userData: {
    externalProfiles: {
      linkedIn: 'janeso',
    },
  },
}

const baseFormState: Partial<FormState> = {
  closeoutYesNo: true,
  closeoutSigningOfficial: { userId: 55, displayName: 'Jane SO', email: 'jane.so@broad.mit.edu' },
  closeoutProjectCompleted: false,
  closeoutRequestorMovedInstitution: false,
  closeoutProjectTransferred: false,
  closeoutProjectSuperseded: false,
  closeoutOther: false,
  closeoutOtherText: '',
}

const defaultProps = {
  datasets: [],
  formState: baseFormState as FormState,
  onFormChange: vi.fn(),
}

describe('DarCloseout', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(User.getSOsForInstitution).mockResolvedValue([])
    vi.mocked(User.getSOsForCurrentUser).mockResolvedValue([])
  })

  describe('read-only mode', () => {
    it('calls getSOsForInstitution when researcherInstitutionId is provided', async () => {
      render(
        <DarCloseout
          {...defaultProps}
          readOnly={true}
          researcherInstitutionId={42}
        />,
      )
      await waitFor(() => {
        expect(User.getSOsForInstitution).toHaveBeenCalledWith(42)
        expect(User.getSOsForCurrentUser).not.toHaveBeenCalled()
      })
    })

    it('falls back to getSOsForCurrentUser when researcherInstitutionId is absent', async () => {
      render(<DarCloseout {...defaultProps} readOnly={true} />)
      await waitFor(() => {
        expect(User.getSOsForCurrentUser).toHaveBeenCalled()
        expect(User.getSOsForInstitution).not.toHaveBeenCalled()
      })
    })

    it('renders SigningOfficialReadOnlyCard with SO name and email', async () => {
      vi.mocked(User.getSOsForInstitution).mockResolvedValue([soWithData])
      render(
        <DarCloseout
          {...defaultProps}
          readOnly={true}
          researcherInstitutionId={42}
        />,
      )
      await waitFor(() => {
        expect(screen.getByText('Jane SO')).toBeInTheDocument()
        expect(screen.getByText('jane.so@broad.mit.edu')).toBeInTheDocument()
      })
    })

    it('renders institution name from the SO API payload', async () => {
      vi.mocked(User.getSOsForInstitution).mockResolvedValue([soWithData])
      render(
        <DarCloseout
          {...defaultProps}
          readOnly={true}
          researcherInstitutionId={42}
        />,
      )
      await waitFor(() => {
        expect(screen.getByText('Broad Institute')).toBeInTheDocument()
      })
    })

    it('renders external profile links from the SO API payload', async () => {
      vi.mocked(User.getSOsForInstitution).mockResolvedValue([soWithData])
      render(
        <DarCloseout
          {...defaultProps}
          readOnly={true}
          researcherInstitutionId={42}
        />,
      )
      await waitFor(() => {
        const link = screen.getByRole('link', { name: /LinkedIn/ })
        expect(link).toHaveAttribute('href', 'https://www.linkedin.com/in/janeso')
      })
    })

    it('renders an empty card when API returns no matching SO', async () => {
      vi.mocked(User.getSOsForInstitution).mockResolvedValue([])
      render(
        <DarCloseout
          {...defaultProps}
          readOnly={true}
          researcherInstitutionId={42}
        />,
      )
      await waitFor(() => {
        expect(screen.getByText(/I certify that the individual listed below/)).toBeInTheDocument()
      })
    })

    it('does not render the SELECT form field', async () => {
      vi.mocked(User.getSOsForInstitution).mockResolvedValue([soWithData])
      render(
        <DarCloseout
          {...defaultProps}
          readOnly={true}
          researcherInstitutionId={42}
        />,
      )
      await waitFor(() => {
        expect(screen.queryByTestId('form-field-closeoutSigningOfficial')).not.toBeInTheDocument()
      })
    })
  })

  describe('edit mode', () => {
    it('calls getSOsForCurrentUser to populate the SO dropdown', async () => {
      render(<DarCloseout {...defaultProps} readOnly={false} />)
      await waitFor(() => {
        expect(User.getSOsForCurrentUser).toHaveBeenCalled()
        expect(User.getSOsForInstitution).not.toHaveBeenCalled()
      })
    })

    it('renders the SELECT form field', async () => {
      render(<DarCloseout {...defaultProps} readOnly={false} />)
      await waitFor(() => {
        expect(screen.getByTestId('form-field-closeoutSigningOfficial')).toBeInTheDocument()
      })
    })
  })
})
