/* eslint-disable no-undef */
import React from 'react';
import {DAC, User, Institution, Schema, Study, DataSet} from '../../../src/libs/ajax';
import DataSubmissionForm from '../../../src/pages/data_submission/DataSubmissionForm';
import { mount } from 'cypress/react';

const dacs = [
  {
    name: 'asdf',
    dacId: 1,
  }
];

const user = {
  userId: 1,
  displayName: 'Cindy Crawford',
  email: 'cc@c.com'
};

beforeEach(() => {
  cy.stub(DAC, 'list').returns(Promise.resolve(dacs));
  cy.stub(User, 'getMe').returns(user);
  cy.stub(Institution, 'list').returns([{name: 'Test Institution'}]);
  cy.stub(Schema, 'datasetRegistrationV1').returns({});
  cy.stub(Study, 'getStudyNames').returns([]);
  cy.stub(DataSet, 'getDatasetNames').returns([]);
});

describe('Data Access Governance', function () {
  it('Adds multiple consent groups', function () {
    mount(<DataSubmissionForm />);

    cy.get('#0_consentGroupForm').should('exist');
    cy.get('#1_consentGroupForm').should('not.exist');
    cy.get('#2_consentGroupForm').should('not.exist');
    cy.get('#3_consentGroupForm').should('not.exist');

    cy.get('#btn_addConsentGroup').click();
    cy.get('#0_consentGroupForm').should('exist');
    cy.get('#1_consentGroupForm').should('exist');
    cy.get('#2_consentGroupForm').should('not.exist');
    cy.get('#3_consentGroupForm').should('not.exist');

    cy.get('#btn_addConsentGroup').click();
    cy.get('#0_consentGroupForm').should('exist');
    cy.get('#1_consentGroupForm').should('exist');
    cy.get('#2_consentGroupForm').should('exist');
    cy.get('#3_consentGroupForm').should('not.exist');

    cy.get('#btn_addConsentGroup').click();
    cy.get('#0_consentGroupForm').should('exist');
    cy.get('#1_consentGroupForm').should('exist');
    cy.get('#2_consentGroupForm').should('exist');
    cy.get('#3_consentGroupForm').should('exist');

  }),
  it('Delete consent group works', function () {
    mount(<DataSubmissionForm />);

    cy.get('#btn_addConsentGroup').click();
    cy.get('#btn_addConsentGroup').click();
    cy.get('#btn_addConsentGroup').click();

    cy.get('#0_consentGroupForm').should('exist');
    cy.get('#1_consentGroupForm').should('exist');
    cy.get('#2_consentGroupForm').should('exist');
    cy.get('#3_consentGroupForm').should('exist');

    // when you delete consent groups, they get shifted down to
    // their appropriate idx; so if you have 0, 1, 2, and 3 and
    // you delete 1, then 0, 2, and 3 get mapped to 0, 1, and 2
    cy.get('#1_deleteConsentGroup').click();
    cy.get('#0_consentGroupForm').should('exist');
    cy.get('#1_consentGroupForm').should('exist');
    cy.get('#2_consentGroupForm').should('exist');
    cy.get('#3_consentGroupForm').should('not.exist');

    cy.get('#0_deleteConsentGroup').click();
    cy.get('#0_consentGroupForm').should('exist');
    cy.get('#1_consentGroupForm').should('exist');
    cy.get('#2_consentGroupForm').should('not.exist');
    cy.get('#3_consentGroupForm').should('not.exist');

    cy.get('#0_deleteConsentGroup').click();
    cy.get('#0_consentGroupForm').should('exist');
    cy.get('#1_consentGroupForm').should('not.exist');
    cy.get('#2_consentGroupForm').should('not.exist');
    cy.get('#3_consentGroupForm').should('not.exist');

    cy.get('#0_deleteConsentGroup').click();
    cy.get('#0_consentGroupForm').should('exist');
    cy.get('#1_consentGroupForm').should('not.exist');
    cy.get('#2_consentGroupForm').should('not.exist');
    cy.get('#3_consentGroupForm').should('not.exist');
  });
});