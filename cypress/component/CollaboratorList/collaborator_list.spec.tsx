import React from 'react'
import { mount } from 'cypress/react'
import CollaboratorList from 'src/components/collaborator_list/CollaboratorList'
import { Collaborator } from 'src/types/model'

describe('CollaboratorList - Component Tests', () => {
  const mockCollaborators: Collaborator[] = [
    {
      name: 'John Doe',
      title: 'Researcher',
      email: 'john.doe@example.com',
      uuid: '123e4567-e89b-12d3-a456-426614174001',
      eraCommonsId: 'jdoe123',
      countryOfOperation: 'Canada',
      approverStatus: true,
    },
    {
      name: 'Jane Smith',
      title: 'Professor',
      email: 'jane.smith@example.com',
      uuid: '123e4567-e89b-12d3-a456-426614174002',
      eraCommonsId: 'jsmith456',
      countryOfOperation: 'United States of America (the)',
      approverStatus: true,
    },
  ]

  const defaultProps = {
    collaborators: mockCollaborators,
    collaboratorText: 'Collaborator',
    columnsToShow: ['name', 'title', 'email'],
    countriesOfOperation: ['France', 'Canada', 'United States of America (the)'],
    onCollaboratorChange: () => { },
    readOnly: false,
  }

  it('renders the component with a list of collaborators', () => {
    mount(<CollaboratorList {...defaultProps} />)

    cy.get('button').contains('Add Collaborator').should('be.visible')

    cy.contains(mockCollaborators[0].name).should('be.visible')
    cy.contains(mockCollaborators[0].title).should('be.visible')
    cy.contains(mockCollaborators[0].email).should('be.visible')

    cy.contains(mockCollaborators[1].name).should('be.visible')
    cy.contains(mockCollaborators[1].title).should('be.visible')
    cy.contains(mockCollaborators[1].email).should('be.visible')

    cy.get('.collaborator-summary-card').should('have.length', 2)
  })

  it('opens the add form when Add button is clicked', () => {
    mount(<CollaboratorList {...defaultProps} />)

    cy.contains('New Collaborator Information').should('not.exist')

    cy.contains('Add Collaborator').click()

    cy.contains('New Collaborator Information').should('be.visible')
  })

  it('switches to edit mode when edit button is clicked for a collaborator', () => {
    mount(<CollaboratorList {...defaultProps} />)

    cy.contains(mockCollaborators[0].name).should('be.visible')
    cy.get('.collaborator-summary-card').first().within(() => {
      cy.get('.glyphicon-pencil').should('exist')
    })

    cy.get('.glyphicon-pencil').first().parent('a').click({ force: true })

    cy.contains(`Edit ${mockCollaborators[0].name} Information`).should('be.visible')
    cy.get('#name').should('have.value', mockCollaborators[0].name)
    cy.get('#title').should('have.value', mockCollaborators[0].title)
  })

  it('deletes a collaborator when delete is confirmed', () => {
    const onCollaboratorChange = cy.stub().as('onCollaboratorChange')

    mount(
      <CollaboratorList
        {...defaultProps}
        onCollaboratorChange={onCollaboratorChange}
      />,
    )

    cy.get('.collaborator-summary-card').should('have.length', 2)

    cy.get('.glyphicon-trash').first().parent('a').click({ force: true })

    cy.get('.delete-modal-primary-button').contains('Delete').click()

    cy.get('@onCollaboratorChange').should('have.been.calledOnce')
  })

  it('adds a new collaborator when adding through the form', () => {
    const onCollaboratorChange = cy.stub().as('onCollaboratorChange')

    mount(
      <CollaboratorList
        {...defaultProps}
        onCollaboratorChange={onCollaboratorChange}
      />,
    )

    cy.contains('Add Collaborator').click()

    cy.get('#name').type('New Person')
    cy.get('#name').blur()
    cy.get('#eraCommonsId').type('newperson123')
    cy.get('#eraCommonsId').blur()
    cy.get('#title').type('New Title')
    cy.get('#title').blur()
    cy.get('#email').type('new.person@example.com')
    cy.get('#email').blur()

    cy.get('.collaborator-form-add-save-button').click({ force: true })

    cy.get('@onCollaboratorChange').should('be.called')
  })

  it('updates a collaborator when editing through the form', () => {
    const onCollaboratorChange = cy.stub().as('onCollaboratorChange')

    mount(
      <CollaboratorList
        {...defaultProps}
        onCollaboratorChange={onCollaboratorChange}
      />,
    )

    cy.get('.glyphicon-pencil').first().parent('a').click({ force: true })

    const updatedName = 'Updated Name'
    cy.get('#name').clear()
    cy.get('#name').type(updatedName)

    cy.contains('Save').click()

    cy.get('@onCollaboratorChange').should('have.been.calledOnce')
  })

  it('closes the add form when Cancel is clicked', () => {
    mount(<CollaboratorList {...defaultProps} />)

    cy.contains('Add Collaborator').click()
    cy.contains('New Collaborator Information').should('be.visible')

    cy.contains('Cancel').click()

    cy.contains('New Collaborator Information').should('not.exist')
  })

  it('disables the Add button when readOnly prop is true', () => {
    mount(<CollaboratorList {...defaultProps} readOnly={true} />)

    // Button should be visible but disabled
    cy.contains('Add Collaborator').should('be.visible')
    cy.get('button').contains('Add Collaborator').should('be.disabled')
  })

  it('renders correctly with empty collaborators list', () => {
    mount(
      <CollaboratorList
        {...defaultProps}
        collaborators={[]}
      />,
    )

    cy.contains('Add Collaborator').should('be.visible')

    cy.get('.collaborator-summary-card').should('not.exist')
  })

  it('renders correctly with custom columnsToShow', () => {
    mount(
      <CollaboratorList
        {...defaultProps}
        columnsToShow={['name']}
      />,
    )

    cy.contains(mockCollaborators[0].name).should('be.visible')
    cy.contains(mockCollaborators[0].title).should('not.exist')
    cy.contains(mockCollaborators[0].email).should('not.exist')
  })

  it('clears edit state after a successful edit', () => {
    mount(<CollaboratorList {...defaultProps} />)

    cy.get('.glyphicon-pencil').first().parent('a').click({ force: true })
    cy.contains(`Edit ${mockCollaborators[0].name} Information`).should('be.visible')

    cy.contains('Save').click()

    cy.contains(`Edit ${mockCollaborators[0].name} Information`).should('not.exist')
    cy.contains(mockCollaborators[0].name).should('be.visible')
  })

  it('maintains proper edit state when editing multiple collaborators', () => {
    mount(<CollaboratorList {...defaultProps} />)

    cy.get('.glyphicon-pencil').first().parent('a').click({ force: true })
    cy.contains(`Edit ${mockCollaborators[0].name} Information`).should('be.visible')

    cy.contains(mockCollaborators[1].name).should('be.visible')

    cy.contains('Cancel').click()

    cy.contains(mockCollaborators[0].name).should('be.visible')
    cy.contains(mockCollaborators[1].name).should('be.visible')

    cy.get('.glyphicon-pencil').eq(1).parent('a').click({ force: true })

    cy.contains(mockCollaborators[0].name).should('be.visible')
    cy.contains(`Edit ${mockCollaborators[1].name} Information`).should('be.visible')
  })

  it('displays view icon instead of edit/delete icons in read-only mode', () => {
    const readOnlyProps = {
      ...defaultProps,
      readOnly: true,
    }

    mount(<CollaboratorList {...readOnlyProps} />)

    // Should show Add button but disabled in read-only mode
    cy.contains('Add Collaborator').should('be.visible')
    cy.get('button').contains('Add Collaborator').should('be.disabled')

    // Wait for component to render and check icons
    cy.get('.collaborator-summary-card').should('have.length', 2)

    // Should show view icon (eye) instead of edit/delete icons
    cy.get('.collaborator-summary-card').first().within(() => {
      cy.get('.glyphicon-eye-open').should('exist')
      cy.get('.glyphicon-pencil').should('not.exist')
      cy.get('.glyphicon-trash').should('not.exist')
    })
  })

  it('opens read-only collaborator details when view icon is clicked', () => {
    const readOnlyProps = {
      ...defaultProps,
      readOnly: true,
    }

    mount(<CollaboratorList {...readOnlyProps} />)

    // Wait for component to fully render
    cy.get('.collaborator-summary-card').should('have.length', 2)
    cy.get('.glyphicon-eye-open').should('exist')

    // Click the view icon
    cy.get('.glyphicon-eye-open').first().parent('a').click({ force: true })

    // Should open read-only view with correct header
    cy.contains(`View ${mockCollaborators[0].name} Information`).should('be.visible')

    // Form fields should be disabled
    cy.get('#name').should('be.disabled')
    cy.get('#email').should('be.disabled')

    // Within the collaborator form, only Close button should be present (no Add/Save)
    cy.get('.collaborator-form-card').within(() => {
      cy.contains('button', 'Save').should('not.exist')
      cy.contains('button', 'Add').should('not.exist')
      cy.contains('Close').should('be.visible')
    })
  })
})
