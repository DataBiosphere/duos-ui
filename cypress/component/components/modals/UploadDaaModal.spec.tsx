import React from 'react'
import { UploadDaaModal } from 'src/components/modals/UploadDaaModal'
import { EntityType, FileCategory } from 'src/libs/ajax/FileStorageObject'
import type { FileStorageObject } from 'src/libs/ajax/FileStorageObject'
import type { Props as DocumentUploadProps } from 'src/components/forms/DocumentUpload'

// --- Shared helpers and constants ---
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
  cy.get('input[data-cy="document-upload-input"]').selectFile(
    {
      contents: Cypress.Buffer.from(fileContent),
      fileName: name,
      mimeType: 'application/pdf',
    },
    { force: true },
  )
}

const waitForUploaderReady = () => {
  cy.get('[data-cy="document-upload-fixed-category"]').should('contain.text', 'Data Access Agreement')
  cy.get('[data-cy="document-upload-dropzone"]').should('exist')
}

const waitForSaveEnabled = () => {
  cy.contains('[data-cy="document-upload-status"]', 'Uploaded', { timeout: 10000 }).should('exist')
  cy.get('#btn_save').should('not.be.disabled')
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

/**
 * Shared test for non-live mode Save enablement and uploadDocument not called.
 * @param opts Optional overrides: tick (ms) to advance clock, fileName for upload, clocked (bool)
 */
function testNonLiveModeSave({ tick, fileName = 'deferred-file.pdf', clocked = false }: { tick?: number, fileName?: string, clocked?: boolean }) {
  const onAttachmentChange = cy.stub()
  const uploadSpy = cy.stub().callsFake(async (_entity: EntityType, _entityId: string, file: File, category: FileCategory) => {
    return buildStoredDocument(777, file.name, category)
  })
  const documentUploadApi = buildDocumentUploadApi({
    uploadDocument: uploadSpy as NonNullable<DocumentUploadProps['api']>['uploadDocument'],
  })
  mountModal({ onAttachmentChange, isLiveUpload: false, documentUploadApi })

  waitForUploaderReady()
  uploadTestFile(fileName)
  if (clocked && tick) cy.tick(tick)
  else waitForSaveEnabled()
  cy.get('#btn_save').should('not.be.disabled')
  cy.get('#btn_save').click()

  cy.wrap(uploadSpy).should('not.have.been.called')
  cy.wrap(onAttachmentChange).should('have.been.calledOnce')
  cy.wrap(onAttachmentChange).its('firstCall.args.0').should('have.length', 1)
  cy.wrap(onAttachmentChange).its('firstCall.args.0.0.name').should('equal', fileName)
}

describe('UploadDaaModal Component', () => {
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

    waitForUploaderReady()
    uploadTestFile()

    waitForSaveEnabled()
    cy.get('#btn_save').click()

    cy.wrap(onAttachmentChange).should('have.been.calledOnce')
    cy.wrap(onAttachmentChange).its('firstCall.args.0').should('have.length', 1)
    cy.wrap(onAttachmentChange).its('firstCall.args.0.0.name').should('equal', fileName)
    cy.wrap(onCloseRequest).should('have.been.calledOnce')
  })

  it('non-live mode enables Save after staging and does not call uploadDocument', () => {
    testNonLiveModeSave({})
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

    waitForUploaderReady()
    uploadTestFile('new-daa.pdf')
    waitForSaveEnabled()
    cy.get('#btn_save').click()

    cy.wrap(onAttachmentChange).should('have.been.calledOnce')
    cy.wrap(onAttachmentChange).its('firstCall.args.0').should('have.length', 1)
    cy.wrap(onAttachmentChange).its('firstCall.args.0.0.name').should('equal', 'new-daa.pdf')
  })
})

describe('UploadDaaModal Component (clocked)', () => {
  beforeEach(() => {
    cy.clock()
  })

  it('live mode uploads first, then enables Save and returns uploaded files only (clocked)', () => {
    const onAttachmentChange = cy.stub()
    const onCloseRequest = cy.stub()
    const documentUploadApi = buildDocumentUploadApi()

    mountModal({ onAttachmentChange, onCloseRequest, documentUploadApi })
    waitForUploaderReady()
    uploadTestFile()

    // Advance time to trigger any timers (simulate upload completion, etc.)
    cy.tick(1000)
    cy.contains('[data-cy="document-upload-status"]', 'Uploaded').should('exist')
    cy.get('#btn_save').should('not.be.disabled')
    cy.get('#btn_save').click()

    cy.wrap(onAttachmentChange).should('have.been.calledOnce')
    cy.wrap(onAttachmentChange).its('firstCall.args.0').should('have.length', 1)
    cy.wrap(onAttachmentChange).its('firstCall.args.0.0.name').should('equal', fileName)
    cy.wrap(onCloseRequest).should('have.been.calledOnce')
  })

  it('non-live mode enables Save after staging and does not call uploadDocument (clocked)', () => {
    testNonLiveModeSave({ tick: 1000, clocked: true })
  })
})
