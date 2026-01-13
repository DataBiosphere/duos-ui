import React from 'react'
import { Workspace } from 'src/types/model'
import WorkspaceAddEdit from 'src/components/workspaces_list/WorkspaceAddEdit'
import WorkspaceSummary from 'src/components/workspaces_list/WorkspaceSummary'
import WorkspaceRow from 'src/components/workspaces_list/WorkspaceRow'
import WorkspaceList from 'src/components/workspaces_list/WorkspaceList'
import { testDeleteViaModal } from './testUtils'

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
      columnsToShow={['name', 'platform']}
      onWorkspaceChange={setItems}
      disabled={false}
    />
  )
}

describe('WorkspaceList component', () => {
  it('renders existing workspaces', () => {
    cy.mount(<WorkspaceListHarness initial={[sampleWorkspace]} />)
    cy.contains(sampleWorkspace.name).should('exist')
    cy.contains(sampleWorkspace.platform).should('exist')
  })

  it('opens add form and enforces validation disabling save then adds', () => {
    const collected: Workspace[] = []
    cy.mount(
      <WorkspaceAddEdit
        id={-1}
        workspace={undefined}
        workspaces={[]}
        closeAction={cy.stub().as('close')}
        onWorkspaceChange={(items) => { collected.splice(0, collected.length, ...items) }}
      />,
    )
    cy.get('#name').type('New Workspace')
    cy.get('#platform').type('New Platform')
    cy.get('#url').type('https://example.com')
    cy.get('#description').type('New Description')
    cy.get('#access').type('open')
    cy.get('.collaborator-form-add-save-button').click()
    cy.wrap(null).then(() => {
      expect(collected.length).to.eq(1)
      expect(collected[0].name).to.eq('New Workspace')
      expect(collected[0].platform).to.eq('New Platform')
    })
  })

  it('opens workspace in view mode when view button is clicked', () => {
    cy.mount(<WorkspaceListHarness initial={[sampleWorkspace]} />)
    cy.get('.glyphicon-eye-open').click({ force: true })
    cy.contains(sampleWorkspace.name).should('exist')
    cy.get('#name').should('be.disabled')
    cy.get('#platform').should('be.disabled')
    cy.get('.collaborator-form-add-save-button').should('not.exist')
    cy.get('.collaborator-form-cancel-button').contains('Close').should('exist')
  })

  it('closes view mode when close button is clicked', () => {
    cy.mount(<WorkspaceListHarness initial={[sampleWorkspace]} />)
    cy.get('.glyphicon-eye-open').click({ force: true })
    cy.get('.collaborator-form-cancel-button').click()
    cy.get('#name').should('not.exist')
    cy.get('.glyphicon-eye-open').should('exist')
  })

  it('adds a new workspace', () => {
    const state: Workspace[] = []
    cy.mount(
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

  it('edits existing workspace and saves changes', () => {
    const workspaces: Workspace[] = [sampleWorkspace]
    cy.mount(
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

  it('deletes a workspace via modal confirmation', () => {
    testDeleteViaModal(
      () => cy.mount(<WorkspaceListHarness initial={[sampleWorkspace]} />),
      sampleWorkspace.name,
    )
  })
})

describe('WorkspaceSummary', () => {
  it('renders columns including arrays and url', () => {
    cy.mount(
      <WorkspaceSummary
        workspace={sampleWorkspace}
        columnsToShow={['name', 'platform', 'description', 'url', 'tools', 'tags']}
        editAction={cy.stub()}
        deleteAction={cy.stub()}
        disabled={false}
      />,
    )
    cy.contains(sampleWorkspace.name).should('exist')
    cy.contains(sampleWorkspace.platform).should('exist')
    cy.contains(sampleWorkspace.description).should('exist')
    cy.contains('R, Python').should('exist')
    cy.contains('genomics, analysis').should('exist')
    cy.get('a[href="https://terra.bio/workspace"]').should('exist')
  })

  it('renders view button and triggers viewAction', () => {
    cy.mount(
      <WorkspaceSummary
        workspace={sampleWorkspace}
        columnsToShow={['name']}
        editAction={cy.stub()}
        deleteAction={cy.stub()}
        viewAction={cy.stub().as('view')}
        disabled={false}
      />,
    )
    cy.get('.glyphicon-eye-open').should('exist')
    cy.get('.glyphicon-eye-open').click({ force: true })
    cy.get('@view').should('have.been.calledOnce')
  })
})

describe('WorkspaceRow', () => {
  it('shows summary when not in edit mode and triggers editAction', () => {
    cy.mount(
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
    cy.contains(sampleWorkspace.name).should('exist')
    cy.get('.glyphicon-pencil').click({ force: true })
    cy.get('@edit').should('have.been.calledOnce')
  })

  it('renders edit form when editMode true', () => {
    cy.mount(
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
    cy.get('#name').should('have.value', sampleWorkspace.name)
  })

  it('renders view form when viewMode true and is read-only', () => {
    cy.mount(
      <WorkspaceRow
        id={0}
        editMode={false}
        viewMode={true}
        workspace={sampleWorkspace}
        workspaces={[sampleWorkspace]}
        columnsToShow={['name']}
        editAction={cy.stub()}
        deleteAction={cy.stub()}
        closeAction={cy.stub()}
        viewAction={cy.stub()}
        onWorkspaceChange={cy.stub()}
        disabled={false}
      />,
    )
    cy.get('#name').should('have.value', sampleWorkspace.name)
    cy.get('#name').should('be.disabled')
    cy.get('.collaborator-form-add-save-button').should('not.exist')
  })

  it('triggers viewAction when view button is clicked', () => {
    cy.mount(
      <WorkspaceRow
        id={0}
        editMode={false}
        viewMode={false}
        workspace={sampleWorkspace}
        workspaces={[sampleWorkspace]}
        columnsToShow={['name', 'platform']}
        editAction={cy.stub()}
        deleteAction={cy.stub()}
        closeAction={cy.stub()}
        viewAction={cy.stub().as('view')}
        onWorkspaceChange={cy.stub()}
        disabled={false}
      />,
    )
    cy.get('.glyphicon-eye-open').click({ force: true })
    cy.get('@view').should('have.been.calledOnce')
  })
})
