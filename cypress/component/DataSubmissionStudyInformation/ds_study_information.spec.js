/* eslint-disable no-undef */
import React from 'react';
import { mount } from 'cypress/react';
import { cloneDeep } from 'lodash/fp';
import { User } from '../../../src/libs/ajax';
import DataSubmissionStudyInformation from '../../../src/components/data_submission/DsStudyInformation';

let propCopy;
const user = {
  userId: 1,
  dacUserId: 2,
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
  it('should mount with all the fields', () => {
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

  it('should load the user information, display it, but not let the user modify it', () => {
    mount(<DataSubmissionStudyInformation {...propCopy}/>);
    cy.get('#dataSubmitterName').should('be.disabled');
    cy.get('#dataSubmitterName').should('have.value', user.displayName);
    cy.get('#dataSubmitterEmail').should('be.disabled');
    cy.get('#dataSubmitterEmail').should('have.value', user.email);
  });

  describe('Form Control - Text Input Tests', () => {
    it('should render', () => {
      mount(<DataSubmissionStudyInformation {...propCopy}/>);
      cy.get('.formField-studyName').should('have.length', 1);
      cy.get('#lbl_studyName').contains('Study Name');
      cy.get('#studyName').should('exist');
    });

    it('should run onChange event when user inputs values into form control', () => {
      const textToType = 'Dangerous Study';
      cy.spy(propCopy, 'onChange');
      mount(<DataSubmissionStudyInformation {...propCopy}/>);
      cy.get('#studyName')
        .type(textToType)
        .then(() => {
          cy.get('#studyName').should('have.value', textToType);
          expect(propCopy.onChange).to.be.calledWith({key: 'studyName', value: textToType}); // code value
        });
    });

    it('should display error when text input is required, value is blank', () => {
      mount(<DataSubmissionStudyInformation {...propCopy}/>);
      cy.get('#studyName')
        .type('hello')
        .clear()
        .then(() => {
          cy.get('#studyName').should('have.value', '');
          cy.get('#studyName').should('have.class', 'errored');
          cy.get('#lbl_studyName').should('have.class', 'errored');
        });
    });

    it('should display error when text input is required, but is dirty', () => {
      mount(<DataSubmissionStudyInformation {...propCopy}/>);
      cy.get('#studyName')
        .click()
        .blur()
        .then(() => {
          cy.get('#studyName').should('have.value', '');
          cy.get('#studyName').should('have.class', 'errored');
          cy.get('#lbl_studyName').should('have.class', 'errored');
        });
    });

    it('should be disabled with the config declares it', () => {
      mount(<DataSubmissionStudyInformation {...propCopy}/>);
      cy.get('#dataSubmitterName').should('be.disabled');
    });
  });

  describe('Form Control - MultiText', () => {
    it('should render', () => {
      mount(<DataSubmissionStudyInformation {...propCopy}/>);
      cy.get('.formField-dataCustodianEmail').should('have.length', 1);
      cy.get('#lbl_dataCustodianEmail').contains('Data Custodian Email');
      cy.get('#dataCustodianEmail').should('exist');
    });

    it('should add email address', () => {
      cy.spy(propCopy, 'onChange');
      mount(<DataSubmissionStudyInformation {...propCopy}/>);
      cy.get('#dataCustodianEmail').type('a@a.com');
      cy.get('#dataCustodianEmail').type('{enter}').then(() => {
        expect(propCopy.onChange).to.be.calledWith({key: 'dataCustodianEmail', value: ['a@a.com']}); // code value
        cy.get('.formField-dataCustodianEmail .pill').first().contains('a@a.com'); // ui element exists
      });
    });

    it('should add multiple email addresses', () => {
      cy.spy(propCopy, 'onChange');
      mount(<DataSubmissionStudyInformation {...propCopy}/>);
      cy.get('#dataCustodianEmail')
        .type('a@a.com').type('{enter}')
        .type('b@b.com').type('{enter}')
        .type('c@c.com').type('{enter}')
        .then(() => {
          expect(propCopy.onChange).to.be.calledWith({key: 'dataCustodianEmail', value: ['a@a.com', 'b@b.com', 'c@c.com']}); // code value
          cy.get('.formField-dataCustodianEmail .pill').first().contains('a@a.com');
          cy.get('.formField-dataCustodianEmail .pill').first().next().contains('b@b.com');
          cy.get('.formField-dataCustodianEmail .pill').first().next().next().contains('c@c.com');
        });
    });

    it('should not add duplicate emails', () => {
      cy.spy(propCopy, 'onChange');
      mount(<DataSubmissionStudyInformation {...propCopy}/>);
      cy.get('#dataCustodianEmail')
        .type('a@a.com').type('{enter}')
        .type('a@a.com').type('{enter}')
        .then(() => {
          expect(propCopy.onChange).to.be.callCount(2); // only calls onChange once
          cy.get('#dataCustodianEmail').should('have.value', ''); // clear input on duplicate text
          cy.get('.formField-dataCustodianEmail .pill').should('have.length', 1); // only have one pill
        });
    });

    it('should not add invalid emails', () => {
      cy.spy(propCopy, 'onChange');
      mount(<DataSubmissionStudyInformation {...propCopy}/>);
      cy.get('#dataCustodianEmail')
        .type('not an email haha').type('{enter}')
        .then(() => {
          expect(propCopy.onChange).to.be.callCount(1); // the first call btw is for user change.
          cy.get('#dataCustodianEmail').should('have.value', 'not an email haha');
          cy.get('#dataCustodianEmail').should('have.class', 'errored');
        });
    });

    it('should remove single on click', () => {
      cy.spy(propCopy, 'onChange');
      mount(<DataSubmissionStudyInformation {...propCopy}/>);
      cy.get('#dataCustodianEmail').type('a@a.com').type('{enter}');
      cy.get('.formField-dataCustodianEmail .pill').first().should('exist');
      cy.get('.formField-dataCustodianEmail .pill').first().click().then(() => {
        expect(propCopy.onChange).to.be.calledWith({key: 'dataCustodianEmail', value: []}); // code value
        cy.get('.formField-dataCustodianEmail .pill').should('not.exist');
      });
    });

    it('should remove [x, 1, 2] from array on click', () => {
      cy.spy(propCopy, 'onChange');
      mount(<DataSubmissionStudyInformation {...propCopy}/>);
      cy.get('#dataCustodianEmail')
        .type('a@a.com').type('{enter}')
        .type('b@b.com').type('{enter}')
        .type('c@c.com').type('{enter}');
      cy.get('.formField-dataCustodianEmail .pill').eq(0).click().then(() => {
        expect(propCopy.onChange).to.be.calledWith({key: 'dataCustodianEmail', value: ['b@b.com', 'c@c.com']}); // code value
        cy.get('.formField-dataCustodianEmail .pill').first().contains('b@b.com');
        cy.get('.formField-dataCustodianEmail .pill').first().next().contains('c@c.com');
      });
    });

    it('should remove [0, x, 2] from array on click', () => {
      cy.spy(propCopy, 'onChange');
      mount(<DataSubmissionStudyInformation {...propCopy}/>);
      cy.get('#dataCustodianEmail')
        .type('a@a.com').type('{enter}')
        .type('b@b.com').type('{enter}')
        .type('c@c.com').type('{enter}');
      cy.get('.formField-dataCustodianEmail .pill').eq(1).click().then(() => {
        expect(propCopy.onChange).to.be.calledWith({key: 'dataCustodianEmail', value: ['a@a.com', 'c@c.com']}); // code value
        cy.get('.formField-dataCustodianEmail .pill').first().contains('a@a.com');
        cy.get('.formField-dataCustodianEmail .pill').first().next().contains('c@c.com');
      });
    });

    it('should remove [0, 1, x] from array on click', () => {
      cy.spy(propCopy, 'onChange');
      mount(<DataSubmissionStudyInformation {...propCopy}/>);
      cy.get('#dataCustodianEmail')
        .type('a@a.com').type('{enter}')
        .type('b@b.com').type('{enter}')
        .type('c@c.com').type('{enter}');
      cy.get('.formField-dataCustodianEmail .pill').eq(2).then(() => {
        expect(propCopy.onChange).to.be.calledWith({key: 'dataCustodianEmail', value: ['a@a.com', 'b@b.com']}); // code value
        cy.get('.formField-dataCustodianEmail .pill').first().contains('a@a.com');
        cy.get('.formField-dataCustodianEmail .pill').first().next().contains('b@b.com');
      });
    });
  });

  describe('Form Control - Slider Tests', () => {
    it('should render', () => {
      mount(<DataSubmissionStudyInformation {...propCopy}/>);
      cy.get('.formField-publicVisibility').should('have.length', 1);
    });

    it('should run onChange event when user toggles the slider false', () => {
      cy.spy(propCopy, 'onChange');
      mount(<DataSubmissionStudyInformation {...propCopy}/>);
      const selector = '#cb_publicVisibility_Visible';
      cy.get(selector).should('be.checked');
      cy.get(selector)
        .click()
        .then(() => {
          cy.get(selector).should('not.be.checked'); // visual
          expect(propCopy.onChange).to.be.calledWith({key: 'publicVisibility', value: false}); // code value
        });
    });

    it('should run onChange event when user toggles the slider true', () => {
      cy.spy(propCopy, 'onChange');
      mount(<DataSubmissionStudyInformation {...propCopy}/>);
      const selector = '#cb_publicVisibility_Visible';
      cy.get(selector).should('be.checked');
      cy.get(selector)
        .click()
        .click()
        .then(() => {
          cy.get(selector).should('be.checked'); // visual
          expect(propCopy.onChange).to.be.calledWith({key: 'publicVisibility', value: true}); // code value
        });
    });
  });

  describe('Form Control - Select Tests', () => {
    it('should render', () => {
      mount(<DataSubmissionStudyInformation {...propCopy}/>);
      cy.get('.formField-studyType').should('have.length', 1);
      cy.get('.formField-studyType label').contains('Study Type');
      cy.get('#studyType').should('exist');
    });

    it('should open the options on click', () => {
      mount(<DataSubmissionStudyInformation {...propCopy}/>);
      cy.get('#studyType .dropdown-toggle').click();
      cy.get('#studyType .select-dropdown-menu').should('exist');
      cy.get('#studyType .select-dropdown-item').should('have.length', 10);
      cy.get('#studyType .select-dropdown-item').eq(0).contains('Observational');
    });

    it('should filter as the user types', () => {
      mount(<DataSubmissionStudyInformation {...propCopy}/>);
      cy.get('#studyType .dropdown-toggle').click();
      cy.get('#studyType .search-bar').type('d').then(() => {
        cy.get('#studyType .select-dropdown-item').should('have.length', 2);
        cy.get('#studyType .select-dropdown-item').eq(0).contains('Descriptive');
        cy.get('#studyType .select-dropdown-item').eq(1).contains('Cohort study');
      });
    });

    it('should allow user to select by clicking dropdown element', () => {
      cy.spy(propCopy, 'onChange');
      mount(<DataSubmissionStudyInformation {...propCopy}/>);
      cy.get('#studyType .dropdown-toggle').click();
      cy.get('#studyType .search-bar').type('d').then(() => {
        cy.get('#studyType .select-dropdown-item').first().click().then(() => {
          expect(propCopy.onChange).to.be.calledWith({key: 'studyType', value: 'Descriptive'}); // code value
          cy.get('#studyType .dropdown-toggle').contains('Descriptive'); // ui updates with new val
        });
      });
    });

    it('should allow user to select by entering a new option as freetext', () => {
      cy.spy(propCopy, 'onChange');
      mount(<DataSubmissionStudyInformation {...propCopy}/>);
      cy.get('#studyType .dropdown-toggle').click();
      cy.get('#studyType .search-bar').type('newtext').then(() => {
        cy.get('#studyType .search-bar').blur().then(() => {
          expect(propCopy.onChange).to.be.calledWith({key: 'studyType', value: 'newtext'}); // code value
          cy.get('#studyType .dropdown-toggle').contains('newtext'); // ui updates with new val
        });
      });
    });

  });
});
