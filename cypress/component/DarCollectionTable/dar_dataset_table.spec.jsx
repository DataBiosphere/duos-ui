import React from 'react'
import { mount } from 'cypress/react'
import { DarDatasetTable } from 'src/components/dar_dataset_table/DarDatasetTable'
import darCollection from './darCollection'
import { Match } from 'src/libs/ajax/Match'
import { DataSet } from 'src/libs/ajax/DataSet'

describe('DarDatasetTable - Tests', function () {
  beforeEach(() => {
    cy.initApplicationConfig()
  })

  it('renders a single row of the data', function () {
    cy.stub(Match, 'findMatchBatch').returns([])
    cy.stub(DataSet, 'searchDatasetIndex').returns([{
      datasetId: 2352,
      name: 'Group 5',
      datasetName: 'Group 5',
      createDate: 'Feb 13, 2024',
      createUserId: 5147,
      updateDate: 1707858294844,
      updateUserId: 5146,
      alias: 850,
      datasetIdentifier: 'DUOS-000850',
      dataUse: {
        primary: [{
          code: 'GRU',
          description: 'General Research Use',
        }],
        secondary: [{
          code: 'NPU',
          description: 'Non-Profit Use',
        }],
      },
      dacId: 8,
    }])
    mount(
      <DarDatasetTable
        summary={darCollection}
        collection={darCollection}
        isLoading={false}
        isUnfilteredView={true}
      />,
    )

    // There should columns for: data use group; # of datasets; and datasets
    cy.get('.column-header').should('have.length', 3)

    // The data use on the requested dataset in `darCollection` is:
    // "dataUse": {
    //   "generalUse": true,
    //     "nonProfitUse": true
    // },
    // So we need to ensure those codes are displayed
    cy.get('.row-data-0').contains('GRU').should('exist')
    cy.get('.row-data-0').contains('NPU').should('exist')

    // Ensure that the dataset identifier is displayed
    cy.get('.row-data-0').contains(darCollection.datasets[0].datasetIdentifier).should('exist')
  })
})
