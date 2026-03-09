/**
 * Component tests for makeClinicalTrialColumns — the column definitions used
 * in the Clinical Trials tab of the Data Library.
 *
 * Each test mounts a minimal DataGrid with a single (or small set of) rows and
 * inspects the rendered HTML to verify the column behaviour.
 */
import React from 'react'
import { DataGrid } from '@mui/x-data-grid'
import { makeClinicalTrialColumns } from 'src/components/data_library/columns/clinicalTrialColumns'
import { makeClinicalTrialRow } from '../../test-utils'

const renderGrid = (overrides = {}) => {
  const row = makeClinicalTrialRow(overrides)
  cy.mount(
    <DataGrid
      rows={[row]}
      columns={makeClinicalTrialColumns()}
      getRowId={r => r.clinicalTrialId}
      autoHeight
    />,
  )
}

// ---------------------------------------------------------------------------
// Trial Title column
// ---------------------------------------------------------------------------

describe('makeClinicalTrialColumns — Trial Title column', () => {
  beforeEach(() => cy.viewport(1600, 800))

  it('renders the title as a link when url is present', () => {
    renderGrid({ title: 'Phase II Immunotherapy Study', url: 'https://clinicaltrials.gov/study/NCT001' })
    cy.get('a[href="https://clinicaltrials.gov/study/NCT001"]')
      .contains('Phase II Immunotherapy Study')
      .should('exist')
  })

  it('sets target="_blank" and rel="noopener noreferrer" on the title link', () => {
    renderGrid({ title: 'Phase II Immunotherapy Study', url: 'https://clinicaltrials.gov/study/NCT001' })
    cy.get('a[href="https://clinicaltrials.gov/study/NCT001"]')
      .should('have.attr', 'target', '_blank')
      .and('have.attr', 'rel', 'noopener noreferrer')
  })

  it('renders the title as plain text when url is absent', () => {
    renderGrid({ title: 'No URL Trial', url: '' })
    cy.contains('No URL Trial').should('exist')
    // No anchor for title when url is absent
    cy.get('.MuiDataGrid-cell').contains('No URL Trial').find('a').should('not.exist')
  })

  it('renders an empty cell gracefully when title is absent', () => {
    renderGrid({ title: '', url: '' })
    cy.get('.MuiDataGrid-root').should('exist')
  })
})

// ---------------------------------------------------------------------------
// Study column
// ---------------------------------------------------------------------------

