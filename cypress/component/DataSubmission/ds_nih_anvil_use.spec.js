/* eslint-disable no-undef */
import React from 'react';
import { mount } from 'cypress/react';
import { cloneDeep } from 'lodash/fp';
import NihAnvilUse from '../../../src/components/data_submission/NihAnvilUse';

let propCopy;

const props = {
  onChange: () => {},
  validation: {},
  onValidationChange: () => {},
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
    cy.get('#dbGaPPhsID').should('not.exist');
    cy.get('#dbGaPStudyRegistrationName').should('not.exist');
    cy.get('#embargoReleaseDate').should('not.exist');
    cy.get('#sequencingCenter').should('not.exist');
  });

  it('should show dbGaP form fields if NHGRI funded and has dbGaP ID', () => {
    mount(<NihAnvilUse {...propCopy}/>);
    cy.get('#nihAnvilUse_yes_nhgri_yes_phs_id').click();

    cy.get('#dbGaPPhsID').should('exist');
    cy.get('#dbGaPStudyRegistrationName').should('exist');
    cy.get('#embargoReleaseDate').should('exist');
    cy.get('#sequencingCenter').should('exist');
  });

  it('should hide dbGaP form fields if NHGRI funded and no dbGaP ID', () => {
    mount(<NihAnvilUse {...propCopy}/>);
    cy.get('#nihAnvilUse_yes_nhgri_no_phs_id').click();

    cy.get('#dbGaPPhsID').should('not.exist');
    cy.get('#dbGaPStudyRegistrationName').should('not.exist');
    cy.get('#embargoReleaseDate').should('not.exist');
    cy.get('#sequencingCenter').should('not.exist');
  });

  it('should hide dbGaP form fields if not NHGRI funded and submitting to AnVIL ', () => {
    mount(<NihAnvilUse {...propCopy}/>);
    cy.get('#nihAnvilUse_no_nhgri_yes_anvil').click();

    cy.get('#dbGaPPhsID').should('not.exist');
    cy.get('#dbGaPStudyRegistrationName').should('not.exist');
    cy.get('#embargoReleaseDate').should('not.exist');
    cy.get('#sequencingCenter').should('not.exist');
  });

  it('should hide dbGaP form fields if not NHGRI funded and not submitting to AnVIL', () => {
    mount(<NihAnvilUse {...propCopy}/>);
    cy.get('#nihAnvilUse_no_nhgri_no_anvil').click();

    cy.get('#dbGaPPhsID').should('not.exist');
    cy.get('#dbGaPStudyRegistrationName').should('not.exist');
    cy.get('#embargoReleaseDate').should('not.exist');
    cy.get('#sequencingCenter').should('not.exist');
  });
});