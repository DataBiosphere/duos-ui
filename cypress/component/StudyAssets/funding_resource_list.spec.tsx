import React from 'react'
import { mount } from 'cypress/react'
import { FundingResource } from 'src/types/model'
import FundingResourceAddEdit from 'src/components/funding_resource_list/FundingResourceAddEdit'
import FundingResourceSummary from 'src/components/funding_resource_list/FundingResourceSummary'
import FundingResourceRow from 'src/components/funding_resource_list/FundingResourceRow'
import FundingResourceList from 'src/components/funding_resource_list/FundingResourceList'

const sampleFunding: FundingResource = {
  fundingId: 'f1',
  studyId: 's1',
  funderName: 'Funder A',
  funderProgram: 'Program Z',
  grantNumber: 'GN12345',
  projectTitle: 'Project Alpha',
  startDate: '2024-01-01',
  endDate: '2024-12-31',
  url: 'https://example.org',
  tags: ['tag1', 'tag2'],
}

const FundingResourceListHarness: React.FC<{ initial: FundingResource[] }> = ({ initial }) => {
  const [items, setItems] = React.useState<FundingResource[]>(initial)
  return (
    <FundingResourceList
      fundingResources={items}
      columnsToShow={['funderName', 'funderProgram', 'startDate']}
      onFundingResourceChange={setItems}
      disabled={false}
    />
  )
}

describe('FundingResourceList component', () => {
  it('renders existing funding resources', () => {
    mount(<FundingResourceListHarness initial={[sampleFunding]} />)
    cy.contains(sampleFunding.funderName).should('exist')
    cy.contains(sampleFunding.funderProgram).should('exist')
  })

  it('opens add form and enforces validation disabling save then adds', () => {
    const collected: FundingResource[] = []
    mount(
      <FundingResourceAddEdit
        id={-1}
        funding={undefined}
        fundingResources={[]}
        closeAction={cy.stub().as('close')}
        onFundingChange={(items) => { collected.splice(0, collected.length, ...items) }}
      />,
    )
    cy.get('#funderName').type('New Funder')
    cy.get('#projectTitle').type('New Project')
    cy.get('#funderProgram').type('New Program')
    cy.get('.collaborator-form-add-save-button').should('not.be.disabled').click()
    cy.wrap(null).then(() => {
      expect(collected.length).to.eq(1)
      expect(collected[0].funderName).to.eq('New Funder')
      expect(collected[0].projectTitle).to.eq('New Project')
    })
  })

  it('opens funding resource in view mode when view button is clicked', () => {
    mount(<FundingResourceListHarness initial={[sampleFunding]} />)
    cy.get('.glyphicon-eye-open').click({ force: true })
    cy.contains(sampleFunding.funderName).should('exist')
    cy.get('#funderName').should('be.disabled')
    cy.get('#projectTitle').should('be.disabled')
    cy.get('.collaborator-form-add-save-button').should('not.exist')
    cy.get('.collaborator-form-cancel-button').contains('Close').should('exist')
  })

  it('closes view mode when close button is clicked', () => {
    mount(<FundingResourceListHarness initial={[sampleFunding]} />)
    cy.get('.glyphicon-eye-open').click({ force: true })
    cy.get('.collaborator-form-cancel-button').click()
    cy.get('#funderName').should('not.exist')
    cy.get('.glyphicon-eye-open').should('exist')
  })

  it('adds a new funding resource', () => {
    const state: FundingResource[] = []
    mount(
      <FundingResourceList
        fundingResources={state}
        columnsToShow={['funderName', 'projectTitle']}
        onFundingResourceChange={(items) => { state.splice(0, state.length, ...items) }}
        disabled={false}
      />,
    )
    cy.get('#add-funding-btn').click()
    cy.get('#funderName').type('Added Funder')
    cy.get('#projectTitle').type('Added Project')
    cy.get('#funderProgram').type('Added Program')
    cy.get('.collaborator-form-add-save-button').click()
    cy.wrap(null).then(() => {
      expect(state.length).to.eq(1)
      expect(state[0].funderName).to.eq('Added Funder')
    })
  })

  it('edits existing funding resource and saves changes', () => {
    const resources: FundingResource[] = [sampleFunding]
    mount(
      <FundingResourceAddEdit
        id={0}
        funding={sampleFunding}
        fundingResources={resources}
        closeAction={cy.stub().as('close')}
        onFundingChange={(updated) => {
          expect(updated[0].funderName).to.eq('Funder A Edited')
        }}
      />,
    )
    cy.get('#funderName').clear()
    cy.get('#funderName').type('Funder A Edited')
    cy.get('.collaborator-form-add-save-button').click()
  })

  it('deletes a funding resource via modal confirmation', () => {
    mount(<FundingResourceListHarness initial={[sampleFunding]} />)
    cy.contains(sampleFunding.funderName).should('exist')
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
    cy.contains(sampleFunding.funderName).should('not.exist')
    cy.get('.collaborator-summary-card').should('have.length', 0)
  })
})

