import React from 'react'
import { DataGrid } from '@mui/x-data-grid'
import { makeDatasetColumns } from 'src/components/data_library/columns/datasetColumns'
import { makeDatasetTerm } from '../test-utils'

/**
 * Tests for makeDatasetColumns — focused on the Access Management chip
 * color and label rendering for each AccessManagement value.
 */
describe('datasetColumns — Access Management chip', () => {
  beforeEach(() => {
    cy.viewport(1200, 800)
  })

  const renderGrid = (accessManagement: string) => {
    const row = makeDatasetTerm({ datasetId: 1, accessManagement })
    cy.mount(
      <DataGrid
        rows={[row]}
        columns={makeDatasetColumns()}
        getRowId={r => r.datasetId}
        autoHeight
      />,
    )
  }

  it('renders "Controlled" chip with primary color for controlled access', () => {
    renderGrid('controlled')
    cy.get('.MuiChip-label').contains('Controlled').should('exist')
    cy.get('.MuiChip-root.MuiChip-colorPrimary').should('exist')
  })

  it('renders "Open" chip with success color for open access', () => {
    renderGrid('open')
    cy.get('.MuiChip-label').contains('Open').should('exist')
    cy.get('.MuiChip-root.MuiChip-colorSuccess').should('exist')
  })

  it('renders "External" chip with secondary color for external access', () => {
    renderGrid('external')
    cy.get('.MuiChip-label').contains('External').should('exist')
    cy.get('.MuiChip-root.MuiChip-colorSecondary').should('exist')
  })

  it('renders "Unknown" chip with default color for unknown access', () => {
    renderGrid('something-unknown')
    cy.get('.MuiChip-label').contains('Unknown').should('exist')
    cy.get('.MuiChip-root.MuiChip-colorDefault').should('exist')
  })
})
