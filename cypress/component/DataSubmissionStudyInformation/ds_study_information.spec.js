/* eslint-disable no-undef */
import React from 'react';
import { mount } from 'cypress/react';
import { cloneDeep } from 'lodash/fp';
import { User } from '../../../src/libs/ajax';
import DataSubmissionStudyInformation from '../../../src/components/data_submission/ds_study_information';

let propCopy;
const user = {
  userId: 1,
  displayName: 'Cindy Crawford',
  email: 'cc@c.com'
};

const props = {
  onChange: () => {}
};

beforeEach(() => {
  propCopy = cloneDeep(props);
  cy.stub(User, 'getMe').returns(user);
});

describe('DataSubmissionStudyInformation - Tests', () => {
  it('Renders', function() {
    mount(<DataSubmissionStudyInformation {...propCopy}/>);
    const formFields = cy.get('.formField-container');
    formFields.should('have.length', 14);

    cy.get('.formField-studyName').should('have.length', 1);
    cy.get('.formField-studyType').should('have.length', 1);
    cy.get('.formField-studyDescription').should('have.length', 1);
    cy.get('.formField-dataTypes').should('have.length', 1);
    cy.get('.formField-fileTypes-0-fileType').should('have.length', 1);
    cy.get('.formField-fileTypes-0-functionalEquivalence').should('have.length', 1);
    cy.get('.formField-fileTypes-0-numberOfParticipants').should('have.length', 1);
    cy.get('.formField-phenotypeIndication').should('have.length', 1);
    cy.get('.formField-species').should('have.length', 1);
    cy.get('.formField-piName').should('have.length', 1);
    cy.get('.formField-dataSubmitterName').should('have.length', 1);
    cy.get('.formField-dataSubmitterEmail').should('have.length', 1);
    cy.get('.formField-dataCustodianEmail').should('have.length', 1);
    cy.get('.formField-publicVisibility').should('have.length', 1);
  });

  it('should run onChange event when user inputs values into form control', () => {
    const onChangeSpy = cy.spy(propCopy, 'onChange');
    mount(<DataSubmissionStudyInformation {...propCopy}/>);
    cy.get('#studyName').type('Dangerous Study');
    expect(onChangeSpy).to.be.calledWith(
      expect.objectContaining({ key: 'studyName', value: 'Dangerous Study'})
    );
  });

  it('should load the user information into disabled fields', () => {
    mount(<DataSubmissionStudyInformation {...propCopy}/>);
    cy.get('#dataSubmitterName').should('be.disabled');
    cy.get('.formField-dataSubmitterName').should('have.value', user.displayName);
    cy.get('#dataSubmitterEmail').should('be.disabled');
    cy.get('.formField-dataSubmitterName').should('have.value', user.email);
  });
});
