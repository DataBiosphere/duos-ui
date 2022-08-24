import ConsentGroupForm from '../../../src/components/data_submission/ConsentGroupForm';
import { cloneDeep } from 'lodash/fp';
import { mount } from 'cypress/react';

const props = {
  idx: 0,
  parentConsentGroup: {},
  saveConsentGroup: () => {},
  deleteConsentGroup: () => {},
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
    cy.get('#0_primaryRadio_hmb').check();
    cy.get('#0_col').check();
    cy.get('#0_dataLocation_text').type('Not Determined{enter}');
    cy.get('#0_saveConsentGroup').click().then(() => {
      expect(propCopy.saveConsentGroup).to.be.calledWith({
            "value": {
                "consentGroupName": "Hello!",
                "generalResearchUse": false,
                "hmb": true,
                "poa": false,
                "nmds": false,
                "gso": false,
                "pub": false,
                "col": true,
                "irb": false,
                "gs": null,
                "mor": false,
                "npu": false,
                "otherSecondary": null,
                "otherPrimary": undefined,
                'diseaseSpecificUse': undefined,
                "dataLocation": [
                    "Not Determined"
                ],
                "url": "https://www.asdf.gov"
            },
            "valid": true
        });

      // switches to summary view
      cy.get('#0_consentGroupSummary').should('exist');
    });

  }),
  it('Deletes properly', function () {
    cy.spy(propCopy, 'deleteConsentGroup');

    mount(<ConsentGroupForm {...propCopy}/>);

    cy.get('#0_consentGroupName').type('Hello!');
    cy.get('#0_url').type('https://www.asdf.gov');
    cy.get('#0_primaryRadio_hmb').check();
    cy.get('#0_col').check();
    cy.get('#0_deleteConsentGroup').click().then(() => {
      expect(propCopy.deleteConsentGroup).to.be.called;
    });
  }),
  it('Shows conditional fields only when checked', function () {

    mount(<ConsentGroupForm {...propCopy}/>);

    cy.get('#0_gs_text').should('not.exist');
    cy.get('#0_gs').check();
    cy.get('#0_gs_text').should('exist');

    cy.get('#0_otherSecondary_text').should('not.exist');
    cy.get('#0_otherSecondary').check();
    cy.get('#0_otherSecondary_text').should('exist');

    cy.get('#0_primaryRadio_otherPrimary_text_input').should('not.exist');
    cy.get('#0_primaryRadio_otherPrimary').check();
    cy.get('#0_primaryRadio_otherPrimary_text_input').should('exist');

    cy.get('#0_primaryRadio_diseaseSpecificUse_text_input').should('not.exist');
    cy.get('#0_primaryRadio_diseaseSpecificUse').check();
    cy.get('#0_primaryRadio_diseaseSpecificUse_text_input').should('exist');


  })
});