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
    cy.get('#0_saveConsentGroup').click().then(() => {
      expect(propCopy.saveConsentGroup).to.be.calledWith({
        col: true,
        consentGroupName: 'Hello!',
        diseaseSpecificUse: undefined,
        generalResearchUse: false,
        hmb: true,
        otherPrimary: undefined,
        poa: false,
        url: 'https://www.asdf.gov',
      });
    });


  }),
  it('Deletes properly', function () {
    cy.spy(propCopy, 'deleteConsentGroup');

    mount(<ConsentGroupForm {...propCopy}/>);

    cy.get('#0_consentGroupName').type('Hello!');
    cy.get('#0_url').type('https://www.asdf.gov');
    cy.get('#0_hmb').check();
    cy.get('#0_col').check();
    cy.get('#0_deleteConsentGroup').click().then(() => {
      expect(propCopy.deleteConsentGroup).to.be.called;
    });
  }),
  it('Shows conditional fields only when checked', function () {

    mount(<ConsentGroupForm {...propCopy}/>);

    cy.get('#0_gstext').should('not.exist');
    cy.get('#0_gs').check();
    cy.get('#0_gstext').should('exist');

    cy.get('#0_otherSecondaryText').should('not.exist');
    cy.get('#0_otherSecondary').check();
    cy.get('#0_otherSecondaryText').should('exist');

    cy.get('#0_otherPrimaryText').should('not.exist');
    cy.get('#0_otherPrimary').check();
    cy.get('#0_otherPrimaryText').should('exist');

    cy.get('#0_diseaseSpecificUseText').should('not.exist');
    cy.get('#0_diseaseSpecificUse').check();
    cy.get('#0_diseaseSpecificUseText').should('exist');


  }),
  it('Shows summary when saved', function () {
    mount(<ConsentGroupForm {...propCopy}/>);

    cy.get('#0_consentGroupName').type('Hello!');


    cy.get('#0_consentGroupSummary').should('not.exist');
    cy.get('#0_saveConsentGroup').click();
    cy.get('#0_consentGroupSummary').should('exist');
  });
});