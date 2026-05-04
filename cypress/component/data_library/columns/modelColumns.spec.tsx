/**
 * Component tests for makeModelColumns — the column definitions used in the
 * AI Models tab of the Data Library.
 *
 * Each test mounts a minimal DataGrid with a single (or small set of) rows and
 * inspects the rendered HTML to verify the column behaviour.
 */
import React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { DataGrid } from '@mui/x-data-grid'
import { makeModelColumns } from 'src/components/data_library/columns/modelColumns'
import { makeModelRow } from '../../test-utils'

const renderGrid = (overrides = {}) => {
  const row = makeModelRow(overrides)
  cy.mount(
    <MemoryRouter>
      <DataGrid
        rows={[row]}
        columns={makeModelColumns()}
        getRowId={r => r.modelId}
        autoHeight
      />,
    </MemoryRouter>,
  )
}

describe('makeModelColumns — Model Name column', () => {
  beforeEach(() => cy.viewport(1400, 800))

  it('renders the model name text', () => {
    renderGrid({ name: 'ResNet-50' })
    cy.contains('ResNet-50').should('exist')
  })

  it('renders an empty cell gracefully when name is absent', () => {
    renderGrid({ name: '' })
    // No error thrown, grid should still render
    cy.get('.MuiDataGrid-root').should('exist')
  })
})

describe('makeModelColumns — Study column', () => {
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

describe('makeModelColumns — Format column', () => {
  beforeEach(() => cy.viewport(1400, 800))

  it('renders the format text', () => {
    renderGrid({ format: 'ONNX' })
    cy.contains('ONNX').should('exist')
  })

  it('renders an empty cell when format is absent', () => {
    renderGrid({ format: '' })
    cy.get('.MuiDataGrid-root').should('exist')
  })
})

describe('makeModelColumns — License column', () => {
  beforeEach(() => cy.viewport(1400, 800))

  it('renders the license text', () => {
    renderGrid({ license: 'Apache-2.0' })
    cy.contains('Apache-2.0').should('exist')
  })

  it('renders an empty cell when license is absent', () => {
    renderGrid({ license: '' })
    cy.get('.MuiDataGrid-root').should('exist')
  })
})

describe('makeModelColumns — Maintainer column', () => {
  beforeEach(() => cy.viewport(1400, 800))

  it('renders the maintainer name', () => {
    renderGrid({ maintainer: { name: 'Alice Smith', email: 'alice@example.com' } })
    cy.contains('Alice Smith').should('exist')
  })

  it('renders an empty cell when maintainer name is absent', () => {
    renderGrid({ maintainer: { name: '', email: '' } })
    cy.get('.MuiDataGrid-root').should('exist')
  })
})

describe('makeModelColumns — URL column', () => {
  beforeEach(() => cy.viewport(1400, 800))

  it('renders "Link" as a clickable anchor when url is present', () => {
    renderGrid({ url: 'https://huggingface.co/my-model' })
    cy.get('a[href="https://huggingface.co/my-model"]')
      .contains('Link')
      .should('exist')
  })

  it('renders nothing when url is absent', () => {
    renderGrid({ url: '' })
    // No "Link" anchor should exist
    cy.get('a').filter(':contains("Link")').should('not.exist')
  })

  it('sets target="_blank" and rel="noopener noreferrer" for external links', () => {
    renderGrid({ url: 'https://example.com' })
    cy.get('a[href="https://example.com"]')
      .should('have.attr', 'target', '_blank')
      .and('have.attr', 'rel', 'noopener noreferrer')
  })
})

describe('makeModelColumns — Tags column', () => {
  beforeEach(() => cy.viewport(1400, 800))

  it('renders nothing when tags array is empty', () => {
    renderGrid({ tags: [] })
    cy.get('.MuiChip-root').should('not.exist')
  })

  it('renders up to 3 chips for 3 tags', () => {
    renderGrid({ tags: ['genomics', 'classification', 'vision'] })
    cy.get('.MuiChip-root').should('have.length', 3)
    cy.contains('genomics').should('exist')
    cy.contains('classification').should('exist')
    cy.contains('vision').should('exist')
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

describe('makeModelColumns — column structure', () => {
  it('returns 7 column definitions', () => {
    const cols = makeModelColumns()
    expect(cols).to.have.length(7)
  })

  it('defines expected fields', () => {
    const fields = makeModelColumns().map(c => c.field)
    expect(fields).to.deep.equal([
      'name',
      'studyName',
      'format',
      'license',
      'maintainer',
      'url',
      'tags',
    ])
  })

  it('marks url and tags as non-sortable', () => {
    const cols = makeModelColumns()
    const urlCol = cols.find(c => c.field === 'url')!
    const tagsCol = cols.find(c => c.field === 'tags')!
    expect(urlCol.sortable).to.equal(false)
    expect(tagsCol.sortable).to.equal(false)
  })
})
