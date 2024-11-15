/* eslint-disable no-undef */
import {React} from 'react';
import {mount} from 'cypress/react';
import DatasetSearchTable from '../../../src/components/data_search/DatasetSearchTable';
import {TerraDataRepo} from '../../../src/libs/ajax/TerraDataRepo';

const datasets = [
  {
    datasetId: 123456,
    datasetIdentifier: `DUOS-123456`,
    datasetName: 'Some Dataset 1',
    study: {
      studyId: 1,
      dataCustodianEmail: ['Some Data Custodian Email 1'],
    }
  }
];

const props = {
  datasets: datasets,
  history: {}
};

describe('Dataset Search Table tests', () => {

  describe('Data library with three datasets', () => {
    beforeEach(() => {
      cy.stub(TerraDataRepo, 'listSnapshotsByDatasetIds').returns({});
      mount(<DatasetSearchTable {...props} />);
    });

    it('When no datasets are selected the footer does not appear', () => {
      cy.contains('1 dataset selected from 1 study').should('not.exist');
    });


    it('When a dataset is selected the footer appears', () => {
      cy.get('#header-checkbox').click();
      cy.contains('1 dataset selected from 1 study');
    });

  });
});
