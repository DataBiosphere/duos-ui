import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import IrbDocumentUpload from 'src/pages/progress_reports/IrbDocumentUpload'
import { FormState } from 'src/pages/progress_reports/ProgressReportFormState'
import { DarErrors } from 'src/pages/dar_application/FormValidationState'

vi.mock('src/components/forms/forms', () => ({
  FormField: ({ id, title, description, onChange }: { id: string, title?: string, description?: string, onChange?: (e: { _key: string, value: File | undefined }) => void }) => (
    <div>
      {title && <label>{title}</label>}
      {description && <span>{description}</span>}
      <input id={id} type="file" onChange={e => onChange?.({ _key: id, value: e.target.files?.[0] })} />
    </div>
  ),
  FormFieldTypes: { FILE: 'file' },
}))

vi.mock('src/components/DownloadLink', () => ({
  DownloadLink: ({ label }: { label: string }) => <a href="#">{label}</a>,
}))

vi.mock('src/components/DuosDatePicker', () => ({
  DuosDatePicker: () => <div data-testid="date-picker" />,
}))

vi.mock('src/libs/ajax/DAR', () => ({
  DAR: { downloadDARDocument: vi.fn() },
}))

const mockFormState: Partial<FormState> = {
  irbProtocolExpiration: '2026-06-14',
  irbDocumentName: 'existing-irb.pdf',
  irbDocumentLocation: 'a1b2c3d4-uuid',
}

const mockFormStateWithoutIrb: Partial<FormState> = {
  irbProtocolExpiration: '2026-06-14',
  irbDocumentName: undefined,
  irbDocumentLocation: undefined,
}

const mockReferenceId = 'DAR-123'
const emptyValidation: DarErrors = {}

function renderComponent(overrides: {
  readOnly?: boolean
  formState?: Partial<FormState>
  validation?: DarErrors
  uploadedIrbDocument?: File | null
  onIrbDocumentChange?: (document: File | null, expiration: string) => void
  referenceId?: string
} = {}) {
  const onIrbDocumentChange = overrides.onIrbDocumentChange ?? vi.fn()
  render(
    <IrbDocumentUpload
      readOnly={overrides.readOnly ?? false}
      formState={(overrides.formState ?? mockFormStateWithoutIrb) as FormState}
      validation={overrides.validation ?? emptyValidation}
      uploadedIrbDocument={overrides.uploadedIrbDocument ?? null}
      onIrbDocumentChange={onIrbDocumentChange}
      referenceId={overrides.referenceId ?? ''}
    />,
  )
  return { onIrbDocumentChange }
}

describe('IrbDocumentUpload', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('File Display and Download', () => {
    it('Should display existing IRB document with download link in read-only mode', () => {
      renderComponent({
        readOnly: true,
        formState: mockFormState,
        referenceId: mockReferenceId,
      })

      expect(screen.getByText(/Current file:/)).toBeInTheDocument()
      expect(screen.getByText(/existing-irb\.pdf/)).toBeInTheDocument()
      expect(screen.getByText('Download')).toBeInTheDocument()
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
      // No file input in read-only mode (FormField not rendered)
      expect(document.querySelector('input[type="file"]')).not.toBeInTheDocument()
      expect(screen.getByText('IRB Protocol Expiration Date')).toBeInTheDocument()
      expect(screen.getByText('2026-06-14')).toBeInTheDocument()
    })

    it('Should display uploaded file name when a new file is uploaded', () => {
      const uploadedFile = new File(['test'], 'new-irb-document.pdf', { type: 'application/pdf' })
      renderComponent({
        readOnly: false,
        formState: mockFormStateWithoutIrb,
        uploadedIrbDocument: uploadedFile,
      })

      expect(screen.getByText(/Current file:/)).toBeInTheDocument()
      expect(screen.getByText(/new-irb-document\.pdf/)).toBeInTheDocument()
    })

    it('Should prioritize uploaded file name over form state file name', () => {
      const uploadedFile = new File(['test'], 'newly-uploaded.pdf', { type: 'application/pdf' })
      renderComponent({
        readOnly: false,
        formState: mockFormState,
        uploadedIrbDocument: uploadedFile,
      })

      expect(screen.getByText(/newly-uploaded\.pdf/)).toBeInTheDocument()
      expect(screen.queryByText(/existing-irb\.pdf/)).not.toBeInTheDocument()
    })
  })

  describe('File Upload Functionality', () => {
    it('Should show file upload form in editable mode', () => {
      renderComponent({
        readOnly: false,
        formState: mockFormStateWithoutIrb,
      })

      expect(screen.getByText('IRB Document')).toBeInTheDocument()
      expect(screen.getByText('Upload your current IRB approval document')).toBeInTheDocument()
      expect(screen.getByText('When does your current IRB approval expire?')).toBeInTheDocument()
    })

    it('Should call onIrbDocumentChange when file is uploaded', () => {
      const onIrbDocumentChangeSpy = vi.fn()
      renderComponent({
        readOnly: false,
        formState: mockFormStateWithoutIrb,
        onIrbDocumentChange: onIrbDocumentChangeSpy,
      })

      const file = new File(['content'], 'uploaded.pdf', { type: 'application/pdf' })
      const input = document.querySelector('input[type="file"]') as HTMLInputElement
      expect(input).not.toBeNull()

      fireEvent.change(input, { target: { files: [file] } })

      expect(onIrbDocumentChangeSpy).toHaveBeenCalled()
    })
  })

  describe('Date Picker Functionality', () => {
    it('Should display date label and date picker in edit mode', () => {
      renderComponent({
        readOnly: false,
        formState: mockFormState,
      })

      expect(screen.getByText('IRB Protocol Expiration Date')).toBeInTheDocument()
      expect(screen.getByText('When does your current IRB approval expire?')).toBeInTheDocument()
      expect(screen.getByTestId('date-picker')).toBeInTheDocument()
    })

    it('Should only show expiration date in read-only mode, not date picker', () => {
      renderComponent({
        readOnly: true,
        formState: mockFormState,
        referenceId: mockReferenceId,
      })

      expect(screen.getByText('IRB Protocol Expiration Date')).toBeInTheDocument()
      expect(screen.getByText('2026-06-14')).toBeInTheDocument()
      expect(screen.queryByText('When does your current IRB approval expire?')).not.toBeInTheDocument()
      expect(screen.queryByTestId('date-picker')).not.toBeInTheDocument()
    })
  })

  describe('Download Functionality', () => {
    it('Should not show download link when no document exists', () => {
      renderComponent({
        readOnly: true,
        formState: mockFormStateWithoutIrb,
        referenceId: mockReferenceId,
      })

      expect(screen.queryByText('Download')).not.toBeInTheDocument()
    })

    it('Should show download link when document exists with valid reference', () => {
      renderComponent({
        readOnly: true,
        formState: mockFormState,
        referenceId: mockReferenceId,
      })

      expect(screen.getByText('Download')).toBeInTheDocument()
    })

    it('Should not show download link when reference ID is missing', () => {
      renderComponent({
        readOnly: true,
        formState: mockFormState,
        referenceId: '',
      })

      expect(screen.queryByText('Download')).not.toBeInTheDocument()
    })
  })
})
