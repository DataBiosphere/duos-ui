import React from 'react'
import { mount } from 'cypress/react'
import { IntellectualProperty } from 'src/types/model'
import { IntellectualPropertyAddEdit } from 'src/components/intellectual_property_list/IntellectualPropertyAddEdit'
import IntellectualPropertySummary from 'src/components/intellectual_property_list/IntellectualPropertySummary'
import IntellectualPropertyRow from 'src/components/intellectual_property_list/IntellectualPropertyRow'
import IntellectualPropertyList from 'src/components/intellectual_property_list/IntellectualPropertyList'

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

describe('IntellectualPropertyAddEdit', () => {
  it('disables Add until required fields filled then adds', () => {
    const collected: IntellectualProperty[] = []
    mount(
      <IntellectualPropertyAddEdit
        id={-1}
        ip={undefined}
        intellectualProperties={[]}
        closeAction={cy.stub().as('close')}
        onIpChange={(items) => { collected.splice(0, collected.length, ...items) }}
      />,
    )
    cy.get('.collaborator-form-add-save-button').should('be.disabled')
    cy.get('#type').type('Patent')
    cy.get('#title').type('New IP')
    cy.get('#assignee').type('Assignee Name')
    cy.get('#patentNumber').type('PAT123')
    cy.get('#filingDate').type('2024-01-01')
    cy.get('#status').type('Pending')
    cy.get('#url').type('https://example.com')
    cy.get('#contact').type('contact@example.com')
    cy.get('.collaborator-form-add-save-button').should('not.be.disabled').click()
    cy.wrap(null).then(() => {
      expect(collected.length).to.eq(1)
      expect(collected[0].type).to.eq('Patent')
      expect(collected[0].title).to.eq('New IP')
    })
  })

  it('edits existing intellectual property and saves changes', () => {
    const ips: IntellectualProperty[] = [sampleIp]
    mount(
      <IntellectualPropertyAddEdit
        id={0}
        ip={sampleIp}
        intellectualProperties={ips}
        closeAction={cy.stub().as('close')}
        onIpChange={(updated) => {
          expect(updated[0].title).to.eq('Test Patent Edited')
        }}
      />,
    )
    cy.get('#title').clear()
    cy.get('#title').type('Test Patent Edited')
    cy.get('.collaborator-form-add-save-button').click()
  })

  it('validates date format', () => {
    mount(
      <IntellectualPropertyAddEdit
        id={-1}
        ip={undefined}
        intellectualProperties={[]}
        closeAction={cy.stub().as('close')}
        onIpChange={cy.stub()}
      />,
    )
    cy.get('#type').type('Patent')
    cy.get('#title').type('New IP')
    cy.get('#assignee').type('Assignee Name')
    cy.get('#patentNumber').type('PAT123')
    cy.get('#filingDate').type('invalid-date')
    cy.get('#status').type('Pending')
    cy.get('#url').type('https://example.com')
    cy.get('#contact').type('contact@example.com')
    cy.get('.collaborator-form-add-save-button').should('be.disabled')
  })

  it('validates URL format', () => {
    mount(
      <IntellectualPropertyAddEdit
        id={-1}
        ip={undefined}
        intellectualProperties={[]}
        closeAction={cy.stub().as('close')}
        onIpChange={cy.stub()}
      />,
    )
    cy.get('#type').type('Patent')
    cy.get('#title').type('New IP')
    cy.get('#assignee').type('Assignee Name')
    cy.get('#patentNumber').type('PAT123')
    cy.get('#filingDate').type('2024-01-01')
    cy.get('#status').type('Pending')
    cy.get('#url').type('invalid-url')
    cy.get('#contact').type('contact@example.com')
    cy.get('.collaborator-form-add-save-button').should('be.disabled')
  })
})

describe('IntellectualPropertySummary', () => {
  it('renders columns including arrays and url', () => {
    mount(
      <IntellectualPropertySummary
        ip={sampleIp}
        columnsToShow={['title', 'type', 'patentNumber', 'url', 'tags']}
        editAction={cy.stub()}
        deleteAction={cy.stub()}
        disabled={false}
      />,
    )
    cy.contains('Test Patent').should('exist')
    cy.contains('Patent').should('exist')
    cy.contains('App123').should('exist')
    cy.contains('tag1, tag2').should('exist')
    cy.get('a[href="https://example.com/ip"]').should('exist')
  })
})

describe('IntellectualPropertyRow', () => {
  it('shows summary when not in edit mode and triggers editAction', () => {
    mount(
      <IntellectualPropertyRow
        id={0}
        editMode={false}
        ip={sampleIp}
        intellectualProperties={[sampleIp]}
        columnsToShow={['title', 'type']}
        editAction={cy.stub().as('edit')}
        deleteAction={cy.stub()}
        closeAction={cy.stub()}
        onIpChange={cy.stub()}
        disabled={false}
      />,
    )
    cy.contains('Test Patent').should('exist')
    cy.get('.glyphicon-pencil').click({ force: true })
    cy.get('@edit').should('have.been.calledOnce')
  })

  it('renders edit form when editMode true', () => {
    mount(
      <IntellectualPropertyRow
        id={0}
        editMode={true}
        ip={sampleIp}
        intellectualProperties={[sampleIp]}
        columnsToShow={['title']}
        editAction={cy.stub()}
        deleteAction={cy.stub()}
        closeAction={cy.stub()}
        onIpChange={cy.stub()}
        disabled={false}
      />,
    )
    cy.get('#title').should('have.value', 'Test Patent')
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
    cy.get('#add-ip-btn').click()
    cy.get('#type').type('Patent')
    cy.get('#title').type('Added IP')
    cy.get('#assignee').type('Assignee Name')
    cy.get('#patentNumber').type('PAT456')
    cy.get('#filingDate').type('2024-02-01')
    cy.get('#status').type('Granted')
    cy.get('#url').type('https://example.com/new')
    cy.get('#contact').type('newcontact@example.com')
    cy.get('.collaborator-form-add-save-button').click()
    cy.wrap(null).then(() => {
      expect(state.length).to.eq(1)
      expect(state[0].title).to.eq('Added IP')
    })
  })

  it('deletes an intellectual property via modal confirmation', () => {
    mount(<IntellectualPropertyListHarness initial={[sampleIp]} />)

    // Ensure the item exists first
    cy.contains('Test Patent').should('exist')

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

    // Modal should close and the intellectual property should be removed
    cy.get('.ReactModal__Content').should('not.exist')
    cy.contains('Test Patent').should('not.exist')
    cy.get('.collaborator-summary-card').should('have.length', 0)
  })
})
