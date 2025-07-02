import React from 'react';
import {mount} from 'cypress/react';
import DatasetStatistics from 'src/pages/DatasetStatistics';
import datasetTerm from './datasetTerm.json';
import {DataSet} from 'src/libs/ajax/DataSet';
import {DatasetMetrics} from 'src/libs/ajax/DatasetMetrics';

describe('Dataset Statistics Tests', () => {

  beforeEach(() => {
    cy.viewport(600, 800);
  });

  it('Displays Controlled Access Dataset Apply Button', () => {
    const controlled = {...datasetTerm, accessManagement: 'controlled'};
    cy.stub(DataSet, 'searchDatasetIndex').returns(Promise.resolve([controlled]));
    cy.stub(DatasetMetrics, 'getDatasetStats').returns(Promise.resolve({}));

    const props = {
      match: {
        params: {
          datasetIdentifier: datasetTerm.datasetIdentifier
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
    const external = {...datasetTerm, accessManagement: 'external', url: 'https://duos.org'};
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
    const external = {...datasetTerm, accessManagement: 'external'};
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
    const open = {...datasetTerm, accessManagement: 'open', url: 'https://duos.org'};
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
    const open = {...datasetTerm, accessManagement: 'open'};
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

  it('Displays with no additional properties', () => {
    cy.stub(DataSet, 'searchDatasetIndex').returns(Promise.resolve([datasetTerm]));
    cy.stub(DatasetMetrics, 'getDatasetStats').returns(Promise.resolve({}));

    const props = {
      match: {
        params: {
          datasetIdentifier: datasetTerm.datasetIdentifier
        }
      },
      history: {
        push() {
        }
      }
    };
    mount(<DatasetStatistics {...props}/>);
    cy.contains(datasetTerm.datasetIdentifier).should('exist');
  });

  it('Displays All Data Custodian Emails', () => {
    const dataCustodians = ['foo@bar.com', 'bar@baz.com']
    const datasetWithCustodians = {
        ...datasetTerm,
        study: {
            ...datasetTerm.study,
          dataCustodianEmail: dataCustodians
        }
    };

    cy.stub(DataSet, 'searchDatasetIndex').returns(Promise.resolve([datasetWithCustodians]));
    cy.stub(DatasetMetrics, 'getDatasetStats').returns(Promise.resolve({}));

    const props = {
      match: {
        params: {
          datasetIdentifier: datasetTerm.datasetIdentifier
        }
      },
      history: {
        push() {
        }
      }
    };
    mount(<DatasetStatistics {...props}/>);
    cy.contains('Data Custodian').should('exist');
    dataCustodians.forEach((dataCustodian) => {
      cy.contains(dataCustodian).should('exist');
    });
  });

  it('Does not display the Data Use field for open datasets', () => {
    const open = {...datasetTerm, accessManagement: 'open'};
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
    cy.contains('Data Use').should('not.exist');
  });

  it('Displays the Data Use field for controlled datasets', () => {
    const controlled = {...datasetTerm, accessManagement: 'controlled'};
    cy.stub(DataSet, 'searchDatasetIndex').returns(Promise.resolve([controlled]));
    cy.stub(DatasetMetrics, 'getDatasetStats').returns(Promise.resolve({}));

    const props = {
      match: {
        params: {
          datasetIdentifier: datasetTerm.datasetIdentifier
        }
      },
      history: {
        push() {
        }
      }
    };
    mount(<DatasetStatistics {...props}/>);
    cy.contains('Data Use').should('exist');
    cy.contains(datasetTerm.dataUse.primary[0].code).should('exist');
  });

  it('Displays the Principal Investigator field', () => {
    cy.stub(DataSet, 'searchDatasetIndex').returns(Promise.resolve([datasetTerm]));
    cy.stub(DatasetMetrics, 'getDatasetStats').returns(Promise.resolve({}));

    const props = {
      match: {
        params: {
          datasetIdentifier: datasetTerm.datasetIdentifier
        }
      },
      history: {
        push() {
        }
      }
    };
    mount(<DatasetStatistics {...props}/>);
    cy.contains('Principal Investigator').should('exist');
    cy.contains(datasetTerm.study.piName).should('exist');
  });

  it('Displays DAR section with data', () => {
    const darsData = [{
      darCode: 'DAR-123',
      projectTitle: 'Test Project',
      updateDate: '2023-01-01',
      nonTechRus: 'Test summary'
    }];

    cy.stub(DataSet, 'searchDatasetIndex').returns(Promise.resolve([datasetTerm]));
    cy.stub(DatasetMetrics, 'getDatasetStats').returns(Promise.resolve({dars: darsData}));

    const props = {
      match: { params: { datasetIdentifier: datasetTerm.datasetIdentifier }},
      history: { push() {} }
    };

    mount(<DatasetStatistics {...props}/>);
    cy.contains('Data Access Requests for this dataset').should('exist');
    cy.contains('DAR-123').should('exist');
    cy.contains('Test Project').should('exist');
  });

  it('Displays message when no DARs exist', () => {
    cy.stub(DataSet, 'searchDatasetIndex').returns(Promise.resolve([datasetTerm]));
    cy.stub(DatasetMetrics, 'getDatasetStats').returns(Promise.resolve({dars: []}));

    const props = {
      match: { params: { datasetIdentifier: datasetTerm.datasetIdentifier }},
      history: { push() {} }
    };

    mount(<DatasetStatistics {...props}/>);
    cy.contains('No Data Access Requests have been created for this dataset').should('exist');
  });
});
