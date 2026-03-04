/**
 * Component tests for makeBiospecimenColumns — the column definitions used in the
 * Biospecimens tab of the Data Library.
 *
 * Each test mounts a minimal DataGrid with a single (or small set of) rows and
 * inspects the rendered HTML to verify the column behaviour.
 */
import React from 'react'
import { DataGrid } from '@mui/x-data-grid'
import { makeBiospecimenColumns } from 'src/components/data_library/columns/biospecimenColumns'
import { makeBiospecimenRow } from '../../test-utils'

const renderGrid = (overrides = {}) => {
  const row = makeBiospecimenRow(overrides)
  cy.mount(
    <DataGrid
      rows={[row]}
      columns={makeBiospecimenColumns()}
      getRowId={r => r.biospecimenId}
      autoHeight
    />,
  )
}

describe('makeBiospecimenColumns — Study Name column', () => {
  beforeEach(() => cy.viewport(1400, 800))

  it('renders a link with the study name', () => {
    renderGrid({ studyId: 42, studyName: 'Alzheimer Research Study' })
    cy.contains('Alzheimer Research Study').should('exist')
  })

  it('links to /studies/:studyId', () => {
    renderGrid({ studyId: 42, studyName: 'Alzheimer Research Study' })
    cy.get('a[href="/studies/42"]').should('exist')
  })

  it('renders an empty cell gracefully when studyName is absent', () => {
    renderGrid({ studyId: 1, studyName: '' })
    cy.get('.MuiDataGrid-root').should('exist')
  })
})

describe('makeBiospecimenColumns — Biospecimen ID column', () => {
  beforeEach(() => cy.viewport(1400, 800))

  it('renders the biospecimen ID text', () => {
    renderGrid({ biospecimenId: 'BS-12345' })
    cy.contains('BS-12345').should('exist')
  })

  it('renders an empty cell gracefully when biospecimenId is absent', () => {
    renderGrid({ biospecimenId: '' })
    cy.get('.MuiDataGrid-root').should('exist')
  })

  it('wraps long biospecimen IDs with tooltip and ellipsis', () => {
    const longId = 'VERY-LONG-BIOSPECIMEN-ID-WITH-MANY-CHARACTERS'
    renderGrid({ biospecimenId: longId })
    cy.contains(longId).parent().should('have.css', 'overflow', 'hidden')
  })
})

describe('makeBiospecimenColumns — Specimen Type column', () => {
  beforeEach(() => cy.viewport(1400, 800))

  it('renders specimen type in title case', () => {
    renderGrid({ specimenType: 'BLOOD' })
    cy.contains('Blood').should('exist')
  })

  it('handles underscores in enum values', () => {
    renderGrid({ specimenType: 'FRESH_FROZEN' })
    cy.contains('Fresh Frozen').should('exist')
  })

  it('renders an empty cell when specimenType is absent', () => {
    renderGrid({ specimenType: '' })
    cy.get('.MuiDataGrid-root').should('exist')
  })

  it('converts multiple underscores correctly', () => {
    renderGrid({ specimenType: 'NORMAL_ADJACENT' })
    cy.contains('Normal Adjacent').should('exist')
  })
})

describe('makeBiospecimenColumns — Donor ID column', () => {
  beforeEach(() => cy.viewport(1400, 800))

  it('renders the donor ID text', () => {
    renderGrid({ donorId: 'DONOR-9876' })
    cy.contains('DONOR-9876').should('exist')
  })

  it('renders an empty cell gracefully when donorId is absent', () => {
    renderGrid({ donorId: '' })
    cy.get('.MuiDataGrid-root').should('exist')
  })

  it('wraps long donor IDs with tooltip and ellipsis', () => {
    const longDonorId = 'VERY-LONG-DONOR-IDENTIFICATION-STRING'
    renderGrid({ donorId: longDonorId })
    cy.contains(longDonorId).parent().should('have.css', 'overflow', 'hidden')
  })
})

describe('makeBiospecimenColumns — Date Of Collection column', () => {
  beforeEach(() => cy.viewport(1400, 800))

  it('renders the date of collection', () => {
    renderGrid({ dateOfCollection: '2023-05-15' })
    cy.contains('2023-05-15').should('exist')
  })

  it('renders an empty cell when dateOfCollection is absent', () => {
    renderGrid({ dateOfCollection: '' })
    cy.get('.MuiDataGrid-root').should('exist')
  })

  it('renders various date formats correctly', () => {
    renderGrid({ dateOfCollection: '2024-01-01' })
    cy.contains('2024-01-01').should('exist')
  })
})

describe('makeBiospecimenColumns — column structure', () => {
  it('returns 5 column definitions', () => {
    const cols = makeBiospecimenColumns()
    expect(cols).to.have.length(5)
  })

  it('defines expected fields in correct order', () => {
    const fields = makeBiospecimenColumns().map(c => c.field)
    expect(fields).to.deep.equal([
      'studyName',
      'biospecimenId',
      'specimenType',
      'donorId',
      'dateOfCollection',
    ])
  })

  it('sets appropriate widths and flex values', () => {
    const cols = makeBiospecimenColumns()
    const studyNameCol = cols.find(c => c.field === 'studyName')!
    const biospecimenIdCol = cols.find(c => c.field === 'biospecimenId')!

    expect(studyNameCol.flex).to.equal(1)
    expect(studyNameCol.minWidth).to.equal(150)
    expect(biospecimenIdCol.flex).to.equal(1)
    expect(biospecimenIdCol.minWidth).to.equal(150)
  })

  it('sets fixed widths for specimen type and donor ID columns', () => {
    const cols = makeBiospecimenColumns()
    const specimenTypeCol = cols.find(c => c.field === 'specimenType')!
    const donorIdCol = cols.find(c => c.field === 'donorId')!
    const dateOfCollectionCol = cols.find(c => c.field === 'dateOfCollection')!

    expect(specimenTypeCol.width).to.equal(150)
    expect(donorIdCol.flex).to.equal(1)
    expect(dateOfCollectionCol.width).to.equal(150)
  })
})

describe('makeBiospecimenColumns — tooltip and text ellipsis', () => {
  beforeEach(() => cy.viewport(1400, 800))

  it('applies ellipsis styling to biospecimen ID', () => {
    renderGrid({ biospecimenId: 'VERY-LONG-BIOSPECIMEN-IDENTIFIER' })

    cy.get('[role="row"]').eq(1).within(() => {
      cy.get('div').filter((_, el) => {
        const style = globalThis.getComputedStyle(el)
        return style.textOverflow === 'ellipsis' && style.whiteSpace === 'nowrap'
      }).should('exist')
    })
  })

  it('shows tooltip on hover for biospecimen ID', () => {
    renderGrid({ biospecimenId: 'BS-12345-LONG' })
    cy.contains('BS-12345-LONG').closest('[role="gridcell"]').trigger('mouseover')
    cy.get('[role="tooltip"]').should('exist').and('be.visible')
  })
})

describe('makeBiospecimenColumns — accessibility', () => {
  beforeEach(() => cy.viewport(1400, 800))

  it('renders headers with proper labels', () => {
    cy.mount(
      <DataGrid
        rows={[makeBiospecimenRow()]}
        columns={makeBiospecimenColumns()}
        getRowId={r => r.biospecimenId}
        autoHeight
      />,
    )
    cy.contains('Study Name').should('exist')
    cy.contains('Biospecimen ID').should('exist')
    cy.contains('Specimen Type').should('exist')
    cy.contains('Donor ID').should('exist')
    cy.contains('Date Of Collection').should('exist')
  })
})
