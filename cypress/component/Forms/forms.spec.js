/* eslint-disable no-undef */
import React from 'react';
import { mount } from 'cypress/react';
import { FormField, FormFieldTypes, FormTable, FormValidators } from '../../../src/components/forms/forms';
import { isEmailAddress } from '../../../src/libs/utils';

let props;
const baseProps = {
  onChange: () => {}
};

describe('FormField - Tests', () => {

  describe('Validation', () => {
    it('should render required indicator', () => {
      props = {
        ...baseProps,
        id: 'studyName',
        title: 'Study Name',
        validators: [FormValidators.REQUIRED]
      };

      mount(<FormField {...props}/>);
      cy.get('#lbl_studyName').contains('Study Name*');
    });

    it('should run custom validator if it is included', () => {
      props = {
        ...baseProps,
        id: 'dataCustodianEmail',
        title: 'Data Custodian Email',
        validators: [
          { isValid: isEmailAddress, msg: 'Enter a valid email address (example@site.com)' }
        ]
      };

      cy.spy(props.validators[0], 'isValid');
      cy.spy(props, 'onChange');
      mount(<FormField {...props}/>);
      cy.get('#dataCustodianEmail')
        .type('a')
        .then(() => {
          cy.get('#dataCustodianEmail').should('have.value', 'a');
          expect(props.validators[0].isValid).to.be.calledWith('a');
          expect(props.onChange).to.be.calledWith({ key: 'dataCustodianEmail', value: 'a', isValid: false });
        });
    });

    it('should show error message with validator error message', () => {
      const errMessage = 'Enter a valid email address (example@site.com)';
      props = {
        ...baseProps,
        id: 'dataCustodianEmail',
        title: 'Data Custodian Email',
        validators: [
          { isValid: isEmailAddress, msg: errMessage }
        ]
      };
      mount(<FormField {...props}/>);
      cy.get('#dataCustodianEmail')
        .type('a')
        .then(() => {
          cy.get('#dataCustodianEmail').should('have.value', 'a');
          cy.get('.formField-dataCustodianEmail .error-message').contains(errMessage);
        });
    });
  });

  describe('Form Control - Text Input Tests', () => {
    beforeEach(() => {
      props = {
        ...baseProps,
        id: 'studyName',
        title: 'Study Name',
        validators: [FormValidators.REQUIRED]
      };
    });

    it('should render', () => {
      mount(<FormField {...props}/>);
      cy.get('.formField-studyName').should('have.length', 1);
      cy.get('#lbl_studyName').contains('Study Name');
      cy.get('#studyName').should('exist');
    });

    it('should run onChange event when user inputs values into form control', () => {
      const textToType = 'Dangerous Study';
      cy.spy(props, 'onChange');
      mount(<FormField {...props}/>);
      cy.get('#studyName')
        .type(textToType)
        .then(() => {
          cy.get('#studyName').should('have.value', textToType);
          expect(props.onChange).to.be.calledWith({key: 'studyName', value: textToType, isValid: true}); // code value
        });
    });

    it('should display error when text input is required, value is blank', () => {
      mount(<FormField {...props}/>);
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
      mount(<FormField {...props}/>);
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
      props.disabled = true;
      mount(<FormField {...props}/>);
      cy.get('#studyName').should('be.disabled');
    });
  });

  describe('Form Control - Multi Select', () => {
    beforeEach(() => {
      props = {
        ...baseProps,
        type: FormFieldTypes.MULTISELECT,
        id: 'multiSelect',
        options: [
          {
            value: 'opt1',
            label: 'Option 1',
          },
          {
            value: 'opt2',
            label: 'Option 2',
          },
          {
            value: 'none',
            label: 'None',
          }
        ]
      };
    });


    it('should render', () => {
      mount(<FormField {...props}/>);
      cy.get('#multiSelect').should('exist');
    });

    it('selects multiple', () => {
      mount(<FormField {...props}/>);
      cy.get('#multiSelect').should('exist');
    });

    it('properly excludes', () => {
      mount(<FormField {...props}/>);
      cy.get('#multiSelect').should('exist');
    });
  
  });

  describe('Form Control - Radio', () => {
    beforeEach(() => {
      props = {
        ...baseProps,
        type: FormFieldTypes.RADIO,
        id: 'radioGroup',
        options: [
          {
            id: 'opt1',
            key: 'opt1',
            text: 'Option 1',
          },
          {
            id: 'opt2',
            key: 'opt2',
            text: 'Option 2',
          },
          {
            id: 'opt3',
            key: 'opt3',
            text: 'Option 3 (text)',
            type: 'string',
            placeholder: 'Please specify.',
          }
        ]
      };
    });


    it('should render', () => {
      mount(<FormField {...props}/>);
      cy.get('#radioGroup_opt1').should('exist');
      cy.get('#radioGroup_opt2').should('exist');
      cy.get('#radioGroup_opt3').should('exist');
      cy.get('#radioGroup_opt3_text_input').should('not.exist');
    });

    it('should able to check, only one at a time', () => {
      cy.spy(props, 'onChange');
      mount(<FormField {...props}/>);

      cy.get('#radioGroup_opt1').should('not.be.checked');
      cy.get('#radioGroup_opt2').should('not.be.checked');
      cy.get('#radioGroup_opt3').should('not.be.checked');
      cy.get('#radioGroup_opt3_text_input').should('not.exist');

      cy.get('#radioGroup_opt1').click().then(() => {
        expect(props.onChange).to.be.calledWith({
          key: 'radioGroup', 
          value: {
            key: 'opt1',
            value: true,
          }, 
          isValid: true
        }); 
      });

      cy.get('#radioGroup_opt1').should('be.checked');
      cy.get('#radioGroup_opt2').should('not.be.checked');
      cy.get('#radioGroup_opt3').should('not.be.checked');
      cy.get('#radioGroup_opt3_text_input').should('not.exist');

      cy.get('#radioGroup_opt2').click().then(() => {
        expect(props.onChange).to.be.calledWith({
          key: 'radioGroup', 
          value: {
            key: 'opt2',
            value: true,
          }, 
          isValid: true
        });
      });

      cy.get('#radioGroup_opt1').should('not.be.checked');
      cy.get('#radioGroup_opt2').should('be.checked');
      cy.get('#radioGroup_opt3').should('not.be.checked');
      cy.get('#radioGroup_opt3_text_input').should('not.exist');

      cy.get('#radioGroup_opt3').click().then(() => {
        expect(props.onChange).to.be.calledWith({
          key: 'radioGroup', 
          value: {
            key: 'opt3',
            value: '',
          }, 
          isValid: true
        });
      });

      cy.get('#radioGroup_opt1').should('not.be.checked');
      cy.get('#radioGroup_opt2').should('not.be.checked');
      cy.get('#radioGroup_opt3').should('be.checked');
      cy.get('#radioGroup_opt3_text_input').should('exist');

      cy.get('#radioGroup_opt3_text_input').type('Hello!').then(() => {
        expect(props.onChange).to.be.calledWith({
          key: 'radioGroup', 
          value: {
            key: 'opt3',
            value: 'Hello!',
          }, 
          isValid: true
        });
      });
    });


  });

  describe('Form Control - MultiText', () => {

    beforeEach(() => {
      props = {
        ...baseProps,
        id: 'dataCustodianEmail',
        title: 'Data Custodian Email',
        type: FormFieldTypes.MULTITEXT,
        validators: [
          { isValid: isEmailAddress, msg: 'Enter a valid email address (example@site.com)' }
        ],
        defaultValue: []
      };
    });

    it('should render', () => {
      mount(<FormField {...props}/>);
      cy.get('.formField-dataCustodianEmail').should('have.length', 1);
      cy.get('#lbl_dataCustodianEmail').contains('Data Custodian Email');
      cy.get('#dataCustodianEmail').should('exist');
    });

    it('should add email address', () => {
      cy.spy(props, 'onChange');
      mount(<FormField {...props}/>);
      cy.get('#dataCustodianEmail').type('a@a.com');
      cy.get('#dataCustodianEmail').type('{enter}').then(() => {
        expect(props.onChange).to.be.calledWith({key: 'dataCustodianEmail', value: ['a@a.com'], isValid: true}); // code value
        cy.get('.formField-dataCustodianEmail .pill').first().contains('a@a.com'); // ui element exists
      });
    });

    it('should add multiple email addresses', () => {
      cy.spy(props, 'onChange');
      mount(<FormField {...props}/>);
      cy.get('#dataCustodianEmail')
        .type('a@a.com').type('{enter}')
        .type('b@b.com').type('{enter}')
        .type('c@c.com').type('{enter}')
        .then(() => {
          expect(props.onChange).to.be.calledWith({key: 'dataCustodianEmail', value: ['a@a.com', 'b@b.com', 'c@c.com'], isValid: true}); // code value
          cy.get('.formField-dataCustodianEmail .pill').first().contains('a@a.com');
          cy.get('.formField-dataCustodianEmail .pill').first().next().contains('b@b.com');
          cy.get('.formField-dataCustodianEmail .pill').first().next().next().contains('c@c.com');
        });
    });

    it('should not add duplicate emails', () => {
      cy.spy(props, 'onChange');
      mount(<FormField {...props}/>);
      cy.get('#dataCustodianEmail')
        .type('a@a.com').type('{enter}')
        .type('a@a.com').type('{enter}')
        .then(() => {
          expect(props.onChange).to.be.callCount(1); // only calls onChange once
          cy.get('#dataCustodianEmail').should('have.value', ''); // clear input on duplicate text
          cy.get('.formField-dataCustodianEmail .pill').should('have.length', 1); // only have one pill
        });
    });

    it('should not add invalid emails', () => {
      cy.spy(props, 'onChange');
      mount(<FormField {...props}/>);
      cy.get('#dataCustodianEmail')
        .type('not an email haha').type('{enter}')
        .then(() => {
          expect(props.onChange).to.be.callCount(0);
          cy.get('#dataCustodianEmail').should('have.value', 'not an email haha');
          cy.get('#dataCustodianEmail').should('have.class', 'errored');
        });
    });

    it('should remove single on click', () => {
      cy.spy(props, 'onChange');
      mount(<FormField {...props}/>);
      cy.get('#dataCustodianEmail').type('a@a.com').type('{enter}');
      cy.get('.formField-dataCustodianEmail .pill').first().should('exist');
      cy.get('.formField-dataCustodianEmail .pill').first().click().then(() => {
        expect(props.onChange).to.be.calledWith({key: 'dataCustodianEmail', value: [], isValid: true}); // code value
        cy.get('.formField-dataCustodianEmail .pill').should('not.exist');
      });
    });

    it('should remove [x, 1, 2] from array on click', () => {
      cy.spy(props, 'onChange');
      mount(<FormField {...props}/>);
      cy.get('#dataCustodianEmail')
        .type('a@a.com').type('{enter}')
        .type('b@b.com').type('{enter}')
        .type('c@c.com').type('{enter}');
      cy.get('.formField-dataCustodianEmail .pill').eq(0).click().then(() => {
        expect(props.onChange).to.be.calledWith({key: 'dataCustodianEmail', value: ['b@b.com', 'c@c.com'], isValid: true}); // code value
        cy.get('.formField-dataCustodianEmail .pill').first().contains('b@b.com');
        cy.get('.formField-dataCustodianEmail .pill').first().next().contains('c@c.com');
      });
    });

    it('should remove [0, x, 2] from array on click', () => {
      cy.spy(props, 'onChange');
      mount(<FormField {...props}/>);
      cy.get('#dataCustodianEmail')
        .type('a@a.com').type('{enter}')
        .type('b@b.com').type('{enter}')
        .type('c@c.com').type('{enter}');
      cy.get('.formField-dataCustodianEmail .pill').eq(1).click().then(() => {
        expect(props.onChange).to.be.calledWith({key: 'dataCustodianEmail', value: ['a@a.com', 'c@c.com'], isValid: true}); // code value
        cy.get('.formField-dataCustodianEmail .pill').first().contains('a@a.com');
        cy.get('.formField-dataCustodianEmail .pill').first().next().contains('c@c.com');
      });
    });

    it('should remove [0, 1, x] from array on click', () => {
      cy.spy(props, 'onChange');
      mount(<FormField {...props}/>);
      cy.get('#dataCustodianEmail')
        .type('a@a.com').type('{enter}')
        .type('b@b.com').type('{enter}')
        .type('c@c.com').type('{enter}');
      cy.get('.formField-dataCustodianEmail .pill').eq(2).then(() => {
        expect(props.onChange).to.be.calledWith({key: 'dataCustodianEmail', value: ['a@a.com', 'b@b.com'], isValid: true}); // code value
        cy.get('.formField-dataCustodianEmail .pill').first().contains('a@a.com');
        cy.get('.formField-dataCustodianEmail .pill').first().next().contains('b@b.com');
      });
    });
  });

  describe('Form Control - Slider Tests', () => {
    beforeEach(() => {
      props = {
        ...baseProps,
        id: 'publicVisibility',
        title: 'Public Visibility',
        validators: [FormValidators.REQUIRED],
        type: FormFieldTypes.SLIDER,
        defaultValue: true,
        description: `Please select if you would like your dataset
          to be publicly visible for the requesters to see and select
          for an access request`,
        toggleText: 'Visible'
      };
    });

    it('should render', () => {
      mount(<FormField {...props}/>);
      cy.get('.formField-publicVisibility').should('have.length', 1);
    });

    it('should run onChange event when user toggles the slider false', () => {
      cy.spy(props, 'onChange');
      mount(<FormField {...props}/>);
      const selector = '#publicVisibility';
      cy.get(selector).should('be.checked');
      cy.get(selector)
        .click()
        .then(() => {
          cy.get(selector).should('not.be.checked'); // visual
          expect(props.onChange).to.be.calledWith({key: 'publicVisibility', value: false, isValid: true}); // code value
        });
    });

    it('should run onChange event when user toggles the slider true', () => {
      cy.spy(props, 'onChange');
      mount(<FormField {...props}/>);
      const selector = '#publicVisibility';
      cy.get(selector).should('be.checked');
      cy.get(selector)
        .click()
        .click()
        .then(() => {
          cy.get(selector).should('be.checked'); // visual
          expect(props.onChange).to.be.calledWith({key: 'publicVisibility', value: true, isValid: true}); // code value
        });
    });
  });

  describe('Form Control - Select Tests', () => {

    beforeEach(() => {
      props = {
        ...baseProps,
        id: 'studyType',
        title: 'Study Type',
        type: FormFieldTypes.SELECT,
        selectOptions: [
          'Observational', 'Interventional', 'Descriptive',
          'Analytical', 'Prospective', 'Retrospective',
          'Case report', 'Case series', 'Cross-sectional',
          'Cohort study'
        ]
      };
    });

    it('should render', () => {
      mount(<FormField {...props}/>);
      cy.get('.formField-studyType').should('have.length', 1);
      cy.get('.formField-studyType label').contains('Study Type');
      cy.get('#studyType').should('exist');
    });

    it('should open the options on click', () => {
      mount(<FormField {...props}/>);
      cy.get('#studyType .dropdown-toggle').click();
      cy.get('#studyType .select-dropdown-menu').should('exist');
      cy.get('#studyType .select-dropdown-item').should('have.length', 10);
      cy.get('#studyType .select-dropdown-item').eq(0).contains('Observational');
    });

    it('should filter as the user types', () => {
      mount(<FormField {...props}/>);
      cy.get('#studyType .dropdown-toggle').click();
      cy.get('#studyType .search-bar').type('d').then(() => {
        cy.get('#studyType .select-dropdown-item').should('have.length', 2);
        cy.get('#studyType .select-dropdown-item').eq(0).contains('Descriptive');
        cy.get('#studyType .select-dropdown-item').eq(1).contains('Cohort study');
      });
    });

    it('should allow user to select by clicking dropdown element', () => {
      cy.spy(props, 'onChange');
      mount(<FormField {...props}/>);
      cy.get('#studyType .dropdown-toggle').click();
      cy.get('#studyType .search-bar').type('d').then(() => {
        cy.get('#studyType .select-dropdown-item').first().click().then(() => {
          expect(props.onChange).to.be.calledWith({key: 'studyType', value: 'Descriptive', isValid: true}); // code value
          cy.get('#studyType .dropdown-toggle').contains('Descriptive'); // ui updates with new val
        });
      });
    });

    it('should allow user to select by entering a new option as freetext if prop passed in', () => {
      cy.spy(props, 'onChange');
      mount(<FormField {...{...props, ...{'allowManualEntry': true}}} />);
      cy.get('#studyType .dropdown-toggle').click();
      cy.get('#studyType .search-bar').type('newtext').then(() => {
        cy.get('#studyType .search-bar').blur().then(() => {
          expect(props.onChange).to.be.calledWith({key: 'studyType', value: 'newtext', isValid: true}); // code value
          cy.get('#studyType .dropdown-toggle').contains('newtext'); // ui updates with new val
        });
      });
    });

    it('should not allow user to select by entering a new option as freetext by default', () => {
      cy.spy(props, 'onChange');
      mount(<FormField {...props}/>);
      cy.get('#studyType .dropdown-toggle').click();
      cy.get('#studyType .search-bar').type('newtext').then(() => {
        cy.get('#studyType .search-bar').blur().then(() => {
          expect(props.onChange).to.not.be.called;
        });
      });
    });
  });

  describe('Form Table - Tests', () => {
    beforeEach(() => {
      props = {
        ...baseProps,
        id: 'fileTypes',
        formFields: [
          {
            id: 'fileType',
            title: 'File Type',
            type: FormFieldTypes.SELECT,
            selectOptions: ['Arrays', 'Genome', 'Exome', 'Survey', 'Phenotype']
          }, {
            id: 'functionalEquivalence',
            title: 'Functional Equivalence',
            placeholder: 'Type'
          }, {
            id: 'numberOfParticipants',
            title: '# of Participants',
            placeholder: 'Number',
            type: FormFieldTypes.NUMBER
          }
        ],
        defaultValue: [{}],
        enableAddingRow: true,
        addRowLabel: 'Add New Filetype'
      };
    });

    it('should render', () => {
      mount(<FormTable {...props}/>);
      cy.get('.formField-fileTypes').should('have.length', 1);
      cy.get('.formField-fileTypes .control-label').eq(0).contains('File Type');
      cy.get('.formField-fileTypes .control-label').eq(1).contains('Functional Equivalence');
      cy.get('.formField-fileTypes .control-label').eq(2).contains('# of Participants');
    });

    it('should update a row field', () => {
      cy.spy(props, 'onChange');
      mount(<FormTable {...props}/>);
      cy.get('#fileTypes-0-functionalEquivalence').type('hello').then(() => {
        cy.get('#fileTypes-0-functionalEquivalence').should('have.value', 'hello');
        expect(props.onChange).to.be.calledWith({key: 'fileTypes.0.functionalEquivalence', value: 'hello', isValid: true}); // code value
      });
    });

    it('should add a new row', () => {
      cy.spy(props, 'onChange');
      mount(<FormTable {...props}/>);
      cy.get('.control-label').should('have.length', 3);
      cy.get('#add-new-table-row-fileTypes')
        .click()
        .then(() => {
          expect(props.onChange).to.be.calledWith({ key: 'fileTypes.1', value: {} }); // code value
          cy.get('.formTable-row').should('have.length', 3);
          cy.get('.control-label').should('have.length', 3); // still only 3 column headers
        });
    });

    it('should be able to update the follow up rows', () => {
      cy.spy(props, 'onChange');
      mount(<FormTable {...props}/>);
      cy.get('#add-new-table-row-fileTypes').click();
      cy.get('#fileTypes-1-functionalEquivalence').type('jello').then(() => {
        cy.get('#fileTypes-1-functionalEquivalence').should('have.value', 'jello');
        expect(props.onChange).to.be.calledWith({key: 'fileTypes.1.functionalEquivalence', value: 'jello', isValid: true }); // code value
      });
    });

    it('should be able to delete rows', () => {
      cy.spy(props, 'onChange');
      mount(<FormTable {...props}/>);
      cy.get('#delete-table-row-fileTypes-0').click().then(() => {
        expect(props.onChange).to.be.calledWith({key: 'fileTypes', value: [], isValid: true}); // code value
        cy.get('.formTable-row.formTable-data-row').should('have.length', 0); // only columns left
      });
    });

    it('should not allow you to delete if minLength rows has been declared', () => {
      cy.spy(props, 'onChange');
      props.minLength = 1;
      props.defaultValue = [{}, {}];
      mount(<FormTable {...props}/>);
      cy.get('#delete-table-row-fileTypes-0').click().then(() => {
        expect(props.onChange).to.be.calledWith({key: 'fileTypes', value: [{}], isValid: true}); // code value
        cy.get('.formTable-row.formTable-data-row').should('have.length', 1); // only columns left
        cy.get('#delete-table-row-fileTypes-0').should('be.disabled');
      });
    });

  });
});