describe('FundingResourceSummary', () => {
  it('renders columns including arrays and url', () => {
    mount(
      <FundingResourceSummary
        funding={sampleFunding}
        columnsToShow={['funderName', 'funderProgram', 'projectTitle', 'url', 'tags']}
        editAction={cy.stub()}
        deleteAction={cy.stub()}
        disabled={false}
      />,
    )
    cy.contains(sampleFunding.funderName).should('exist')
    cy.contains(sampleFunding.funderProgram).should('exist')
    cy.contains(sampleFunding.projectTitle).should('exist')
    cy.contains('tag1, tag2').should('exist')
    cy.get('a[href="https://example.org"]').should('exist')
  })

  it('renders view button and triggers viewAction', () => {
    mount(
      <FundingResourceSummary
        funding={sampleFunding}
        columnsToShow={['funderName']}
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

describe('FundingResourceRow', () => {
  it('shows summary when not in edit mode and triggers editAction', () => {
    mount(
      <FundingResourceRow
        id={0}
        editMode={false}
        funding={sampleFunding}
        fundingResources={[sampleFunding]}
        columnsToShow={['funderName', 'projectTitle']}
        editAction={cy.stub().as('edit')}
        deleteAction={cy.stub()}
        closeAction={cy.stub()}
        onFundingChange={cy.stub()}
        disabled={false}
      />,
    )
    cy.contains(sampleFunding.funderName).should('exist')
    cy.get('.glyphicon-pencil').click({ force: true })
    cy.get('@edit').should('have.been.calledOnce')
  })

  it('renders edit form when editMode true', () => {
    mount(
      <FundingResourceRow
        id={0}
        editMode={true}
        funding={sampleFunding}
        fundingResources={[sampleFunding]}
        columnsToShow={['funderName']}
        editAction={cy.stub()}
        deleteAction={cy.stub()}
        closeAction={cy.stub()}
        onFundingChange={cy.stub()}
        disabled={false}
      />,
    )
    cy.get('#funderName').should('have.value', sampleFunding.funderName)
  })

  it('renders view form when viewMode true and is read-only', () => {
    mount(
      <FundingResourceRow
        id={0}
        editMode={false}
        viewMode={true}
        funding={sampleFunding}
        fundingResources={[sampleFunding]}
        columnsToShow={['funderName']}
        editAction={cy.stub()}
        deleteAction={cy.stub()}
        closeAction={cy.stub()}
        viewAction={cy.stub()}
        onFundingChange={cy.stub()}
        disabled={false}
      />,
    )
    cy.get('#funderName').should('have.value', sampleFunding.funderName)
    cy.get('#funderName').should('be.disabled')
    cy.get('.collaborator-form-add-save-button').should('not.exist')
  })

  it('triggers viewAction when view button is clicked', () => {
    mount(
      <FundingResourceRow
        id={0}
        editMode={false}
        viewMode={false}
        funding={sampleFunding}
        fundingResources={[sampleFunding]}
        columnsToShow={['funderName', 'projectTitle']}
        editAction={cy.stub()}
        deleteAction={cy.stub()}
        closeAction={cy.stub()}
        viewAction={cy.stub().as('view')}
        onFundingChange={cy.stub()}
        disabled={false}
      />,
    )
    cy.get('.glyphicon-eye-open').click({ force: true })
    cy.get('@view').should('have.been.calledOnce')
  })
})
