import ConsentGroupForm from '../../../src/components/data_submitter/ConsentGroupForm';
import { cloneDeep } from 'lodash/fp';
import { mount } from 'cypress/react';

const props = {
  idx: 0,
  parentConsentGroup: {},
  saveConsentGroup: () => {},
  deleteConsentGroup: () => {},
}

let propCopy = {}; 

beforeEach(() => {
    propCopy = cloneDeep(props);
})

describe('Consent Group', function () {
  it('Edits without saving', function () {
    cy.spy(propCopy, 'saveConsentGroup');

    mount(<ConsentGroupForm {...propCopy}/>);

    cy.get('#0_consent_group_name').type('Hello!');
    cy.get('#0_url').type('https://www.asdf.gov');

    expect(propCopy.saveConsentGroup).to.not.be.called;

  }),
  it('Saves properly', function () {
    cy.spy(propCopy, 'saveConsentGroup');

    mount(<ConsentGroupForm {...propCopy}/>);

    cy.get('#0_consent_group_name').type('Hello!');
    cy.get('#0_url').type('https://www.asdf.gov');
    cy.get('#0_hmb').check();
    cy.get('#0_col').check();
    cy.get('#0_saveConsentGroup').click().then(() => {
        expect(propCopy.saveConsentGroup).to.be.calledWith({
            consentGroupName: 'Hello!',
            hmb: true,
            diseaseSpecificUse: true,
    
        });
    });


  }),
  it('Deletes properly', function () {

  }),
  it('Shows conditional fields only when checked', function () {

  }),
  it('Shows summary when saved', function () {

  })
})