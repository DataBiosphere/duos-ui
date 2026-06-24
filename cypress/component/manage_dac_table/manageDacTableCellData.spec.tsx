import React from 'react'
import { BrowserRouter } from 'react-router-dom'
import { actionsCellData } from 'src/components/manage_dac_table/ManageDacTableCellData'

const mockDac = {
  dacId: 123,
  name: 'Test DAC',
  datasets: [],
}

const mockDacWithDatasets = {
  dacId: 123,
  name: 'Test DAC',
  datasets: [{ datasetId: 1 }],
}

const mountActions = (props: { dac: object; deleteDac: unknown; userRole: string }) => {
  const cellData = actionsCellData(props)
  cy.mount(<BrowserRouter>{cellData.data}</BrowserRouter>)
}

describe('ManageDacTableCellData Actions Tests', () => {
  beforeEach(() => {
    cy.viewport(1200, 800)
  })

  it('edit icon links to the DAC profile page', () => {
    mountActions({ dac: mockDac, deleteDac: cy.stub(), userRole: 'Admin' })

    cy.get('img#edit-pencil-icon').should('exist')
    cy.get('img#edit-pencil-icon').closest('a').should('have.attr', 'href', '/manage_dac/123')
  })

  it('shows the delete button for Admin users', () => {
    mountActions({ dac: mockDac, deleteDac: cy.stub(), userRole: 'Admin' })

    cy.get('[data-tip="Delete DAC"]').should('exist')
  })

  it('hides the delete button for non-Admin users', () => {
    mountActions({ dac: mockDac, deleteDac: cy.stub(), userRole: 'Chairperson' })

    cy.get('[data-tip="Delete DAC"]').should('not.exist')
  })

  it('disables the delete button when the DAC has datasets', () => {
    mountActions({ dac: mockDacWithDatasets, deleteDac: cy.stub(), userRole: 'Admin' })

    cy.get('button[disabled]').should('exist')
  })

  it('calls deleteDac when the delete button is clicked', () => {
    const deleteDac = cy.stub().as('deleteDac')
    mountActions({ dac: mockDac, deleteDac, userRole: 'Admin' })

    cy.get('[data-tip="Delete DAC"]').click()
    cy.get('@deleteDac').should('have.been.calledOnce')
  })
})
