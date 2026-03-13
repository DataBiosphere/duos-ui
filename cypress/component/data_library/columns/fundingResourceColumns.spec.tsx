/**
 * Component tests for makeFundingResourceColumns — the column definitions used in the
 * funding resources tab of the Data Library.
 *
 * Each test mounts a minimal DataGrid with a single (or small set of) rows and
 * inspects the rendered HTML to verify the column behaviour.
 */
import React from 'react'
import { DataGrid } from '@mui/x-data-grid'
import { makeFundingResourceColumns } from 'src/components/data_library/columns/fundingResourceColumns'
import { makeFundingResourceRow } from '../../test-utils'

const renderGrid = (overrides = {}) => {
  const row = makeFundingResourceRow(overrides)
  cy.mount(
    <DataGrid
      rows={[row]}
      columns={makeFundingResourceColumns()}
      getRowId={r => r.fundingId}
      autoHeight
      sx={{ width: 1200 }} // Ensures grid is wide enough for all columns
    />,
  )
}

describe('makeFundingResourceColumns — Study Name column', () => {
  beforeEach(() => cy.viewport(1400, 800))

  it('renders a link with the study name', () => {
    renderGrid({ studyId: 101, studyName: 'Cancer Study' })
    cy.contains('Cancer Study').should('exist')
  })

  it('links to /studies/:studyId', () => {
    renderGrid({ studyId: 101, studyName: 'Cancer Study' })
    cy.get('a[href="/studies/101"]').should('exist')
  })

  it('renders an empty cell gracefully when studyName is absent', () => {
    renderGrid({ studyName: '' })
    cy.get('.MuiDataGrid-root').should('exist')
  })
})

describe('makeFundingResourceColumns — Funding ID column', () => {
  it('renders the funding ID text', () => {
    renderGrid({ fundingId: 'FR-12345' })
    cy.contains('FR-12345').should('exist')
  })

  it('renders an empty cell gracefully when fundingId is absent', () => {
    renderGrid({ fundingId: '' })
    cy.get('.MuiDataGrid-root').should('exist')
  })
})

describe('makeFundingResourceColumns — Funder Name column', () => {
  it('renders the funder name', () => {
    renderGrid({ funderName: 'NIH' })
    cy.contains('NIH').should('exist')
  })

  it('renders an empty cell gracefully when funderName is absent', () => {
    renderGrid({ funderName: '' })
    cy.get('.MuiDataGrid-root').should('exist')
  })
})

describe('makeFundingResourceColumns — Grant Number column', () => {
  it('renders the grant number', () => {
    renderGrid({ grantNumber: 'R01-XYZ' })
    cy.contains('R01-XYZ').should('exist')
  })

  it('renders an empty cell gracefully when grantNumber is absent', () => {
    renderGrid({ grantNumber: '' })
    cy.get('.MuiDataGrid-root').should('exist')
  })
})

describe('makeFundingResourceColumns — Project Title column', () => {
  it('renders the project title', () => {
    renderGrid({ projectTitle: 'Cancer Genomics' })
    cy.contains('Cancer Genomics').should('exist')
  })

  it('renders an empty cell gracefully when projectTitle is absent', () => {
    renderGrid({ projectTitle: '' })
    cy.get('.MuiDataGrid-root').should('exist')
  })
})

describe('makeFundingResourceColumns — Start Date column', () => {
  it('renders the start date', () => {
    renderGrid({ startDate: '2024-01-01' })
    cy.contains('2024-01-01').should('exist')
  })

  it('renders an empty cell gracefully when startDate is absent', () => {
    renderGrid({ startDate: '' })
    cy.get('.MuiDataGrid-root').should('exist')
  })
})

describe('makeFundingResourceColumns — URL column', () => {
  it('renders url as external link when present', () => {
    renderGrid({ url: 'https://example.org' })
    cy.contains('a', 'Link')
      .should('have.attr', 'href', 'https://example.org')
      .and('have.attr', 'target', '_blank')
      .and('have.attr', 'rel', 'noopener noreferrer')
  })

  it('renders null for empty url', () => {
    renderGrid({ url: '' })
    cy.get('.MuiDataGrid-root').should('exist')
  })
})

describe('makeFundingResourceColumns — Tags column', () => {
  beforeEach(() => cy.viewport(1400, 800))

  it('renders nothing when tags array is empty', () => {
    renderGrid({ tags: [] })
    cy.get('.MuiChip-root').should('not.exist')
  })

  it('renders up to 3 chips for 3 tags', () => {
    renderGrid({ tags: ['tag1', 'tag2', 'tag3'] })
    cy.get('.MuiChip-root').should('have.length', 3)
    cy.contains('tag1').should('exist')
    cy.contains('tag2').should('exist')
    cy.contains('tag3').should('exist')
  })

  it('shows "+N" overflow chip when there are more than 3 tags', () => {
    renderGrid({ tags: ['tag1', 'tag2', 'tag3', 'tag4', 'tag5'] })
    cy.get('.MuiChip-root').should('have.length', 4)
    cy.contains('+2').should('exist')
  })

  it('does not show an overflow chip for exactly 3 tags', () => {
    renderGrid({ tags: ['tagA', 'tagB', 'tagC'] })
    cy.get('.MuiChip-root').should('have.length', 3)
    cy.get('.MuiChip-root').each(($chip) => {
      expect($chip.text()).to.not.match(/^\+\d+$/)
    })
  })
})

describe('makeFundingResourceColumns — column structure', () => {
  it('returns 9 column definitions', () => {
    const cols = makeFundingResourceColumns()
    expect(cols).to.have.length(9)
  })

  it('defines expected fields in correct order', () => {
    const fields = makeFundingResourceColumns().map(c => c.field)
    expect(fields).to.deep.equal([
      'studyName',
      'fundingId',
      'funderName',
      'funderProgram',
      'grantNumber',
      'projectTitle',
      'startDate',
      'url',
      'tags',
    ])
  })

  it('sets url and tags as non-sortable', () => {
    const cols = makeFundingResourceColumns()
    expect(cols.find(c => c.field === 'url')?.sortable).to.equal(false)
    expect(cols.find(c => c.field === 'tags')?.sortable).to.equal(false)
  })
})

describe('makeFundingResourceColumns — accessibility', () => {
  it('renders headers with proper labels', () => {
    cy.mount(
      <DataGrid
        rows={[makeFundingResourceRow()]}
        columns={makeFundingResourceColumns()}
        getRowId={r => r.fundingId}
        autoHeight
        sx={{ width: 1200 }} // Ensures grid is wide enough for all columns
      />,
    )
    cy.contains('Study Name').should('exist')
    cy.contains('Funding Resource ID').should('exist')
    cy.contains('Funder Name').should('exist')
    cy.contains('Funder Program').should('exist')
    cy.contains('Grant Number').should('exist')
    cy.contains('Project Title').should('exist')
    cy.contains('Start Date').should('exist')
    cy.contains('URL').should('exist')
    cy.contains('Tags').should('exist')
  })
})
