import React from 'react'
import { DraftFileUpload } from 'src/components/forms/DraftFileUpload'
import { BrowserRouter } from 'react-router-dom'
import { FileStorageObject } from 'src/types/model'

const baseProps = {
  defaultValue: undefined,
  description: 'An important file description.',
  draftId: '',
  async onAddFile() {
  },
  async onDeleteFile() {
  },
  id: 'testFileUpload',
  title: 'File Upload Test',
  required: false,
}

const baseFso = {
  fileStorageObjectId: 1234,
  entityId: 'abcd',
  fileName: 'blank.pdf',
  category: 'draftUploadedFile',
  mediaType: 'application/pdf',
  createUserId: 1,
  createDate: 1,
  updateUserId: 1,
  updateDate: 1,
  deleteUserId: -1,
  deleteDate: -1,
  deleted: false,
} as FileStorageObject

describe('Draft File Upload - Tests', () => {
  it('should render a draft file upload control', () => {
    cy.mount(<DraftFileUpload {...baseProps} />)
    cy.get('#lbl_testFileUpload').contains('File Upload Test')
    cy.get('div').contains('An important file description.')
    cy.get('button').contains('Upload a file')
  })
  it('should render a draft file upload control with a required indicator', () => {
    const customProps = { ...baseProps }
    customProps.required = true
    cy.mount(<DraftFileUpload {...customProps} />)
    cy.get('#lbl_testFileUpload').contains('File Upload Test*')
    cy.get('button').contains('Upload a file')
  })

  it('should trigger onAddFile when file is added.', () => {
    const customProps = { ...baseProps }
    customProps.onAddFile = cy.spy().as('onAddFileSpy')
    cy.mount(<DraftFileUpload {...customProps} />)
    cy.get('input[type="file"]').as('fileUpload')
    cy.get('button').click()
    cy.get('@fileUpload').invoke('show')
    cy.get('@fileUpload').selectFile('cypress/resources/blank.pdf')
    cy.get('@fileUpload').invoke('hide')
    cy.get('@onAddFileSpy').should('have.been.called')
  })

  it('should display file name when defaultValue is FSO.', () => {
    const customProps = { ...baseProps, defaultValue: baseFso }
    cy.mount(<BrowserRouter><DraftFileUpload {...customProps} /></BrowserRouter>)
    cy.get('button').should('be.disabled')
    cy.get('span').contains('blank.pdf')
    cy.get('a').should('have.class', 'glyphicon glyphicon-trash')
  })

  it('should trigger onDelete when file is removed.', () => {
    const customProps = { ...baseProps, defaultValue: baseFso }
    customProps.onDeleteFile = cy.spy().as('onDeleteFileSpy')
    cy.mount(<BrowserRouter><DraftFileUpload {...customProps} /></BrowserRouter>)
    cy.get('a').click({ force: true })
    cy.get('button').contains('Confirm').click()
    cy.get('@onDeleteFileSpy').should('have.been.called')
  })
})
