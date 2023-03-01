/* eslint-disable no-undef */
import React from 'react';
import ConsentGroupForm from '../../../src/components/data_submission/consent_group/ConsentGroupForm';
import { cloneDeep } from 'lodash/fp';
import { mount } from 'cypress/react';

const props = {
  idx: 0,
  parentConsentGroup: {},
  saveConsentGroup: () => {},
  deleteConsentGroup: () => {},
  nihInstitutionalCertificationFile: null,
  updateNihInstitutionalCertificationFile: () => {},
  validation: {},
  onValidationChange: () => {}
};

let propCopy = {};

beforeEach(() => {
  propCopy = cloneDeep(props);
});

describe('Consent Group', function () {
  it('Edits without saving', function () {
    cy.spy(propCopy, 'saveConsentGroup');

    mount(<ConsentGroupForm {...propCopy}/>);

    cy.get('#0_consentGroupName').type('Hello!');
    cy.get('#0_url').type('https://www.asdf.gov');

    expect(propCopy.saveConsentGroup).to.not.be.called;
  }),
  it('Saves properly', function () {
    cy.spy(propCopy, 'saveConsentGroup');

    mount(<ConsentGroupForm {...propCopy}/>);

    cy.get('#0_consentGroupName').type('Hello!');
    cy.get('#0_url').type('https://www.asdf.gov');
    cy.get('#0_primaryConsent_hmb').check();
    cy.get('#0_col').check();
    cy.get('#0_dataLocation').type('Not Determined{enter}');
    cy.get('#0_fileTypes-0-0_fileType').type('Geno{enter}');
    cy.get('#0_fileTypes-0-0_functionalEquivalence').type('asdf');
    cy.get('#0_fileTypes-0-0_numberOfParticipants').type('123');
    cy.get('#0_saveConsentGroup').click().then(() => {
      expect(propCopy.saveConsentGroup).to.be.calledWith(
        {
          'value': {
            'consentGroupName': 'Hello!',
            'generalResearchUse': false,
            'hmb': true,
            'poa': false,
            'nmds': false,
            'gso': false,
            'pub': false,
            'col': true,
            'irb': false,
            'gs': null,
            'npu': false,
            'mor': undefined,
            'diseaseSpecificUse': undefined,
            'otherPrimary': undefined,
            'otherSecondary': null,
            'dataLocation': [
              'Not Determined'
            ],
            'url': 'https://www.asdf.gov',
            'fileTypes': [
              {
                'fileType': 'Genome',
                'functionalEquivalence': 'asdf',
                'numberOfParticipants': 123
              }
            ]
          },
          'valid': true
        }
      );

      // switches to summary view
      cy.get('#0_consentGroupSummary').should('exist');
    });

  }),
  it('Deletes properly', function () {
    cy.spy(propCopy, 'deleteConsentGroup');

    mount(<ConsentGroupForm {...propCopy}/>);

    cy.get('#0_consentGroupName').type('Hello!');
    cy.get('#0_url').type('https://www.asdf.gov');
    cy.get('#0_primaryConsent_hmb').check();
    cy.get('#0_col').check();
    cy.get('#0_deleteConsentGroup').click().then(() => {
      expect(propCopy.deleteConsentGroup).to.be.called;
    });
  }),
  it('Shows conditional fields only when checked', function () {

    mount(<ConsentGroupForm {...propCopy}/>);

    cy.get('#0_gsText').should('not.exist');
    cy.get('#0_gs').check();
    cy.get('#0_gsText').should('exist');

    cy.get('#0_otherSecondaryText').should('not.exist');
    cy.get('#0_otherSecondary').check();
    cy.get('#0_otherSecondaryText').should('exist');

    cy.get('#0_otherPrimaryText').should('not.exist');
    cy.get('#0_primaryConsent_otherPrimary').check();
    cy.get('#0_otherPrimaryText').should('exist');

    cy.get('#0_diseaseSpecificUseText').should('not.exist');
    cy.get('#0_primaryConsent_diseaseSpecificUse').check();
    cy.get('#0_diseaseSpecificUseText').should('exist');


  });
});