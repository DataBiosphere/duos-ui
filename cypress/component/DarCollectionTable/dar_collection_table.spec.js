/* eslint-disable no-undef */
import React from 'react';
import { mount } from '@cypress/react';
import { DarCollectionTableColumnOptions, DarCollectionTable } from '../../../src/components/dar_collection_table/DarCollectionTable';

const collections = [
  {
    "darCollectionId": 211,
    "darCode": "DAR-259",
    "datasets": [{}, {}]
  }
];

describe('DataUseVoteSummary - Tests', function() {
  it('renders a single column of the data', function() {
    const columns = [
      DarCollectionTableColumnOptions.DAR_CODE
    ];
    mount(
      <DarCollectionTable
        collections={collections}
        columns={columns}
        isRendered={true}
        isLoading={false}
        cancelCollection={null}
        resubmitCollection={null}
        actionsDisabled={false}
      />
    );
    const colHeaders = cy.get('.column-header');
    colHeaders.should('have.length', 1);
  });

  it('renders multiple rows of the data', function() {
    const columns = [
      DarCollectionTableColumnOptions.DAR_CODE,
      DarCollectionTableColumnOptions.DATASET_COUNT
    ];
    mount(
      <DarCollectionTable
        collections={collections}
        columns={columns}
        isRendered={true}
        isLoading={false}
        cancelCollection={null}
        resubmitCollection={null}
        actionsDisabled={false}
      />
    );
    const colHeaders = cy.get('.column-header');
    colHeaders.should('have.length', 2);
  });

  it('should render skeleton table if isLoading is true', function() {
    mount(
      <DarCollectionTable
        isLoading={true}
      />
    );
    const component = cy.get('.table-data');
    component.should('exist');
    const rows = cy.get('.placeholder-row-0');
    rows.should('exist');
  });
});