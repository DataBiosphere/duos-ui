import React from 'react'
import { mount } from 'cypress/react'
import PresentationList from 'src/components/presentations_list/PresentationList'
import PresentationAddEdit from 'src/components/presentations_list/PresentationAddEdit'
import PresentationRow from 'src/components/presentations_list/PresentationRow'
import PresentationSummary from 'src/components/presentations_list/PresentationSummary'
import { Presentation } from 'src/types/model'

const samplePresentation: Presentation = {
  presentationId: 'p1',
  studyId: 's1',
  title: 'Sample Talk',
  date: '2024-06-01',
  url: 'https://example.org/presentation',
  authors: 'Author A; Author B',
  datasetCitation: 'Dataset X',
  citation: true,
  presenter: { name: 'Dr. Presenter', email: 'presenter@example.org' },
  event: 'Conference 2024',
  location: 'City',
  format: 'Oral',
  access: 'Open',
  tags: ['tagA', 'tagB'],
}

const PresentationListHarness: React.FC<{ initial: Presentation[] }> = ({ initial }) => {
  const [items, setItems] = React.useState<Presentation[]>(initial)
  return (
    <PresentationList
      presentations={items}
      columnsToShow={['title', 'date', 'url', 'presenter', 'event']}
      onPresentationChange={setItems}
      disabled={false}
    />
  )
}

describe('PresentationList component', () => {
  it('renders existing presentations', () => {
    mount(<PresentationListHarness initial={[samplePresentation]} />)
    cy.contains('Sample Talk').should('exist')
    cy.contains('Conference 2024').should('exist')
  })

  it('opens add form and enforces validation disabling save then adds', () => {
    const collected: Presentation[] = []
    mount(
      <PresentationAddEdit
        id={-1}
        presentations={[]}
        closeAction={cy.stub().as('close')}
        onPresentationChange={(items) => { collected.splice(0, collected.length, ...items) }}
      />,
    )
    cy.get('.collaborator-form-add-save-button').should('be.disabled')
    cy.get('#title').type('New Title')
    cy.get('#date').type('2024-07-15')
    cy.get('#url').type('https://example.org/new')
    cy.get('#authors').type('Author One; Author Two')
    cy.get('#datasetCitation').type('Dataset Y')
    // citation yes/no radio group (pick first option)
    cy.get('input[type="radio"]').first().check({ force: true })
    cy.get('#presenterName').type('Presenter X')
    cy.get('#presenterEmail').type('presenterx@example.org')
    cy.get('#event').type('Event 2024')
    cy.get('#location').type('Location Z')
    cy.get('#format').type('Poster')
    cy.get('#access').type('Public')
    cy.get('.collaborator-form-add-save-button').should('not.be.disabled').click()
    cy.wrap(null).then(() => {
      expect(collected.length).to.eq(1)
      expect(collected[0].title).to.eq('New Title')
    })
  })

  it('adds a presentation through list harness', () => {
    const state: Presentation[] = []
    mount(<PresentationListHarness initial={state} />)
    cy.get('#add-presentation-btn').click()
    cy.contains('New Presentation').should('exist')
    cy.get('#title').type('Added Talk')
    cy.get('#date').type('2024-08-20')
    cy.get('#url').type('https://example.org/added')
    cy.get('#authors').type('Auth A')
    cy.get('#datasetCitation').type('Dataset Added')
    cy.get('input[type="radio"]').first().check({ force: true })
    cy.get('#presenterName').type('Added Presenter')
    cy.get('#presenterEmail').type('added.presenter@example.org')
    cy.get('#event').type('Added Event')
    cy.get('#location').type('Added City')
    cy.get('#format').type('Poster')
    cy.get('#access').type('Open')
    cy.get('.collaborator-form-add-save-button').click()
    cy.contains('Added Talk').should('exist')
  })

  it('edits a presentation', () => {
    mount(<PresentationListHarness initial={[samplePresentation]} />)
    cy.get('.glyphicon-pencil').click({ force: true })
    cy.get('#title').clear()
    cy.get('#title').type('Sample Talk Edited')
    cy.get('.collaborator-form-add-save-button').click()
    cy.contains('Sample Talk Edited').should('exist')
  })

  it('deletes a presentation via modal confirmation', () => {
    mount(<PresentationListHarness initial={[samplePresentation]} />)
    cy.contains('Sample Talk').should('exist')
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
    cy.contains('Sample Talk').should('not.exist')
    cy.get('.collaborator-summary-card').should('have.length', 0)
  })
})

describe('PresentationSummary', () => {
  it('renders columns including presenter composite', () => {
    mount(
      <PresentationSummary
        presentation={samplePresentation}
        columnsToShow={['title', 'event', 'presenter', 'url', 'tags']}
        editAction={cy.stub()}
        deleteAction={cy.stub()}
        disabled={false}
      />,
    )
    cy.contains('Sample Talk').should('exist')
    cy.contains('Conference 2024').should('exist')
    cy.contains('Dr. Presenter').should('exist')
    cy.get('a[href="https://example.org/presentation"]').should('exist')
  })
})

describe('PresentationRow', () => {
  it('shows summary when not in edit mode and triggers editAction', () => {
    mount(
      <PresentationRow
        id={0}
        editMode={false}
        presentation={samplePresentation}
        presentations={[samplePresentation]}
        columnsToShow={['title', 'event']}
        editAction={cy.stub().as('edit')}
        deleteAction={cy.stub()}
        closeAction={cy.stub()}
        onPresentationChange={cy.stub()}
        disabled={false}
      />,
    )
    cy.contains('Sample Talk').should('exist')
    cy.get('.glyphicon-pencil').click({ force: true })
    cy.get('@edit').should('have.been.calledOnce')
  })

  it('renders edit form when editMode true', () => {
    mount(
      <PresentationRow
        id={0}
        editMode={true}
        presentation={samplePresentation}
        presentations={[samplePresentation]}
        columnsToShow={['title']}
        editAction={cy.stub()}
        deleteAction={cy.stub()}
        closeAction={cy.stub()}
        onPresentationChange={cy.stub()}
        disabled={false}
      />,
    )
    cy.get('#title').should('have.value', 'Sample Talk')
  })
})
