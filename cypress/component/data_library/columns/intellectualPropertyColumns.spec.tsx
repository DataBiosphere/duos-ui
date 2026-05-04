/**
 * Component tests for makeIntellectualPropertyColumns — the column definitions
 * used in the Intellectual Property tab of the Data Library.
 *
 * Each test mounts a minimal DataGrid with a single row and inspects the
 * rendered HTML to verify column behaviour.
 */
import React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { DataGrid } from '@mui/x-data-grid'
import { makeIntellectualPropertyColumns } from 'src/components/data_library/columns/intellectualPropertyColumns'
import { makeIntellectualPropertyRow } from '../../test-utils'

const renderGrid = (overrides = {}) => {
  const row = makeIntellectualPropertyRow(overrides)
  cy.mount(
    <MemoryRouter>
      <DataGrid
        rows={[row]}
        columns={makeIntellectualPropertyColumns()}
        getRowId={r => r.ipId}
        autoHeight
      />,
    </MemoryRouter>,
  )
}

describe('makeIntellectualPropertyColumns — Title column', () => {
  beforeEach(() => cy.viewport(1800, 800))

  it('renders the IP title as a link when url is present', () => {
    renderGrid({ title: 'Novel Sequencing Method', url: 'https://patents.example.com/US00001' })
    cy.get('a[href="https://patents.example.com/US00001"]').contains('Novel Sequencing Method').should('exist')
  })

  it('renders plain text when url is absent', () => {
    renderGrid({ title: 'No Link Title', url: '' })
    cy.contains('No Link Title').should('exist')
    cy.get('a').filter(':contains("No Link Title")').should('not.exist')
  })

  it('sets target="_blank" and rel="noopener noreferrer" for the title link', () => {
    renderGrid({ title: 'Ext Link', url: 'https://patents.example.com/US99999' })
    cy.get('a[href="https://patents.example.com/US99999"]')
      .should('have.attr', 'target', '_blank')
      .and('have.attr', 'rel', 'noopener noreferrer')
  })

  it('renders gracefully when title is empty', () => {
    renderGrid({ title: '', url: '' })
    cy.get('.MuiDataGrid-root').should('exist')
  })
})

describe('makeIntellectualPropertyColumns — Study column', () => {
  beforeEach(() => cy.viewport(1800, 800))

  it('renders a link with the study name', () => {
    renderGrid({ studyId: 7, studyName: 'Genome Atlas' })
    cy.contains('Genome Atlas').should('exist')
  })

  it('links to /studies/:studyId', () => {
    renderGrid({ studyId: 7, studyName: 'Genome Atlas' })
    cy.get('a[href="/studies/7"]').should('exist')
  })
})

describe('makeIntellectualPropertyColumns — Type column', () => {
  beforeEach(() => cy.viewport(1800, 800))

  it('renders the IP type', () => {
    renderGrid({ type: 'Patent' })
    cy.contains('Patent').should('exist')
  })

  it('renders gracefully when type is empty', () => {
    renderGrid({ type: '' })
    cy.get('.MuiDataGrid-root').should('exist')
  })
})

describe('makeIntellectualPropertyColumns — Patent Number column', () => {
  beforeEach(() => cy.viewport(1800, 800))

  it('renders the patent number', () => {
    renderGrid({ patentNumber: 'US12345678' })
    cy.contains('US12345678').should('exist')
  })

  it('renders gracefully when patent number is empty', () => {
    renderGrid({ patentNumber: '' })
    cy.get('.MuiDataGrid-root').should('exist')
  })
})

describe('makeIntellectualPropertyColumns — Assignee column', () => {
  beforeEach(() => cy.viewport(1800, 800))

  it('renders the assignee', () => {
    renderGrid({ assignee: 'Broad Institute' })
    cy.contains('Broad Institute').should('exist')
  })

  it('renders gracefully when assignee is empty', () => {
    renderGrid({ assignee: '' })
    cy.get('.MuiDataGrid-root').should('exist')
  })
})

describe('makeIntellectualPropertyColumns — Status column', () => {
  beforeEach(() => cy.viewport(1800, 800))

  it('renders the status', () => {
    renderGrid({ status: 'Granted' })
    cy.contains('Granted').should('exist')
  })

  it('renders gracefully when status is empty', () => {
    renderGrid({ status: '' })
    cy.get('.MuiDataGrid-root').should('exist')
  })
})

describe('makeIntellectualPropertyColumns — Filing Date column', () => {
  beforeEach(() => cy.viewport(1800, 800))

  it('renders the filing date', () => {
    renderGrid({ filingDate: '2023-06-15' })
    cy.contains('2023-06-15').should('exist')
  })

  it('renders gracefully when filing date is empty', () => {
    renderGrid({ filingDate: '' })
    cy.get('.MuiDataGrid-root').should('exist')
  })
})

describe('makeIntellectualPropertyColumns — Contact column', () => {
  beforeEach(() => cy.viewport(1800, 800))

  it('renders the contact', () => {
    renderGrid({ contact: 'ip@broadinstitute.org' })
    cy.contains('ip@broadinstitute.org').should('exist')
  })

  it('renders gracefully when contact is empty', () => {
    renderGrid({ contact: '' })
    cy.get('.MuiDataGrid-root').should('exist')
  })
})

describe('makeIntellectualPropertyColumns — Tags column', () => {
  beforeEach(() => cy.viewport(1800, 800))

  it('renders chips for each tag', () => {
    renderGrid({ tags: ['genomics', 'sequencing', 'IP'] })
    cy.contains('genomics').should('exist')
    cy.contains('sequencing').should('exist')
    cy.contains('IP').should('exist')
  })

  it('shows overflow chip when more than 3 tags are present', () => {
    renderGrid({ tags: ['a', 'b', 'c', 'd', 'e'] })
    cy.contains('+2').should('exist')
  })

  it('renders gracefully when tags array is empty', () => {
    renderGrid({ tags: [] })
    cy.get('.MuiDataGrid-root').should('exist')
  })
})