describe('makeClinicalTrialColumns — Study column', () => {
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

// ---------------------------------------------------------------------------
// Identifier column
// ---------------------------------------------------------------------------

describe('makeClinicalTrialColumns — Identifier column', () => {
  beforeEach(() => cy.viewport(1600, 800))

  it('renders the identifier as a link when url is present', () => {
    renderGrid({ identifier: 'NCT00000001', url: 'https://clinicaltrials.gov/study/NCT00000001' })
    cy.get('a[href="https://clinicaltrials.gov/study/NCT00000001"]')
      .contains('NCT00000001')
      .should('exist')
  })

  it('renders the identifier as plain text when url is absent', () => {
    renderGrid({ identifier: 'NCT00000001', url: '' })
    cy.contains('NCT00000001').should('exist')
    cy.get('a[href*="NCT00000001"]').should('not.exist')
  })

  it('renders an empty cell gracefully when identifier is absent', () => {
    renderGrid({ identifier: '' })
    cy.get('.MuiDataGrid-root').should('exist')
  })
})

// ---------------------------------------------------------------------------
// Status column
// ---------------------------------------------------------------------------

describe('makeClinicalTrialColumns — Status column', () => {
  beforeEach(() => cy.viewport(1600, 800))

  it('renders the status as a chip', () => {
    renderGrid({ status: 'RECRUITING' })
    cy.get('.MuiChip-root').should('exist')
    cy.get('.MuiChip-root').contains('Recruiting').should('exist')
  })

  it('converts ACTIVE_NOT_RECRUITING to title case with spaces', () => {
    renderGrid({ status: 'ACTIVE_NOT_RECRUITING' })
    cy.get('.MuiChip-root').contains('Active Not Recruiting').should('exist')
  })

  it('renders an empty chip when status is absent', () => {
    renderGrid({ status: '' })
    cy.get('.MuiChip-root').should('exist')
  })
})

// ---------------------------------------------------------------------------
// Phase column
// ---------------------------------------------------------------------------

describe('makeClinicalTrialColumns — Phase column', () => {
  beforeEach(() => cy.viewport(1600, 800))

  it('renders PHASE2 as "PHASE2" with underscores replaced by spaces', () => {
    renderGrid({ phase: 'PHASE2' })
    cy.contains('PHASE2').should('exist')
  })

  it('renders EARLY_PHASE1 with "Early" prefix lowercased', () => {
    renderGrid({ phase: 'EARLY_PHASE1' })
    cy.contains('Early PHASE1').should('exist')
  })

  it('renders NA phase gracefully', () => {
    renderGrid({ phase: 'NA' })
    cy.contains('NA').should('exist')
  })

  it('renders an empty cell when phase is absent', () => {
    renderGrid({ phase: '' })
    cy.get('.MuiDataGrid-root').should('exist')
  })
})

// ---------------------------------------------------------------------------
// Intervention Type column
// ---------------------------------------------------------------------------

describe('makeClinicalTrialColumns — Intervention Type column', () => {
  beforeEach(() => cy.viewport(1600, 800))

  it('renders the intervention type in title case', () => {
    renderGrid({ interventionType: 'BIOLOGICAL' })
    cy.contains('Biological').should('exist')
  })

  it('converts COMBINATION_PRODUCT to "Combination Product"', () => {
    renderGrid({ interventionType: 'COMBINATION_PRODUCT' })
    cy.contains('Combination Product').should('exist')
  })

  it('renders an empty cell gracefully when interventionType is absent', () => {
    renderGrid({ interventionType: '' })
    cy.get('.MuiDataGrid-root').should('exist')
  })
})

// ---------------------------------------------------------------------------
// Sponsor column
// ---------------------------------------------------------------------------

describe('makeClinicalTrialColumns — Sponsor column', () => {
  beforeEach(() => cy.viewport(1600, 800))

  it('renders the sponsor name', () => {
    renderGrid({ sponsor: 'NIH/NHGRI' })
    cy.contains('NIH/NHGRI').should('exist')
  })

  it('renders an empty cell gracefully when sponsor is absent', () => {
    renderGrid({ sponsor: '' })
    cy.get('.MuiDataGrid-root').should('exist')
  })
})

// ---------------------------------------------------------------------------
// Start Date column
// ---------------------------------------------------------------------------

describe('makeClinicalTrialColumns — Start Date column', () => {
  beforeEach(() => cy.viewport(1600, 800))

  it('renders the start date', () => {
    renderGrid({ startDate: '2024-03-15' })
    cy.contains('2024-03-15').should('exist')
  })

  it('renders an empty cell gracefully when startDate is absent', () => {
    renderGrid({ startDate: '' })
    cy.get('.MuiDataGrid-root').should('exist')
  })
})

// ---------------------------------------------------------------------------
// Column structure
// ---------------------------------------------------------------------------

describe('makeClinicalTrialColumns — column structure', () => {
  it('returns 8 column definitions', () => {
    const cols = makeClinicalTrialColumns()
    expect(cols).to.have.length(8)
  })

  it('defines expected fields in order', () => {
    const fields = makeClinicalTrialColumns().map(c => c.field)
    expect(fields).to.deep.equal([
      'title',
      'studyName',
      'identifier',
      'status',
      'phase',
      'interventionType',
      'sponsor',
      'startDate',
    ])
  })
})
