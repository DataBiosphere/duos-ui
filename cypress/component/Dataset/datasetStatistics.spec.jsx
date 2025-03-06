import React from 'react';
import {mount} from 'cypress/react';
import DatasetStatistics from '../../../src/pages/DatasetStatistics';
import dataset from './dataset.json';
import {DataSet} from '../../../src/libs/ajax/DataSet';
import {DatasetMetrics} from '../../../src/libs/ajax/DatasetMetrics';

const externalProp = {
  'propertyId': 9314,
  'datasetId': 1975,
  'propertyName': 'Access Management',
  'propertyValue': 'external',
  'schemaProperty': 'accessManagement',
  'propertyType': 'String'
};

const openProp = {
  'propertyId': 9314,
  'datasetId': 1975,
  'propertyName': 'Access Management',
  'propertyValue': 'open',
  'schemaProperty': 'accessManagement',
  'propertyType': 'String'
};

const controlledProp = {
  'propertyId': 9314,
  'datasetId': 1975,
  'propertyName': 'Access Management',
  'propertyValue': 'controlled',
  'schemaProperty': 'accessManagement',
  'propertyType': 'String'
};

const location = {
  'propertyId': 12657,
  'datasetId': 1975,
  'propertyName': 'URL',
  'propertyValue': 'https://duos.org',
  'schemaProperty': 'url',
  'propertyType': 'String'
};

describe('Dataset Statistics Tests', () => {

  beforeEach(() => {
    cy.viewport(600, 800);
  });

  it('Displays Controlled Access Dataset Apply Button', () => {
    const controlled = Object.assign(dataset, {properties: [controlledProp]});
    cy.stub(DataSet, 'getDatasetByDatasetIdentifier').returns(Promise.resolve(controlled));
    cy.stub(DataSet, 'getDataSetsByDatasetId').returns(Promise.resolve(controlled));
    cy.stub(DatasetMetrics, 'getDatasetStats').returns(Promise.resolve({}));

    const props = {
      match: {
        params: {
          datasetIdentifier: controlled.datasetIdentifier
        }
      },
      history: {
        push() {
        }
      }
    };
    mount(<DatasetStatistics {...props}/>);
    cy.contains(controlled.datasetIdentifier).should('exist');
    cy.contains('Apply for Access').should('exist');
  });

  it('Displays External Access Language With Location', () => {
    const external = Object.assign(dataset, {properties: [externalProp, location]});
    cy.stub(DataSet, 'getDatasetByDatasetIdentifier').returns(Promise.resolve(external));
    cy.stub(DataSet, 'getDataSetsByDatasetId').returns(Promise.resolve(external));
    cy.stub(DatasetMetrics, 'getDatasetStats').returns(Promise.resolve({}));

    const props = {
      match: {
        params: {
          datasetIdentifier: external.datasetIdentifier
        }
      },
      history: {
        push() {
        }
      }
    };
    mount(<DatasetStatistics {...props}/>);
    cy.contains(external.datasetIdentifier).should('exist');
    cy.contains('This dataset is externally managed').should('exist');
    cy.contains('Requests cannot be made via DUOS, but must be made directly').should('exist');
  });

  it('Displays External Access Language Without Location', () => {
    const external = Object.assign(dataset, {properties: [externalProp]});
    cy.stub(DataSet, 'getDatasetByDatasetIdentifier').returns(Promise.resolve(external));
    cy.stub(DataSet, 'getDataSetsByDatasetId').returns(Promise.resolve(external));
    cy.stub(DatasetMetrics, 'getDatasetStats').returns(Promise.resolve({}));

    const props = {
      match: {
        params: {
          datasetIdentifier: external.datasetIdentifier
        }
      },
      history: {
        push() {
        }
      }
    };
    mount(<DatasetStatistics {...props}/>);
    cy.contains(external.datasetIdentifier).should('exist');
    cy.contains('This dataset is externally managed').should('exist');
    cy.contains('Requests cannot be made via DUOS, but must be made directly').should('not.exist');
  });

  it('Displays Open Access Language With Location', () => {
    const open = Object.assign(dataset, {properties: [openProp, location]});
    cy.stub(DataSet, 'getDatasetByDatasetIdentifier').returns(Promise.resolve(open));
    cy.stub(DataSet, 'getDataSetsByDatasetId').returns(Promise.resolve(open));
    cy.stub(DatasetMetrics, 'getDatasetStats').returns(Promise.resolve({}));

    const props = {
      match: {
        params: {
          datasetIdentifier: open.datasetIdentifier
        }
      },
      history: {
        push() {
        }
      }
    };
    mount(<DatasetStatistics {...props}/>);
    cy.contains(open.datasetIdentifier).should('exist');
    cy.contains('This dataset is open access, does not require an access request').should('exist');
    cy.contains('and can be accessed directly').should('exist');
  });

  it('Displays Open Access Language Without Location', () => {
    const open = Object.assign(dataset, {properties: [openProp]});
    cy.stub(DataSet, 'getDatasetByDatasetIdentifier').returns(Promise.resolve(open));
    cy.stub(DataSet, 'getDataSetsByDatasetId').returns(Promise.resolve(open));
    cy.stub(DatasetMetrics, 'getDatasetStats').returns(Promise.resolve({}));

    const props = {
      match: {
        params: {
          datasetIdentifier: open.datasetIdentifier
        }
      },
      history: {
        push() {
        }
      }
    };
    mount(<DatasetStatistics {...props}/>);
    cy.contains(open.datasetIdentifier).should('exist');
    cy.contains('This dataset is open access, does not require an access request').should('exist');
    cy.contains('and can be accessed directly').should('not.exist');
  });

  it('displays with no additional properties', () => {
    cy.stub(DataSet, 'getDatasetByDatasetIdentifier').returns(Promise.resolve(dataset));
    cy.stub(DataSet, 'getDataSetsByDatasetId').returns(Promise.resolve(dataset));
    cy.stub(DatasetMetrics, 'getDatasetStats').returns(Promise.resolve({}));

    const props = {
      match: {
        params: {
          datasetIdentifier: dataset.datasetIdentifier
        }
      },
      history: {
        push() {
        }
      }
    };
    mount(<DatasetStatistics {...props}/>);
    cy.contains(dataset.datasetIdentifier).should('exist');
  });

  it('Displays All Data Custodian Emails', () => {
    cy.stub(DataSet, 'getDatasetByDatasetIdentifier').returns(Promise.resolve(dataset));
    cy.stub(DataSet, 'getDataSetsByDatasetId').returns(Promise.resolve(dataset));
    cy.stub(DatasetMetrics, 'getDatasetStats').returns(Promise.resolve({}));

    const props = {
      match: {
        params: {
          datasetIdentifier: dataset.datasetIdentifier
        }
      },
      history: {
        push() {
        }
      }
    };
    mount(<DatasetStatistics {...props}/>);
    cy.contains(dataset.datasetIdentifier).should('exist');
    cy.contains('Data Custodian').should('exist');
    const dataCustodians = dataset.study.properties.find((property) => property.key === 'dataCustodianEmail').value;
    dataCustodians.forEach((dataCustodian) => {
      cy.contains(dataCustodian).should('exist');
    });
  });
});
