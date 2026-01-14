import React from 'react'
import { IntellectualProperty } from 'src/types/model'
import IntellectualPropertyAddEdit from 'src/components/intellectual_property_list/IntellectualPropertyAddEdit'
import IntellectualPropertySummary from 'src/components/intellectual_property_list/IntellectualPropertySummary'
import IntellectualPropertyRow from 'src/components/intellectual_property_list/IntellectualPropertyRow'
import IntellectualPropertyList from 'src/components/intellectual_property_list/IntellectualPropertyList'
import {
  testDeleteViaModal,
  testViewModeFlow,
  testCloseViewMode,
  testEditModeRender,
  testViewModeRender,
  testViewActionTrigger,
  testSummaryViewActionTrigger,
} from './testUtils'

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

// Helper functions
function mountListWithItem() {
  return cy.mount(<IntellectualPropertyListHarness initial={[sampleIp]} />)
}

function mountRow(overrides: Partial<React.ComponentProps<typeof IntellectualPropertyRow>> = {}) {
  return cy.mount(
    <IntellectualPropertyRow
      id={0}
      editMode={false}
      intellectualProperty={sampleIp}
      intellectualProperties={[sampleIp]}
      columnsToShow={['title', 'type']}
      editAction={cy.stub()}
      deleteAction={cy.stub()}
      closeAction={cy.stub()}
      onIntellectualPropertyChange={cy.stub()}
      disabled={false}
      {...overrides}
    />,
  )
}

function fillForm(overrides: Partial<IntellectualProperty> = {}) {
  cy.get('#type').type(overrides.type ?? 'Patent')
  cy.get('#title').type(overrides.title ?? 'New IP')
  cy.get('#assignee').type(overrides.assignee ?? 'Assignee Name')
  cy.get('#patentNumber').type(overrides.patentNumber ?? 'PAT123')
  cy.get('#filingDate').type(overrides.filingDate ?? '2024-01-01')
  cy.get('#status').type(overrides.status ?? 'Pending')
  cy.get('#url').type(overrides.url ?? 'https://example.com')
  cy.get('#contact').type(overrides.contact ?? 'contact@example.com')
}

function assertNotSaved() {
  cy.get('@onIntellectualPropertyChange').should('not.have.been.called')
}

describe('IntellectualPropertyAddEdit', () => {
  it('prevents save until required fields are valid, then saves', () => {
    const collected: IntellectualProperty[] = []
    cy.mount(
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

    fillForm()

    cy.get('.collaborator-form-add-save-button').click()
    cy.wrap(null).then(() => {
      expect(collected.length).to.eq(1)
      expect(collected[0].type).to.eq('Patent')
      expect(collected[0].title).to.eq('New IP')
    })
  })

  const invalidInputTests = [
    { field: '#filingDate', value: 'invalid-date', label: 'date' },
    { field: '#url', value: 'invalid-url', label: 'URL' },
  ]

  invalidInputTests.forEach(({ field, value, label }) => {
    it(`does not save when ${label} format is invalid`, () => {
      const onIntellectualPropertyChange = cy.stub().as('onIntellectualPropertyChange')
      cy.mount(
        <IntellectualPropertyAddEdit
          id={-1}
          intellectualProperty={undefined}
          intellectualProperties={[]}
          closeAction={cy.stub().as('close')}
          onIntellectualPropertyChange={onIntellectualPropertyChange}
        />,
      )
      fillForm()
      cy.get(field).clear()
      cy.get(field).type(value)

      cy.get('.collaborator-form-add-save-button').click()
      assertNotSaved()
    })
  })
})

describe('IntellectualPropertySummary', () => {
  it('renders columns including arrays and url', () => {
    cy.mount(
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
    testSummaryViewActionTrigger(() =>
      cy.mount(
        <IntellectualPropertySummary
          intellectualProperty={sampleIp}
          columnsToShow={['title', 'type', 'patentNumber', 'url', 'tags']}
          editAction={cy.stub()}
          deleteAction={cy.stub()}
          viewAction={cy.stub().as('view')}
          disabled={false}
        />,
      ),
    )
  })
})

describe('IntellectualPropertyRow', () => {
  it('shows summary when not in edit mode and triggers editAction', () => {
    mountRow({ editAction: cy.stub().as('edit') })
    cy.contains(sampleIp.title).should('exist')
    cy.get('.glyphicon-pencil').click({ force: true })
    cy.get('@edit').should('have.been.calledOnce')
  })

  it('renders edit form when editMode true', () => {
    testEditModeRender<React.ComponentProps<typeof IntellectualPropertyRow>>(
      mountRow,
      '#title',
      sampleIp.title,
    )
  })

  it('renders view form when viewMode true and is read-only', () => {
    testViewModeRender<React.ComponentProps<typeof IntellectualPropertyRow>>(
      mountRow,
      '#title',
      sampleIp.title,
    )
  })

  it('triggers viewAction when view button is clicked', () => {
    testViewActionTrigger<React.ComponentProps<typeof IntellectualPropertyRow>>(mountRow)
  })
})

describe('IntellectualPropertyList', () => {
  it('adds a new intellectual property', () => {
    const state: IntellectualProperty[] = []
    cy.mount(
      <IntellectualPropertyList
        intellectualProperties={state}
        columnsToShow={['title', 'type']}
        onIntellectualPropertyChange={(items) => { state.splice(0, state.length, ...items) }}
        disabled={false}
      />,
    )
    cy.get('#add-intellectual-property-btn').click()
    fillForm()
    cy.get('.collaborator-form-add-save-button').click()
    cy.wrap(null).then(() => {
      expect(state.length).to.eq(1)
      expect(state[0].title).to.eq('New IP')
    })
  })

  it('deletes an intellectual property via modal confirmation', () => {
    testDeleteViaModal(mountListWithItem, sampleIp.title)
  })

  it('opens intellectual property in view mode when view button is clicked', () => {
    testViewModeFlow(mountListWithItem, sampleIp.title, { fieldId: '#title' })
  })

  it('closes view mode when close button is clicked', () => {
    testCloseViewMode(mountListWithItem, { fieldId: '#title' })
  })
})
