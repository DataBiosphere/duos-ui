import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DocumentUpload } from 'src/components/forms/DocumentUpload'
import { EntityType, FileCategory } from 'src/libs/ajax/FileStorageObject'
import { Notifications } from 'src/libs/utils'

const selectPdf = (name: string) => {
  const input = document.querySelector('[data-cy="document-upload-input"]') as HTMLInputElement
  const mockFile = new File(['test pdf content'], name, { type: 'application/pdf' })
  fireEvent.change(input, { target: { files: [mockFile] } })
}

describe('DocumentUpload', () => {
  beforeEach(() => {
    vi.spyOn(Notifications, 'showError').mockImplementation(() => {})
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test')
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('loads existing documents on mount', async () => {
    const listStub = vi.fn().mockResolvedValue([
      {
        fileStorageObjectId: 101,
        entityId: 'dar-1',
        fileName: 'existing_consent.pdf',
        category: FileCategory.IRB_COLLABORATION_LETTER,
        mediaType: 'application/pdf',
        createUserId: 1,
        createDate: Date.now(),
      },
    ])
    const getDocumentFileStub = vi.fn().mockResolvedValue(new Blob([new Uint8Array(4096)], { type: 'application/pdf' }))

    const api = {
      uploadDocument: vi.fn().mockResolvedValue({} as never),
      deleteDocument: vi.fn().mockResolvedValue({} as never),
      listDocuments: listStub,
      getDocumentFile: getDocumentFileStub,
    }

    render(
      <DocumentUpload
        entity={EntityType.DAR}
        entityId="dar-1"
        api={api}
      />,
    )

    await waitFor(() => expect(screen.getByText('existing_consent.pdf')).toBeInTheDocument())

    expect(listStub).toHaveBeenCalledOnce()
    expect(getDocumentFileStub).toHaveBeenCalledWith(EntityType.DAR, 'dar-1', 101)

    await waitFor(() => {
      expect(document.querySelector('[data-cy="document-upload-status"]')).toHaveTextContent('Uploaded')
      expect(document.querySelector('[data-cy="document-upload-status"]')).toHaveTextContent('4.0 KB')
      expect(document.querySelector('[data-cy="document-upload-status"]')).not.toHaveTextContent('0 B')
    })

    expect(document.querySelector('[data-cy="document-upload-count"]')).toHaveTextContent('1')
  })

  it('uploads files immediately and stores uploaded state', async () => {
    const onFilesReady = vi.fn()
    let resolveUpload!: (val: unknown) => void
    const api = {
      uploadDocument: vi.fn().mockImplementation(
        () => new Promise((resolve) => { resolveUpload = resolve }),
      ),
      deleteDocument: vi.fn().mockResolvedValue({} as never),
      listDocuments: vi.fn().mockResolvedValue([]),
    }

    render(
      <DocumentUpload
        entity={EntityType.DAR}
        entityId="dar-1"
        onFilesReady={onFilesReady}
        api={api}
      />,
    )

    await userEvent.click(document.querySelector(`[data-cy="document-upload-type-${FileCategory.IRB_COLLABORATION_LETTER}"]`)!)

    await act(async () => {
      selectPdf('consent.pdf')
    })

    expect(screen.getByText('consent.pdf')).toBeInTheDocument()

    // Upload is in-flight — status must pass through Uploading before resolving
    await waitFor(() => {
      expect(document.querySelector('[data-cy="document-upload-status"]')).toHaveTextContent('Uploading')
    })

    await act(async () => {
      resolveUpload({
        fileStorageObjectId: 101,
        entityId: 'dar-1',
        fileName: 'consent.pdf',
        category: FileCategory.IRB_COLLABORATION_LETTER,
        mediaType: 'application/pdf',
        createUserId: 1,
        createDate: Date.now(),
      })
    })

    await waitFor(() => {
      expect(document.querySelector('[data-cy="document-upload-status"]')).toHaveTextContent('Uploaded')
    })

    expect(document.querySelector('[data-cy="document-upload-count"]')).toHaveTextContent('1')
    expect(onFilesReady).toHaveBeenCalled()
  })

  it('stages files in deferred mode without API calls', async () => {
    const onFilesReady = vi.fn()
    const uploadStub = vi.fn().mockResolvedValue({} as never)
    const api = {
      uploadDocument: uploadStub,
      deleteDocument: vi.fn().mockResolvedValue({} as never),
      listDocuments: vi.fn().mockResolvedValue([]),
    }

    render(
      <DocumentUpload
        entity={EntityType.DATASET}
        entityId="dataset-1"
        isLiveUpload={false}
        onFilesReady={onFilesReady}
        api={api}
      />,
    )

    await userEvent.click(document.querySelector(`[data-cy="document-upload-type-${FileCategory.DATA_USE_LETTER}"]`)!)

    await act(async () => {
      selectPdf('dua.pdf')
    })

    await waitFor(() => {
      expect(document.querySelector('[data-cy="document-upload-status"]')).toHaveTextContent('Uploaded')
    })

    expect(onFilesReady).toHaveBeenCalledOnce()

    const [[files]] = onFilesReady.mock.calls
    expect(files).toHaveLength(1)
    expect(files[0].category).toBe(FileCategory.DATA_USE_LETTER)
    expect(files[0].file.name).toBe('dua.pdf')

    expect(uploadStub).not.toHaveBeenCalled()
  })

  it('maps upload errors and retries failed uploads', async () => {
    let callCount = 0
    const uploadStub = vi.fn().mockImplementation(() => {
      callCount++
      if (callCount === 1) {
        return Promise.reject({ response: { status: 403 } })
      }
      return Promise.resolve({
        fileStorageObjectId: 222,
        entityId: 'dac-9',
        fileName: 'letter.pdf',
        category: FileCategory.DATA_ACCESS_AGREEMENT,
        mediaType: 'application/pdf',
        createUserId: 1,
        createDate: Date.now(),
      })
    })

    const api = {
      uploadDocument: uploadStub,
      deleteDocument: vi.fn().mockResolvedValue({} as never),
      listDocuments: vi.fn().mockResolvedValue([]),
    }

    render(
      <DocumentUpload
        entity={EntityType.DAC}
        entityId="dac-9"
        api={api}
      />,
    )

    await userEvent.click(document.querySelector(`[data-cy="document-upload-type-${FileCategory.DATA_ACCESS_AGREEMENT}"]`)!)

    await act(async () => {
      selectPdf('letter.pdf')
    })

    await waitFor(() => {
      expect(document.querySelector('[data-cy="document-upload-error"]')).toHaveTextContent('No permission')
    })

    await userEvent.click(document.querySelector('[data-cy="document-upload-retry"]')!)

    await waitFor(() => {
      expect(document.querySelector('[data-cy="document-upload-status"]')).toHaveTextContent('Uploaded')
      expect(document.querySelector('[data-cy="document-upload-error"]')).toBeNull()
    })
  })

  it('deletes uploaded documents and calls API', async () => {
    const deleteStub = vi.fn().mockResolvedValue({} as never)
    const api = {
      uploadDocument: vi.fn().mockResolvedValue({
        fileStorageObjectId: 303,
        entityId: 'dataset-5',
        fileName: 'data.pdf',
        category: FileCategory.DATA_USE_LETTER,
        mediaType: 'application/pdf',
        createUserId: 1,
        createDate: Date.now(),
      }),
      deleteDocument: deleteStub,
      listDocuments: vi.fn().mockResolvedValue([]),
    }

    render(
      <DocumentUpload
        entity={EntityType.DATASET}
        entityId="dataset-5"
        api={api}
      />,
    )

    await userEvent.click(document.querySelector(`[data-cy="document-upload-type-${FileCategory.DATA_USE_LETTER}"]`)!)
    await act(async () => {
      selectPdf('data.pdf')
    })

    await waitFor(() => {
      expect(document.querySelector('[data-cy="document-upload-status"]')).toHaveTextContent('Uploaded')
    })

    await userEvent.click(document.querySelector('[data-cy="document-upload-delete"]')!)

    expect(screen.getByText('Delete File')).toBeInTheDocument()
    expect(screen.getByText('Are you sure you want to delete the file \'data.pdf\'?')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(deleteStub).not.toHaveBeenCalled()
    expect(screen.getByText('data.pdf')).toBeInTheDocument()

    await userEvent.click(document.querySelector('[data-cy="document-upload-delete"]')!)
    await userEvent.click(screen.getByRole('button', { name: 'Confirm' }))

    await waitFor(() => {
      expect(deleteStub).toHaveBeenCalledWith(EntityType.DATASET, 'dataset-5', 303)
    })
    expect(screen.queryByText('data.pdf')).not.toBeInTheDocument()
  })

  it('confirms deletion before removing deferred documents', async () => {
    const onFilesReady = vi.fn()
    const deleteStub = vi.fn().mockResolvedValue({} as never)
    const api = {
      uploadDocument: vi.fn().mockResolvedValue({} as never),
      deleteDocument: deleteStub,
      listDocuments: vi.fn().mockResolvedValue([]),
    }

    render(
      <DocumentUpload
        entity={EntityType.DATASET}
        entityId="dataset-deferred-delete"
        isLiveUpload={false}
        onFilesReady={onFilesReady}
        api={api}
      />,
    )

    await userEvent.click(document.querySelector(`[data-cy="document-upload-type-${FileCategory.DATA_USE_LETTER}"]`)!)
    await act(async () => {
      selectPdf('staged-delete.pdf')
    })

    await waitFor(() => expect(screen.getByText('staged-delete.pdf')).toBeInTheDocument())

    await userEvent.click(document.querySelector('[data-cy="document-upload-delete"]')!)
    expect(screen.getByText('Delete File')).toBeInTheDocument()
    expect(screen.getByText('Are you sure you want to delete the file \'staged-delete.pdf\'?')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Confirm' }))

    expect(screen.queryByText('staged-delete.pdf')).not.toBeInTheDocument()
    expect(deleteStub).not.toHaveBeenCalled()
    expect(onFilesReady).toHaveBeenCalled()
  })

  it('uses fixed category and bypasses type selection', async () => {
    const api = {
      uploadDocument: vi.fn().mockResolvedValue({
        fileStorageObjectId: 404,
        entityId: 'dac-7',
        fileName: 'daa.pdf',
        category: FileCategory.DATA_ACCESS_AGREEMENT,
        mediaType: 'application/pdf',
        createUserId: 1,
        createDate: Date.now(),
      }),
      deleteDocument: vi.fn().mockResolvedValue({} as never),
      listDocuments: vi.fn().mockResolvedValue([]),
    }

    render(
      <DocumentUpload
        entity={EntityType.DAC}
        entityId="dac-7"
        categories={[FileCategory.DATA_ACCESS_AGREEMENT]}
        api={api}
      />,
    )

    await waitFor(() => {
      expect(document.querySelector('[data-cy="document-upload-fixed-category"]')).toHaveTextContent('Data Access Agreement')
    })
    expect(document.querySelector('[data-cy="document-upload-type-list"]')).toBeNull()

    await act(async () => {
      selectPdf('daa.pdf')
    })

    await waitFor(() => {
      expect(document.querySelector('[data-cy="document-upload-status"]')).toHaveTextContent('Uploaded')
    })
  })

  it('shows deleted documents when configured and keeps delete disabled', async () => {
    const api = {
      uploadDocument: vi.fn().mockResolvedValue({} as never),
      deleteDocument: vi.fn().mockResolvedValue({} as never),
      listDocuments: vi.fn().mockResolvedValue([
        {
          fileStorageObjectId: 901,
          entityId: 'dac-9',
          fileName: 'deleted_daa.pdf',
          category: FileCategory.DATA_ACCESS_AGREEMENT,
          mediaType: 'application/pdf',
          createUserId: 1,
          createDate: Date.now(),
          deleted: true,
        },
      ]),
    }

    render(
      <DocumentUpload
        entity={EntityType.DAC}
        entityId="dac-9"
        categories={[FileCategory.DATA_ACCESS_AGREEMENT]}
        deletedDocumentsView="all"
        api={api}
      />,
    )

    await waitFor(() => expect(screen.getByText('deleted_daa.pdf')).toBeInTheDocument())

    const card = screen.getByText('deleted_daa.pdf').closest('[data-cy="document-upload-card"]')!
    expect(card.querySelector('[data-cy="document-upload-deleted-status"]')).toBeInTheDocument()
    expect(card.querySelector('[data-cy="document-upload-delete"]')).toBeDisabled()
  })

  it('shows the deleted toggle even when all documents are deleted', async () => {
    const api = {
      uploadDocument: vi.fn().mockResolvedValue({} as never),
      deleteDocument: vi.fn().mockResolvedValue({} as never),
      listDocuments: vi.fn().mockResolvedValue([
        {
          fileStorageObjectId: 953,
          entityId: 'dac-96',
          fileName: 'only-deleted.pdf',
          category: FileCategory.DATA_ACCESS_AGREEMENT,
          mediaType: 'application/pdf',
          createUserId: 1,
          createDate: Date.now(),
          deleted: true,
        },
      ]),
    }

    render(
      <DocumentUpload
        entity={EntityType.DAC}
        entityId="dac-96"
        categories={[FileCategory.DATA_ACCESS_AGREEMENT]}
        api={api}
      />,
    )

    await waitFor(() => {
      expect(document.querySelector('[data-cy="document-upload-toggle-deleted"]')).toBeInTheDocument()
    })

    expect(screen.queryByText('only-deleted.pdf')).not.toBeInTheDocument()
    await userEvent.click(document.querySelector('[data-cy="document-upload-toggle-deleted"]')!)
    expect(screen.getByText('only-deleted.pdf')).toBeInTheDocument()
    expect(document.querySelector('[data-cy="document-upload-empty-state"]')).toBeNull()
  })

  it('toggles deleted document visibility inline', async () => {
    const api = {
      uploadDocument: vi.fn().mockResolvedValue({} as never),
      deleteDocument: vi.fn().mockResolvedValue({} as never),
      listDocuments: vi.fn().mockResolvedValue([
        {
          fileStorageObjectId: 951,
          entityId: 'dac-95',
          fileName: 'active_daa.pdf',
          category: FileCategory.DATA_ACCESS_AGREEMENT,
          mediaType: 'application/pdf',
          createUserId: 1,
          createDate: Date.now(),
        },
        {
          fileStorageObjectId: 952,
          entityId: 'dac-95',
          fileName: 'deleted_daa_hidden_by_default.pdf',
          category: FileCategory.DATA_ACCESS_AGREEMENT,
          mediaType: 'application/pdf',
          createUserId: 1,
          createDate: Date.now(),
          deleted: true,
        },
      ]),
    }

    render(
      <DocumentUpload
        entity={EntityType.DAC}
        entityId="dac-95"
        categories={[FileCategory.DATA_ACCESS_AGREEMENT]}
        api={api}
      />,
    )

    await waitFor(() => expect(screen.getByText('active_daa.pdf')).toBeInTheDocument())
    expect(screen.queryByText('deleted_daa_hidden_by_default.pdf')).not.toBeInTheDocument()

    const toggle = document.querySelector('[data-cy="document-upload-toggle-deleted"]')!
    expect(toggle).toHaveTextContent('Show deleted')
    await userEvent.click(toggle)
    expect(screen.getByText('deleted_daa_hidden_by_default.pdf')).toBeInTheDocument()

    expect(toggle).toHaveTextContent('Hide deleted')
    await userEvent.click(toggle)
    expect(screen.queryByText('deleted_daa_hidden_by_default.pdf')).not.toBeInTheDocument()
  })

  it('re-syncs deleted visibility when the deletedDocumentsView prop changes', async () => {
    const api = {
      uploadDocument: vi.fn().mockResolvedValue({} as never),
      deleteDocument: vi.fn().mockResolvedValue({} as never),
      listDocuments: vi.fn().mockResolvedValue([
        {
          fileStorageObjectId: 961,
          entityId: 'dac-96',
          fileName: 'active_daa.pdf',
          category: FileCategory.DATA_ACCESS_AGREEMENT,
          mediaType: 'application/pdf',
          createUserId: 1,
          createDate: Date.now(),
        },
        {
          fileStorageObjectId: 962,
          entityId: 'dac-96',
          fileName: 'deleted_daa_resync.pdf',
          category: FileCategory.DATA_ACCESS_AGREEMENT,
          mediaType: 'application/pdf',
          createUserId: 1,
          createDate: Date.now(),
          deleted: true,
        },
      ]),
    }

    const element = (view: 'active' | 'all') => (
      <DocumentUpload
        entity={EntityType.DAC}
        entityId="dac-96"
        categories={[FileCategory.DATA_ACCESS_AGREEMENT]}
        deletedDocumentsView={view}
        api={api}
      />
    )

    const { rerender } = render(element('active'))

    await waitFor(() => expect(screen.getByText('active_daa.pdf')).toBeInTheDocument())
    expect(screen.queryByText('deleted_daa_resync.pdf')).not.toBeInTheDocument()

    // Changing the prop to 'all' should reveal deleted documents.
    rerender(element('all'))
    expect(screen.getByText('deleted_daa_resync.pdf')).toBeInTheDocument()

    // Changing it back to 'active' should hide them again.
    rerender(element('active'))
    expect(screen.queryByText('deleted_daa_resync.pdf')).not.toBeInTheDocument()
  })

  it('supports viewing documents and loading details from getDocument', async () => {
    const getDocumentStub = vi.fn().mockResolvedValue({
      fileStorageObjectId: 777,
      entityId: 'dar-7',
      fileName: 'viewable.pdf',
      category: FileCategory.DATA_USE_LETTER,
      mediaType: 'application/pdf',
      createUserId: 1,
      createDate: 1710000000000,
      updateDate: 1710000500000,
      deleteDate: 1710000700000,
      deleted: true,
    })

    const previewDocument = document.implementation.createHTMLDocument('')
    const previewWindow = { document: previewDocument }
    vi.spyOn(window, 'open').mockReturnValue(previewWindow as never)

    const documentBlob = new Blob(['pdf'], { type: 'application/pdf' })

    const api = {
      uploadDocument: vi.fn().mockResolvedValue({} as never),
      deleteDocument: vi.fn().mockResolvedValue({} as never),
      listDocuments: vi.fn().mockResolvedValue([
        {
          fileStorageObjectId: 777,
          entityId: 'dar-7',
          fileName: 'viewable.pdf',
          category: FileCategory.DATA_USE_LETTER,
          mediaType: 'application/pdf',
          createUserId: 1,
          createDate: Date.now(),
        },
      ]),
      getDocumentFile: vi.fn().mockResolvedValue(documentBlob),
      getDocument: getDocumentStub,
    }

    render(
      <DocumentUpload
        entity={EntityType.DAR}
        entityId="dar-7"
        api={api}
      />,
    )

    await waitFor(() => expect(screen.getByText('viewable.pdf')).toBeInTheDocument())

    const card = screen.getByText('viewable.pdf').closest('[data-cy="document-upload-card"]')!
    await userEvent.click(card.querySelector('[data-cy="document-upload-view"]') as HTMLElement)
    await userEvent.click(card.querySelector('[data-cy="document-upload-details-toggle"]') as HTMLElement)

    await waitFor(() => {
      expect(window.open).toHaveBeenCalledOnce()
      // Component wraps the blob in new File([blob], doc.file.name, {type}) before passing to createObjectURL
      expect(URL.createObjectURL).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'viewable.pdf', type: 'application/pdf' }),
      )
    })

    expect(previewWindow.document.title).toBe('viewable.pdf')
    const iframe = previewDocument.querySelector('iframe')
    expect(iframe).not.toBeNull()
    expect(iframe!.title).toBe('viewable.pdf')
    expect(iframe!.getAttribute('src')).toBe('blob:test')

    await waitFor(() => {
      expect(getDocumentStub).toHaveBeenCalledWith(EntityType.DAR, 'dar-7', 777)
    })

    await waitFor(() => {
      expect(document.querySelector('[data-cy="document-upload-details"]')).toHaveTextContent('Document ID: 777')
      expect(document.querySelector('[data-cy="document-upload-details"]')).toHaveTextContent('Deleted:')
    })

    expect(document.querySelector('[data-cy="document-upload-details"]')).not.toHaveTextContent('Deleted On:')
  })

  it('does not inject uploaded PDF filenames into preview HTML', async () => {
    // Payload that would inject `onerror` onto the <iframe> element and a stray <img>
    // if the preview code used string interpolation instead of safe DOM property assignment.
    const maliciousFileName = 'report" onerror="alert(1)"><img src=x'

    const previewDocument = document.implementation.createHTMLDocument('')
    vi.spyOn(window, 'open').mockReturnValue({ document: previewDocument } as never)

    const api = {
      uploadDocument: vi.fn().mockResolvedValue({} as never),
      deleteDocument: vi.fn().mockResolvedValue({} as never),
      listDocuments: vi.fn().mockResolvedValue([
        {
          fileStorageObjectId: 778,
          entityId: 'dar-8',
          fileName: maliciousFileName,
          category: FileCategory.DATA_USE_LETTER,
          mediaType: 'application/pdf',
          createUserId: 1,
          createDate: Date.now(),
        },
      ]),
      getDocumentFile: vi.fn().mockResolvedValue(new Blob(['pdf'], { type: 'application/pdf' })),
    }

    render(
      <DocumentUpload
        entity={EntityType.DAR}
        entityId="dar-8"
        api={api}
      />,
    )

    await waitFor(() => expect(screen.getByText(maliciousFileName)).toBeInTheDocument())

    const card = screen.getByText(maliciousFileName).closest('[data-cy="document-upload-card"]')!
    await userEvent.click(card.querySelector('[data-cy="document-upload-view"]') as HTMLElement)

    await waitFor(() => expect(window.open).toHaveBeenCalledOnce())

    const iframe = previewDocument.querySelector('iframe')
    expect(iframe).not.toBeNull()
    expect(iframe!.title).toBe(maliciousFileName)
    expect(iframe!.getAttribute('onerror')).toBeNull()
    expect(previewDocument.querySelector('img')).toBeNull()
    expect(previewDocument.body.children).toHaveLength(1)
  })

  it('updates category for an uploaded document', async () => {
    const updateCategoryStub = vi.fn().mockResolvedValue({} as never)
    const api = {
      uploadDocument: vi.fn().mockResolvedValue({} as never),
      deleteDocument: vi.fn().mockResolvedValue({} as never),
      listDocuments: vi.fn().mockResolvedValue([
        {
          fileStorageObjectId: 1101,
          entityId: 'dataset-11',
          fileName: 'editable-category.pdf',
          category: FileCategory.DATA_ACCESS_AGREEMENT,
          mediaType: 'application/pdf',
          createUserId: 1,
          createDate: Date.now(),
        },
      ]),
      updateDocumentCategory: updateCategoryStub,
    }

    render(
      <DocumentUpload
        entity={EntityType.DATASET}
        entityId="dataset-11"
        api={api}
      />,
    )

    await waitFor(() => expect(screen.getByText('editable-category.pdf')).toBeInTheDocument())

    const card = screen.getByText('editable-category.pdf').closest('[data-cy="document-upload-card"]')!
    const categorySelect = card.querySelector('[data-cy="document-upload-category-select"]') as HTMLElement
    const combobox = categorySelect.querySelector('[role="combobox"]') ?? categorySelect
    fireEvent.mouseDown(combobox)

    const option = await screen.findByRole('option', { name: 'Data Use Letter' })
    await userEvent.click(option)

    await waitFor(() => {
      expect(updateCategoryStub).toHaveBeenCalledWith(EntityType.DATASET, 'dataset-11', 1101, FileCategory.DATA_USE_LETTER)
    })
  })

  it('does not open the file browser when clicking the document type section', async () => {
    const api = {
      uploadDocument: vi.fn().mockResolvedValue({} as never),
      deleteDocument: vi.fn().mockResolvedValue({} as never),
      listDocuments: vi.fn().mockResolvedValue([]),
    }

    render(
      <DocumentUpload
        entity={EntityType.DAC}
        entityId="dac-type-click"
        api={api}
      />,
    )

    const fileInput = document.querySelector('[data-cy="document-upload-input"]') as HTMLInputElement
    const clickSpy = vi.spyOn(fileInput, 'click').mockImplementation(() => {})

    fireEvent.click(document.querySelector('[data-cy="document-upload-type-section"]')!)
    expect(clickSpy).not.toHaveBeenCalled()

    await userEvent.click(document.querySelector(`[data-cy="document-upload-type-${FileCategory.DATA_ACCESS_AGREEMENT}"]`)!)
    expect(clickSpy).not.toHaveBeenCalled()

    fireEvent.click(document.querySelector('[data-cy="document-upload-root"]')!)
    expect(clickSpy).not.toHaveBeenCalled()

    await userEvent.click(document.querySelector('[data-cy="document-upload-dropzone-trigger"]')!)
    expect(clickSpy).toHaveBeenCalledOnce()
  })

  it('opens the file browser from the dropzone with keyboard input', async () => {
    const api = {
      uploadDocument: vi.fn().mockResolvedValue({} as never),
      deleteDocument: vi.fn().mockResolvedValue({} as never),
      listDocuments: vi.fn().mockResolvedValue([]),
    }

    render(
      <DocumentUpload
        entity={EntityType.DAC}
        entityId="dac-keyboard"
        api={api}
      />,
    )

    await userEvent.click(document.querySelector(`[data-cy="document-upload-type-${FileCategory.DATA_ACCESS_AGREEMENT}"]`)!)

    const fileInput = document.querySelector('[data-cy="document-upload-input"]') as HTMLInputElement
    const clickSpy = vi.spyOn(fileInput, 'click').mockImplementation(() => {})

    const dropzoneTrigger = document.querySelector('[data-cy="document-upload-dropzone-trigger"]') as HTMLElement
    dropzoneTrigger.focus()
    await userEvent.keyboard('{Enter}')

    expect(clickSpy).toHaveBeenCalledOnce()
  })

  it('renders read-only mode with documents and no upload actions', async () => {
    const api = {
      uploadDocument: vi.fn().mockResolvedValue({} as never),
      deleteDocument: vi.fn().mockResolvedValue({} as never),
      listDocuments: vi.fn().mockResolvedValue([
        {
          fileStorageObjectId: 808,
          entityId: 'dac-8',
          fileName: 'existing_daa.pdf',
          category: FileCategory.DATA_ACCESS_AGREEMENT,
          mediaType: 'application/pdf',
          createUserId: 1,
          createDate: Date.now(),
        },
      ]),
    }

    render(
      <DocumentUpload
        entity={EntityType.DAC}
        entityId="dac-8"
        categories={[FileCategory.DATA_ACCESS_AGREEMENT]}
        readOnly={true}
        api={api}
      />,
    )

    await waitFor(() => expect(screen.getByText('existing_daa.pdf')).toBeInTheDocument())

    expect(document.querySelector('[data-cy="document-upload-dropzone"]')).toBeNull()
    expect(document.querySelector('[data-cy="document-upload-delete"]')).toBeDisabled()
    expect(document.querySelector('[data-cy="document-upload-retry"]')).toBeNull()
  })
})
