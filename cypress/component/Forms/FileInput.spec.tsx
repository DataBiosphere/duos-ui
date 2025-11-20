import { mount } from 'cypress/react'
import React from 'react'
import { BrowserRouter } from 'react-router-dom'
import { FileInput } from 'src/components/forms/FileInput'

const baseProps = {
  defaultValue: undefined,
  description: 'An important file description.',
  async onAddFile() {
  },
  async onDeleteFile() {
  },
  id: 'testFileUpload',
  title: 'File Upload Test',
  required: false,
}

describe('File Input - Tests', () => {
  it('should render a file input control', () => {
    mount(<FileInput {...baseProps} />)
    cy.get('#lbl_testFileUpload').contains('File Upload Test')
    cy.get('div').contains('An important file description.')
    cy.get('button').contains('Add a file')
  })
  it('should render a file input control with a required indicator', () => {
    const customProps = { ...baseProps }
    customProps.required = true
    mount(<FileInput {...customProps} />)
    cy.get('#lbl_testFileUpload').contains('File Upload Test*')
    cy.get('button').contains('Add a file')
  })

  it('should trigger onAddFile when file is added.', () => {
    const customProps = { ...baseProps }
    customProps.onAddFile = cy.spy().as('onAddFileSpy')
    customProps.onDeleteFile = cy.spy().as('onDeleteFileSpy')
    mount(<BrowserRouter><FileInput {...customProps} /></BrowserRouter>)
    cy.get('input[type="file"]').as('fileUpload')
    cy.get('button').click()
    cy.get('@fileUpload').invoke('show')
    cy.get('@fileUpload').selectFile('cypress/resources/blank.pdf')
    cy.get('@fileUpload').invoke('hide')
    cy.get('@onAddFileSpy').should('have.been.called')
    cy.get('span').contains('blank.pdf')
    cy.get('a').should('have.class', 'glyphicon glyphicon-trash')
    cy.get('a').click({ force: true })
    cy.get('button').contains('Confirm').click()
    cy.get('@onDeleteFileSpy').should('have.been.called')
  })
})
