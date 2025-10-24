import React from 'react'
import { mount } from 'cypress/react'
import { FundingResource } from 'src/types/model'
import { FundingResourceAddEdit } from 'src/components/funding_resource_list/FundingResourceAddEdit'
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
      columnsToShow={['funderName']}
      onFundingResourceChange={setItems}
      disabled={false}
    />
  )
}

describe('FundingResourceAddEdit', () => {
  it('disables Add until required fields filled then adds', () => {
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
    cy.get('.collaborator-form-add-save-button').should('be.disabled')
    cy.get('#funderName').type('New Funder')
    cy.get('#projectTitle').type('New Project')
    // funderProgram is marked required in validators, include it for consistency
    cy.get('#funderProgram').type('New Program')
    cy.get('.collaborator-form-add-save-button').should('not.be.disabled').click()
    cy.wrap(null).then(() => {
      expect(collected.length).to.eq(1)
      expect(collected[0].funderName).to.eq('New Funder')
      expect(collected[0].projectTitle).to.eq('New Project')
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
    cy.contains('Funder A').should('exist')
    cy.contains('Program Z').should('exist')
    cy.contains('Project Alpha').should('exist')
    cy.contains('tag1, tag2').should('exist')
    cy.get('a[href="https://example.org"]').should('exist')
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
    cy.contains('Funder A').should('exist')
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
    cy.get('#funderName').should('have.value', 'Funder A')
  })
})

describe('FundingResourceList', () => {
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

  it('deletes a funding resource via modal confirmation', () => {
    mount(<FundingResourceListHarness initial={[sampleFunding]} />)

    // Ensure the item exists first
    cy.contains('Funder A').should('exist')

    // Open the delete modal
    cy.get('.glyphicon-trash').click({ force: true })

    // Wait for Modal content to appear
    cy.get('.ReactModal__Content')
      .should('be.visible')
      .within(() => {
        // Click the visible Delete button inside the modal
        cy.get('button')
          .filter(':visible')
          .contains(/delete/i)
          .click({ force: true })
      })

    // Modal should close and the funding resource should be removed
    cy.get('.ReactModal__Content').should('not.exist')
    cy.contains('Funder A').should('not.exist')
    cy.get('.collaborator-summary-card').should('have.length', 0)
  })
})
