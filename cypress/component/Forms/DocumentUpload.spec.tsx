import React from 'react'
import { DocumentUpload } from 'src/components/forms/DocumentUpload'
import { EntityType, FileCategory } from 'src/libs/ajax/FileStorageObject'

const selectPdf = (name: string) => {
  cy.get('[data-cy="document-upload-input"]').selectFile(
    {
      contents: Cypress.Buffer.from('test pdf content'),
      fileName: name,
      mimeType: 'application/pdf',
      lastModified: Date.now(),
    },
    { force: true },
  )
}

describe('DocumentUpload', () => {
  it('loads existing documents on mount', () => {
    const listStub = cy.stub().resolves([
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

    const api = {
      uploadDocument: cy.stub().resolves({} as never),
      deleteDocument: cy.stub().resolves({} as never),
      listDocuments: listStub,
    }

    cy.mount(
      <DocumentUpload
        entity={EntityType.DAR}
        entityId="dar-1"
        api={api}
      />,
    )

    cy.wrap(listStub).should('have.been.calledOnce')
    cy.contains('existing_consent.pdf').should('exist')
    cy.get('[data-cy="document-upload-status"]').should('contain.text', 'Uploaded')
    cy.get('[data-cy="document-upload-count"]').should('contain.text', '1')
  })

  it('uploads files immediately and stores uploaded state', () => {
    const onFilesReady = cy.stub().as('filesReady')
    const api = {
      uploadDocument: cy.stub().callsFake(async () => {
        await new Promise(resolve => setTimeout(resolve, 250))
        return {
          fileStorageObjectId: 101,
          entityId: 'dar-1',
          fileName: 'consent.pdf',
          category: FileCategory.IRB_COLLABORATION_LETTER,
          mediaType: 'application/pdf',
          createUserId: 1,
          createDate: Date.now(),
        }
      }),
      deleteDocument: cy.stub().resolves({} as never),
      listDocuments: cy.stub().resolves([]),
    }

    cy.mount(
      <DocumentUpload
        entity={EntityType.DAR}
        entityId="dar-1"
        onFilesReady={onFilesReady}
        api={api}
      />,
    )

    cy.get(`[data-cy="document-upload-type-${FileCategory.IRB_COLLABORATION_LETTER}"]`).click()
    selectPdf('consent.pdf')

    cy.contains('consent.pdf').should('exist')
    cy.get('[data-cy="document-upload-status"]', { timeout: 5000 }).should('contain.text', 'Uploading')
    cy.get('[data-cy="document-upload-status"]', { timeout: 5000 }).should('contain.text', 'Uploaded')
    cy.get('[data-cy="document-upload-count"]').should('contain.text', '1')
    cy.get('@filesReady').should('have.been.called')
  })

  it('stages files in deferred mode without API calls', () => {
    const onFilesReady = cy.stub().as('filesReady')
    const uploadStub = cy.stub().resolves({} as never)
    const api = {
      uploadDocument: uploadStub,
      deleteDocument: cy.stub().resolves({} as never),
      listDocuments: cy.stub().resolves([]),
    }

    cy.mount(
      <DocumentUpload
        entity={EntityType.DATASET}
        entityId="dataset-1"
        isLiveUpload={false}
        onFilesReady={onFilesReady}
        api={api}
      />,
    )

    cy.get(`[data-cy="document-upload-type-${FileCategory.DATA_USE_LETTER}"]`).click()
    selectPdf('dua.pdf')

    cy.get('[data-cy="document-upload-status"]', { timeout: 5000 }).should('contain.text', 'Uploaded')
    cy.get('@filesReady').should('have.been.calledOnce')
    cy.wrap(null).then(() => {
      const [[files]] = onFilesReady.args
      expect(files).to.have.length(1)
      expect(files[0].category).to.equal(FileCategory.DATA_USE_LETTER)
      expect(files[0].file.name).to.equal('dua.pdf')
    })
    cy.wrap(uploadStub).should('not.have.been.called')
  })

  it('maps upload errors and retries failed uploads', () => {
    const uploadStub = cy.stub()
      .onFirstCall()
      .rejects({ response: { status: 403 } })
      .onSecondCall()
      .resolves({
        fileStorageObjectId: 222,
        entityId: 'dac-9',
        fileName: 'letter.pdf',
        category: FileCategory.DATA_ACCESS_AGREEMENT,
        mediaType: 'application/pdf',
        createUserId: 1,
        createDate: Date.now(),
      })

    const api = {
      uploadDocument: uploadStub,
      deleteDocument: cy.stub().resolves({} as never),
      listDocuments: cy.stub().resolves([]),
    }

    cy.mount(
      <DocumentUpload
        entity={EntityType.DAC}
        entityId="dac-9"
        api={api}
      />,
    )

    cy.get(`[data-cy="document-upload-type-${FileCategory.DATA_ACCESS_AGREEMENT}"]`).click()
    selectPdf('letter.pdf')

    cy.get('[data-cy="document-upload-error"]', { timeout: 5000 })
      .should('contain.text', 'No permission')

    cy.get('[data-cy="document-upload-retry"]').click()
    cy.get('[data-cy="document-upload-status"]', { timeout: 5000 }).should('contain.text', 'Uploaded')
    cy.get('[data-cy="document-upload-error"]').should('not.exist')
  })

  it('deletes uploaded documents and calls API', () => {
    const deleteStub = cy.stub().resolves({} as never)
    const api = {
      uploadDocument: cy.stub().callsFake(async () => {
        await new Promise(resolve => setTimeout(resolve, 250))
        return {
          fileStorageObjectId: 303,
          entityId: 'dataset-5',
          fileName: 'data.pdf',
          category: FileCategory.DATA_USE_LETTER,
          mediaType: 'application/pdf',
          createUserId: 1,
          createDate: Date.now(),
        }
      }),
      deleteDocument: deleteStub,
      listDocuments: cy.stub().resolves([]),
    }

    cy.mount(
      <DocumentUpload
        entity={EntityType.DATASET}
        entityId="dataset-5"
        api={api}
      />,
    )

    cy.get(`[data-cy="document-upload-type-${FileCategory.DATA_USE_LETTER}"]`).click()
    selectPdf('data.pdf')

    cy.get('[data-cy="document-upload-status"]', { timeout: 5000 }).should('contain.text', 'Uploaded')
    cy.get('[data-cy="document-upload-delete"]').click()
    cy.wrap(deleteStub).should('have.been.calledOnceWith', EntityType.DATASET, 'dataset-5', 303)
    cy.contains('data.pdf').should('not.exist')
  })

  it('uses fixed category and bypasses type selection', () => {
    const api = {
      uploadDocument: cy.stub().callsFake(async () => ({
        fileStorageObjectId: 404,
        entityId: 'dac-7',
        fileName: 'daa.pdf',
        category: FileCategory.DATA_ACCESS_AGREEMENT,
        mediaType: 'application/pdf',
        createUserId: 1,
        createDate: Date.now(),
      })),
      deleteDocument: cy.stub().resolves({} as never),
      listDocuments: cy.stub().resolves([]),
    }

    cy.mount(
      <DocumentUpload
        entity={EntityType.DAC}
        entityId="dac-7"
        categories={[FileCategory.DATA_ACCESS_AGREEMENT]}
        api={api}
      />,
    )

    cy.get('[data-cy="document-upload-fixed-category"]').should('contain.text', 'Data Access Agreement')
    cy.get('[data-cy="document-upload-type-list"]').should('not.exist')
    selectPdf('daa.pdf')
    cy.get('[data-cy="document-upload-status"]', { timeout: 5000 }).should('contain.text', 'Uploaded')
  })

  it('shows deleted documents when configured and keeps delete disabled', () => {
    const api = {
      uploadDocument: cy.stub().resolves({} as never),
      deleteDocument: cy.stub().resolves({} as never),
      listDocuments: cy.stub().resolves([
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

    cy.mount(
      <DocumentUpload
        entity={EntityType.DAC}
        entityId="dac-9"
        categories={[FileCategory.DATA_ACCESS_AGREEMENT]}
        deletedDocumentsView="all"
        api={api}
      />,
    )

    cy.contains('deleted_daa.pdf')
      .closest('[data-cy="document-upload-card"]')
      .within(() => {
        cy.get('[data-cy="document-upload-deleted-status"]').should('exist')
        cy.get('[data-cy="document-upload-delete"]').should('be.disabled')
      })
  })

  it('shows the deleted toggle even when all documents are deleted', () => {
    const api = {
      uploadDocument: cy.stub().resolves({} as never),
      deleteDocument: cy.stub().resolves({} as never),
      listDocuments: cy.stub().resolves([
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

    cy.mount(
      <DocumentUpload
        entity={EntityType.DAC}
        entityId="dac-96"
        categories={[FileCategory.DATA_ACCESS_AGREEMENT]}
        api={api}
      />,
    )

    cy.contains('only-deleted.pdf').should('not.exist')
    cy.get('[data-cy="document-upload-toggle-deleted"]').should('contain.text', 'Show deleted').click()
    cy.contains('only-deleted.pdf').should('exist')
    cy.get('[data-cy="document-upload-empty-state"]').should('not.exist')
  })

  it('toggles deleted document visibility inline', () => {
    const api = {
      uploadDocument: cy.stub().resolves({} as never),
      deleteDocument: cy.stub().resolves({} as never),
      listDocuments: cy.stub().resolves([
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

    cy.mount(
      <DocumentUpload
        entity={EntityType.DAC}
        entityId="dac-95"
        categories={[FileCategory.DATA_ACCESS_AGREEMENT]}
        api={api}
      />,
    )

    cy.contains('active_daa.pdf').should('exist')
    cy.contains('deleted_daa_hidden_by_default.pdf').should('not.exist')
    cy.get('[data-cy="document-upload-toggle-deleted"]').should('contain.text', 'Show deleted').click()
    cy.contains('deleted_daa_hidden_by_default.pdf').should('exist')
    cy.get('[data-cy="document-upload-toggle-deleted"]').should('contain.text', 'Hide deleted').click()
    cy.contains('deleted_daa_hidden_by_default.pdf').should('not.exist')
  })

  it('supports viewing documents and loading details from getDocument', () => {
    const getDocumentStub = cy.stub().resolves({
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

    const api = {
      uploadDocument: cy.stub().resolves({} as never),
      deleteDocument: cy.stub().resolves({} as never),
      listDocuments: cy.stub().resolves([
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
      getDocumentFile: cy.stub().resolves(new Blob(['pdf'], { type: 'application/pdf' })),
      getDocument: getDocumentStub,
    }

    cy.mount(
      <DocumentUpload
        entity={EntityType.DAR}
        entityId="dar-7"
        api={api}
      />,
    )

    cy.window().then((win) => {
      const previewWindow = {
        document: {
          title: '',
          body: {
            style: {},
            innerHTML: '',
          },
        },
      }

      cy.stub(win, 'open').as('windowOpen').returns(previewWindow)
      cy.stub(win.URL, 'createObjectURL').callsFake((file) => {
        expect(file).to.be.instanceOf(File)
        expect((file as File).name).to.equal('viewable.pdf')
        return 'blob:viewable'
      }).as('createObjectURL')

      cy.wrap(previewWindow).as('previewWindow')
    })

    cy.contains('viewable.pdf')
      .closest('[data-cy="document-upload-card"]')
      .within(() => {
        cy.get('[data-cy="document-upload-view"]').click()
        cy.get('[data-cy="document-upload-details-toggle"]').click()
      })

    cy.get('@windowOpen').should('have.been.calledOnce')
    cy.get('@createObjectURL').should('have.been.calledOnce')
    cy.get('@previewWindow').its('document.title').should('equal', 'viewable.pdf')
    cy.get('@previewWindow').its('document.body.innerHTML').should('contain', 'blob:viewable')
    cy.wrap(getDocumentStub).should('have.been.calledOnceWith', EntityType.DAR, 'dar-7', 777)
    cy.get('[data-cy="document-upload-details"]').should('contain.text', 'Document ID: 777')
    cy.get('[data-cy="document-upload-details"]').should('contain.text', 'Deleted:')
    cy.get('[data-cy="document-upload-details"]').should('not.contain.text', 'Deleted On:')
  })

  it('updates category for an uploaded document', () => {
    const updateCategoryStub = cy.stub().resolves({} as never)
    const api = {
      uploadDocument: cy.stub().resolves({} as never),
      deleteDocument: cy.stub().resolves({} as never),
      listDocuments: cy.stub().resolves([
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

    cy.mount(
      <DocumentUpload
        entity={EntityType.DATASET}
        entityId="dataset-11"
        api={api}
      />,
    )

    cy.contains('editable-category.pdf')
      .closest('[data-cy="document-upload-card"]')
      .within(() => {
        cy.get('[data-cy="document-upload-category-select"]').click()
      })
    cy.get('li[role="option"]').contains('Data Use Letter').click()

    cy.wrap(updateCategoryStub).should('have.been.calledOnceWith', EntityType.DATASET, 'dataset-11', 1101, FileCategory.DATA_USE_LETTER)
  })

  it('does not open the file browser when clicking the document type section', () => {
    const api = {
      uploadDocument: cy.stub().resolves({} as never),
      deleteDocument: cy.stub().resolves({} as never),
      listDocuments: cy.stub().resolves([]),
    }

    cy.mount(
      <DocumentUpload
        entity={EntityType.DAC}
        entityId="dac-type-click"
        api={api}
      />,
    )

    cy.get('[data-cy="document-upload-input"]').then(($input) => {
      cy.stub($input[0], 'click').as('inputClick')
    })

    cy.get('[data-cy="document-upload-type-section"]').click('topLeft')
    cy.get('@inputClick').should('not.have.been.called')

    cy.get(`[data-cy="document-upload-type-${FileCategory.DATA_ACCESS_AGREEMENT}"]`).click()
    cy.get('@inputClick').should('not.have.been.called')

    cy.get('[data-cy="document-upload-root"]').click('topLeft')
    cy.get('@inputClick').should('not.have.been.called')

    cy.get('[data-cy="document-upload-dropzone-trigger"]').click()
    cy.get('@inputClick').should('have.been.calledOnce')
  })

  it('opens the file browser from the dropzone with keyboard input', () => {
    const api = {
      uploadDocument: cy.stub().resolves({} as never),
      deleteDocument: cy.stub().resolves({} as never),
      listDocuments: cy.stub().resolves([]),
    }

    cy.mount(
      <DocumentUpload
        entity={EntityType.DAC}
        entityId="dac-keyboard"
        api={api}
      />,
    )

    cy.get('[data-cy="document-upload-input"]').then(($input) => {
      cy.stub($input[0], 'click').as('keyboardInputClick')
    })

    cy.get(`[data-cy="document-upload-type-${FileCategory.DATA_ACCESS_AGREEMENT}"]`).click()
    cy.get('[data-cy="document-upload-dropzone-trigger"]').focus()
    cy.get('[data-cy="document-upload-dropzone-trigger"]').type('{enter}')
    cy.get('@keyboardInputClick').should('have.been.calledOnce')
  })

  it('renders read-only mode with documents and no upload actions', () => {
    const api = {
      uploadDocument: cy.stub().resolves({} as never),
      deleteDocument: cy.stub().resolves({} as never),
      listDocuments: cy.stub().resolves([
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

    cy.mount(
      <DocumentUpload
        entity={EntityType.DAC}
        entityId="dac-8"
        categories={[FileCategory.DATA_ACCESS_AGREEMENT]}
        readOnly={true}
        api={api}
      />,
    )

    cy.get('[data-cy="document-upload-dropzone"]').should('not.exist')
    cy.contains('existing_daa.pdf').should('exist')
    cy.get('[data-cy="document-upload-delete"]').should('be.disabled')
    cy.get('[data-cy="document-upload-retry"]').should('not.exist')
  })
})
