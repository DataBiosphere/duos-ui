import React from 'react'
import { extractError, formatSectionedError } from 'src/utils/ErrorUtils'

describe('extractError', () => {
  it('should extract message from Error instance', () => {
    const error = new Error('Fetch failed')
    expect(extractError(error)).to.equal('Fetch failed')
  })

  it('should extract message from ConsentError shape', () => {
    const error = { message: 'Consent error occurred' }
    expect(extractError(error)).to.equal('Consent error occurred')
  })

  it('should return "Unknown error" if message is missing', () => {
    const error = {}
    expect(extractError(error)).to.equal('Unknown error')
  })

  it('should handle non-object error', () => {
    expect(extractError('some string')).to.match(/^Unknown error/)
  })
})

describe('formatSectionedError', () => {
  it('renders preamble and sections correctly', () => {
    const error = `
      Error:
      Please correct the following fields:

      Study:
      Name: must not be empty
      Description: must not be empty

      Dataset:
      Consent Groups: must have at least 1 item
    `
    cy.mount(<>{formatSectionedError(error)}</>)
    cy.contains('Error:').should('exist')
    cy.contains('Please correct the following fields:').should('exist')
    cy.contains('Study:').should('exist')
    cy.contains('Name: must not be empty').should('exist')
    cy.contains('Dataset:').should('exist')
    cy.contains('Consent Groups: must have at least 1 item').should('exist')
  })

  it('handles errors with no sections', () => {
    const error = 'Something went wrong'
    cy.mount(<>{formatSectionedError(error)}</>)
    cy.contains('Something went wrong').should('exist')
  })

  it('uses custom section header regex', () => {
    const error = `
      Models:
      Model 1: missing description
      Workspaces:
      Workspace 1: missing URL
    `
    const regex = /^(Models|Workspaces):/
    cy.mount(<>{formatSectionedError(error, regex)}</>)
    cy.contains('Models:').should('exist')
    cy.contains('Model 1: missing description').should('exist')
    cy.contains('Workspaces:').should('exist')
    cy.contains('Workspace 1: missing URL').should('exist')
  })

  it('renders multiple items in a section', () => {
    const error = `
      Study:
      Name: required
      Description: required
      Data Types: required
    `
    cy.mount(<>{formatSectionedError(error)}</>)
    cy.get('ul').within(() => {
      cy.contains('Name: required').should('exist')
      cy.contains('Description: required').should('exist')
      cy.contains('Data Types: required').should('exist')
    })
  })

  it('renders nothing for empty error', () => {
    cy.mount(<>{formatSectionedError('')}</>)
    cy.get('div').should('exist')
  })
})
