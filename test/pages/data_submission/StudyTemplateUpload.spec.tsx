import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { act, fireEvent, screen, waitFor } from '@testing-library/react'
import { StudyTemplateUpload } from 'src/pages/data_submission/StudyTemplateUpload'
import { Draft } from 'src/libs/ajax/Draft'
import { fileDownload } from 'src/utils/FileDownload'
import { Notifications } from 'src/libs/utils'
import { TemplateValidationResponse } from 'src/types/studyTemplate'
import { renderWithRouter } from '../../test-utils'

const mockNavigate = vi.fn()

vi.mock('react-router', async () => {
  const actual = await vi.importActual<typeof import('react-router')>('react-router')
  return { ...actual, useNavigate: () => mockNavigate }
})

vi.mock('src/libs/ajax/Draft', () => ({
  Draft: {
    validateStudyDatasetTemplate: vi.fn(),
  },
}))

vi.mock('src/utils/FileDownload', () => ({
  fileDownload: vi.fn(),
}))

const buildCsv = (name = 'my-study.csv', size?: number): File => {
  const file = new File(['templateVersion,recordType,recordId,parentRecordId,field,value\r\n'], name, { type: 'text/csv' })
  if (size !== undefined) {
    Object.defineProperty(file, 'size', { value: size })
  }
  return file
}

const validResponse: TemplateValidationResponse = {
  valid: true,
  errors: [],
  draft: { id: 'c2e4583a-20b9-4705-8280-e6a5753f10c9', draftType: 'StudyDatasetSubmissionV1' },
}

const fileInput = (): HTMLInputElement => screen.getByLabelText(/Choose (a different file|CSV file)/i) as HTMLInputElement

// fireEvent wraps its own act(), so these only need to yield the microtask queue so an async click
// handler's continuation lands before the next assertion.
const selectFile = async (file: File) => {
  fireEvent.change(fileInput(), { target: { files: [file] } })
}

const clickValidate = async () => {
  fireEvent.click(screen.getByRole('button', { name: 'Validate' }))
}

const clickButton = async (name: string | RegExp) => {
  fireEvent.click(screen.getByRole('button', { name }))
}

