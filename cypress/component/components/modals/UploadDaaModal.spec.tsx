import React from 'react'
import { UploadDaaModal } from 'src/components/modals/UploadDaaModal'

describe('UploadDaaModal Component', () => {
  const fileName = 'test-file.pdf'
  const fileContent = 'test content'

  const mountModal = (overrides?: {
    showModal?: boolean
    onAttachmentChange?: Cypress.Agent<sinon.SinonStub>
    onCloseRequest?: Cypress.Agent<sinon.SinonStub>
  }) => {
    const onAttachmentChange = overrides?.onAttachmentChange ?? cy.stub()
    const onCloseRequest = overrides?.onCloseRequest ?? cy.stub()

    cy.mount(
      <UploadDaaModal
        showModal={overrides?.showModal ?? true}
        onAttachmentChange={onAttachmentChange}
        onCloseRequest={onCloseRequest}
      />,
    )

    return { onAttachmentChange, onCloseRequest }
  }

  const uploadTestFile = () => {
    cy.get('input[type="file"]').selectFile(
      {
        contents: Cypress.Buffer.from(fileContent),
        fileName,
        mimeType: 'application/pdf',
      },
      { force: true },
    )
  }

  it('renders modal when showModal is true', () => {
    mountModal()
    cy.contains('Upload a file').should('be.visible')
    cy.contains('Drag and drop a file to upload or click to browse files').should('be.visible')
  })

  it('does not render modal when showModal is false', () => {
    mountModal({ showModal: false })
    cy.contains('Upload a file').should('not.exist')
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

  it('enables Save after selecting a file', () => {
    mountModal()

    cy.get('#btn_save').should('be.disabled')
    uploadTestFile()
    cy.contains(fileName).should('be.visible')
    cy.get('#btn_save').should('not.be.disabled')
  })

  it('disables Save again after removing the selected file', () => {
    mountModal()

    uploadTestFile()
    cy.get('#btn_save').should('not.be.disabled')

    cy.get('button[aria-label="Remove file"]').click()
    cy.get('#btn_save').should('be.disabled')
  })

  it('calls onAttachmentChange and onCloseRequest when Save is clicked after file upload', () => {
    const onAttachmentChange = cy.stub()
    const onCloseRequest = cy.stub()
    mountModal({ onAttachmentChange, onCloseRequest })

    uploadTestFile()
    cy.contains(fileName).should('be.visible')

    cy.get('#btn_save').click()

    cy.wrap(onAttachmentChange).should('have.been.calledOnce')
    cy.wrap(onCloseRequest).should('have.been.calledOnce')
  })

  it('removes file when cancel icon is clicked', () => {
    mountModal()

    uploadTestFile()
    cy.contains(fileName).should('be.visible')

    cy.get('button[aria-label="Remove file"]').click()

    cy.contains('Drag and drop a file to upload or click to browse files').should('be.visible')
    cy.contains(fileName).should('not.exist')
  })

  it('displays confirmation message when file is selected', () => {
    mountModal()

    cy.contains('Clicking Save will create this new Data Access Agreement').should('not.exist')

    uploadTestFile()

    cy.contains('Clicking Save will create this new Data Access Agreement').should('be.visible')
  })
})
