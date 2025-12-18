import React from 'react'
import { mount } from 'cypress/react'
import { IntellectualProperty } from 'src/types/model'
import IntellectualPropertyAddEdit from 'src/components/intellectual_property_list/IntellectualPropertyAddEdit'
import IntellectualPropertySummary from 'src/components/intellectual_property_list/IntellectualPropertySummary'
import IntellectualPropertyRow from 'src/components/intellectual_property_list/IntellectualPropertyRow'
import IntellectualPropertyList from 'src/components/intellectual_property_list/IntellectualPropertyList'
import { testDeleteViaModal } from './testUtils'

const sampleIp: IntellectualProperty = {
  ipId: 'ip-1',
  studyId: 'study-1',
  type: 'Patent',
  title: 'Test Patent',
  assignee: 'Inventor A',
  patentNumber: 'App123',
  filingDate: '2023-01-01',
  status: 'Filed',
  url: 'https://example.com/ip',
  contact: 'contact@example.com',
  tags: ['tag1', 'tag2'],
}

const IntellectualPropertyListHarness: React.FC<{ initial: IntellectualProperty[] }> = ({ initial }) => {
  const [items, setItems] = React.useState<IntellectualProperty[]>(initial)
  return (
    <IntellectualPropertyList
      intellectualProperties={items}
      columnsToShow={['title', 'type']}
      onIntellectualPropertyChange={setItems}
      disabled={false}
    />
  )
}

function fillValidForm() {
  cy.get('#type').type('Patent')
  cy.get('#title').type('New IP')
  cy.get('#assignee').type('Assignee Name')
  cy.get('#patentNumber').type('PAT123')
  cy.get('#filingDate').type('2024-01-01')
  cy.get('#status').type('Pending')
  cy.get('#url').type('https://example.com')
  cy.get('#contact').type('contact@example.com')
}

function testViewModeFlow(mountFn: () => void, titleText: string) {
  mountFn()
  cy.get('.glyphicon-eye-open').click({ force: true })
  cy.contains(titleText).should('exist')
  cy.get('#title').should('be.disabled')
  cy.get('#filingDate').should('be.disabled')
  cy.get('.collaborator-form-add-save-button').should('not.exist')
  cy.get('.collaborator-form-cancel-button').contains('Close').should('exist')
}

function testCloseViewMode(mountFn: () => void) {
  mountFn()
  cy.get('.glyphicon-eye-open').click({ force: true })
  cy.get('.collaborator-form-cancel-button').click()
  cy.get('#title').should('not.exist')
  cy.get('.glyphicon-eye-open').should('exist')
}

describe('IntellectualPropertyAddEdit', () => {
  it('prevents save until required fields are valid, then saves', () => {
    const collected: IntellectualProperty[] = []
    mount(
      <IntellectualPropertyAddEdit
        id={-1}
        intellectualProperty={undefined}
        intellectualProperties={[]}
        closeAction={cy.stub().as('close')}
        onIntellectualPropertyChange={(items) => { collected.splice(0, collected.length, ...items) }}
      />,
    )

    cy.get('.collaborator-form-add-save-button').click()
    cy.wrap(null).then(() => {
      expect(collected.length).to.eq(0)
    })

    fillValidForm()

    cy.get('.collaborator-form-add-save-button').click()
    cy.wrap(null).then(() => {
      expect(collected.length).to.eq(1)
      expect(collected[0].type).to.eq('Patent')
      expect(collected[0].title).to.eq('New IP')
    })
  })

  it('does not save when date format is invalid', () => {
    const onIntellectualPropertyChange = cy.stub().as('onIntellectualPropertyChange')
    mount(
      <IntellectualPropertyAddEdit
        id={-1}
        intellectualProperty={undefined}
        intellectualProperties={[]}
        closeAction={cy.stub().as('close')}
        onIntellectualPropertyChange={onIntellectualPropertyChange}
      />,
    )
    fillValidForm()
    cy.get('#filingDate').clear()
    cy.get('#filingDate').type('invalid-date')

    cy.get('.collaborator-form-add-save-button').click()
    cy.get('@onIntellectualPropertyChange').should('not.have.been.called')
  })

  it('does not save when URL format is invalid', () => {
    const onIntellectualPropertyChange = cy.stub().as('onIntellectualPropertyChange')
    mount(
      <IntellectualPropertyAddEdit
        id={-1}
        intellectualProperty={undefined}
        intellectualProperties={[]}
        closeAction={cy.stub().as('close')}
        onIntellectualPropertyChange={onIntellectualPropertyChange}
      />,
    )
    fillValidForm()
    cy.get('#url').clear()
    cy.get('#url').type('invalid-url')

    cy.get('.collaborator-form-add-save-button').click()
    cy.get('@onIntellectualPropertyChange').should('not.have.been.called')
  })
})

