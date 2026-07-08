import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act, render, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import SubmitProgressReport from 'src/pages/progress_reports/SubmitProgressReport'
import { FormState } from 'src/pages/progress_reports/ProgressReportFormState'

vi.mock('src/libs/ajax/ProgressReport', () => ({
  ProgressReport: { submitProgressReport: vi.fn() },
}))

vi.mock('src/libs/ajax/DAR', () => ({
  DAR: { getDARDocumentAsBlob: vi.fn() },
}))

vi.mock('src/libs/utils', () => ({
  Notifications: { showError: vi.fn() },
}))

vi.mock('src/utils/DarUtils', () => ({
  convertFormStateToDAR: vi.fn().mockReturnValue({}),
}))

vi.mock('src/components/AsyncSpinnerButton', () => ({
  default: ({ children, onClick, 'data-cy': dataCy }: { 'children'?: React.ReactNode, 'onClick'?: () => void | Promise<void>, 'data-cy'?: string }) => (
    <button data-cy={dataCy} onClick={onClick}>{children}</button>
  ),
}))

import { ProgressReport } from 'src/libs/ajax/ProgressReport'
import { DAR } from 'src/libs/ajax/DAR'
import { Notifications } from 'src/libs/utils'
import { CombinedDataAccessRequest } from 'src/types/model'

const mockFormState = {} as FormState
const mockParentReferenceId = 'DAR-123'

function renderComponent(overrides: {
  formState?: FormState
  parentReferenceId?: string
  onSuccess?: (result: unknown) => void
  onCancel?: () => void
  isValid?: boolean
  onValidate?: () => void
  uploadedIrbDocument?: File | null
  parentDar?: CombinedDataAccessRequest
} = {}) {
  const onSuccess = overrides.onSuccess ?? vi.fn()
  const onCancel = overrides.onCancel ?? vi.fn()
  render(
    <SubmitProgressReport
      formState={overrides.formState ?? mockFormState}
      parentReferenceId={overrides.parentReferenceId ?? mockParentReferenceId}
      onSuccess={onSuccess}
      onCancel={onCancel}
      isValid={overrides.isValid}
      onValidate={overrides.onValidate}
      uploadedIrbDocument={overrides.uploadedIrbDocument}
      parentDar={overrides.parentDar}
    />,
  )
  return { onSuccess, onCancel }
}

