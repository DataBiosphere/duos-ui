import React from 'react'
import { mount } from 'cypress/react'
import { Workspace } from 'src/types/model'
import { WorkspaceAddEdit } from 'src/components/workspaces_list/WorkspaceAddEdit'
import WorkspaceSummary from 'src/components/workspaces_list/WorkspaceSummary'
import WorkspaceRow from 'src/components/workspaces_list/WorkspaceRow'
import WorkspaceList from 'src/components/workspaces_list/WorkspaceList'

const sampleWorkspace: Workspace = {
  workspaceId: 'w1',
  studyId: 's1',
  name: 'Analysis Workspace',
  platform: 'Terra',
  url: 'https://terra.bio/workspace',
  description: 'Main analysis workspace',
  tools: ['R', 'Python'],
  access: 'controlled',
  tags: ['genomics', 'analysis'],
}

const WorkspaceListHarness: React.FC<{ initial: Workspace[] }> = ({ initial }) => {
  const [items, setItems] = React.useState<Workspace[]>(initial)
  return (
    <WorkspaceList
      workspaces={items}
      columnsToShow={['name']}
      onWorkspaceChange={setItems}
      disabled={false}
    />
  )
}

describe('WorkspaceAddEdit', () => {
  it('disables Add until required fields filled then adds', () => {
    const collected: Workspace[] = []
    mount(
      <WorkspaceAddEdit
        id={-1}
        workspace={undefined}
        workspaces={[]}
        closeAction={cy.stub().as('close')}
        onWorkspaceChange={(items) => { collected.splice(0, collected.length, ...items) }}
      />,
    )
    cy.get('.collaborator-form-add-save-button').should('be.disabled')
    cy.get('#name').type('New Workspace')
    cy.get('#platform').type('New Platform')
    cy.get('#url').type('https://example.com')
    cy.get('#description').type('New Description')
    cy.get('#access').type('open')
    cy.get('.collaborator-form-add-save-button').should('not.be.disabled').click()
    cy.wrap(null).then(() => {
      expect(collected.length).to.eq(1)
      expect(collected[0].name).to.eq('New Workspace')
      expect(collected[0].platform).to.eq('New Platform')
    })
  })

  it('edits existing workspace and saves changes', () => {
    const workspaces: Workspace[] = [sampleWorkspace]
    mount(
      <WorkspaceAddEdit
        id={0}
        workspace={sampleWorkspace}
        workspaces={workspaces}
        closeAction={cy.stub().as('close')}
        onWorkspaceChange={(updated) => {
          expect(updated[0].name).to.eq('Analysis Workspace Edited')
        }}
      />,
    )
    cy.get('#name').clear()
    cy.get('#name').type('Analysis Workspace Edited')
    cy.get('.collaborator-form-add-save-button').click()
  })
})

describe('WorkspaceSummary', () => {
  it('renders columns including arrays and url', () => {
    mount(
      <WorkspaceSummary
        workspace={sampleWorkspace}
        columnsToShow={['name', 'platform', 'description', 'url', 'tools', 'tags']}
        editAction={cy.stub()}
        deleteAction={cy.stub()}
        disabled={false}
      />,
    )
    cy.contains('Analysis Workspace').should('exist')
    cy.contains('Terra').should('exist')
    cy.contains('Main analysis workspace').should('exist')
    cy.contains('R, Python').should('exist')
    cy.contains('genomics, analysis').should('exist')
    cy.get('a[href="https://terra.bio/workspace"]').should('exist')
  })
})

describe('WorkspaceRow', () => {
  it('shows summary when not in edit mode and triggers editAction', () => {
    mount(
      <WorkspaceRow
        id={0}
        editMode={false}
        workspace={sampleWorkspace}
        workspaces={[sampleWorkspace]}
        columnsToShow={['name', 'platform']}
        editAction={cy.stub().as('edit')}
        deleteAction={cy.stub()}
        closeAction={cy.stub()}
        onWorkspaceChange={cy.stub()}
        disabled={false}
      />,
    )
    cy.contains('Analysis Workspace').should('exist')
    cy.get('.glyphicon-pencil').click({ force: true })
    cy.get('@edit').should('have.been.calledOnce')
  })

  it('renders edit form when editMode true', () => {
    mount(
      <WorkspaceRow
        id={0}
        editMode={true}
        workspace={sampleWorkspace}
        workspaces={[sampleWorkspace]}
        columnsToShow={['name']}
        editAction={cy.stub()}
        deleteAction={cy.stub()}
        closeAction={cy.stub()}
        onWorkspaceChange={cy.stub()}
        disabled={false}
      />,
    )
    cy.get('#name').should('have.value', 'Analysis Workspace')
  })
})

describe('WorkspaceList', () => {
  it('adds a new workspace', () => {
    const state: Workspace[] = []
    mount(
      <WorkspaceList
        workspaces={state}
        columnsToShow={['name', 'platform']}
        onWorkspaceChange={(items) => { state.splice(0, state.length, ...items) }}
        disabled={false}
      />,
    )
    cy.get('#add-workspace-btn').click()
    cy.get('#name').type('Added Workspace')
    cy.get('#platform').type('Added Platform')
    cy.get('#url').type('https://added.com')
    cy.get('#description').type('Added Description')
    cy.get('#access').type('open')
    cy.get('.collaborator-form-add-save-button').click()
    cy.wrap(null).then(() => {
      expect(state.length).to.eq(1)
      expect(state[0].name).to.eq('Added Workspace')
    })
  })

  it('deletes a workspace via modal confirmation', () => {
    mount(<WorkspaceListHarness initial={[sampleWorkspace]} />)

    cy.contains('Analysis Workspace').should('exist')

    cy.get('.glyphicon-trash').click({ force: true })

    cy.get('.ReactModal__Content')
      .should('be.visible')
      .within(() => {
        cy.get('button')
          .filter(':visible')
          .contains(/delete/i)
          .click({ force: true })
      })

    cy.get('.ReactModal__Content').should('not.exist')
    cy.contains('Analysis Workspace').should('not.exist')
    cy.get('.collaborator-summary-card').should('have.length', 0)
  })
})