describe('StudyTemplateUpload', () => {
  let showError: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    vi.clearAllMocks()
    showError = vi.spyOn(Notifications, 'showError').mockImplementation(() => undefined)
  })

  describe('idle state', () => {
    it('disables Validate until a file is selected', () => {
      renderWithRouter(<StudyTemplateUpload />)
      expect(screen.getByRole('button', { name: 'Validate' }).hasAttribute('disabled')).toBe(true)
    })

    it('asks the picker for CSV files', () => {
      renderWithRouter(<StudyTemplateUpload />)
      expect(fileInput().getAttribute('accept')).toBe('.csv')
    })

    it('states the size limit before any upload', () => {
      renderWithRouter(<StudyTemplateUpload />)
      expect(screen.getByText(/up to 5 MiB/)).toBeTruthy()
    })

    it('offers a link back to the manual registration form', () => {
      renderWithRouter(<StudyTemplateUpload />)
      const link = screen.getByRole('link', { name: /Register a study without a template/ })
      expect(link.getAttribute('href')).toBe('/data_submission_form')
    })

    it('exposes an aria-live region for results', () => {
      const { container } = renderWithRouter(<StudyTemplateUpload />)
      expect(container.querySelector('[aria-live="polite"]')).toBeTruthy()
    })
  })

  describe('template download', () => {
    it('downloads a generated v1 CSV', async () => {
      renderWithRouter(<StudyTemplateUpload />)

      await clickButton(/Download blank template/)

      expect(fileDownload).toHaveBeenCalledTimes(1)
      const [content, filename, mime] = vi.mocked(fileDownload).mock.calls[0]
      expect(filename).toBe('duos-study-template-v1.csv')
      expect(mime).toBe('text/csv')
      expect(String(content)).toContain('templateVersion,recordType,recordId,parentRecordId,field,value')
    })

    it('does not call the validation endpoint to build the template', async () => {
      renderWithRouter(<StudyTemplateUpload />)

      await clickButton(/Download blank template/)

      expect(Draft.validateStudyDatasetTemplate).not.toHaveBeenCalled()
    })
  })

  describe('file selection', () => {
    it('shows the selected filename and enables Validate', async () => {
      renderWithRouter(<StudyTemplateUpload />)
      await selectFile(buildCsv())

      expect(screen.getByText('my-study.csv')).toBeTruthy()
      expect(screen.getByRole('button', { name: 'Validate' }).hasAttribute('disabled')).toBe(false)
    })

    it('names the file in the Remove control', async () => {
      renderWithRouter(<StudyTemplateUpload />)
      await selectFile(buildCsv())

      expect(screen.getByRole('button', { name: 'Remove my-study.csv' })).toBeTruthy()
    })

    it('rejects a non-CSV file without uploading it', async () => {
      renderWithRouter(<StudyTemplateUpload />)
      await selectFile(buildCsv('notes.txt'))

      expect(showError).toHaveBeenCalledWith({ text: 'Template file must be a .csv file' })
      expect(screen.getByRole('button', { name: 'Validate' }).hasAttribute('disabled')).toBe(true)
      expect(Draft.validateStudyDatasetTemplate).not.toHaveBeenCalled()
    })

    it('rejects a file over 5 MiB without uploading it', async () => {
      renderWithRouter(<StudyTemplateUpload />)
      await selectFile(buildCsv('huge.csv', 5 * 1024 * 1024 + 1))

      expect(showError).toHaveBeenCalledWith({ text: 'Template file must be no larger than 5 MiB' })
      expect(Draft.validateStudyDatasetTemplate).not.toHaveBeenCalled()
    })

    it('resets the input after a rejection so the same file can be re-picked', async () => {
      renderWithRouter(<StudyTemplateUpload />)
      await selectFile(buildCsv('notes.txt'))

      expect(fileInput().value).toBe('')
    })

    it('accepts a file exactly at the limit', async () => {
      renderWithRouter(<StudyTemplateUpload />)
      await selectFile(buildCsv('exact.csv', 5 * 1024 * 1024))

      expect(screen.getByRole('button', { name: 'Validate' }).hasAttribute('disabled')).toBe(false)
    })
  })

  describe('pending state', () => {
    it('marks Validate busy and blocks duplicate requests while validating', async () => {
      let resolveValidation: (value: TemplateValidationResponse) => void = () => {}
      vi.mocked(Draft.validateStudyDatasetTemplate).mockReturnValue(
        new Promise<TemplateValidationResponse>((resolve) => { resolveValidation = resolve }),
      )

      renderWithRouter(<StudyTemplateUpload />)
      await selectFile(buildCsv())
      await clickValidate()

      const button = screen.getByRole('button', { name: 'Validate' })
      expect(button.getAttribute('aria-busy')).toBe('true')
      expect(button.hasAttribute('disabled')).toBe(true)

      fireEvent.click(button)
      expect(Draft.validateStudyDatasetTemplate).toHaveBeenCalledTimes(1)

      await act(async () => {
        resolveValidation({ valid: false, errors: [{ message: 'done' }] })
      })
    })
  })

  describe('stale results', () => {
    const pendingValidation = () => {
      let settle: (value: TemplateValidationResponse) => void = () => {}
      vi.mocked(Draft.validateStudyDatasetTemplate).mockReturnValue(
        new Promise<TemplateValidationResponse>((resolve) => { settle = resolve }),
      )
      return async (response: TemplateValidationResponse) => {
        await act(async () => {
          settle(response)
        })
      }
    }

    it('discards errors belonging to a file the user has replaced', async () => {
      const settle = pendingValidation()

      renderWithRouter(<StudyTemplateUpload />)
      await selectFile(buildCsv('first.csv'))
      await clickValidate()
      await selectFile(buildCsv('second.csv'))

      await settle({ valid: false, errors: [{ message: 'Study name is required.' }] })

      expect(screen.queryByText('Study name is required.')).toBeNull()
      expect(screen.getByText('second.csv')).toBeTruthy()
    })

    it('does not navigate to a draft built from a file the user has removed', async () => {
      const settle = pendingValidation()

      renderWithRouter(<StudyTemplateUpload />)
      await selectFile(buildCsv())
      await clickValidate()
      await clickButton('Remove my-study.csv')

      await settle(validResponse)

      expect(mockNavigate).not.toHaveBeenCalled()
    })

    it('does not report a failure for a file the user has removed', async () => {
      let reject: (error: unknown) => void = () => {}
      vi.mocked(Draft.validateStudyDatasetTemplate).mockReturnValue(
        new Promise<TemplateValidationResponse>((_resolve, rejectPromise) => { reject = rejectPromise }),
      )

      renderWithRouter(<StudyTemplateUpload />)
      await selectFile(buildCsv())
      await clickValidate()
      await clickButton('Remove my-study.csv')

      await act(async () => {
        reject(new Error('Service unavailable'))
      })

      expect(showError).not.toHaveBeenCalled()
    })
  })

  describe('validation errors', () => {
    const invalidResponse: TemplateValidationResponse = {
      valid: false,
      errors: [
        { row: 3, column: 'piEmail', message: 'Must be a valid email address.' },
        { row: 7, message: 'Unknown field "piEmial".' },
        { message: 'Study name is required.' },
      ],
    }

    beforeEach(() => {
      vi.mocked(Draft.validateStudyDatasetTemplate).mockResolvedValue(invalidResponse)
    })

    it('renders row and column context when available', async () => {
      renderWithRouter(<StudyTemplateUpload />)
      await selectFile(buildCsv())
      await clickValidate()

      expect(await screen.findByText('Row 3, column piEmail')).toBeTruthy()
      expect(screen.getByText('Must be a valid email address.')).toBeTruthy()
    })

    it('renders a row without a column when only the row is known', async () => {
      renderWithRouter(<StudyTemplateUpload />)
      await selectFile(buildCsv())
      await clickValidate()

      expect(await screen.findByText('Row 7')).toBeTruthy()
    })

    it('never fabricates a location for message-only violations', async () => {
      renderWithRouter(<StudyTemplateUpload />)
      await selectFile(buildCsv())
      await clickValidate()

      const item = (await screen.findByText('Study name is required.')).closest('li')
      expect(item?.textContent).toBe('Study name is required.')
    })

    it('stays on the page and keeps the filename visible', async () => {
      renderWithRouter(<StudyTemplateUpload />)
      await selectFile(buildCsv())
      await clickValidate()

      await screen.findByText(/3 errors/)
      expect(mockNavigate).not.toHaveBeenCalled()
      expect(screen.getByText('my-study.csv')).toBeTruthy()
    })

    it('keeps Validate available for a retry', async () => {
      renderWithRouter(<StudyTemplateUpload />)
      await selectFile(buildCsv())
      await clickValidate()

      await screen.findByText(/3 errors/)
      const button = screen.getByRole('button', { name: 'Validate' })
      expect(button.hasAttribute('disabled')).toBe(false)
      expect(button.getAttribute('aria-busy')).toBe('false')
    })

    it('reports omitted errors when the cap is reached', async () => {
      vi.mocked(Draft.validateStudyDatasetTemplate).mockResolvedValue({
        valid: false,
        errors: [{ message: 'first of many' }],
        truncated: true,
      })

      renderWithRouter(<StudyTemplateUpload />)
      await selectFile(buildCsv())
      await clickValidate()

      expect(await screen.findByText(/Further errors were omitted/)).toBeTruthy()
    })

    it('clears previous errors when validation is retried', async () => {
      renderWithRouter(<StudyTemplateUpload />)
      await selectFile(buildCsv())
      await clickValidate()
      await screen.findByText(/3 errors/)

      vi.mocked(Draft.validateStudyDatasetTemplate).mockResolvedValue({
        valid: false,
        errors: [{ message: 'Study name is required.' }],
      })
      await clickValidate()

      expect(await screen.findByText(/1 error$/)).toBeTruthy()
      expect(screen.queryByText('Must be a valid email address.')).toBeNull()
    })
  })

  describe('remove and replace', () => {
    beforeEach(() => {
      vi.mocked(Draft.validateStudyDatasetTemplate).mockResolvedValue({
        valid: false,
        errors: [{ row: 3, message: 'Must be a valid email address.' }],
      })
    })

    it('clears the file and its errors', async () => {
      renderWithRouter(<StudyTemplateUpload />)
      await selectFile(buildCsv())
      await clickValidate()
      await screen.findByText('Must be a valid email address.')

      await clickButton('Remove my-study.csv')

      expect(screen.queryByText('my-study.csv')).toBeNull()
      expect(screen.queryByText('Must be a valid email address.')).toBeNull()
      expect(screen.getByRole('button', { name: 'Validate' }).hasAttribute('disabled')).toBe(true)
    })

    it('resets the input so the same filename can be reselected', async () => {
      renderWithRouter(<StudyTemplateUpload />)
      await selectFile(buildCsv())

      await clickButton('Remove my-study.csv')

      expect(fileInput().value).toBe('')
    })

    it('validates a replacement file without remounting the page', async () => {
      renderWithRouter(<StudyTemplateUpload />)
      await selectFile(buildCsv('first.csv'))
      await clickValidate()
      await screen.findByText('Must be a valid email address.')

      await clickButton('Remove first.csv')
      await selectFile(buildCsv('second.csv'))

      vi.mocked(Draft.validateStudyDatasetTemplate).mockResolvedValue(validResponse)
      await clickValidate()

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/data_submission_form/draft/study-dataset/c2e4583a-20b9-4705-8280-e6a5753f10c9')
      })
      expect(Draft.validateStudyDatasetTemplate).toHaveBeenCalledTimes(2)
    })

    it('replaces the file without an explicit remove', async () => {
      renderWithRouter(<StudyTemplateUpload />)
      await selectFile(buildCsv('first.csv'))
      await clickValidate()
      await screen.findByText('Must be a valid email address.')

      await selectFile(buildCsv('second.csv'))

      expect(screen.getByText('second.csv')).toBeTruthy()
      expect(screen.queryByText('Must be a valid email address.')).toBeNull()
    })
  })

  describe('request failures', () => {
    it('stays on the page and shows the failure', async () => {
      vi.mocked(Draft.validateStudyDatasetTemplate).mockRejectedValue(new Error('Request failed with status 500'))

      renderWithRouter(<StudyTemplateUpload />)
      await selectFile(buildCsv())
      await clickValidate()

      await waitFor(() => {
        expect(showError).toHaveBeenCalledWith({ text: 'Request failed with status 500' })
      })
      expect(mockNavigate).not.toHaveBeenCalled()
      expect(screen.getByText('my-study.csv')).toBeTruthy()
    })

    it('allows a retry that then succeeds', async () => {
      vi.mocked(Draft.validateStudyDatasetTemplate).mockRejectedValueOnce(new Error('Network error'))

      renderWithRouter(<StudyTemplateUpload />)
      await selectFile(buildCsv())
      await clickValidate()
      await waitFor(() => expect(showError).toHaveBeenCalled())

      vi.mocked(Draft.validateStudyDatasetTemplate).mockResolvedValue(validResponse)
      await clickValidate()

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/data_submission_form/draft/study-dataset/c2e4583a-20b9-4705-8280-e6a5753f10c9')
      })
    })
  })

  describe('successful validation', () => {
    it('routes to the exact draft UUID Consent returned', async () => {
      vi.mocked(Draft.validateStudyDatasetTemplate).mockResolvedValue(validResponse)

      renderWithRouter(<StudyTemplateUpload />)
      await selectFile(buildCsv())
      await clickValidate()

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/data_submission_form/draft/study-dataset/c2e4583a-20b9-4705-8280-e6a5753f10c9')
      })
    })

    it('refuses to route when the draft type is not StudyDatasetSubmissionV1', async () => {
      vi.mocked(Draft.validateStudyDatasetTemplate).mockResolvedValue({
        valid: true,
        errors: [],
        draft: { id: 'c2e4583a-20b9-4705-8280-e6a5753f10c9', draftType: 'SomeOtherDraft' },
      } as unknown as TemplateValidationResponse)

      renderWithRouter(<StudyTemplateUpload />)
      await selectFile(buildCsv())
      await clickValidate()

      await waitFor(() => {
        expect(showError).toHaveBeenCalledWith({
          text: expect.stringContaining('did not identify a study/dataset draft'),
        })
      })
      expect(mockNavigate).not.toHaveBeenCalled()
    })

    it('refuses to route when the draft reference is missing', async () => {
      vi.mocked(Draft.validateStudyDatasetTemplate).mockResolvedValue({
        valid: true,
        errors: [],
      } as unknown as TemplateValidationResponse)

      renderWithRouter(<StudyTemplateUpload />)
      await selectFile(buildCsv())
      await clickValidate()

      await waitFor(() => expect(showError).toHaveBeenCalled())
      expect(mockNavigate).not.toHaveBeenCalled()
    })
  })

  describe('failure reporting', () => {
    it('reports failures as toasts rather than inline, matching the rest of the app', async () => {
      vi.mocked(Draft.validateStudyDatasetTemplate).mockRejectedValue(new Error('Network error'))

      const { container } = renderWithRouter(<StudyTemplateUpload />)
      await selectFile(buildCsv())
      await clickValidate()

      await waitFor(() => expect(showError).toHaveBeenCalled())
      expect(container.querySelector('[role="alert"]')).toBeNull()
    })

    // Validation errors are a completed result the user works through while editing their file, not a
    // failure: they need row and column context and must survive longer than a toast.
    it('keeps structured validation errors on the page instead of toasting them', async () => {
      vi.mocked(Draft.validateStudyDatasetTemplate).mockResolvedValue({
        valid: false,
        errors: [{ row: 3, column: 'piEmail', message: 'Must be a valid email address.' }],
      })

      renderWithRouter(<StudyTemplateUpload />)
      await selectFile(buildCsv())
      await clickValidate()

      expect(await screen.findByText('Must be a valid email address.')).toBeTruthy()
      expect(showError).not.toHaveBeenCalled()
    })
  })
})
