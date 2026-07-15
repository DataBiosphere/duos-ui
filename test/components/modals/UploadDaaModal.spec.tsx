import React from 'react'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Modal from 'react-modal'
import { UploadDaaModal } from 'src/components/modals/UploadDaaModal'
import { EntityType, FileCategory } from 'src/libs/ajax/FileStorageObject'
import type { FileStorageObject } from 'src/libs/ajax/FileStorageObject'
import type { Props as DocumentUploadProps } from 'src/components/forms/DocumentUpload'

const fileName = 'test-file.pdf'
const fileContent = 'test content'

beforeEach(() => {
  Modal.setAppElement(document.body)
})

const buildStoredDocument = (
  fileStorageObjectId: number,
  name: string,
  category: FileCategory,
): FileStorageObject => ({
  fileStorageObjectId,
  entityId: 'test-dac-id',
  fileName: name,
  category,
  mediaType: 'application/pdf',
  createUserId: 1,
  createDate: 0,
})

const buildDocumentUploadApi = (
  overrides?: Partial<NonNullable<DocumentUploadProps['api']>>,
): NonNullable<DocumentUploadProps['api']> => ({
  uploadDocument: async (_entity, _entityId, file, category) => buildStoredDocument(500, file.name, category),
  deleteDocument: async () => ({}) as never,
  listDocuments: async () => [],
  ...overrides,
})

const mountModal = async (overrides?: {
  showModal?: boolean
  isLiveUpload?: boolean
  documentUploadApi?: DocumentUploadProps['api']
  onAttachmentChange?: ReturnType<typeof vi.fn>
  onCloseRequest?: ReturnType<typeof vi.fn>
}) => {
  const onAttachmentChange = overrides?.onAttachmentChange ?? vi.fn()
  const onCloseRequest = overrides?.onCloseRequest ?? vi.fn()
  render(
    <UploadDaaModal
      showModal={overrides?.showModal ?? true}
      isLiveUpload={overrides?.isLiveUpload}
      documentUploadApi={overrides?.documentUploadApi ?? buildDocumentUploadApi()}
      onAttachmentChange={onAttachmentChange as unknown as (files: File[]) => void}
      onCloseRequest={onCloseRequest as unknown as () => void}
    />,
  )
  // Flush the async listDocuments microtask so React state updates land inside act().
  await act(async () => {})
  return { onAttachmentChange, onCloseRequest }
}

const uploadTestFile = (name: string = fileName) => {
  const input = document.querySelector('input[data-cy="document-upload-input"]') as HTMLInputElement
  const file = new File([fileContent], name, { type: 'application/pdf' })
  Object.defineProperty(input, 'files', { value: [file], configurable: true })
  fireEvent.change(input)
}

const waitForUploaderReady = async () => {
  await waitFor(() => {
    const fixedCategory = document.querySelector('[data-cy="document-upload-fixed-category"]')
    expect(fixedCategory).toHaveTextContent('Data Access Agreement')
    expect(document.querySelector('[data-cy="document-upload-dropzone"]')).toBeInTheDocument()
  })
}

const waitForStatusUploaded = async (opts?: Parameters<typeof waitFor>[1]) => {
  await waitFor(
    () => {
      const statusEl = document.querySelector('[data-cy="document-upload-status"]')
      expect(statusEl).toHaveTextContent('Uploaded')
    },
    opts,
  )
}

const waitForSaveEnabled = async () => {
  await waitForStatusUploaded({ timeout: 10000 })
  await waitFor(() => expect(document.getElementById('btn_save')).not.toBeDisabled())
}

const assertLiveModeSave = (
  onAttachmentChange: ReturnType<typeof vi.fn>,
  onCloseRequest: ReturnType<typeof vi.fn>,
  expectedFileName: string = fileName,
) => {
  expect(onAttachmentChange).toHaveBeenCalledTimes(1)
  expect(onAttachmentChange.mock.calls[0][0]).toHaveLength(1)
  expect(onAttachmentChange.mock.calls[0][0][0].name).toBe(expectedFileName)
  expect(onCloseRequest).toHaveBeenCalledTimes(1)
}

