import React from 'react'
import { UploadDaaModal } from 'src/components/modals/UploadDaaModal'
import { EntityType, FileCategory } from 'src/libs/ajax/FileStorageObject'
import type { FileStorageObject } from 'src/libs/ajax/FileStorageObject'
import type { Props as DocumentUploadProps } from 'src/components/forms/DocumentUpload'

describe('UploadDaaModal Component', () => {
  const fileName = 'test-file.pdf'
  const fileContent = 'test content'

  const mountModal = (overrides?: {
    showModal?: boolean
    isLiveUpload?: boolean
    documentUploadApi?: DocumentUploadProps['api']
    onAttachmentChange?: Cypress.Agent<sinon.SinonStub>
    onCloseRequest?: Cypress.Agent<sinon.SinonStub>
  }) => {
    const onAttachmentChange = overrides?.onAttachmentChange ?? cy.stub()
    const onCloseRequest = overrides?.onCloseRequest ?? cy.stub()

    cy.mount(
      <UploadDaaModal
        showModal={overrides?.showModal ?? true}
        isLiveUpload={overrides?.isLiveUpload}
        documentUploadApi={overrides?.documentUploadApi}
        onAttachmentChange={onAttachmentChange}
        onCloseRequest={onCloseRequest}
      />,
    )

    return { onAttachmentChange, onCloseRequest }
  }

  const uploadTestFile = (name: string = fileName) => {
    cy.get('.ReactModalPortal input[type="file"]').selectFile(
      {
        contents: Cypress.Buffer.from(fileContent),
        fileName: name,
        mimeType: 'application/pdf',
      },
      { force: true },
    )
  }

  const buildStoredDocument = (
    fileStorageObjectId: number,
    fileName: string,
    category: FileCategory,
  ): FileStorageObject => {
    return {
      fileStorageObjectId,
      entityId: 'test-dac-id',
      fileName,
      category,
      mediaType: 'application/pdf',
      createUserId: 1,
      createDate: Date.now(),
    }
  }

  const buildDocumentUploadApi = (overrides?: Partial<NonNullable<DocumentUploadProps['api']>>): NonNullable<DocumentUploadProps['api']> => {
    return {
      uploadDocument: async (_entity, _entityId, file, category) => {
        return buildStoredDocument(500, file.name, category)
      },
      deleteDocument: async () => ({}) as never,
      listDocuments: async () => [],
      ...overrides,
    }
  }

  it('renders modal when showModal is true', () => {
    mountModal()
    cy.contains('Upload Documents').should('be.visible')
  })

  it('does not render modal when showModal is false', () => {
    mountModal({ showModal: false })
    cy.contains('Upload Documents').should('not.exist')
  })

  it('calls onCloseRequest when Cancel button is clicked', () => {
    const onCloseRequest = cy.stub()
    mountModal({ onCloseRequest })

    cy.get('#btn_cancel').click()
    cy.wrap(onCloseRequest).should('have.been.calledOnce')
  })

  it('keeps Save disabled when no file is selected', () => {
    const { onAttachmentChange, onCloseRequest } = mountModal()

    cy.get('#btn_save').should('be.disabled')
    cy.get('#btn_save').click({ force: true })

    cy.wrap(onAttachmentChange).should('not.have.been.called')
    cy.wrap(onCloseRequest).should('not.have.been.called')
  })

  it('live mode uploads first, then enables Save and returns uploaded files only', () => {
    const onAttachmentChange = cy.stub()
    const onCloseRequest = cy.stub()
    const documentUploadApi = buildDocumentUploadApi()

    mountModal({ onAttachmentChange, onCloseRequest, documentUploadApi })

    uploadTestFile()

    cy.get('#btn_save').should('not.be.disabled').click()

    cy.wrap(onAttachmentChange).should('have.been.calledOnce')
    cy.wrap(onAttachmentChange).its('firstCall.args.0').should('have.length', 1)
    cy.wrap(onAttachmentChange).its('firstCall.args.0.0.name').should('equal', fileName)
    cy.wrap(onCloseRequest).should('have.been.calledOnce')
  })

  it('non-live mode enables Save after staging and does not call uploadDocument', () => {
    const onAttachmentChange = cy.stub()
    const uploadSpy = cy.stub().callsFake(async (_entity: EntityType, _entityId: string, file: File, category: FileCategory) => {
      return buildStoredDocument(777, file.name, category)
    })
    const documentUploadApi = buildDocumentUploadApi({
      uploadDocument: uploadSpy as NonNullable<DocumentUploadProps['api']>['uploadDocument'],
    })
    mountModal({ onAttachmentChange, isLiveUpload: false, documentUploadApi })

    uploadTestFile('deferred-file.pdf')
    cy.get('#btn_save').should('not.be.disabled').click()

    cy.wrap(uploadSpy).should('not.have.been.called')
    cy.wrap(onAttachmentChange).should('have.been.calledOnce')
    cy.wrap(onAttachmentChange).its('firstCall.args.0').should('have.length', 1)
    cy.wrap(onAttachmentChange).its('firstCall.args.0.0.name').should('equal', 'deferred-file.pdf')
  })

  it('only returns newly uploaded files when existing docs are present', () => {
    const onAttachmentChange = cy.stub()
    const documentUploadApi = buildDocumentUploadApi({
      listDocuments: async () => {
        return [
          buildStoredDocument(1, 'existing-daa.pdf', FileCategory.DATA_ACCESS_AGREEMENT),
        ]
      },
      uploadDocument: async (_entity, _entityId, file, category) => {
        return buildStoredDocument(501, file.name, category)
      },
    })

    mountModal({ onAttachmentChange, documentUploadApi })

    uploadTestFile('new-daa.pdf')
    cy.get('#btn_save').should('not.be.disabled').click()

    cy.wrap(onAttachmentChange).should('have.been.calledOnce')
    cy.wrap(onAttachmentChange).its('firstCall.args.0').should('have.length', 1)
    cy.wrap(onAttachmentChange).its('firstCall.args.0.0.name').should('equal', 'new-daa.pdf')
  })
})
