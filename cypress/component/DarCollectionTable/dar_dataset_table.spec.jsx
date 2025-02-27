import React from 'react';
import { mount } from 'cypress/react';
import {DarDatasetTable} from '../../../src/components/dar_dataset_table/DarDatasetTable.jsx';
import darCollection from './darCollection.json'
import {Match} from '../../../src/libs/ajax/Match.js';

describe('DarDatasetTable - Tests', function() {
  beforeEach(() => {
    cy.initApplicationConfig();
  });

  it('renders a single row of the data', function () {
    cy.stub(Match, 'findMatchBatch').returns([]);
    mount(
      <DarDatasetTable
        summary={darCollection}
        collection={darCollection}
        isLoading={false}
        isUnfilteredView={true}
      />
    );

    // There should columns for: data use group; # of datasets; and datasets
    cy.get('.column-header').should('have.length', 3);

    // The data use on the requested dataset in `darCollection` is:
    // "dataUse": {
    //   "generalUse": true,
    //     "nonProfitUse": true
    // },
    // So we need to ensure those codes are displayed
    cy.get('.row-data-0').contains('GRU').should('exist');
    cy.get('.row-data-0').contains('NPU').should('exist');

    // Ensure that the dataset identifier is displayed
    cy.get('.row-data-0').contains(darCollection.datasets[0].datasetIdentifier).should('exist');

  });
});