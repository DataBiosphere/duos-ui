import React from 'react'
import CollaboratorChanges from 'src/pages/progress_reports/CollaboratorChanges'
import { Collaborator } from 'src/types/model'
import { FormState } from 'src/pages/progress_reports/ProgressReportFormState'

describe('Collaborator Changes - Component Tests', () => {
  let onFormChangeSpy: () => void
  const countriesOfOperation = ['United States of America (the)', 'France']
  const initialCollaborators: Collaborator[] = [
    {
      name: 'Test User 1',
      title: 'Researcher',
      uuid: '1',
      eraCommonsId: 'user1',
      email: 'user1@example.com',
      countryOfOperation: 'France',
      approverStatus: false,
    },
    {
      name: 'Test User 2',
      title: 'Assistant',
      uuid: '2',
      eraCommonsId: 'user2',
      email: 'user2@example.com',
      approverStatus: false,
      countryOfOperation: 'United States of America (the)',
    },
  ]

  const mountComponent = (customState = {}) => {
    const formState = { ...customState } as FormState

    const props = {
      readOnly: false,
      formState,
      onFormChange: onFormChangeSpy,
      countriesOfOperation: countriesOfOperation,
    }

    return cy.mount(<CollaboratorChanges {...props} />)
  }

  beforeEach(() => {
    onFormChangeSpy = cy.stub().as('formChangeStub')
    mountComponent()
  })

  it('renders the component correctly', () => {
    cy.get('[data-cy=dar-closeout]').should('exist')
    cy.contains('Step 3: Add or Remove Collaborators').should('be.visible')
    cy.contains('3.1 Internal Lab Staff').should('be.visible')
    cy.contains('3.2 Internal Collaborators').should('be.visible')
    cy.contains('3.3 External Collaborators').should('be.visible')
  })

  it('renders all three collaborator sections', () => {
    cy.contains('Internal Lab Staff').should('exist')
    cy.contains('Internal Collaborators').should('exist')
    cy.contains('External Collaborators').should('exist')
  })

  it('displays preloaded internal lab staff', () => {
    mountComponent({ labCollaborators: initialCollaborators })

    cy.contains('Test User 1').should('be.visible')
    cy.contains('Test User 2').should('be.visible')
    cy.contains('Researcher').should('be.visible')
    cy.contains('Assistant').should('be.visible')
  })

  it('displays preloaded internal collaborators', () => {
    mountComponent({ internalCollaborators: initialCollaborators })

    cy.contains('Test User 1').should('be.visible')
    cy.contains('Test User 2').should('be.visible')
  })

  it('displays preloaded external collaborators', () => {
    mountComponent({ externalCollaborators: initialCollaborators })

    cy.contains('Test User 1').should('be.visible')
    cy.contains('Test User 2').should('be.visible')
  })

  it('renders in read-only mode correctly', () => {
    const props = {
      readOnly: true,
      formState: { labCollaborators: initialCollaborators } as FormState,
      onFormChange: onFormChangeSpy,
      countriesOfOperation: countriesOfOperation,
    }

    cy.mount(<CollaboratorChanges {...props} />)

    cy.contains('Test User 1').should('be.visible')
    cy.contains('Test User 2').should('be.visible')
  })

  it('handles empty collaborator lists', () => {
    mountComponent({
      labCollaborators: [],
      internalCollaborators: [],
      externalCollaborators: [],
    })

    cy.contains('Internal Lab Staff').should('exist')
    cy.contains('Internal Collaborators').should('exist')
    cy.contains('External Collaborators').should('exist')
  })

  it('displays correct description text for each collaborator type', () => {
    mountComponent()

    cy.contains('Please add Internal Lab Staff here').should('be.visible')
    cy.contains('Please add Internal Collaborators here').should('be.visible')
    cy.contains('Please list External collaborators here').should('be.visible')

    cy.contains('Internal Lab Staff are defined as users of data from this Data Access Request').should('be.visible')
    cy.contains('Internal Collaborators are defined as individuals who are not under the direct supervision of the PI').should('be.visible')
    cy.contains('External Collaborators are not employees of the Requesting PI').should('be.visible')
  })
})
