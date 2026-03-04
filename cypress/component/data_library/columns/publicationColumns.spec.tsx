/**
 * Component tests for makePublicationColumns — the column definitions used
 * in the Publications tab of the Data Library.
 *
 * Each test mounts a minimal DataGrid with a single row and inspects the
 * rendered HTML to verify column behaviour.
 */
import React from 'react'
import { DataGrid } from '@mui/x-data-grid'
import { makePublicationColumns } from 'src/components/data_library/columns/publicationColumns'
import { makePublicationRow } from '../../test-utils'

const renderGrid = (overrides = {}) => {
  const row = makePublicationRow(overrides)
  cy.mount(
    <DataGrid
      rows={[row]}
      columns={makePublicationColumns()}
      getRowId={r => r.publicationId}
      autoHeight
    />,
  )
}

describe('makePublicationColumns — Title column', () => {
  beforeEach(() => cy.viewport(1600, 800))

  it('renders the publication title as a link when url is present', () => {
    renderGrid({ title: 'A Novel Genomics Study', url: 'https://doi.org/10.1038/test' })
    cy.get('a[href="https://doi.org/10.1038/test"]').contains('A Novel Genomics Study').should('exist')
  })

  it('renders plain text when url is absent', () => {
    renderGrid({ title: 'No Link Title', url: '' })
    cy.contains('No Link Title').should('exist')
    cy.get('a').filter(':contains("No Link Title")').should('not.exist')
  })

  it('sets target="_blank" and rel="noopener noreferrer" for the title link', () => {
    renderGrid({ title: 'Ext Link', url: 'https://example.com/pub' })
    cy.get('a[href="https://example.com/pub"]')
      .should('have.attr', 'target', '_blank')
      .and('have.attr', 'rel', 'noopener noreferrer')
  })

  it('renders gracefully when title is empty', () => {
    renderGrid({ title: '', url: '' })
    cy.get('.MuiDataGrid-root').should('exist')
  })
})

describe('makePublicationColumns — Study column', () => {
  beforeEach(() => cy.viewport(1600, 800))

  it('renders a link with the study name', () => {
    renderGrid({ studyId: 7, studyName: 'Genome Atlas' })
    cy.contains('Genome Atlas').should('exist')
  })

  it('links to /studies/:studyId', () => {
    renderGrid({ studyId: 7, studyName: 'Genome Atlas' })
    cy.get('a[href="/studies/7"]').should('exist')
  })
})

describe('makePublicationColumns — Journal column', () => {
  beforeEach(() => cy.viewport(1600, 800))

  it('renders the journal name', () => {
    renderGrid({ journal: 'Nature Genetics' })
    cy.contains('Nature Genetics').should('exist')
  })

  it('renders gracefully when journal is empty', () => {
    renderGrid({ journal: '' })
    cy.get('.MuiDataGrid-root').should('exist')
  })
})

describe('makePublicationColumns — Published Date column', () => {
  beforeEach(() => cy.viewport(1600, 800))

  it('renders the published date', () => {
    renderGrid({ publishedDate: '2024-06-15' })
    cy.contains('2024-06-15').should('exist')
  })

  it('renders gracefully when publishedDate is empty', () => {
    renderGrid({ publishedDate: '' })
    cy.get('.MuiDataGrid-root').should('exist')
  })
})

describe('makePublicationColumns — PubMed ID column', () => {
  beforeEach(() => cy.viewport(1600, 800))

  it('renders the PubMed ID as a link', () => {
    renderGrid({ pubmedId: '87654321' })
    cy.get('a[href="https://pubmed.ncbi.nlm.nih.gov/87654321"]')
      .contains('87654321')
      .should('exist')
  })

  it('sets target="_blank" and rel="noopener noreferrer"', () => {
    renderGrid({ pubmedId: '87654321' })
    cy.get('a[href="https://pubmed.ncbi.nlm.nih.gov/87654321"]')
      .should('have.attr', 'target', '_blank')
      .and('have.attr', 'rel', 'noopener noreferrer')
  })

  it('renders nothing when pubmedId is absent', () => {
    renderGrid({ pubmedId: '' })
    cy.get('a[href^="https://pubmed.ncbi.nlm.nih.gov"]').should('not.exist')
  })
})

describe('makePublicationColumns — DOI column', () => {
  beforeEach(() => cy.viewport(1600, 800))

  it('renders the DOI as a link', () => {
    renderGrid({ doi: '10.1038/ng.1234' })
    cy.get('a[href="https://doi.org/10.1038/ng.1234"]')
      .contains('10.1038/ng.1234')
      .should('exist')
  })

  it('sets target="_blank" and rel="noopener noreferrer"', () => {
    renderGrid({ doi: '10.1038/ng.1234' })
    cy.get('a[href="https://doi.org/10.1038/ng.1234"]')
      .should('have.attr', 'target', '_blank')
      .and('have.attr', 'rel', 'noopener noreferrer')
  })

  it('renders nothing when doi is absent', () => {
    // Clear url too so the Title column doesn't produce a doi.org link
    renderGrid({ doi: '', url: 'https://example.com/pub' })
    cy.get('a[href^="https://doi.org"]').should('not.exist')
  })
})

describe('makePublicationColumns — Authors column', () => {
  beforeEach(() => cy.viewport(1600, 800))

  it('renders comma-separated author names', () => {
    renderGrid({ authorNames: ['Alice Smith', 'Bob Jones', 'Carol White'] })
    cy.contains('Alice Smith, Bob Jones, Carol White').should('exist')
  })

  it('renders gracefully when authorNames is empty', () => {
    renderGrid({ authorNames: [] })
    cy.get('.MuiDataGrid-root').should('exist')
  })
})

describe('makePublicationColumns — Tags column', () => {
  beforeEach(() => cy.viewport(1600, 800))

  it('renders nothing when tags array is empty', () => {
    renderGrid({ tags: [] })
    cy.get('.MuiChip-root').should('not.exist')
  })

  it('renders up to 3 chips for 3 tags', () => {
    renderGrid({ tags: ['genomics', 'GWAS', 'cancer'] })
    cy.get('.MuiChip-root').should('have.length', 3)
    cy.contains('genomics').should('exist')
    cy.contains('GWAS').should('exist')
    cy.contains('cancer').should('exist')
  })

  it('shows "+N" overflow chip when there are more than 3 tags', () => {
    renderGrid({ tags: ['t1', 't2', 't3', 't4', 't5'] })
    // 3 visible tags + 1 overflow chip = 4 chips total
    cy.get('.MuiChip-root').should('have.length', 4)
    cy.contains('+2').should('exist')
  })

  it('does not show an overflow chip for exactly 3 tags', () => {
    renderGrid({ tags: ['a', 'b', 'c'] })
    cy.get('.MuiChip-root').should('have.length', 3)
    cy.get('.MuiChip-root').each(($chip) => {
      expect($chip.text()).to.not.match(/^\+\d+$/)
    })
  })
})
