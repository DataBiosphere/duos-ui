import React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { DataGrid } from '@mui/x-data-grid'
import { makeDatasetColumns } from 'src/components/data_library/columns/datasetColumns'
import { makeDatasetTerm } from '../../test-utils'

/**
 * Tests for makeDatasetColumns — focused on the Access Management chip
 * color and label rendering for each AccessManagement value.
 */
describe('datasetColumns — column order', () => {
  it('returns columns in the expected order', () => {
    const columns = makeDatasetColumns()
    const fields = columns.map(c => c.field)
    expect(fields).to.deep.equal([
      'datasetName',
      'studyName',
      'datasetIdentifier',
      'accessManagement',
      'participantCount',
      'dataUse',
      'dac',
      'actions',
    ])
  })
})

describe('datasetColumns — Access Management chip', () => {
  beforeEach(() => {
    cy.viewport(1200, 800)
  })

  const renderGrid = (accessManagement: string) => {
    const row = makeDatasetTerm({ datasetId: 1, accessManagement })
    cy.mount(
      <MemoryRouter>
        <DataGrid
          rows={[row]}
          columns={makeDatasetColumns()}
          getRowId={r => r.datasetId}
          autoHeight
        />,
      </MemoryRouter>,
    )
  }

  it('renders "Controlled" chip with primary color for controlled access', () => {
    renderGrid('controlled')
    cy.get('.MuiChip-label').contains('Controlled').should('exist')
    cy.get('.MuiChip-root.MuiChip-colorPrimary').should('exist')
    cy.get('svg[data-testid="BoltIcon"]').should('not.exist')
  })

  it('renders "Open" chip with success color for open access', () => {
    renderGrid('open')
    cy.get('.MuiChip-label').contains('Open').should('exist')
    cy.get('.MuiChip-root.MuiChip-colorSuccess').should('exist')
    cy.get('svg[data-testid="BoltIcon"]').should('not.exist')
  })

  it('renders "External" chip with secondary color for external access', () => {
    renderGrid('external')
    cy.get('.MuiChip-label').contains('External').should('exist')
    cy.get('.MuiChip-root.MuiChip-colorSecondary').should('exist')
    cy.get('svg[data-testid="BoltIcon"]').should('not.exist')
  })

  it('renders "Unknown" chip with default color for unknown access', () => {
    renderGrid('something-unknown')
    cy.get('.MuiChip-label').contains('Unknown').should('exist')
    cy.get('.MuiChip-root.MuiChip-colorDefault').should('exist')
    cy.get('svg[data-testid="BoltIcon"]').should('not.exist')
  })

  it('shows Bolt icon for radar enabled datasets', () => {
    const radarEnabledDatasetIds = new Set([1])
    const row = makeDatasetTerm({ datasetId: 1, accessManagement: 'controlled' })
    cy.mount(
      <MemoryRouter>
        <DataGrid
          rows={[row]}
          columns={makeDatasetColumns({}, radarEnabledDatasetIds)}
          getRowId={r => r.datasetId}
          autoHeight
        />,
      </MemoryRouter>,
    )
    cy.get('svg[data-testid="BoltIcon"]').should('exist')
  })
})
