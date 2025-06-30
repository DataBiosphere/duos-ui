import React from 'react';
import {mount} from 'cypress/react';
import DatasetStatistics from 'src/pages/DatasetStatistics';
import dataset from './dataset.json';
import {DataSet} from 'src/libs/ajax/DataSet';
import {DatasetMetrics} from 'src/libs/ajax/DatasetMetrics';

describe('Dataset Statistics Tests', () => {

  beforeEach(() => {
    cy.viewport(600, 800);
  });

  it('Displays Controlled Access Dataset Apply Button', () => {
    const controlled = {...dataset, accessManagement: 'controlled'};
    cy.stub(DataSet, 'searchDatasetIndex').returns(Promise.resolve([controlled]));
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
    cy.contains(controlled.datasetIdentifier).should('exist');
    cy.contains(controlled.datasetName).should('exist');
    cy.contains('Apply for Access').should('exist');
  });

  it('Displays External Access Language With Location', () => {
    const external = {...dataset, accessManagement: 'external', url: 'https://duos.org'};
    cy.stub(DataSet, 'searchDatasetIndex').returns(Promise.resolve([external]));
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
    cy.contains(external.datasetName).should('exist');
    cy.contains('This dataset is externally managed').should('exist');
    cy.contains('Requests cannot be made via DUOS, but must be made directly').should('exist');
  });

  it('Displays External Access Language Without Location', () => {
    const external = {...dataset, accessManagement: 'external'};
    cy.stub(DataSet, 'searchDatasetIndex').returns(Promise.resolve([external]));
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
    cy.contains(external.datasetName).should('exist');
    cy.contains('This dataset is externally managed').should('exist');
    cy.contains('Requests cannot be made via DUOS, but must be made directly').should('not.exist');
  });

  it('Displays Open Access Language With Location', () => {
    const open = {...dataset, accessManagement: 'open', url: 'https://duos.org'};
    cy.stub(DataSet, 'searchDatasetIndex').returns(Promise.resolve([open]));
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
    cy.contains(open.datasetName).should('exist');
    cy.contains('This dataset is open access, does not require an access request').should('exist');
    cy.contains('and can be accessed directly').should('exist');
  });

  it('Displays Open Access Language Without Location', () => {
    const open = {...dataset, accessManagement: 'open'};
    cy.stub(DataSet, 'searchDatasetIndex').returns(Promise.resolve([open]));
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
    cy.contains(open.datasetName).should('exist');
    cy.contains('This dataset is open access, does not require an access request').should('exist');
    cy.contains('and can be accessed directly').should('not.exist');
  });

  it('displays with no additional properties', () => {
    cy.stub(DataSet, 'searchDatasetIndex').returns(Promise.resolve([dataset]));
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
    const dataCustodians = ['foo@bar.com', 'bar@baz.com']
    const datasetWithCustodians = {
        ...dataset,
        study: {
            ...dataset.study,
          dataCustodianEmail: dataCustodians
        }
    };

    cy.stub(DataSet, 'searchDatasetIndex').returns(Promise.resolve([datasetWithCustodians]));
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
    dataCustodians.forEach((dataCustodian) => {
      cy.contains(dataCustodian).should('exist');
    });
  });
});
