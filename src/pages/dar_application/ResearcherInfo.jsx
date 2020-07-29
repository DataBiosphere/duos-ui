import React, {useState} from 'react';
import {Alert} from '../../components/Alert';
import {Link} from 'react-router-dom';
import { a, div, fieldset, h3, input, label, span } from 'react-hyperscript-helpers';
import { eRACommons } from '../components/eRAcommons';

const profileLink = <Link to={'/profile'} className={'hover-color'}>Your Profile</Link>;

const profileUnsubmitted = () => {
  return <span>Please submit {profileLink} to be able to create a Data Access Request</span>;
};

const profileSubmitted = () => {
  return <span>Please make sure {profileLink} is updated to be able to create a Data Access Request</span>;
};

export default function ResearcherInfo(props) {
  //NOTE: showValidationMessages is updated on the parent function within the verify steps
  //assumption is to keep those methods and value updates there and simply pass the value in as a prop
  // const [showValidationMessages, setShowValidationMessages] = useState(false);
  //NOTE: seems like we'll be passing in a lot of prop data to this individual component
  //raises question on whether or not it can be broken down further or if the prop data
  const [checkCollaborator, setCheckCollaborator] = useState(props.collaborator);
  const [linkedIn, setLinkedIn] = useState(props.linkedIn);
  const [orcid, setOrcid] = useState(props.orcid);
  const [researcherGate, setResearcherGate] = useState(props.researcherGate);

  //helper function to coordinate local state changes as well as updates to form data on the parent
  const formStateChange = (stateVar, stateVarSetter, attr, event) => {
    const name = event.current.name;
    const value = event.current[attr];
    //NOTE: come up with a better name for this function, sounds too similar to formStateChange
    props.formFieldChange(name, value);
    stateVarSetter(value);
  };
  /*
    props:
      checkCollaborator: checkCollaborator,
      completed: this.state.completed,
      darCode: this.state.formData.dar_code,
      eRACommonsDestination: eRACommonsDestination,
      formFieldChange: this.formFieldChange,
      invalidInvestigator: step1.inputInvestigator.invalid,
      invalidResearcher: step1.inputResearcher.invalid,
      investigator: investigator,
      linkedIn: linkedIn,
      location: this.props.location,
      nihValid: this.state.nihValid,
      onNihStatusUpdate: this.onNihStatusUpdate,
      orcid: orcid,
      partialSave: this.partialSave,
      researcher: this.state.formData.researcher,
      researcherGate: researcherGate,
      showValidationMessages: showValidationMessages,
      step2: this.step2


    const (template, functions, etc.)
      formStateChange()
      profileUnsubmitted,
      profileSubmitted
      eRACommonsDestination -> value is a string determined by empty/non-empty status of dataRequestId

    state
      NOTE: for the four values below props have to be passed in to set preset values from existing records (partial or otherwise)
      linkedIn
      orcid
      researcherGate
      checkCollaborator

      Other notes
        - the ajax library needs to go. The constants defined there are services and should be declared as such within their own files
        - the ajax library is importing all of jQuery just to execute async functions. We need to replace it with axios (slow conversion)
        - based on the original code it seems nihValid is updated and read for rendering purposes on step 1 while the parent uses the value for data processing
          -- might be a better idea to update the value on the parent and simply pass the value down to step 1 as a prop
          -- can't use the formUpdate method because it's not a shallow key, it's nested deeper within step1
  */

  return (
    div({ className: 'col-lg-10 col-lg-offset-1 col-md-12 col-sm-12 col-xs-12' }, [
      fieldset({ disabled: props.darCode !== null }, [

        div({ isRendered: props.completed === false, className: 'rp-alert' }, [
          Alert({ id: 'profileUnsubmitted', type: 'danger', title: profileUnsubmitted })
        ]),
        div({ isRendered: props.completed === true, className: 'rp-alert' }, [
          Alert({ id: 'profileSubmitted', type: 'info', title: profileSubmitted })
        ]),

        h3({ className: 'rp-form-title access-color' }, ['1. Researcher Information']),

        div({ className: 'form-group' }, [
          div({ className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group' }, [
            label({ className: 'control-label rp-title-question' }, ['1.1 Researcher*'])
          ]),

          div({ className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group' }, [
            input({
              type: 'text',
              name: 'researcher',
              id: 'inputResearcher',
              value: props.researcher,
              disabled: true,
              className: props.researcherInvalid && props.showValidationMessages ? 'form-control required-field-error' : 'form-control',
              required: true
            }),
            span({
              isRendered: (props.researcherInvalid) && (props.showValidationMessages), className: 'cancel-color required-field-error-span'
            }, ['Required field'])
          ]),

          div({ className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group checkbox' }, [
            input({
              type: 'checkbox',
              id: 'chk_collaborator',
              name: 'checkCollaborator',
              className: 'checkbox-inline rp-checkbox',
              disabled: checkCollaborator !== null,
              checked: checkCollaborator,
              onChange: formStateChange(checkCollaborator, setCheckCollaborator, 'checked')
            }),
            label({ className: 'regular-checkbox rp-choice-questions', htmlFor: 'chk_collaborator' },
              ['I am an NIH Intramural researcher (NIH email required), or internal collaborator of the PI for the selected dataset(s)'])
          ]),

          div({ className: 'col-lg-12 col-md-12 col-sm-6 col-xs-12' }, [
            label({ className: 'control-label rp-title-question' }, [
              '1.2 Researcher Identification',
              div({ isRendered: checkCollaborator !== true, className: 'display-inline' }, ['*']),
              div({ isRendered: checkCollaborator === true, className: 'display-inline italic' }, [' (optional)']),
              span({ className: 'default-color' },
                ['Please autenticate with ',
                  a({ target: '_blank', href: 'https://era.nih.gov/reg-accounts/register-commons.htm' }, ['eRA Commons']), ' in order to proceed. Your ORCID iD is optional.'
                ])
            ])
          ]),

          span({
            isRendered: (props.showValidationMessages && !props.nihValid), className: 'col-lg-12 col-md-12 col-sm-6 col-xs-12 cancel-color required-field-error-span'
          }, ['NIH eRA Authentication is required']),

          div({ className: 'row no-margin' }, [
            eRACommons({
              className: 'col-lg-6 col-md-6 col-sm-6 col-xs-12 rp-group',
              destination: props.eRACommonsDestination,
              onNihStatusUpdate: props.onNihStatusUpdate,
              location: props.location,
              validationError: props.showValidationMessages
            }),
            div({ className: 'col-lg-6 col-md-6 col-sm-6 col-xs-12 rp-group' }, [
              label({ className: 'control-label' }, ['LinkedIn Profile']),
              input({
                type: 'text',
                name: 'linkedIn',
                id: 'inputLinkedIn',
                value: linkedIn,
                onChange: this.formStateChange(linkedIn, setLinkedIn, 'value'),
                disabled: false,
                className: 'form-control',
                required: true
              })
            ])
          ]),

          div({ className: 'row no-margin' }, [
            div({ className: 'col-lg-6 col-md-6 col-sm-6 col-xs-12' }, [
              label({ className: 'control-label' }, ['ORCID iD']),
              input({
                type: 'text',
                name: 'orcid',
                id: 'inputOrcid',
                value: orcid,
                onChange: formStateChange(orcid, setOrcid, 'value'),
                disabled: false,
                className: 'form-control',
                required: true
              })
            ]),

            div({ className: 'col-lg-6 col-md-6 col-sm-6 col-xs-12' }, [
              label({ className: 'control-label' }, ['ResearchGate ID']),
              input({
                type: 'text',
                name: 'researcherGate',
                id: 'inputResearcherGate',
                value: researcherGate,
                onChange: formStateChange(researcherGate, setResearcherGate, 'value'),
                disabled: false,
                className: 'form-control',
                required: true
              })
            ])
          ])
        ]),

        div({ className: 'form-group' }, [
          div({ className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group' }, [
            label({ className: 'control-label rp-title-question' }, [
              '1.3 Principal Investigator* ',
              span({}, ['By typing in the name of the principal investigator, I certify that he or she is aware of this research study.'])
            ])
          ]),
          div({ className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group' }, [
            input({
              type: 'text',
              name: 'investigator',
              id: 'inputInvestigator',
              value: props.investigator,
              disabled: true,
              className: props.invalidInvestigator && props.showValidationMessages ? 'form-control required-field-error' : 'form-control',
              required: true
            }),
            span({
              className: 'cancel-color required-field-error-span', isRendered: (props.invalidInvestigator) && (props.showValidationMessages)
            }, ['Required field'])
          ])
        ])
      ]),

      div({ className: 'row no-margin' }, [
        div({ className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12' }, [
          a({ id: 'btn_next', onClick: props.step2, className: 'btn-primary f-right access-background' }, [
            'Next Step', span({ className: 'glyphicon glyphicon-chevron-right', 'aria-hidden': 'true' })
          ]),

          a({
            id: 'btn_save', isRendered: props.darCode === null, onClick: props.partialSave,
            className: 'btn-secondary f-right access-color'
          }, ['Save'])
        ])
      ])
    ])
  );
}