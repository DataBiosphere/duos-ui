/* eslint-disable no-undef */
import React from 'react';
import { mount } from 'cypress/react';
import { cloneDeep } from 'lodash/fp';
import DataSubmissionNihAnvilUse from '../../../src/components/data_submission/DataSubmissionNihAnvilUse';

let propCopy;

const props = {
  onChange: () => {}
};

beforeEach(() => {
  propCopy = cloneDeep(props);
});

describe('DataSubmissionNihAnvilUse - Tests', () => {
  it('should mount with only the nihAnvilUse form field displayed', () => {
    propCopy.formData = {};
    mount(<DataSubmissionNihAnvilUse {...propCopy}/>);
    const formFields = cy.get('.formField-container');
    formFields.should('have.length', 1);

    cy.get('.formField-nihAnvilUse').should('have.length', 1);

    cy.get('.formField-submittingToAnvil').should('not.exist');
    cy.get('.formField-dbGaPPhsID').should('not.exist');
    cy.get('.formField-dbGaPStudyRegistrationName').should('not.exist');
    cy.get('.formField-embargoReleaseDate').should('not.exist');
    cy.get('.formField-sequencingCenter').should('not.exist');
  });

  it('should display submittingToAnvil form field if nihAnvilUse is \'I will\'', () => {
    propCopy.formData = {
      nihAnvilUse: 'I will'
    };
    mount(<DataSubmissionNihAnvilUse {...propCopy}/>);
    cy.get('.formField-submittingToAnvil').should('have.length', 1);

    cy.get('.formField-dbGaPPhsID').should('not.exist');
    cy.get('.formField-dbGaPStudyRegistrationName').should('not.exist');
    cy.get('.formField-embargoReleaseDate').should('not.exist');
    cy.get('.formField-sequencingCenter').should('not.exist');
  });

  it('should display submittingToAnvil form field if nihAnvilUse is \'No\'', () => {
    propCopy.formData = {
      nihAnvilUse: 'No'
    };
    mount(<DataSubmissionNihAnvilUse {...propCopy}/>);
    cy.get('.formField-submittingToAnvil').should('have.length', 1);

    cy.get('.formField-dbGaPPhsID').should('not.exist');
    cy.get('.formField-dbGaPStudyRegistrationName').should('not.exist');
    cy.get('.formField-embargoReleaseDate').should('not.exist');
    cy.get('.formField-sequencingCenter').should('not.exist');
  });

  it('should display dbGaP form fields if nihAnvilUse is \'I did\'', () => {
    propCopy.formData = {
      nihAnvilUse: 'I did'
    };
    mount(<DataSubmissionNihAnvilUse {...propCopy}/>);
    cy.get('.formField-submittingToAnvil').should('not.exist');

    cy.get('.formField-dbGaPPhsID').should('have.length', 1);
    cy.get('.formField-dbGaPStudyRegistrationName').should('have.length', 1);
    cy.get('.formField-embargoReleaseDate').should('have.length', 1);
    cy.get('.formField-sequencingCenter').should('have.length', 1);
  });
});
