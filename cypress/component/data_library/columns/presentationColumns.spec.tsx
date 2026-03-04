/**
 * Component tests for makePresentationColumns — the column definitions used
 * in the Presentations tab of the Data Library.
 *
 * Each test mounts a minimal DataGrid with a single row and inspects the
 * rendered HTML to verify column behaviour.
 */
import React from 'react'
import { DataGrid } from '@mui/x-data-grid'
import { makePresentationColumns } from 'src/components/data_library/columns/presentationColumns'
import { makePresentationRow } from '../../test-utils'

const renderGrid = (overrides = {}) => {
  const row = makePresentationRow(overrides)
  cy.mount(
    <DataGrid
      rows={[row]}
      columns={makePresentationColumns()}
      getRowId={r => r.presentationId}
      autoHeight
    />,
  )
}

describe('makePresentationColumns — Title column', () => {
  beforeEach(() => cy.viewport(1600, 800))

  it('renders the presentation title as a link when url is present', () => {
    renderGrid({ title: 'Genomics in Practice', url: 'https://example.com/slides' })
    cy.get('a[href="https://example.com/slides"]').contains('Genomics in Practice').should('exist')
  })

  it('renders plain text when url is absent', () => {
    renderGrid({ title: 'No Link Title', url: '' })
    cy.contains('No Link Title').should('exist')
    cy.get('a').filter(':contains("No Link Title")').should('not.exist')
  })

  it('sets target="_blank" and rel="noopener noreferrer" for the title link', () => {
    renderGrid({ title: 'Ext Link', url: 'https://example.com/pres' })
    cy.get('a[href="https://example.com/pres"]')
      .should('have.attr', 'target', '_blank')
      .and('have.attr', 'rel', 'noopener noreferrer')
  })

  it('renders gracefully when title is empty', () => {
    renderGrid({ title: '', url: '' })
    cy.get('.MuiDataGrid-root').should('exist')
  })
})

describe('makePresentationColumns — Study column', () => {
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

describe('makePresentationColumns — Event column', () => {
  beforeEach(() => cy.viewport(1600, 800))

  it('renders the event name', () => {
    renderGrid({ event: 'ASHG 2024' })
    cy.contains('ASHG 2024').should('exist')
  })

  it('renders gracefully when event is empty', () => {
    renderGrid({ event: '' })
    cy.get('.MuiDataGrid-root').should('exist')
  })
})

describe('makePresentationColumns — Date column', () => {
  beforeEach(() => cy.viewport(1600, 800))

  it('renders the presentation date', () => {
    renderGrid({ date: '2024-10-15' })
    cy.contains('2024-10-15').should('exist')
  })

  it('renders gracefully when date is empty', () => {
    renderGrid({ date: '' })
    cy.get('.MuiDataGrid-root').should('exist')
  })
})

describe('makePresentationColumns — Location column', () => {
  beforeEach(() => cy.viewport(1600, 800))

  it('renders the location', () => {
    renderGrid({ location: 'Denver, CO' })
    cy.contains('Denver, CO').should('exist')
  })

  it('renders gracefully when location is empty', () => {
    renderGrid({ location: '' })
    cy.get('.MuiDataGrid-root').should('exist')
  })
})

describe('makePresentationColumns — Presenter column', () => {
  beforeEach(() => cy.viewport(1600, 800))

  it('renders the presenter name', () => {
    renderGrid({ presenter: { name: 'Alice Smith', email: 'alice@example.com' } })
    cy.contains('Alice Smith').should('exist')
  })

  it('renders gracefully when presenter is absent', () => {
    renderGrid({ presenter: undefined })
    cy.get('.MuiDataGrid-root').should('exist')
  })

  it('renders gracefully when presenter name is absent', () => {
    renderGrid({ presenter: { email: 'alice@example.com' } })
    cy.get('.MuiDataGrid-root').should('exist')
  })
})

describe('makePresentationColumns — Format column', () => {
  beforeEach(() => cy.viewport(1600, 800))

  it('renders the format', () => {
    renderGrid({ format: 'Oral' })
    cy.contains('Oral').should('exist')
  })

  it('renders gracefully when format is empty', () => {
    renderGrid({ format: '' })
    cy.get('.MuiDataGrid-root').should('exist')
  })
})

describe('makePresentationColumns — Tags column', () => {
  beforeEach(() => cy.viewport(1600, 800))

  it('renders nothing when tags array is empty', () => {
    renderGrid({ tags: [] })
    cy.get('.MuiChip-root').should('not.exist')
  })

  it('renders up to 3 chips for 3 tags', () => {
    renderGrid({ tags: ['genomics', 'data-sharing', 'open-access'] })
    cy.get('.MuiChip-root').should('have.length', 3)
    cy.contains('genomics').should('exist')
    cy.contains('data-sharing').should('exist')
    cy.contains('open-access').should('exist')
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
