// Adjusted tests for author validation and ORCID format error
import React from 'react'
import { mount } from 'cypress/react'
import PublicationList from 'src/components/publications_list/PublicationList'
import PublicationAddEdit from 'src/components/publications_list/PublicationAddEdit'
import PublicationRow from 'src/components/publications_list/PublicationRow'
import PublicationSummary from 'src/components/publications_list/PublicationSummary'
import { Publication, Author } from 'src/types/model'

const authorsSample: Author[] = [
  { name: 'Author One', orcId: '0000-0000-0000-0001' },
  { name: 'Author Two', orcId: '0000-0000-0000-0002' },
]

const samplePublication: Publication = {
  title: 'Sample Publication',
  pubmedId: '123456',
  publishedDate: '2024-06-01',
  authors: authorsSample,
  bibliographicCitation: 'Sample Citation',
  datasetCitation: 'Sample Dataset Citation',
  citation: true,
  publicationId: 'pub-1',
  studyId: 'study-1',
  journal: 'Journal Name',
  doi: '10.1000/sample.doi',
  url: 'https://example.org/pub',
  access: 'Open',
  tags: ['tag1', 'tag2'],
}

const PublicationListHarness: React.FC<{ initial: Publication[] }> = ({ initial }) => {
  const [items, setItems] = React.useState<Publication[]>(initial)
  return (
    <PublicationList
      publications={items}
      columnsToShow={['title', 'publishedDate', 'journal', 'url', 'access']}
      onPublicationChange={setItems}
      disabled={false}
    />
  )
}

describe('PublicationList component', () => {
  it('renders existing publications', () => {
    mount(<PublicationListHarness initial={[samplePublication]} />)
    cy.contains('Sample Publication').should('exist')
    cy.contains('Journal Name').should('exist')
  })

  it('fills in and saves a new publication', () => {
    const collected: Publication[] = []
    mount(
      <PublicationAddEdit
        id={-1}
        publications={[]}
        closeAction={cy.stub().as('close')}
        onPublicationChange={(items) => {
          collected.splice(0, collected.length, ...items)
        }}
      />,
    )

    cy.get('#title').type('New Pub')
    cy.get('#publishedDate').type('2024-07-15')
    cy.get('#pubmedId').type('99999')
    cy.get('#bibliographicCitation').type('Bib Cit X')
    cy.get('#datasetCitation').type('Dataset Cit X')
    cy.get('#journal').type('Journal X')
    cy.get('#doi').type('10.1000/xyz')
    cy.get('#url').type('https://example.org/newpub')
    cy.get('#access').type('Public')
    cy.get('input[placeholder="Author Name"]').type('First Author')
    cy.get('input[placeholder="ORCID (0000-0000-0000-0000)"]').type('0000-0000-0000-0003')

    cy.contains('Add Author').should('not.be.disabled')
    cy.get('.collaborator-form-add-save-button').click()
    cy.wrap(null).then(() => {
      expect(collected.length).to.eq(1)
      expect(collected[0].title).to.eq('New Pub')
      expect(collected[0].authors).to.have.length(1)
      expect(collected[0].authors[0].name).to.eq('First Author')
    })
  })

  it('opens publication in view mode when view button is clicked', () => {
    mount(<PublicationListHarness initial={[samplePublication]} />)
    cy.get('.glyphicon-eye-open').click({ force: true })
    cy.contains('Sample Publication').should('exist')
    cy.get('#title').should('be.disabled')
    cy.get('#publishedDate').should('be.disabled')
    cy.get('.collaborator-form-add-save-button').should('not.exist')
    cy.get('.collaborator-form-cancel-button').contains('Close').should('exist')
  })

  it('closes view mode when close button is clicked', () => {
    mount(<PublicationListHarness initial={[samplePublication]} />)
    cy.get('.glyphicon-eye-open').click({ force: true })
    cy.get('.collaborator-form-cancel-button').click()
    cy.get('#title').should('not.exist')
    cy.get('.glyphicon-eye-open').should('exist')
  })

  it('shows validation errors on empty form', () => {
    mount(
      <PublicationAddEdit
        id={-1}
        publications={[]}
        closeAction={cy.stub()}
        onPublicationChange={cy.stub()}
      />,
    )
    cy.get('.collaborator-form-add-save-button').click()
    cy.get('.error-message').should('exist')
    cy.get('.error-message').should('have.length.greaterThan', 0)
  })

  it('disables Add Author until first row has name filled', () => {
    mount(
      <PublicationAddEdit
        id={-1}
        publications={[]}
        closeAction={cy.stub()}
        onPublicationChange={cy.stub()}
      />,
    )
    cy.contains('Add Author').should('be.disabled')
    cy.get('input[placeholder="Author Name"]').type('Temp Author')
    cy.contains('Add Author').should('not.be.disabled')
    cy.get('input[placeholder="ORCID (0000-0000-0000-0000)"]').type('BAD-ORCID')
    cy.contains('Add Author').should('not.be.disabled').click()
    cy.get('input[placeholder="Author Name"]').should('have.length', 2)
  })

  it('shows per-author ORCID format error', () => {
    mount(
      <PublicationAddEdit
        id={-1}
        publications={[]}
        closeAction={cy.stub()}
        onPublicationChange={cy.stub()}
      />,
    )
    cy.get('input[placeholder="Author Name"]').type('Author Bad Orcid')
    cy.get('input[placeholder="ORCID (0000-0000-0000-0000)"]').type('1111-2222-3333-444')
    cy.get('.collaborator-form-add-save-button').click()
    cy.get('.error-message').contains(/orcIdFormat@0/i).should('exist')
  })
})

