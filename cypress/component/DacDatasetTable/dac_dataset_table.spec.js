/* eslint-disable no-undef */

import React from 'react';
import {mount} from 'cypress/react';
import DACDatasets from '../../../src/pages/DACDatasets';
import {DataSet} from '../../../src/libs/ajax/DataSet';
import {Storage} from '../../../src/libs/storage';
import {BrowserRouter} from 'react-router-dom';

const sampleDataset = {
  'datasetId': 1,
  'createUserId': 1,
  'createUserDisplayName': 'Admin',
  'datasetIdentifier': 'DUOS-000649',
  'deletable': false,
  'datasetName': 'Test Dataset Submission V2',
  'participantCount': 10,
  'dataLocation': 'AnVIL Workspace',
  'url': 'http://www.abcnews.com',
  'dacId': 4,
  'dataUse': {},
  'study': {
    'description': 'Test Dataset Submission',
    'studyName': 'Test Dataset Submission V2',
    'studyId': 39,
    'phsId': 'PHS ID',
    'phenotype': 'Test Dataset Submission',
    'species': 'Test Dataset Submission',
    'piName': 'Test Dataset Submission',
    'dataSubmitterEmail': 'user@broadinstitute.org',
    'dataSubmitterId': 3351,
    'dataCustodianEmail': [
      'grushton@broadinstitute.org'
    ],
    'publicVisibility': true,
    'dataTypes': [
      'CITE-seq'
    ]
  },
  'submitter': {
    'userId': 1,
    'displayName': 'Admin',
    'institution': {
      'id': 150,
      'name': 'The Broad Institute of MIT and Harvard'
    }
  },
  'updateUser': {
    'userId': 1,
    'displayName': 'Admin',
    'institution': {
      'id': 150,
      'name': 'The Broad Institute of MIT and Harvard'
    }
  },
  'dac': {
    'dacId': 4,
    'dacName': 'DAC 0002'
  }
};

const user = {
  'userId': 1,
  'displayName': 'Admin',
  'institution': {
    'id': 150,
    'name': 'The Broad Institute of MIT and Harvard'
  },
  //  const dacIds = user.roles?.map(r => r.dacId).filter(id => id !== undefined);
  roles: [{dacId: 4}]
};

// It's necessary to wrap components that contain `Link` components
const WrappedDACDatasetsComponent = (props) => {
  return <BrowserRouter>
    <DACDatasets {...props}/>
  </BrowserRouter>;
};

describe('Dac Dataset Table Component', function () {
  it('Dac Dataset Table Page Loads', function () {
    cy.viewport(800, 500);
    cy.stub(Storage, 'getCurrentUser').returns(user);
    cy.stub(DataSet, 'searchDatasetIndex').returns([sampleDataset]);
    mount(WrappedDACDatasetsComponent({}));
    cy.contains("My DAC's Datasets").should('exist');
  });
  it('Dataset with data use is visible on page', function () {
    cy.viewport(800, 500);
    const datasetWithDataUseInfo = Object.assign(
      {},
      sampleDataset,
      {dataUse: {
        primary: [
          {
            code: 'HMB',
            description: 'Data is limited for health/medical/biomedical research.'
          }
        ]
      }}
    );
    const datasets = [datasetWithDataUseInfo];
    cy.stub(DataSet, 'searchDatasetIndex').returns(datasets);
    cy.stub(Storage, 'getCurrentUser').returns(user);
    mount(WrappedDACDatasetsComponent({}));
    cy.contains('HMB').should('exist');
  });

  it('Rejected dataset is visible on page', function () {
    cy.viewport(800, 500);
    const rejectedDataset = Object.assign(
      {},
      sampleDataset,
      {dacApproval: false});
    const datasets = [rejectedDataset];
    cy.stub(DataSet, 'searchDatasetIndex').returns(datasets);
    cy.stub(Storage, 'getCurrentUser').returns(user);
    mount(WrappedDACDatasetsComponent({}));
    cy.contains('REJECTED').should('exist');
  });

  it('Accepted dataset is visible on page', function () {
    cy.viewport(800, 500);
    const approvedDataset = Object.assign(
      {},
      sampleDataset,
      {dacApproval: true});
    const datasets = [approvedDataset];
    cy.stub(DataSet, 'searchDatasetIndex').returns(datasets);
    cy.stub(Storage, 'getCurrentUser').returns(user);
    mount(WrappedDACDatasetsComponent({}));
    cy.contains('ACCEPTED').should('exist');
  });

  it('Datasets filter on data use', function () {
    cy.viewport(800, 500);
    const hmbDataset = Object.assign(
      {},
      sampleDataset,
      {dataUse: {
        primary: [
          {
            code: 'HMB',
            description: 'Data is limited for health/medical/biomedical research.'
          }
        ]
      }}
    );
    const gruDataset = Object.assign(
      {},
      sampleDataset,
      {
        datasetId: 2,
        dataUse: {
          primary: [
            {
              code: 'GRU',
              description: 'Data is available for general research use.'
            }
          ]
        }}
    );
    const datasets = [hmbDataset, gruDataset];
    cy.stub(DataSet, 'searchDatasetIndex').returns(datasets);
    cy.stub(Storage, 'getCurrentUser').returns(user);
    mount(WrappedDACDatasetsComponent({}));
    cy.contains('HMB').should('exist');
    cy.contains('GRU').should('exist');
    cy.get('[data-cy="search-bar"]')
      .clear()
      .type('HMB')
      .then(() => {
        cy.contains('HMB').should('exist');
        cy.contains('GRU').should('not.exist');
      });
    cy.get('[data-cy="search-bar"]')
      .clear()
      .type('GRU')
      .then(() => {
        cy.contains('HMB').should('not.exist');
        cy.contains('GRU').should('exist');
      });
    cy.get('[data-cy="search-bar"]')
      .clear()
      .type('PHS')
      .then(() => {
        cy.contains('PHS').should('exist');
      });
  });
});