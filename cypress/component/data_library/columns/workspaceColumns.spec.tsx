/**
 * Component tests for makeWorkspaceColumns — the column definitions used in the
 * Workspaces tab of the Data Library.
 *
 * Each test mounts a minimal DataGrid with a single (or small set of) rows and
 * inspects the rendered HTML to verify the column behaviour.
 */
import React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { DataGrid } from '@mui/x-data-grid'
import { makeWorkspaceColumns } from 'src/components/data_library/columns/workspaceColumns'
import { makeWorkspaceRow } from '../../test-utils'

const renderGrid = (overrides = {}) => {
  const row = makeWorkspaceRow(overrides)
  cy.mount(
    <MemoryRouter>
      <DataGrid
        rows={[row]}
        columns={makeWorkspaceColumns()}
        getRowId={r => r.workspaceId}
        autoHeight
      />,
    </MemoryRouter>,
  )
}

describe('makeWorkspaceColumns — Workspace Name column', () => {
  beforeEach(() => cy.viewport(1400, 800))

  it('renders the workspace name text', () => {
    renderGrid({ name: 'Terra Analysis Workspace' })
    cy.contains('Terra Analysis Workspace').should('exist')
  })

  it('renders an empty cell gracefully when name is absent', () => {
    renderGrid({ name: '' })
    cy.get('.MuiDataGrid-root').should('exist')
  })
})

describe('makeWorkspaceColumns — Study column', () => {
  beforeEach(() => cy.viewport(1400, 800))

  it('renders a link with the study name', () => {
    renderGrid({ studyId: 7, studyName: 'Genome Atlas' })
    cy.contains('Genome Atlas').should('exist')
  })

  it('links to /studies/:studyId', () => {
    renderGrid({ studyId: 7, studyName: 'Genome Atlas' })
    cy.get('a[href="/studies/7"]').should('exist')
  })
})

describe('makeWorkspaceColumns — Platform column', () => {
  beforeEach(() => cy.viewport(1400, 800))

  it('renders the platform text', () => {
    renderGrid({ platform: 'AnVIL' })
    cy.contains('AnVIL').should('exist')
  })

  it('renders an empty cell when platform is absent', () => {
    renderGrid({ platform: '' })
    cy.get('.MuiDataGrid-root').should('exist')
  })
})

describe('makeWorkspaceColumns — URL column', () => {
  beforeEach(() => cy.viewport(1400, 800))

  it('renders "Link" as a clickable anchor when url is present', () => {
    renderGrid({ url: 'https://app.terra.bio/#workspaces/test/example' })
    cy.get('a[href="https://app.terra.bio/#workspaces/test/example"]')
      .contains('Link')
      .should('exist')
  })

  it('renders nothing when url is absent', () => {
    renderGrid({ url: '' })
    cy.get('a').filter(':contains("Link")').should('not.exist')
  })

  it('sets target="_blank" and rel="noopener noreferrer" for external links', () => {
    renderGrid({ url: 'https://example.com/workspace' })
    cy.get('a[href="https://example.com/workspace"]')
      .should('have.attr', 'target', '_blank')
      .and('have.attr', 'rel', 'noopener noreferrer')
  })
})

describe('makeWorkspaceColumns — Description column', () => {
  beforeEach(() => cy.viewport(1400, 800))

  it('renders the description text', () => {
    renderGrid({ description: 'A cloud-based genomics pipeline' })
    cy.contains('A cloud-based genomics pipeline').should('exist')
  })

  it('renders an empty cell when description is absent', () => {
    renderGrid({ description: '' })
    cy.get('.MuiDataGrid-root').should('exist')
  })
})

describe('makeWorkspaceColumns — Tools column', () => {
  beforeEach(() => cy.viewport(1400, 800))

  it('renders nothing when tools array is empty', () => {
    renderGrid({ tools: [], tags: [] })
    cy.get('.MuiChip-root').should('not.exist')
  })

  it('renders up to 3 chips for 3 tools', () => {
    renderGrid({ tools: ['WDL', 'Jupyter', 'R'], tags: [] })
    cy.get('.MuiChip-root').should('have.length', 3)
    cy.contains('WDL').should('exist')
    cy.contains('Jupyter').should('exist')
    cy.contains('R').should('exist')
  })

  it('shows "+N" overflow chip when there are more than 3 tools', () => {
    renderGrid({ tools: ['WDL', 'Jupyter', 'R', 'Python', 'Nextflow'], tags: [] })
    // 3 visible chips + 1 overflow chip = 4 chips total
    cy.get('.MuiChip-root').should('have.length', 4)
    cy.contains('+2').should('exist')
  })

  it('does not show an overflow chip for exactly 3 tools', () => {
    renderGrid({ tools: ['WDL', 'Jupyter', 'R'], tags: [] })
    cy.get('.MuiChip-root').should('have.length', 3)
    cy.get('.MuiChip-root').each(($chip) => {
      expect($chip.text()).to.not.match(/^\+\d+$/)
    })
  })
})

describe('makeWorkspaceColumns — Access column', () => {
  beforeEach(() => cy.viewport(1400, 800))

  it('renders the access text', () => {
    renderGrid({ access: 'controlled' })
    cy.contains('controlled').should('exist')
  })

  it('renders an empty cell when access is absent', () => {
    renderGrid({ access: '' })
    cy.get('.MuiDataGrid-root').should('exist')
  })
})

describe('makeWorkspaceColumns — Tags column', () => {
  beforeEach(() => cy.viewport(1400, 800))

  it('renders nothing when tags array is empty', () => {
    renderGrid({ tags: [], tools: [] })
    cy.get('.MuiChip-root').should('not.exist')
  })

  it('renders up to 3 chips for 3 tags', () => {
    renderGrid({ tools: [], tags: ['genomics', 'cloud', 'wgs'] })
    cy.get('.MuiChip-root').should('have.length', 3)
    cy.contains('genomics').should('exist')
    cy.contains('cloud').should('exist')
    cy.contains('wgs').should('exist')
  })

  it('shows "+N" overflow chip when there are more than 3 tags', () => {
    renderGrid({ tools: [], tags: ['t1', 't2', 't3', 't4', 't5'] })
    cy.get('.MuiChip-root').should('have.length', 4)
    cy.contains('+2').should('exist')
  })

  it('does not show an overflow chip for exactly 3 tags', () => {
    renderGrid({ tools: [], tags: ['a', 'b', 'c'] })
    cy.get('.MuiChip-root').should('have.length', 3)
    cy.get('.MuiChip-root').each(($chip) => {
      expect($chip.text()).to.not.match(/^\+\d+$/)
    })
  })
})

describe('makeWorkspaceColumns — column structure', () => {
  it('returns 8 column definitions', () => {
    const cols = makeWorkspaceColumns()
    expect(cols).to.have.length(8)
  })

  it('defines expected fields in order', () => {
    const fields = makeWorkspaceColumns().map(c => c.field)
    expect(fields).to.deep.equal([
      'name',
      'studyName',
      'platform',
      'url',
      'description',
      'tools',
      'access',
      'tags',
    ])
  })

  it('marks url, tools, and tags as non-sortable', () => {
    const cols = makeWorkspaceColumns()
    const urlCol = cols.find(c => c.field === 'url')!
    const toolsCol = cols.find(c => c.field === 'tools')!
    const tagsCol = cols.find(c => c.field === 'tags')!
    expect(urlCol.sortable).to.equal(false)
    expect(toolsCol.sortable).to.equal(false)
    expect(tagsCol.sortable).to.equal(false)
  })
})
