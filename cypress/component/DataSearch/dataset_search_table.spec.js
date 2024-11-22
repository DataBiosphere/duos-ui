/* eslint-disable no-undef */
import {React} from 'react';
import {mount} from 'cypress/react';
import DatasetSearchTable from '../../../src/components/data_search/DatasetSearchTable';
import {TerraDataRepo} from '../../../src/libs/ajax/TerraDataRepo';
import {DataSet} from '../../../src/libs/ajax/DataSet';

const datasets = [
  {
    datasetId: 123456,
    datasetIdentifier: `DUOS-123456`,
    datasetName: 'Some Dataset 1',
    participantCount: 100,
    study: {
      studyName: 'Some Study 1',
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

  describe('Data library with one dataset footer tests', () => {
    beforeEach(() => {
      cy.initApplicationConfig();
      cy.stub(TerraDataRepo, 'listSnapshotsByDatasetIds').returns({});
      cy.stub(DataSet, 'searchDatasetIndex').returns({});
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

  describe('Data library filter by participant count tests', () => {
    let searchText;
    let filtered;

    beforeEach(() => {
      cy.initApplicationConfig();
      cy.stub(TerraDataRepo, 'listSnapshotsByDatasetIds').returns({});
      filtered = false;
    });

    function handler(request) {
      if (JSON.stringify(request.body).includes(searchText)) {
        filtered = true;
      }
      request.reply({statusCode: 200, body:[]});
    }

    it('When a participant count filter is applied the query is updated', () => {
      searchText ='{"range":{"participantCount":{"gte":null,"lte":"50"}}}';

      cy.intercept(
        {method: 'POST', url: '**/api/dataset/search/index'}, handler);
      mount(<DatasetSearchTable {...props} />);
      cy.get('#participantCountMax-range-input').clear().type('50');
      cy.wait(1500).then(() => {
        expect(filtered).to.be.true;
      });
    });

    it('When an invalid participant count filter is applied the query represents the default value', () => {
      searchText = '{"range":{"participantCount":{"gte":100,"lte":null}}}';

      cy.intercept({method: 'POST', url: '**/api/dataset/search/index'}, handler);
      mount(<DatasetSearchTable {...props} />);
      cy.get('#participantCountMin-range-input').clear().type('test');
      cy.wait(1500).then(() => {
        expect(filtered).to.be.true;
      });
    });

  });
});
