/* eslint-disable no-undef */

import React from 'react';
import {mount} from 'cypress/react';
import DACDatasets from '../../../src/pages/DACDatasets';
import {DatasetService} from '../../../src/utils/DatasetService';
import {BrowserRouter} from "react-router-dom";
import ResearcherInfo from "../../../src/pages/dar_application/ResearcherInfo_new";

const sampleDataset = {
  'dataSetId': 1408,
  'name': 'Name',
  'datasetName': 'Name',
  'createDate': 'Nov 22, 2022',
  'createUserId': 1,
  'updateDate': 1669148177373,
  'updateUserId': 1,
  'active': true,
  'needsApproval': false,
  'alias': 612,
  'datasetIdentifier': 'DUOS-000612',
  'dataUse': {
    'hmbResearch': true
  },
  'dacId': 1,
  'consentId': 'dcf14449-ff38-4fc5-8ab1-4e08f91f2521',
  'translatedUseRestriction': 'Samples are restricted for use under the following conditions:\nData is limited for health/medical/biomedical research. [HMB]\nCommercial use is not prohibited.\nData use for methods development research irrespective of the specified data use limitations is not prohibited.\nRestrictions for use as a control set for diseases other than those defined were not specified.',
  'deletable': true,
  'properties': [
    {
      'dataSetId': 1408,
      'propertyName': 'Data Type',
      'propertyValue': 'test',
      'propertyType': 'String'
    },
    {
      'dataSetId': 1408,
      'propertyName': '# of participants',
      'propertyValue': '2',
      'propertyType': 'String'
    },
    {
      'dataSetId': 1408,
      'propertyName': 'Principal Investigator(PI)',
      'propertyValue': 'Magnum PI',
      'propertyType': 'String'
    },
    {
      'dataSetId': 1408,
      'propertyName': 'Description',
      'propertyValue': 'Test Description',
      'propertyType': 'String'
    },
    {
      'dataSetId': 1408,
      'propertyName': 'Phenotype/Indication',
      'propertyValue': 'Indication',
      'propertyType': 'String'
    },
    {
      'dataSetId': 1408,
      'propertyName': 'Dataset Name',
      'propertyValue': 'Test Name',
      'propertyType': 'String'
    },
    {
      'dataSetId': 1408,
      'propertyName': 'dbGAP',
      'propertyValue': 'http://...',
      'propertyType': 'String'
    },
    {
      'dataSetId': 1408,
      'propertyName': 'Data Depositor',
      'propertyValue': 'Test User',
      'propertyType': 'String'
    },
    {
      'dataSetId': 1408,
      'propertyName': 'Species',
      'propertyValue': 'human',
      'propertyType': 'String'
    }
  ]
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
    mount(<DACDatasets/>);
    cy.contains("My DAC's Datasets").should('exist');
  });
  it('Dataset with data use is visible on page', function () {
    cy.viewport(800, 500);
    const datasetWithDataUseInfo = Object.assign(
      {},
      sampleDataset,
      {codeList: ['HMB'], translations: [{code: 'HMB', description: 'HMB'}]});
    const datasets = [datasetWithDataUseInfo];
    cy.stub(DatasetService, 'populateDacDatasets').returns(datasets);
    mount(<DACDatasets/>);
    cy.contains('HMB').should('exist');
  });
  it('Rejected dataset is visible on page', function () {
    cy.viewport(800, 500);
    const datasetWithDataUseInfo = Object.assign(
      {},
      sampleDataset,
      {dacApproval: false});
    const datasets = [datasetWithDataUseInfo];
    cy.stub(DatasetService, 'populateDacDatasets').returns(datasets);
    mount(<DACDatasets/>);
    cy.contains('REJECTED').should('exist');
  });
  it('Accepted dataset is visible on page', function () {
    cy.viewport(800, 500);
    const datasetWithDataUseInfo = Object.assign(
      {},
      sampleDataset,
      {dacApproval: true});
    const datasets = [datasetWithDataUseInfo];
    cy.stub(DatasetService, 'populateDacDatasets').returns(datasets);
    mount(WrappedDACDatasetsComponent({}));
    cy.contains('ACCEPTED').should('exist');
  });
});