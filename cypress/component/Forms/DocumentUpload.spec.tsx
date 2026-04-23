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
        api={api}
      />,
    )

    cy.get(`[data-cy="document-upload-type-${FileCategory.IRB_COLLABORATION_LETTER}"]`).click()
    selectPdf('consent.pdf')

    cy.contains('consent.pdf').should('exist')
    cy.get('[data-cy="document-upload-status"]', { timeout: 5000 }).should('contain.text', 'Uploading')
    cy.get('[data-cy="document-upload-status"]', { timeout: 5000 }).should('contain.text', 'Uploaded')
    cy.get('[data-cy="document-upload-count"]').should('contain.text', '1')
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
        mode="deferred"
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
      .should('contain.text', 'You do not have permission to upload this document.')

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
})