describe('PublicationSummary', () => {
  it('renders columns including authors list', () => {
    mount(
      <PublicationSummary
        publication={samplePublication}
        columnsToShow={['title', 'journal', 'authors', 'url', 'tags']}
        editAction={cy.stub()}
        deleteAction={cy.stub()}
        disabled={false}
      />,
    )
    cy.contains('Sample Publication').should('exist')
    cy.contains('Journal Name').should('exist')
    cy.contains('Author One').should('exist')
    cy.get(`a[href="${samplePublication.url}"]`).should('exist')
  })

  it('renders view button and triggers viewAction', () => {
    mount(
      <PublicationSummary
        publication={samplePublication}
        columnsToShow={['title', 'publishedDate']}
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

describe('PublicationRow', () => {
  it('shows summary when not in edit mode and triggers editAction', () => {
    mount(
      <PublicationRow
        id={0}
        editMode={false}
        publication={samplePublication}
        publications={[samplePublication]}
        columnsToShow={['title', 'journal']}
        editAction={cy.stub().as('edit')}
        deleteAction={cy.stub()}
        closeAction={cy.stub()}
        onPublicationChange={cy.stub()}
        disabled={false}
      />,
    )
    cy.contains('Sample Publication').should('exist')
    cy.get('.glyphicon-pencil').click({ force: true })
    cy.get('@edit').should('have.been.calledOnce')
  })

  it('renders edit form when editMode true', () => {
    mount(
      <PublicationRow
        id={0}
        editMode={true}
        publication={samplePublication}
        publications={[samplePublication]}
        columnsToShow={['title']}
        editAction={cy.stub()}
        deleteAction={cy.stub()}
        closeAction={cy.stub()}
        onPublicationChange={cy.stub()}
        disabled={false}
      />,
    )
    cy.get('#title').should('have.value', 'Sample Publication')
  })

  it('renders view form when viewMode true and is read-only', () => {
    mount(
      <PublicationRow
        id={0}
        editMode={false}
        viewMode={true}
        publication={samplePublication}
        publications={[samplePublication]}
        columnsToShow={['title']}
        editAction={cy.stub()}
        deleteAction={cy.stub()}
        closeAction={cy.stub()}
        viewAction={cy.stub()}
        onPublicationChange={cy.stub()}
        disabled={false}
      />,
    )
    cy.get('#title').should('have.value', 'Sample Publication')
    cy.get('#title').should('be.disabled')
    cy.get('.collaborator-form-add-save-button').should('not.exist')
  })

  it('triggers viewAction when view button is clicked', () => {
    mount(
      <PublicationRow
        id={0}
        editMode={false}
        viewMode={false}
        publication={samplePublication}
        publications={[samplePublication]}
        columnsToShow={['title', 'event']}
        editAction={cy.stub()}
        deleteAction={cy.stub()}
        closeAction={cy.stub()}
        viewAction={cy.stub().as('view')}
        onPublicationChange={cy.stub()}
        disabled={false}
      />,
    )
    cy.get('.glyphicon-eye-open').click({ force: true })
    cy.get('@view').should('have.been.calledOnce')
  })
})

describe('Publication delete flow', () => {
  it('deletes a publication via modal confirmation', () => {
    const list: Publication[] = [samplePublication]
    mount(<PublicationListHarness initial={list} />)
    cy.contains('Sample Publication').should('exist')
    cy.get('.glyphicon-trash').click({ force: true })
    cy.get('.ReactModal__Content')
      .should('be.visible')
      .within(() => {
        cy.get('button').filter(':visible').contains(/delete/i).click({ force: true })
      })
    cy.get('.ReactModal__Content').should('not.exist')
    cy.contains('Sample Publication').should('not.exist')
  })
})