const testNonLiveModeSave = async ({
  tick,
  fileName: uploadFileName = 'deferred-file.pdf',
  clocked = false,
}: {
  tick?: number
  fileName?: string
  clocked?: boolean
}) => {
  const onAttachmentChange = vi.fn()
  const uploadSpy = vi.fn().mockImplementation(
    async (_entity: EntityType, _entityId: string, file: File, category: FileCategory) =>
      buildStoredDocument(777, file.name, category),
  )
  const documentUploadApi = buildDocumentUploadApi({ uploadDocument: uploadSpy })
  await mountModal({ onAttachmentChange, isLiveUpload: false, documentUploadApi })

  await waitForUploaderReady()
  uploadTestFile(uploadFileName)

  if (clocked && tick !== undefined) {
    await act(async () => {
      await vi.advanceTimersByTimeAsync(tick)
    })
  }
  else {
    await waitForSaveEnabled()
  }

  expect(document.getElementById('btn_save')).not.toBeDisabled()
  await userEvent.click(document.getElementById('btn_save')!)

  expect(uploadSpy).not.toHaveBeenCalled()
  expect(onAttachmentChange).toHaveBeenCalledTimes(1)
  expect(onAttachmentChange.mock.calls[0][0]).toHaveLength(1)
  expect(onAttachmentChange.mock.calls[0][0][0].name).toBe(uploadFileName)
}

describe('UploadDaaModal Component', () => {
  it('renders modal when showModal is true', async () => {
    await mountModal()
    expect(screen.getByText('Upload Documents')).toBeInTheDocument()
  })

  it('does not render modal when showModal is false', async () => {
    await mountModal({ showModal: false })
    expect(screen.queryByText('Upload Documents')).not.toBeInTheDocument()
  })

  it('calls onCloseRequest when Cancel button is clicked', async () => {
    const onCloseRequest = vi.fn()
    await mountModal({ onCloseRequest })
    await userEvent.click(document.getElementById('btn_cancel')!)
    expect(onCloseRequest).toHaveBeenCalledTimes(1)
  })

  it('keeps Save disabled when no file is selected', async () => {
    const { onAttachmentChange, onCloseRequest } = await mountModal()
    expect(document.getElementById('btn_save')).toBeDisabled()
    await userEvent.click(document.getElementById('btn_save')!, { pointerEventsCheck: 0 })
    expect(onAttachmentChange).not.toHaveBeenCalled()
    expect(onCloseRequest).not.toHaveBeenCalled()
  })

  it('live mode uploads first, then enables Save and returns uploaded files only', async () => {
    const onAttachmentChange = vi.fn()
    const onCloseRequest = vi.fn()
    const documentUploadApi = buildDocumentUploadApi()

    await mountModal({ onAttachmentChange, onCloseRequest, documentUploadApi })

    await waitForUploaderReady()
    uploadTestFile()

    await waitForSaveEnabled()
    await userEvent.click(document.getElementById('btn_save')!)
    assertLiveModeSave(onAttachmentChange, onCloseRequest)
  })

  it('non-live mode enables Save after staging and does not call uploadDocument', async () => {
    await testNonLiveModeSave({})
  })

  it('only returns newly uploaded files when existing docs are present', async () => {
    const onAttachmentChange = vi.fn()
    const documentUploadApi = buildDocumentUploadApi({
      listDocuments: async () => [buildStoredDocument(1, 'existing-daa.pdf', FileCategory.DATA_ACCESS_AGREEMENT)],
      uploadDocument: async (_entity, _entityId, file, category) => buildStoredDocument(501, file.name, category),
    })

    await mountModal({ onAttachmentChange, documentUploadApi })

    await waitForUploaderReady()
    uploadTestFile('new-daa.pdf')
    await waitForSaveEnabled()
    await userEvent.click(document.getElementById('btn_save')!)

    expect(onAttachmentChange).toHaveBeenCalledTimes(1)
    expect(onAttachmentChange.mock.calls[0][0]).toHaveLength(1)
    expect(onAttachmentChange.mock.calls[0][0][0].name).toBe('new-daa.pdf')
  })
})

describe('UploadDaaModal Component (clocked)', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('live mode uploads first, then enables Save and returns uploaded files only (clocked)', async () => {
    const onAttachmentChange = vi.fn()
    const onCloseRequest = vi.fn()
    const documentUploadApi = buildDocumentUploadApi()

    await mountModal({ onAttachmentChange, onCloseRequest, documentUploadApi })
    await waitForUploaderReady()
    uploadTestFile()

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000)
    })

    await waitForStatusUploaded()
    expect(document.getElementById('btn_save')).not.toBeDisabled()
    await userEvent.click(document.getElementById('btn_save')!)
    assertLiveModeSave(onAttachmentChange, onCloseRequest)
  })

  it('non-live mode enables Save after staging and does not call uploadDocument (clocked)', async () => {
    await testNonLiveModeSave({ tick: 1000, clocked: true })
  })
})
