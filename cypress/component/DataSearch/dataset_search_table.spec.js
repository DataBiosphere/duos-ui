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
      cy.stub(DataSet, 'searchDatasetIndex').returns(Promise.resolve([]));
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
      cy.clock();
      cy.initApplicationConfig();
      cy.stub(TerraDataRepo, 'listSnapshotsByDatasetIds').returns({});
    });

    function handler(request, searchText) {
      if (JSON.stringify(request.body).includes(searchText)) {
        request.reply(['filtered']);
      } else {
        request.reply([]);
      }
    }


    it('When a participant count filter is applied the query is updated', () => {
      cy.intercept(
        {method: 'POST', url: '**/search/index'}, (req) => {
          return handler(req, '{"range":{"participantCount":{"gte":null,"lte":50}}}');
        }).as('searchIndex1');
      mount(<DatasetSearchTable {...props} />);
      // first clear the default value (100), without clearing first, type('50') would result in input of 10050
      cy.get('#participantCountMax-range-input').clear().type('50');
      cy.tick(150);
      // ignore first call (why are there two? even without clear())
      cy.wait('@searchIndex1');
      // this api call, caused by .type('50'), should have had a request that contained the searchText
      cy.wait('@searchIndex1').then((response) => {
        expect(response.response.body[0]).to.equal('filtered');
      });
      // should be 1?
      cy.get('@searchIndex1.all').should('have.length', 2);
    });

    it('When an invalid participant count filter is applied the query represents the default value', () => {

      cy.intercept({method: 'POST', url: '**/search/index'}, (req) => {
        // when non-numeric input is entered, the default value (in this case, 100) is used
        return handler(req, '{"range":{"participantCount":{"gte":100,"lte":null}}}');
      }).as('searchIndex2');
      mount(<DatasetSearchTable {...props} />);
      cy.get('#participantCountMin-range-input').type('test');
      cy.tick(150);
      cy.wait('@searchIndex2').then((response) => {
        expect(response.response.body[0]).to.equal('filtered');
      });
      cy.get('@searchIndex2.all').should('have.length', 1);
    });

  });
});
