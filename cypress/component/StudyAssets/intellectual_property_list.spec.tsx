import React from 'react'
import { mount } from 'cypress/react'
import { IntellectualProperty } from 'src/types/model'
import IntellectualPropertyAddEdit from 'src/components/intellectual_property_list/IntellectualPropertyAddEdit'
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
  it('prevents save until required fields are valid, then saves', () => {
    const collected: IntellectualProperty[] = []
    const onIntellectualPropertyChange = (items: IntellectualProperty[]) => {
      collected.splice(0, collected.length, ...items)
    }
    mount(
      <IntellectualPropertyAddEdit
        id={-1}
        intellectualProperty={undefined}
        intellectualProperties={[]}
        closeAction={cy.stub().as('close')}
        onIntellectualPropertyChange={onIntellectualPropertyChange}
      />,
    )

    // Try saving immediately; should not add because validation fails
    cy.get('.collaborator-form-add-save-button').click()
    cy.wrap(null).then(() => {
      expect(collected.length).to.eq(0)
    })

    // Fill required fields with valid values
    cy.get('#type').type('Patent')
    cy.get('#title').type('New IP')
    cy.get('#assignee').type('Assignee Name')
    cy.get('#patentNumber').type('PAT123')
    cy.get('#filingDate').type('2024-01-01')
    cy.get('#status').type('Pending')
    cy.get('#url').type('https://example.com')
    cy.get('#contact').type('contact@example.com')

    // Now save should succeed and add one item
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
    cy.get('#type').type('Patent')
    cy.get('#title').type('New IP')
    cy.get('#assignee').type('Assignee Name')
    cy.get('#patentNumber').type('PAT123')
    cy.get('#filingDate').type('invalid-date')
    cy.get('#status').type('Pending')
    cy.get('#url').type('https://example.com')
    cy.get('#contact').type('contact@example.com')

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
    cy.get('#type').type('Patent')
    cy.get('#title').type('New IP')
    cy.get('#assignee').type('Assignee Name')
    cy.get('#patentNumber').type('PAT123')
    cy.get('#filingDate').type('2024-01-01')
    cy.get('#status').type('Pending')
    cy.get('#url').type('invalid-url')
    cy.get('#contact').type('contact@example.com')

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

    cy.contains(sampleIp.title).should('exist')
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
    cy.contains(sampleIp.title).should('not.exist')
    cy.get('.collaborator-summary-card').should('have.length', 0)
  })

  it('opens intellectual property in view mode when view button is clicked', () => {
    mount(<IntellectualPropertyListHarness initial={[sampleIp]} />)
    cy.get('.glyphicon-eye-open').click({ force: true })
    cy.contains(sampleIp.title).should('exist')
    cy.get('#title').should('be.disabled')
    cy.get('#filingDate').should('be.disabled')
    cy.get('.collaborator-form-add-save-button').should('not.exist')
    cy.get('.collaborator-form-cancel-button').contains('Close').should('exist')
  })

  it('closes view mode when close button is clicked', () => {
    mount(<IntellectualPropertyListHarness initial={[sampleIp]} />)
    cy.get('.glyphicon-eye-open').click({ force: true })
    cy.get('.collaborator-form-cancel-button').click()
    cy.get('#title').should('not.exist')
    cy.get('.glyphicon-eye-open').should('exist')
  })
})