describe('SubmitProgressReport', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('Should show a submit and cancel button when form is valid', () => {
    renderComponent({ isValid: true })

    expect(document.querySelector('[data-cy="pr-submit-button"]')).toBeVisible()
    expect(document.querySelector('[data-cy="pr-cancel-button"]')).toBeVisible()
  })

  it('Should show a validate and cancel button when form is invalid', () => {
    renderComponent({ isValid: false })

    const validateButton = document.querySelector('[data-cy="pr-validate-button"]')
    expect(validateButton).toBeVisible()
    expect(validateButton?.textContent).toContain('Validate')
    expect(document.querySelector('[data-cy="pr-submit-button"]')).not.toBeInTheDocument()
    expect(document.querySelector('[data-cy="pr-cancel-button"]')).toBeVisible()
  })

  it('Validate button calls onValidate handler when clicked', () => {
    const onValidateSpy = vi.fn()
    renderComponent({ isValid: false, onValidate: onValidateSpy })

    const validateButton = document.querySelector('[data-cy="pr-validate-button"]') as HTMLButtonElement
    fireEvent.click(validateButton)

    expect(onValidateSpy).toHaveBeenCalledOnce()
  })

  it('Submit should succeed', async () => {
    vi.mocked(ProgressReport.submitProgressReport).mockResolvedValue({ data: null })
    renderComponent({ isValid: true })

    const submitButton = document.querySelector('[data-cy="pr-submit-button"]') as HTMLButtonElement
    await act(async () => {
      fireEvent.click(submitButton)
    })

    await waitFor(() => {
      expect(ProgressReport.submitProgressReport).toHaveBeenCalled()
    })
  })

  it('On Submit handler should be called after successful submit', async () => {
    const onSuccessSpy = vi.fn()
    vi.mocked(ProgressReport.submitProgressReport).mockResolvedValue({ data: null })
    renderComponent({ isValid: true, onSuccess: onSuccessSpy })

    const submitButton = document.querySelector('[data-cy="pr-submit-button"]') as HTMLButtonElement
    await act(async () => {
      fireEvent.click(submitButton)
    })

    await waitFor(() => {
      expect(onSuccessSpy).toHaveBeenCalled()
    })
  })

  it('On Cancel handler should be called after cancel button clicked', async () => {
    const onCancelSpy = vi.fn()
    renderComponent({ onCancel: onCancelSpy })

    const cancelButton = document.querySelector('[data-cy="pr-cancel-button"]') as HTMLButtonElement
    await act(async () => {
      fireEvent.click(cancelButton)
    })

    expect(onCancelSpy).toHaveBeenCalledOnce()
  })

  it('Submit failure message should be captured', async () => {
    vi.mocked(ProgressReport.submitProgressReport).mockRejectedValue(new Error('Submit failed'))
    renderComponent({ isValid: true })

    const submitButton = document.querySelector('[data-cy="pr-submit-button"]') as HTMLButtonElement
    await act(async () => {
      fireEvent.click(submitButton)
    })

    await waitFor(() => {
      expect(Notifications.showError).toHaveBeenCalledWith(
        expect.objectContaining({
          text: expect.stringContaining('Submit failed'),
        }),
      )
    })
  })

  describe('IRB Document Inheritance Tests', () => {
    const mockIrbFormState = { irbProtocolExpiration: '2026-06-14' } as FormState

    const mockParentDar = {
      referenceId: 'DAR-123',
      irbDocumentName: 'parent-irb-document.pdf',
      irbDocumentLocation: 'f7e8d9c0-b1a2-3456-7890-abcdef123456',
    } as CombinedDataAccessRequest

    const mockParentDarWithoutIrb = {
      referenceId: 'DAR-456',
      irbDocumentName: undefined,
      irbDocumentLocation: undefined,
    } as CombinedDataAccessRequest

    beforeEach(() => {
      vi.mocked(ProgressReport.submitProgressReport).mockResolvedValue({ data: null })
    })

    it('Should submit with uploaded IRB document when one is provided', async () => {
      const mockFile = new File(['test content'], 'new-irb.pdf', { type: 'application/pdf' })
      renderComponent({
        formState: mockIrbFormState,
        isValid: true,
        uploadedIrbDocument: mockFile,
        parentDar: mockParentDar,
      })

      const submitButton = document.querySelector('[data-cy="pr-submit-button"]') as HTMLButtonElement
      await act(async () => {
        fireEvent.click(submitButton)
      })

      await waitFor(() => {
        expect(ProgressReport.submitProgressReport).toHaveBeenCalled()
        const formData = vi.mocked(ProgressReport.submitProgressReport).mock.calls[0][0]
        const irbFile = formData.get('ethicsApprovalRequiredFile') as File
        expect(irbFile).toBeInstanceOf(File)
        expect(irbFile.name).toBe('new-irb.pdf')
      })
    })

    it('Should fetch and submit parent IRB document when no new document is uploaded', async () => {
      vi.mocked(DAR.getDARDocumentAsBlob).mockResolvedValue(
        new Blob(['parent irb content'], { type: 'application/pdf' }),
      )
      renderComponent({
        formState: mockIrbFormState,
        isValid: true,
        uploadedIrbDocument: null,
        parentDar: mockParentDar,
      })

      const submitButton = document.querySelector('[data-cy="pr-submit-button"]') as HTMLButtonElement
      await act(async () => {
        fireEvent.click(submitButton)
      })

      await waitFor(() => {
        expect(DAR.getDARDocumentAsBlob).toHaveBeenCalledWith(mockParentReferenceId, 'irbDocument')
        expect(ProgressReport.submitProgressReport).toHaveBeenCalled()
        const formData = vi.mocked(ProgressReport.submitProgressReport).mock.calls[0][0]
        const irbFile = formData.get('ethicsApprovalRequiredFile') as File
        expect(irbFile).toBeInstanceOf(File)
        expect(irbFile.name).toBe('parent-irb-document.pdf')
      })
    })

    it('Should handle parent IRB document fetch failure gracefully', async () => {
      vi.spyOn(console, 'warn').mockImplementation(() => {})
      vi.mocked(DAR.getDARDocumentAsBlob).mockRejectedValue(new Error('Document not found'))
      renderComponent({
        formState: mockIrbFormState,
        isValid: true,
        uploadedIrbDocument: null,
        parentDar: mockParentDar,
      })

      const submitButton = document.querySelector('[data-cy="pr-submit-button"]') as HTMLButtonElement
      await act(async () => {
        fireEvent.click(submitButton)
      })

      await waitFor(() => {
        expect(ProgressReport.submitProgressReport).toHaveBeenCalled()
        const formData = vi.mocked(ProgressReport.submitProgressReport).mock.calls[0][0]
        expect(formData.get('ethicsApprovalRequiredFile')).toBe('')
      })
    })

    it('Should submit without IRB document when no new document and no parent document exists', async () => {
      renderComponent({
        formState: mockIrbFormState,
        isValid: true,
        uploadedIrbDocument: null,
        parentDar: mockParentDarWithoutIrb,
      })

      const submitButton = document.querySelector('[data-cy="pr-submit-button"]') as HTMLButtonElement
      await act(async () => {
        fireEvent.click(submitButton)
      })

      await waitFor(() => {
        expect(ProgressReport.submitProgressReport).toHaveBeenCalled()
        const formData = vi.mocked(ProgressReport.submitProgressReport).mock.calls[0][0]
        expect(formData.get('ethicsApprovalRequiredFile')).toBe('')
      })
    })

    it('Should handle missing parent DAR gracefully', async () => {
      renderComponent({
        formState: mockIrbFormState,
        isValid: true,
        uploadedIrbDocument: null,
        parentDar: undefined,
      })

      const submitButton = document.querySelector('[data-cy="pr-submit-button"]') as HTMLButtonElement
      await act(async () => {
        fireEvent.click(submitButton)
      })

      await waitFor(() => {
        expect(ProgressReport.submitProgressReport).toHaveBeenCalled()
        const formData = vi.mocked(ProgressReport.submitProgressReport).mock.calls[0][0]
        expect(formData.get('ethicsApprovalRequiredFile')).toBe('')
      })
    })
  })
})
