/* eslint-disable no-undef */
import React from 'react';
import { mount } from 'cypress/react';
import { cloneDeep } from 'lodash/fp';
import NihAnvilUse from '../../../src/components/data_submission/NihAnvilUse';

let propCopy;

const props = {
  onChange: () => {}
};

beforeEach(() => {
  propCopy = cloneDeep(props);
});

describe('NihAnvilUse - Tests', () => {
  it('should mount with only the nihAnvilUse form field displayed', () => {
    propCopy.formData = {};
    mount(<NihAnvilUse {...propCopy}/>);
    const formFields = cy.get('.formField-container');
    formFields.should('exist');

    cy.get('#nihAnvilUse').should('exist');

    cy.get('#submittingToAnvil').should('not.exist');
    cy.get('#dbGaPPhsID').should('not.exist');
    cy.get('#dbGaPStudyRegistrationName').should('not.exist');
    cy.get('#embargoReleaseDate').should('not.exist');
    cy.get('#sequencingCenter').should('not.exist');
  });

  it('should display submittingToAnvil form field if nihAnvilUse is \'I will\'', () => {
    mount(<NihAnvilUse {...propCopy}/>);
    cy.get('#nihAnvilUse_i_will').click();

    cy.get('#submittingToAnvil').should('exist');

    cy.get('#dbGaPPhsID').should('not.exist');
    cy.get('#dbGaPStudyRegistrationName').should('not.exist');
    cy.get('#embargoReleaseDate').should('not.exist');
    cy.get('#sequencingCenter').should('not.exist');
  });

  it('should display submittingToAnvil form field if nihAnvilUse is \'No\'', () => {
    mount(<NihAnvilUse {...propCopy}/>);
    cy.get('#nihAnvilUse_no').click();

    cy.get('#submittingToAnvil').should('exist');

    cy.get('#dbGaPPhsID').should('not.exist');
    cy.get('#dbGaPStudyRegistrationName').should('not.exist');
    cy.get('#embargoReleaseDate').should('not.exist');
    cy.get('#sequencingCenter').should('not.exist');
  });

  it('should display dbGaP form fields if nihAnvilUse is \'I did\'', () => {
    mount(<NihAnvilUse {...propCopy}/>);
    cy.get('#nihAnvilUse_i_did').click();

    cy.get('#submittingToAnvil').should('not.exist');

    cy.get('#dbGaPPhsID').should('exist');
    cy.get('#dbGaPStudyRegistrationName').should('exist');
    cy.get('#embargoReleaseDate').should('exist');
    cy.get('#sequencingCenter').should('exist');
  });
});