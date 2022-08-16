import { DAC } from '../../../src/libs/ajax';
import DataSubmissionForm from '../../../src/pages/DataSubmissionForm';
import { cloneDeep } from 'lodash/fp';
import { mount } from 'cypress/react';

const dacs = [];

beforeEach(() => {
  cy.stub(DAC, 'list').returns(Promise.resolve(dacs));
});

describe('Data Access Governance', function () {
  it('Only renders consent group info if closed access', function () {
    mount(<DataSubmissionForm />);

    cy.get('#btn_addInstitution').should('not.exist');
    cy.get('#data_submission_select_dac').should('not.exist');

    cy.get('#alternativeDataSharingPlanControlledClosedAccess').check();


    cy.get('#btn_addInstitution').should('exist');
    cy.get('#data_submission_select_dac').should('exist');
    cy.get('#0_consentGroupForm').should('not.exist');
    cy.get('#btn_addInstitution').click();
    cy.get('#0_consentGroupForm').should('exist');

    cy.get('#alternativeDataSharingPlanControlledOpenAccess').check();

    cy.get('#btn_addInstitution').should('not.exist');
    cy.get('#data_submission_select_dac').should('not.exist');
    cy.get('#0_consentGroupForm').should('not.exist');

  }),
  it('Adds multiple consent groups', function () {
    mount(<DataSubmissionForm />);

    cy.get('#alternativeDataSharingPlanControlledClosedAccess').check();

    cy.get('#0_consentGroupForm').should('not.exist');
    cy.get('#1_consentGroupForm').should('not.exist');
    cy.get('#2_consentGroupForm').should('not.exist');

    cy.get('#btn_addInstitution').click();
    cy.get('#0_consentGroupForm').should('exist');
    cy.get('#1_consentGroupForm').should('not.exist');
    cy.get('#2_consentGroupForm').should('not.exist');

    cy.get('#btn_addInstitution').click();
    cy.get('#0_consentGroupForm').should('exist');
    cy.get('#1_consentGroupForm').should('exist');
    cy.get('#2_consentGroupForm').should('not.exist');

    cy.get('#btn_addInstitution').click();
    cy.get('#0_consentGroupForm').should('exist');
    cy.get('#1_consentGroupForm').should('exist');
    cy.get('#2_consentGroupForm').should('exist');


  }),
  it('Delete consent group works', function () {
    mount(<DataSubmissionForm />);

    cy.get('#alternativeDataSharingPlanControlledClosedAccess').check();

    cy.get('#btn_addInstitution').click();
    cy.get('#btn_addInstitution').click();
    cy.get('#btn_addInstitution').click();

    cy.get('#0_consentGroupForm').should('exist');
    cy.get('#1_consentGroupForm').should('exist');
    cy.get('#2_consentGroupForm').should('exist');

    cy.get('#1_deleteConsentGroup').click();
    cy.get('#0_consentGroupForm').should('exist');
    cy.get('#1_consentGroupForm').should('not.exist');
    cy.get('#2_consentGroupForm').should('exist');

    cy.get('#0_deleteConsentGroup').click();
    cy.get('#0_consentGroupForm').should('not.exist');
    cy.get('#1_consentGroupForm').should('not.exist');
    cy.get('#2_consentGroupForm').should('exist');

    cy.get('#2_deleteConsentGroup').click();
    cy.get('#0_consentGroupForm').should('not.exist');
    cy.get('#1_consentGroupForm').should('not.exist');
    cy.get('#2_consentGroupForm').should('not.exist');
  });
});