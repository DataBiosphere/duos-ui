import React from 'react'
import { ManageDacDatasets } from 'src/pages/manage_dac/ManageDacDatasets'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

const datasets = [
  {
    datasetIdentifier: 'DUOS-001',
    name: 'Dataset One',
    properties: [
      { propertyName: 'Data Type', propertyValue: 'Genomic' },
      { propertyName: 'Description', propertyValue: 'A long description that should wrap.' },
      { propertyName: 'url', propertyValue: 'https://dbgap.org/DS-001' },
    ],
    dataUse: [],
    study: { piName: 'Dr. Smith' },
  },
  {
    datasetIdentifier: 'DUOS-002',
    name: 'Dataset Two',
    properties: [
      { propertyName: 'Data Type', propertyValue: 'Proteomic' },
      { propertyName: 'Description', propertyValue: 'Short desc.' },
      // No URL property
    ],
    dataUse: [],
    study: { piName: 'Dr. Jones' },
  },
]

const locationState = { dac: { name: 'Test DAC' }, datasets }

describe('ManageDacDatasets Component', () => {
  beforeEach(() => {
    cy.mount(
      <MemoryRouter initialEntries={[{ pathname: '/manage_dac_datasets', state: locationState }]}>
        <Routes>
          <Route path="/manage_dac_datasets" element={<ManageDacDatasets />} />
        </Routes>
      </MemoryRouter>,
    )
  })

  it('renders with mock datasets', () => {
    const locationState = {
      dac: { name: 'Test DAC' },
      datasets: [
        {
          datasetIdentifier: 'DUOS-001',
          name: 'Dataset One',
          properties: [
            { propertyName: 'Data Type', propertyValue: 'Genomic' },
            { propertyName: 'Description', propertyValue: 'A long description that should wrap.' },
            { propertyName: 'url', propertyValue: 'https://dbgap.org/DUOS-001' },
          ],
          dataUse: [],
          study: { piName: 'Dr. Smith' },
        },
      ],
    }

    cy.mount(
      <MemoryRouter initialEntries={[{ pathname: '/manage_dac_datasets', state: locationState }]}>
        <Routes>
          <Route path="/manage_dac_datasets" element={<ManageDacDatasets />} />
        </Routes>
      </MemoryRouter>,
    )

    cy.contains('DAC Datasets associated with DAC: Test DAC').should('be.visible')
    cy.contains('DUOS-001').should('be.visible')
    cy.contains('Dataset One').should('be.visible')
    cy.get('a.enabled').should('have.attr', 'href').and('include', 'dbgap.org')
    cy.contains('A long description that should wrap.').should('be.visible')
  })

  it('filters datasets by search', () => {
    cy.get('[data-cy="search-bar"]').type('DUOS-002')
    cy.contains('Dataset Two').should('be.visible')
    cy.contains('Dataset One').should('not.exist')
  })

  it('shows disabled URL when missing', () => {
    cy.contains('Dataset Two').parent().within(() => {
      cy.get('span.disabled').should('contain', '---')
    })
  })

  it('sorts by Dataset ID', () => {
    cy.contains('Dataset ID').click()
    cy.get('.row-data-0').should('contain', 'DUOS-002')
    cy.contains('Dataset ID').click()
    cy.get('.row-data-0').should('contain', 'DUOS-001')
  })
})