describe('IntellectualPropertySummary', () => {
  it('renders columns including arrays and url', () => {
    mount(
      <IntellectualPropertySummary
        intellectualProperty={sampleIp}
        columnsToShow={['title', 'type', 'patentNumber', 'url', 'tags']}
        editAction={cy.stub()}
        deleteAction={cy.stub()}
        disabled={false}
      />,
    )
    cy.contains(sampleIp.title).should('exist')
    cy.contains(sampleIp.type).should('exist')
    cy.contains(sampleIp.patentNumber).should('exist')
    cy.contains('tag1, tag2').should('exist')
    cy.get('a[href="https://example.com/ip"]').should('exist')
  })

  it('renders view button and triggers viewAction', () => {
    mount(
      <IntellectualPropertySummary
        intellectualProperty={sampleIp}
        columnsToShow={['title', 'type', 'patentNumber', 'url', 'tags']}
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

describe('IntellectualPropertyRow', () => {
  it('shows summary when not in edit mode and triggers editAction', () => {
    mount(
      <IntellectualPropertyRow
        id={0}
        editMode={false}
        intellectualProperty={sampleIp}
        intellectualProperties={[sampleIp]}
        columnsToShow={['title', 'type']}
        editAction={cy.stub().as('edit')}
        deleteAction={cy.stub()}
        closeAction={cy.stub()}
        onIntellectualPropertyChange={cy.stub()}
        disabled={false}
      />,
    )
    cy.contains(sampleIp.title).should('exist')
    cy.get('.glyphicon-pencil').click({ force: true })
    cy.get('@edit').should('have.been.calledOnce')
  })

  it('renders edit form when editMode true', () => {
    mount(
      <IntellectualPropertyRow
        id={0}
        editMode={true}
        intellectualProperty={sampleIp}
        intellectualProperties={[sampleIp]}
        columnsToShow={['title']}
        editAction={cy.stub()}
        deleteAction={cy.stub()}
        closeAction={cy.stub()}
        onIntellectualPropertyChange={cy.stub()}
        disabled={false}
      />,
    )
    cy.get('#title').should('have.value', sampleIp.title)
  })

  it('renders view form when viewMode true and is read-only', () => {
    mount(
      <IntellectualPropertyRow
        id={0}
        editMode={false}
        viewMode={true}
        intellectualProperty={sampleIp}
        intellectualProperties={[sampleIp]}
        columnsToShow={['title']}
        editAction={cy.stub()}
        deleteAction={cy.stub()}
        closeAction={cy.stub()}
        viewAction={cy.stub()}
        onIntellectualPropertyChange={cy.stub()}
        disabled={false}
      />,
    )
    cy.get('#title').should('have.value', sampleIp.title)
    cy.get('#title').should('be.disabled')
    cy.get('.collaborator-form-add-save-button').should('not.exist')
  })

  it('triggers viewAction when view button is clicked', () => {
    mount(
      <IntellectualPropertyRow
        id={0}
        editMode={false}
        viewMode={false}
        intellectualProperty={sampleIp}
        intellectualProperties={[sampleIp]}
        columnsToShow={['title', 'type']}
        editAction={cy.stub()}
        deleteAction={cy.stub()}
        closeAction={cy.stub()}
        viewAction={cy.stub().as('view')}
        onIntellectualPropertyChange={cy.stub()}
        disabled={false}
      />,
    )
    cy.get('.glyphicon-eye-open').click({ force: true })
    cy.get('@view').should('have.been.calledOnce')
  })
})

describe('IntellectualPropertyList', () => {
  it('adds a new intellectual property', () => {
    const state: IntellectualProperty[] = []
    mount(
      <IntellectualPropertyList
        intellectualProperties={state}
        columnsToShow={['title', 'type']}
        onIntellectualPropertyChange={(items) => { state.splice(0, state.length, ...items) }}
        disabled={false}
      />,
    )
    cy.get('#add-intellectual-property-btn').click()
    fillValidForm()
    cy.get('.collaborator-form-add-save-button').click()
    cy.wrap(null).then(() => {
      expect(state.length).to.eq(1)
      expect(state[0].title).to.eq('New IP')
    })
  })

  it('deletes an intellectual property via modal confirmation', () => {
    testDeleteViaModal(
      () => mount(<IntellectualPropertyListHarness initial={[sampleIp]} />),
      sampleIp.title,
    )
  })

  it('opens intellectual property in view mode when view button is clicked', () => {
    testViewModeFlow(() => mount(<IntellectualPropertyListHarness initial={[sampleIp]} />), sampleIp.title)
  })

  it('closes view mode when close button is clicked', () => {
    testCloseViewMode(() => mount(<IntellectualPropertyListHarness initial={[sampleIp]} />))
  })
})
