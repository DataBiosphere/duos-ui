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
    beforeEach(() => {
      cy.initApplicationConfig();
      cy.stub(TerraDataRepo, 'listSnapshotsByDatasetIds').returns({});
    });

    it('When a participant count filter is applied the query is updated', () => {
      var filtered = false;
      function handler(request) {
        if (JSON.stringify(request.body).includes('{"range":{"participantCount":{"gte":null,"lte":"50"}}}')) {
          filtered = true;
        }
        request.reply({statusCode: 200, body:[]});
      }

      cy.intercept(
        {method: 'POST', url: '**/api/dataset/search/index'}, handler).as('searchIndex');
      mount(<DatasetSearchTable {...props} />);
      cy.get('#participantCountMax-range-input').clear().type('50');
      cy.wait(1000).then(() => {
        expect(filtered).to.be.true;
      });
    });

  });
});
