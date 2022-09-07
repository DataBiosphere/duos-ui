/* eslint-disable no-undef */
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
    cy.get('#dataAccessCommitteeId').should('not.exist');

    cy.get('#dataSharingPlan_closed_access').check();


    cy.get('#btn_addInstitution').should('exist');
    cy.get('#dataAccessCommitteeId').should('exist');
    cy.get('#0_consentGroupForm').should('not.exist');
    cy.get('#btn_addInstitution').click();
    cy.get('#0_consentGroupForm').should('exist');

    cy.get('#dataSharingPlan_open_access').check();

    cy.get('#btn_addInstitution').should('not.exist');
    cy.get('#dataAccessCommitteeId').should('not.exist');
    cy.get('#0_consentGroupForm').should('not.exist');

  }),
  it('Adds multiple consent groups', function () {
    mount(<DataSubmissionForm />);

    cy.get('#dataSharingPlan_closed_access').check();

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

    cy.get('#dataSharingPlan_closed_access').check();

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