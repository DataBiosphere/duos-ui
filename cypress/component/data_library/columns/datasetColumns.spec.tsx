import React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { DataGrid } from '@mui/x-data-grid'
import { makeDatasetColumns } from 'src/components/data_library/columns/datasetColumns'
import { makeDatasetTerm } from '../../test-utils'

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
      'requestLocation',
      'actions',
    ])
  })
})

describe('datasetColumns — Access Management text', () => {
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

  it('renders "via DUOS" for controlled access', () => {
    renderGrid('controlled')
    cy.contains('via DUOS').should('exist')
    cy.get('.MuiChip-root').should('not.exist')
    cy.get('svg[data-testid="BoltIcon"]').should('not.exist')
  })

  it('renders "Open Access" for open access', () => {
    renderGrid('open')
    cy.contains('Open Access').should('exist')
    cy.get('.MuiChip-root').should('not.exist')
    cy.get('svg[data-testid="BoltIcon"]').should('not.exist')
  })

  it('renders "External to DUOS" for external access', () => {
    renderGrid('external')
    cy.contains('External to DUOS').should('exist')
    cy.get('.MuiChip-root').should('not.exist')
    cy.get('svg[data-testid="BoltIcon"]').should('not.exist')
  })

  it('renders the raw value for unknown access types', () => {
    renderGrid('something-unknown')
    cy.contains('something-unknown').should('exist')
    cy.get('.MuiChip-root').should('not.exist')
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
