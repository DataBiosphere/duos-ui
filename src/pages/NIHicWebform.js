import {Component} from 'react';
import {RadioButton} from '../components/RadioButton';
import {a, div, fieldset, form, h, h3, hr, input, label, span, textarea} from 'react-hyperscript-helpers';
import Select from 'react-select';
import {Notification} from '../components/Notification';
import {PageHeading} from '../components/PageHeading';
import {DAR} from '../libs/ajax';
import {searchOntology} from '../libs/ontologyService';
import * as fp from 'lodash/fp';
import AsyncSelect from 'react-select/async';

class NIHICWebform extends Component {

  constructor(props) {
    super(props);

  };

  searchOntologies = (query, callback) => {
    let options = [];
    DAR.getAutoCompleteOT(query).then(
      items => {
        options = items.map(function(item) {
          return {
            key: item.id,
            value: item.id,
            label: item.label,
            item: item,
          };
        });
        callback(options);
      });
  };

  render() {

    const controlLabelStyle = {
      fontWeight: 500,
      marginBottom: 0
    };

    return (

      div({ className: 'container' }, [
        div({ className: 'col-lg-10 col-lg-offset-1 col-md-12 col-sm-12 col-xs-12' }, [
          div({ className: 'row no-margin' }, [
            div({
              className: ( 'col-lg-12 col-md-12 col-sm-12 ' )
            }, [
              PageHeading({
                id: 'requestApplication', color: 'common',
                title: 'Extramural Genomic Data Sharing Plan & Institutional Certification',
                description: 'This integrated GDSP & IC form combines duplicate fields, allows for digital tracking and statistics, and assigns machine-readable GA4GH Data Use Ontology terms to the datasets upon completion!'
              })
            ])
          ]),
          hr({ className: 'section-separator' }),
        ]),

        form({ name: 'form', 'noValidate': true }, [
          div({ id: 'form-views' }, [
            div({}, [
              div({ className: 'col-lg-10 col-lg-offset-1 col-md-12 col-sm-12 col-xs-12' }, [
                fieldset({}, [
                  h3({ className: 'rp-form-title common-color' }, ['Administrative Information']),

                  div({className: 'form-group'}, [
                    div(
                      {className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group'},
                      [
                        label({className: 'control-label rp-title-question common-color'}, [
                          'Principal Investigator Name* ',
                        ]),
                      ]),
                    div(
                      {className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group rp-last-group'},
                      [
                        input({
                          type: 'text',
                          name: 'piName',
                          id: 'piName',
                          maxLength: '256',
                          className: 'form-control',
                          required: true,
                        })
                      ])
                  ]),


                  div({className: 'form-group'}, [
                    div(
                      {className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group'},
                      [
                        label({className: 'control-label rp-title-question common-color'}, [
                          'Principal Investigator Title* ',
                        ]),
                      ]),
                    div(
                      {className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group rp-last-group'},
                      [
                        input({
                          type: 'text',
                          name: 'piTitle',
                          id: 'piTitle',
                          maxLength: '256',
                          className: 'form-control',
                          required: true,
                        })
                      ])
                  ]),

                  div({className: 'form-group'}, [
                    div(
                      {className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group'},
                      [
                        label({className: 'control-label rp-title-question common-color'}, [
                          'Principal Investigator Email* ',
                        ]),
                      ]),
                    div(
                      {className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group rp-last-group'},
                      [
                        input({
                          type: 'url',
                          name: 'piEmail',
                          id: 'piEmail',
                          maxLength: '256',
                          placeholder: 'email@domain.org',
                          className: 'form-control',
                          required: true,
                        })
                      ])
                  ]),

                  div({className: 'form-group'}, [
                    div(
                      {className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group'},
                      [
                        label({className: 'control-label rp-title-question common-color'}, [
                          'Principal Investigator Institution* ',
                        ]),
                      ]),
                    div(
                      {className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group rp-last-group'},
                      [
                        input({
                          type: 'text',
                          name: 'piInstitute',
                          id: 'piInstitute',
                          maxLength: '256',
                          className: 'form-control',
                          required: true,
                        })
                      ])
                  ]),

                  div({className: 'form-group'}, [
                    div(
                      {className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group'},
                      [
                        label({className: 'control-label rp-title-question common-color'}, [
                          'Assistant/Submitter Name (if applicable)',
                        ]),
                      ]),
                    div(
                      {className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group rp-last-group'},
                      [
                        input({
                          type: 'text',
                          name: 'assistantName',
                          id: 'assistantName',
                          maxLength: '256',
                          className: 'form-control',
                          required: true,
                        })
                      ])
                  ]),

                  div({className: 'form-group'}, [
                    div(
                      {className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group'},
                      [
                        label({className: 'control-label rp-title-question common-color'}, [
                          'Assistant Submitter Email',
                        ]),
                      ]),
                    div(
                      {className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group rp-last-group'},
                      [
                        input({
                          type: 'text',
                          name: 'assistantEmail',
                          id: 'assistantEmail',
                          maxLength: '256',
                          className: 'form-control',
                          required: true,
                        })
                      ])
                  ]),

                  div({className: 'form-group'}, [
                    div(
                      {className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group'},
                      [
                        label({className: 'control-label rp-title-question common-color'}, [
                          'Do you have an eRA Commons Account?',
                        ]),
                      ]),
                    div({ className: 'row no-margin' }, [
                      div({ className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 dataset-group' }, [

                        RadioButton({
                          style: {
                            margin: '2rem',
                            color: ' #010101',
                          },
                          id: 'eraAuthorizedYes',
                          name: 'eraAuthorizedYes',
                          defaultChecked: true,
                          label: 'Yes',
                          disabled: false,
                        }),

                        RadioButton({
                          style: {
                            marginBottom: '2rem',
                            marginLeft: '2rem',
                            color: ' #010101',
                          },
                          id: 'eraAuthorizedNo',
                          name: 'eraAuthorizedNo',
                          defaultChecked: false,
                          label: 'No',
                          disabled: false,
                        }),
                      ]),
                    ]),
                  ]),

                  div({className: 'form-group'}, [
                    div(
                      {className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group'},
                      [
                        label({className: 'control-label rp-title-question common-color'}, [
                          'NIH Grant or Contract Number ',
                        ]),
                      ]),
                    div(
                      {className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group rp-last-group'},
                      [
                        input({
                          type: 'text',
                          name: 'NIHnumber',
                          id: 'inputNIHnumber',
                          maxLength: '256',
                          className: 'form-control',
                          required: true,
                        }),
                      ])
                  ]),

                  div({className: 'form-group'}, [
                    div(
                      {className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group'},
                      [
                        label({className: 'control-label rp-title-question common-color'}, [
                          'NIH Institutes/Centers supporting the study',
                        ]),
                      ]),
                    div(
                      {className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group'},
                      [
                        div({className: 'checkbox'}, [
                          input({
                            id: 'check1',
                            type: 'checkbox',
                            className: 'checkbox-inline rp-checkbox',
                            name: 'methods',
                          }),
                          label({
                            className: 'regular-checkbox rp-choice-questions',
                            htmlFor: 'checkMethods',
                          }, [
                            span({},
                              ['NHGRI']),
                            '',
                          ]),
                        ]),
                      ]),
                    div(
                      {className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group'},
                      [
                        div({className: 'checkbox'}, [
                          input({
                            id: 'checkMethods',
                            type: 'checkbox',
                            className: 'checkbox-inline rp-checkbox',
                            name: 'methods',
                          }),
                          label({
                            className: 'regular-checkbox rp-choice-questions',
                            htmlFor: 'checkMethods',
                          }, [
                            span({},
                              ['NCI']),
                            '',
                          ]),
                        ]),
                      ]),
                    div(
                      {className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group'},
                      [
                        div({className: 'checkbox'}, [
                          input({
                            id: 'checkMethods',
                            type: 'checkbox',
                            className: 'checkbox-inline rp-checkbox',
                            name: 'methods',
                          }),
                          label({
                            className: 'regular-checkbox rp-choice-questions',
                            htmlFor: 'checkMethods',
                          }, [
                            span({},
                              ['NHLBI']),
                            '',
                          ]),
                        ]),
                      ]),
                    div(
                      {className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group'},
                      [
                        div({className: 'checkbox'}, [
                          input({
                            id: 'checkMethods',
                            type: 'checkbox',
                            className: 'checkbox-inline rp-checkbox',
                            name: 'methods',
                          }),
                          label({
                            className: 'regular-checkbox rp-choice-questions',
                            htmlFor: 'checkMethods',
                          }, [
                            span({},
                              ['NIMH']),
                            '',
                          ]),
                        ]),
                      ]),
                    div(
                      {className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group'},
                      [
                        div({className: 'checkbox'}, [
                          input({
                            id: 'checkMethods',
                            type: 'checkbox',
                            className: 'checkbox-inline rp-checkbox',
                            name: 'methods',
                          }),
                          label({
                            className: 'regular-checkbox rp-choice-questions',
                            htmlFor: 'checkMethods',
                          }, [
                            span({},
                              ['NIDCR']),
                            '',
                          ]),
                        ]),
                      ]),
                    div(
                      {className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group'},
                      [
                        div({className: 'checkbox'}, [
                          input({
                            id: 'checkMethods',
                            type: 'checkbox',
                            className: 'checkbox-inline rp-checkbox',
                            name: 'methods',
                          }),
                          label({
                            className: 'regular-checkbox rp-choice-questions',
                            htmlFor: 'checkMethods',
                          }, [
                            span({},
                              ['NIAID']),
                            '',
                          ]),
                        ]),
                      ]),
                    div(
                      {className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group'},
                      [
                        div({className: 'checkbox'}, [
                          input({
                            id: 'checkMethods',
                            type: 'checkbox',
                            className: 'checkbox-inline rp-checkbox',
                            name: 'methods',
                          }),
                          label({
                            className: 'regular-checkbox rp-choice-questions',
                            htmlFor: 'checkMethods',
                          }, [
                            span({},
                              ['NINDS']),
                            '',
                          ]),
                        ]),
                      ]),
                    div(
                      {className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group'},
                      [
                        div({className: 'checkbox'}, [
                          input({
                            id: 'checkMethods',
                            type: 'checkbox',
                            className: 'checkbox-inline rp-checkbox',
                            name: 'methods',
                          }),
                          label({
                            className: 'regular-checkbox rp-choice-questions',
                            htmlFor: 'checkMethods',
                          }, [
                            span({},
                              ['NCATS']),
                            '',
                          ]),
                        ]),
                      ]),
                    div(
                      {className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group'},
                      [
                        div({className: 'checkbox'}, [
                          input({
                            id: 'checkMethods',
                            type: 'checkbox',
                            className: 'checkbox-inline rp-checkbox',
                            name: 'methods',
                          }),
                          label({
                            className: 'regular-checkbox rp-choice-questions',
                            htmlFor: 'checkMethods',
                          }, [
                            span({},
                              ['NIA']),
                            '',
                          ]),
                        ]),
                      ]),
                    div(
                      {className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group'},
                      [
                        div({className: 'checkbox'}, [
                          input({
                            id: 'checkMethods',
                            type: 'checkbox',
                            className: 'checkbox-inline rp-checkbox',
                            name: 'methods',
                          }),
                          label({
                            className: 'regular-checkbox rp-choice-questions',
                            htmlFor: 'checkMethods',
                          }, [
                            span({},
                              ['NIDDK']),
                            '',
                          ]),
                        ]),
                      ]),
                    div(
                      {className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group'},
                      [
                        div({className: 'checkbox'}, [
                          input({
                            id: 'checkMethods',
                            type: 'checkbox',
                            className: 'checkbox-inline rp-checkbox',
                            name: 'methods',
                          }),
                          label({
                            className: 'regular-checkbox rp-choice-questions',
                            htmlFor: 'checkMethods',
                          }, [
                            span({},
                              ['NEI']),
                            '',
                          ]),
                        ]),
                      ]),
                    div(
                      {className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group'},
                      [
                        div({className: 'checkbox'}, [
                          input({
                            id: 'checkMethods',
                            type: 'checkbox',
                            className: 'checkbox-inline rp-checkbox',
                            name: 'methods',
                          }),
                          label({
                            className: 'regular-checkbox rp-choice-questions',
                            htmlFor: 'checkMethods',
                          }, [
                            span({},
                              ['NIDA']),
                            '',
                          ]),
                        ]),
                      ]),
                  ]),

                  div({className: 'form-group'}, [
                    div(
                      {className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group'},
                      [
                        label({className: 'control-label rp-title-question common-color'}, [
                          'NIH Program Officer Name',
                        ]),
                      ]),
                    div(
                      {className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group'},
                      [
                        h(Select, {
                          name: 'nihProgramOfficer',
                          id: 'nihProgramOfficer',
                          blurInputOnSelect: true,
                          openMenuOnFocus: true,
                          isDisabled: false,
                          isClearable: true,
                          isMulti: false,
                          isSearchable: true,
                          options: [],
                          placeholder: 'Select a Program Officer...',
                          className: '',
                          required: true,
                        }),
                      ])
                  ]),


                  div({className: 'form-group'}, [
                    div(
                      {className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group'},
                      [
                        label({className: 'control-label rp-title-question common-color'}, [
                          'NIH Institute/Center for Submission',
                        ]),
                      ]),
                    div(
                      {className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group'},
                      [
                        h(Select, {
                          name: 'nihCenterSubmission',
                          id: 'nihCenterSubmission',
                          blurInputOnSelect: true,
                          openMenuOnFocus: true,
                          isDisabled: false,
                          isClearable: true,
                          isMulti: false,
                          isSearchable: true,
                          options: [],
                          placeholder: 'Select an NIH IC...',
                          className: '',
                          required: true,
                        })
                      ])
                  ]),

                  div({className: 'form-group'}, [
                    div(
                      {className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group'},
                      [
                        label({className: 'control-label rp-title-question common-color'}, [
                          'NIH Genomic Program Administrator Name',
                        ]),
                      ]),
                    div(
                      {className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group'},
                      [
                        h(Select, {
                          name: 'nihProgramAdmin',
                          id: 'nihProgramAdmin',
                          blurInputOnSelect: true,
                          openMenuOnFocus: true,
                          isDisabled: false,
                          isClearable: true,
                          isMulti: false,
                          isSearchable: true,
                          options: [],
                          placeholder: 'Select a Genomic Program Administrator...',
                          className: '',
                          required: true,
                        })
                      ])
                  ]),

                ]),


                h3({ className: 'rp-form-title common-color' }, ['Study/Dataset Information']),

                div({className: 'form-group'}, [
                  div(
                    {className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group'},
                    [
                      label({className: 'control-label rp-title-question common-color'}, [
                        'Original Study Name',
                      ]),
                    ]),
                  div(
                    {className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group rp-last-group'},
                    [
                      input({
                        type: 'text',
                        name: 'originalName',
                        id: 'originalName',
                        maxLength: '256',
                        className: 'form-control',
                        required: true,
                      })
                    ])
                ]),

                div({className: 'form-group'}, [
                  div(
                    {className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group'},
                    [
                      label({className: 'control-label rp-title-question common-color'}, [
                        'Study Type',
                      ]),
                    ]),
                  div(
                    {className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group'},
                    [
                      h(Select, {
                        name: 'studyType',
                        id: 'studyType',
                        blurInputOnSelect: true,
                        openMenuOnFocus: true,
                        isDisabled: false,
                        isClearable: true,
                        isMulti: false,
                        isSearchable: true,
                        options: [],
                        placeholder: 'Select a study type...',
                        className: '',
                        required: true,
                      })
                    ])
                ]),

                div({className: 'form-group'}, [
                  div(
                    {className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group'},
                    [
                      label({className: 'control-label rp-title-question common-color'}, [
                        'Project title for data to be submitted',
                      ]),
                    ]),
                  div(
                    {className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group rp-last-group'},
                    [
                      input({
                        type: 'text',
                        name: 'projectTitle',
                        id: 'projectTitle',
                        maxLength: '256',
                        className: 'form-control',
                        required: true,
                      })
                    ])
                ]),

                div({className: 'form-group'}, [
                  div(
                    {className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group'},
                    [
                      label({className: 'control-label rp-title-question common-color'}, [
                        'Is this a multi-center study?',
                      ]),
                    ]),
                  div({ className: 'row no-margin' }, [
                    div({ className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 dataset-group' }, [

                      RadioButton({
                        style: {
                          margin: '2rem',
                          color: ' #010101',
                        },
                        id: 'multicenter',
                        name: 'multicenterdescription',
                        label: 'Yes',
                        disabled: false,
                      }),

                      RadioButton({
                        style: {
                          marginBottom: '2rem',
                          marginLeft: '2rem',
                          color: ' #010101',
                        },
                        id: 'checkPublicAccess_no',
                        name: 'checkPublicAccess',
                        label: 'No',
                        disabled: false,
                      }),
                    ]),
                  ]),
                ]),

                div({className: 'form-group'}, [
                  div(
                    {className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group'},
                    [
                      label({className: 'control-label rp-title-question common-color'}, [
                        'List Collaborating Sites (please enter a comma or tab delimited list)',
                      ]),
                    ]),
                  div(
                    {className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group rp-last-group'},
                    [
                      input({
                        type: 'text',
                        name: 'collaboratingsites',
                        id: 'inputcollaboratingsites',
                        maxLength: '256',
                        required: true,
                        className: 'form-control'
                      }),
                    ])
                ]),

                div({className: 'form-group'}, [
                  div(
                    {className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group'},
                    [
                      label({className: 'control-label rp-title-question common-color'}, [
                        'The individual level data are to be made available through:',
                      ]),
                    ]),
                  div({ className: 'row no-margin' }, [
                    div({ className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 dataset-group' }, [

                      RadioButton({
                        style: {
                          margin: '2rem',
                          color: ' #010101',
                        },
                        id: 'checkPublicAccess_yes',
                        name: 'checkPublicAccess',
                        label: 'Yes',
                        disabled: false,
                      }),

                      RadioButton({
                        style: {
                          marginBottom: '2rem',
                          marginLeft: '2rem',
                          color: ' #010101',
                        },
                        id: 'checkPublicAccess_no',
                        name: 'checkPublicAccess',
                        label: 'No',
                        disabled: false,
                      }),
                    ]),
                  ]),
                ]),

                div({className: 'form-group'}, [
                  div(
                    {className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group'},
                    [
                      label({className: 'control-label rp-title-question common-color'}, [
                        'The genomic summary results (GSR) from this study are only to be made available through controlled-access',
                      ]),
                    ]),
                  div({ className: 'row no-margin' }, [
                    div({ className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 dataset-group' }, [

                      RadioButton({
                        style: {
                          margin: '2rem',
                          color: ' #010101',
                        },
                        id: 'checkPublicAccess_yes',
                        name: 'checkPublicAccess',
                        label: 'Yes',
                        disabled: false,
                      }),

                      RadioButton({
                        style: {
                          marginBottom: '2rem',
                          marginLeft: '2rem',
                          color: ' #010101',
                        },
                        id: 'checkPublicAccess_no',
                        name: 'checkPublicAccess',
                        label: 'No',
                        disabled: false,
                      }),
                    ]),
                  ]),
                ]),

                div({className: 'form-group'}, [
                  div(
                    {className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group'},
                    [
                      label({className: 'control-label rp-title-question common-color'}, [
                        'Explanation if controlled-access for GSR was selected',
                      ]),
                    ]),
                  div(
                    {className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group rp-last-group'},
                    [
                      input({
                        type: 'text',
                        name: 'explanation',
                        id: 'explanation',
                        maxLength: '256',
                        className: 'form-control',
                        required: true,
                      })
                    ])
                ]),

                div({className: 'form-group'}, [
                  div(
                    {className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group'},
                    [
                      label({className: 'control-label rp-title-question common-color'}, [
                        'Consent Group 1 - Name:',
                      ]),
                    ]),
                  div(
                    {className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group rp-last-group'},
                    [
                      input({
                        type: 'text',
                        name: 'consentGroupName',
                        id: 'consentGroupName',
                        maxLength: '256',
                        className: 'form-control',
                        required: true,
                      })
                    ]),
                  div(
                    {className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group'},
                    [
                      span({className: 'control-label rp-title-question common-color'}, [
                        'Consent Group 1 - Primary Data Use Terms ',
                        span({},
                          ['Please select one of the following data use permissions for your dataset.']),
                        div({
                          style: {'marginLeft': '15px'},
                          className: 'row'
                        }, []),

                        div(
                          {className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group'},
                          [
                            RadioButton({
                              style: {
                                marginBottom: '2rem',
                                color: ' #010101',
                              },
                              id: 'checkGeneral',
                              name: 'checkPrimary',
                              value: 'general',
                              label: 'General Research Use: ',
                              description: 'use is permitted for any research purpose',
                              disabled: false,
                            }),

                            RadioButton({
                              style: {
                                marginBottom: '2rem',
                                color: ' #010101',
                              },
                              id: 'checkHmb',
                              name: 'checkPrimary',
                              value: 'hmb',
                              label: 'Health/Medical/Biomedical Use: ',
                              description: 'use is permitted for any health, medical, or biomedical purpose',
                              disabled: false,
                            }),

                            RadioButton({
                              style: {
                                marginBottom: '2rem',
                                color: ' #010101',
                              },
                              id: 'checkDisease',
                              name: 'checkPrimary',
                              value: 'diseases',
                              label: 'Disease-related studies: ',
                              description: 'use is permitted for research on the specified disease',
                              disabled: false,
                            }),
                            div({
                              style: {
                                marginBottom: '2rem',
                                color: ' #010101'
                              },
                            }, [
                              h(AsyncSelect, {
                                id: 'sel_diseases',
                                isDisabled: false,
                                isMulti: true,
                                loadOptions: (query, callback) => this.searchOntologies(query, callback),
                                placeholder: 'Please enter one or more diseases',
                                classNamePrefix: 'select',
                              }),
                            ]),

                            RadioButton({
                              style: {
                                marginBottom: '2rem',
                                color: ' #010101',
                              },
                              id: 'checkPoa',
                              name: 'checkPrimary',
                              value: 'poa',
                              label: 'Populations, Origins, Ancestry Use: ',
                              description: 'use is permitted exclusively for populations, origins, or ancestry research',
                              disabled: false,
                            }),

                            RadioButton({
                              style: {
                                marginBottom: '2rem',
                                color: ' #010101',
                              },
                              id: 'checkOther',
                              name: 'checkPrimary',
                              value: 'other',
                              label: 'Other Use:',
                              description: 'permitted research use is defined as follows: ',
                              disabled: false
                            }),

                            textarea({
                              className: 'form-control',
                              name: 'otherText',
                              id: 'otherText',
                              maxLength: '512',
                              rows: '2',
                              placeholder: 'Please specify if selected (max. 512 characters)'
                            }),
                          ]),

                        div({className: 'form-group'}, [
                          div(
                            {className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group'},
                            [
                              label({className: 'control-label rp-title-question common-color'},
                                [
                                  'Consent Group 1 - Secondary Data Use Terms',
                                  span({}, ['Please select all applicable data use parameters.']),
                                ]),
                            ]),
                        ]),

                        div(
                          {className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group'},
                          [
                            div({className: 'checkbox'}, [
                              input({
                                id: 'checkMethods',
                                type: 'checkbox',
                                className: 'checkbox-inline rp-checkbox',
                                name: 'methods',
                                disabled: false
                              }),
                              label({
                                className: 'regular-checkbox rp-choice-questions',
                                htmlFor: 'checkMethods',
                              }, [
                                span({ className: 'access-color'},
                                  ['No methods development or validation studies (NMDS)']),
                              ]),
                            ]),
                          ]),

                        div(
                          {className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group'},
                          [
                            div({className: 'checkbox'}, [
                              input({
                                id: 'checkGenetic',
                                type: 'checkbox',
                                className: 'checkbox-inline rp-checkbox',
                                name: 'genetic',
                                disabled: false
                              }),
                              label({
                                className: 'regular-checkbox rp-choice-questions',
                                htmlFor: 'checkGenetic',
                              }, [
                                span({ className: 'access-color'},
                                  ['Genetic Studies Only (GSO)']),
                              ]),
                            ]),
                          ]),

                        div(
                          {className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group'},
                          [
                            div({className: 'checkbox'}, [
                              input({
                                id: 'checkPublication',
                                type: 'checkbox',
                                className: 'checkbox-inline rp-checkbox',
                                name: 'publication',
                                disabled: false
                              }),
                              label({
                                className: 'regular-checkbox rp-choice-questions',
                                htmlFor: 'checkPublication',
                              }, [
                                span({ className: 'access-color'},
                                  ['Publication Required (PUB)']),
                              ]),
                            ]),
                          ]),

                        div(
                          {className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group'},
                          [
                            div({className: 'checkbox'}, [
                              input({
                                id: 'checkCollaboration',
                                type: 'checkbox',
                                className: 'checkbox-inline rp-checkbox',
                                name: 'collaboration',
                                disabled: false
                              }),
                              label({
                                className: 'regular-checkbox rp-choice-questions',
                                htmlFor: 'checkCollaboration',
                              }, [
                                span({ className: 'access-color'},
                                  ['Collaboration Required (COL)']),
                              ]),
                            ]),
                          ]),

                        div(
                          {className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group'},
                          [
                            div({className: 'checkbox'}, [
                              input({
                                id: 'checkEthics',
                                type: 'checkbox',
                                className: 'checkbox-inline rp-checkbox',
                                name: 'ethics',
                                disabled: false
                              }),
                              label({
                                className: 'regular-checkbox rp-choice-questions',
                                htmlFor: 'checkEthics',
                              }, [
                                span({ className: 'access-color'},
                                  ['Ethics Approval Required (IRB)']),
                              ]),
                            ]),
                          ]),

                        div(
                          {className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group'},
                          [
                            div({className: 'checkbox'}, [
                              input({
                                id: 'checkGeographic',
                                type: 'checkbox',
                                className: 'checkbox-inline rp-checkbox',
                                name: 'geographic',
                                disabled: false
                              }),
                              label({
                                className: 'regular-checkbox rp-choice-questions',
                                htmlFor: 'checkGeographic',
                              }, [
                                span({ className: 'access-color'},
                                  ['Geographic Restriction (GS-)']),
                              ]),
                            ]),
                          ]),

                        div(
                          {className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group'},
                          [
                            div({className: 'checkbox'}, [
                              input({
                                id: 'checkMoratorium',
                                type: 'checkbox',
                                className: 'checkbox-inline rp-checkbox',
                                name: 'moratorium',
                                disabled: false
                              }),
                              label({
                                className: 'regular-checkbox rp-choice-questions',
                                htmlFor: 'checkMoratorium',
                              }, [
                                span({ className: 'access-color'},
                                  ['Publication Moratorium (MOR)']),
                              ]),
                            ]),
                          ]),

                        div(
                          {className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group'},
                          [
                            div({className: 'checkbox'}, [
                              input({
                                id: 'checkNpoa',
                                type: 'checkbox',
                                className: 'checkbox-inline rp-checkbox',
                                name: 'poa',
                                disabled: false
                              }),
                              label({
                                className: 'regular-checkbox rp-choice-questions',
                                htmlFor: 'checkNpoa',
                              }, [
                                span({ className: 'access-color'},
                                  ['No Populations Origins or Ancestry Research (NPOA)']),
                              ]),
                            ]),
                          ]),

                        div(
                          {className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group'},
                          [
                            div({className: 'checkbox'}, [
                              input({
                                id: 'checkForProfit',
                                type: 'checkbox',
                                className: 'checkbox-inline rp-checkbox',
                                name: 'forProfit',
                                disabled: false
                              }),
                              label({
                                className: 'regular-checkbox rp-choice-questions',
                                htmlFor: 'checkForProfit',
                              }, [
                                span({ className: 'access-color'},
                                  ['Non-Profit Use Only (NPU)']),
                              ]),
                            ]),
                          ]),

                        div(
                          {className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group'},
                          [
                            div({className: 'checkbox'}, [
                              input({
                                id: 'checkOtherSecondary',
                                type: 'checkbox',
                                className: 'checkbox-inline rp-checkbox',
                                name: 'other',
                                disabled: false
                              }),
                              label({
                                className: 'regular-checkbox rp-choice-questions',
                                htmlFor: 'checkOtherSecondary',
                              }, [
                                span({ className: 'access-color'},
                                  ['Other Secondary Use Terms:']),
                              ]),
                            ]),
                          ]),
                        div(
                          {className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group'},
                          [
                            textarea({
                              name: 'otherText',
                              id: 'inputOtherText',
                              className: 'form-control',
                              rows: '6',
                              required: false,
                              placeholder: 'Note - adding free text data use terms in the box will inhibit your dataset from being read by the DUOS Algorithm for decision support.',
                            })
                          ]),
                      ]),
                    ]),
                ]),

                div({ className: 'row no-margin' }, [
                  div({ className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12' }, [
                    a({
                      id: 'btn_submit',
                      className: 'f-right btn-primary access-background bold'
                    }, ['Add Consent Group']),
                  ])
                ]),


                div({className: 'form-group'}, [
                  div(
                    {className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group'},
                    [
                      label({className: 'control-label rp-title-question common-color'}, [
                        'Are you requesting an Alternative Data Sharing Plan for samples that cannot be shared through a public database or repository?',
                      ]),
                    ]),
                  div({ className: 'row no-margin' }, [
                    div({ className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 dataset-group' }, [

                      RadioButton({
                        style: {
                          margin: '2rem',
                          color: ' #010101',
                        },
                        id: 'checkPublicAccess_yes',
                        name: 'checkPublicAccess',
                        label: 'Yes',
                        disabled: false,
                      }),

                      RadioButton({
                        style: {
                          marginBottom: '2rem',
                          marginLeft: '2rem',
                          color: ' #010101',
                        },
                        id: 'checkPublicAccess_no',
                        name: 'checkPublicAccess',
                        label: 'No',
                        disabled: false,
                      }),
                    ]),
                  ]),
                ]),

                div({className: 'form-group'}, [
                  div(
                    {className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group'},
                    [
                      label({className: 'control-label rp-title-question common-color'}, [
                        'Please mark the reasons for which you are requesting an Alternative Data Sharing Plan',
                      ]),
                    ]),
                  div(
                    {className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group'},
                    [
                      div({className: 'checkbox'}, [
                        input({
                          id: 'checkMethods',
                          type: 'checkbox',
                          className: 'checkbox-inline rp-checkbox',
                          name: 'methods',
                        }),
                        label({
                          className: 'regular-checkbox rp-choice-questions',
                          htmlFor: 'checkMethods',
                        }, [
                          span({},
                            ['Legal Restrictions']),
                          '',
                        ]),
                      ]),
                    ]),
                  div(
                    {className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group'},
                    [
                      div({className: 'checkbox'}, [
                        input({
                          id: 'checkMethods',
                          type: 'checkbox',
                          className: 'checkbox-inline rp-checkbox',
                          name: 'methods',
                        }),
                        label({
                          className: 'regular-checkbox rp-choice-questions',
                          htmlFor: 'checkMethods',
                        }, [
                          span({},
                            ['Informed consent processes are inadequate to support data sharing for the following reasons:']),
                          '',
                        ]),
                      ]),
                    ]),
                  div(
                    {className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group'},
                    [
                      div({className: 'checkbox'}, [
                        input({
                          id: 'checkMethods',
                          type: 'checkbox',
                          className: 'checkbox-inline rp-checkbox',
                          name: 'methods',
                        }),
                        label({
                          className: 'regular-checkbox rp-choice-questions',
                          htmlFor: 'checkMethods',
                        }, [
                          span({},
                            ['The consent forms are unavailable or non-existent for samples collected after January 25, 2015']),
                          '',
                        ]),
                      ]),
                    ]),
                  div(
                    {className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group'},
                    [
                      div({className: 'checkbox'}, [
                        input({
                          id: 'checkMethods',
                          type: 'checkbox',
                          className: 'checkbox-inline rp-checkbox',
                          name: 'methods',
                        }),
                        label({
                          className: 'regular-checkbox rp-choice-questions',
                          htmlFor: 'checkMethods',
                        }, [
                          span({},
                            [' The consent process did not explicitly address future use or broad data sharing for samples collect after January 25, 2015']),
                          '',
                        ]),
                      ]),
                    ]),
                  div(
                    {className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group'},
                    [
                      div({className: 'checkbox'}, [
                        input({
                          id: 'checkMethods',
                          type: 'checkbox',
                          className: 'checkbox-inline rp-checkbox',
                          name: 'methods',
                        }),
                        label({
                          className: 'regular-checkbox rp-choice-questions',
                          htmlFor: 'checkMethods',
                        }, [
                          span({},
                            ['The consent process inadequately address risks related to future use or broad data sharing for samples collected after January 25, 2015']),
                          '',
                        ]),
                      ]),
                    ]),
                  div(
                    {className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group'},
                    [
                      div({className: 'checkbox'}, [
                        input({
                          id: 'checkMethods',
                          type: 'checkbox',
                          className: 'checkbox-inline rp-checkbox',
                          name: 'methods',
                        }),
                        label({
                          className: 'regular-checkbox rp-choice-questions',
                          htmlFor: 'checkMethods',
                        }, [
                          span({},
                            ['The consent process specifically precludes future use or broad sharing (including a statement that use of data will be limited to the original researchers)']),
                          '',
                        ]),
                      ]),
                    ]),
                  div(
                    {className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group'},
                    [
                      div({className: 'checkbox'}, [
                        input({
                          id: 'checkMethods',
                          type: 'checkbox',
                          className: 'checkbox-inline rp-checkbox',
                          name: 'methods',
                        }),
                        label({
                          className: 'regular-checkbox rp-choice-questions',
                          htmlFor: 'checkMethods',
                        }, [
                          span({},
                            ['Other informed consent limitations or concerns']),
                          '',
                        ]),
                      ]),
                    ]),
                  div(
                    {className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group'},
                    [
                      div({className: 'checkbox'}, [
                        input({
                          id: 'checkMethods',
                          type: 'checkbox',
                          className: 'checkbox-inline rp-checkbox',
                          name: 'methods',
                        }),
                        label({
                          className: 'regular-checkbox rp-choice-questions',
                          htmlFor: 'checkMethods',
                        }, [
                          span({},
                            ['Other']),
                          '',
                        ]),
                      ]),
                    ]),
                ]),

                div({className: 'form-group'}, [
                  div(
                    {className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group'},
                    [
                      label({className: 'control-label rp-title-question common-color'}, [
                        'Explanation for Request',
                      ]),
                    ]),
                  div(
                    {className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group rp-last-group'},
                    [
                      input({
                        type: 'text',
                        name: 'explanation',
                        id: 'inputexplanation',
                        maxLength: '256',
                        required: true,
                        className: 'form-control'
                      }),
                    ])
                ]),

                div({className: 'form-group'}, [
                  div(
                    {className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group'},
                    [
                      label({className: 'control-label rp-title-question common-color'}, [
                        'Alternative Data Sharing Plan',
                      ]),
                    ]),
                  div(
                    {className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group rp-last-group'},
                    [
                      input({
                        type: 'text',
                        name: 'ADSP',
                        id: 'inputADSP',
                        maxLength: '256',
                        required: true,
                        className: 'form-control'
                      }),
                    ])
                ]),

                div({className: 'form-group'}, [
                  div(
                    {className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group'},
                    [
                      label({className: 'control-label rp-title-question common-color'}, [
                        'Alternative Data Sharing Plan',
                      ]),
                    ]),
                  div(
                    {className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group rp-last-group'},
                    [
                      input({
                        type: 'text',
                        name: 'description',
                        id: 'inputDescription',
                        maxLength: '256',
                        required: true,
                        className: 'form-control'
                      }),
                    ])
                ]),

                div({className: 'form-group'}, [
                  div(
                    {className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group'},
                    [
                      label({className: 'control-label rp-title-question common-color'}, [
                        'If needed, please attach additional information to this document',
                      ]),
                    ]),
                  div(
                    {className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group rp-last-group'},
                    [
                      input({
                        type: 'text',
                        name: 'Acknowledgement',
                        id: 'inputAcknowledgement',
                        maxLength: '256',
                        className: 'form-control'
                      }),
                    ])
                ]),

                div({className: 'form-group'}, [
                  div(
                    {className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group'},
                    [
                      label({className: 'control-label rp-title-question common-color'}, [
                        'Data will be submitted',
                      ]),
                    ]),
                  div({ className: 'row no-margin' }, [
                    div({ className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 dataset-group' }, [

                      RadioButton({
                        style: {
                          margin: '2rem',
                          color: ' #010101',
                        },
                        id: 'checkPublicAccess_yes',
                        name: 'checkPublicAccess',
                        label: 'Within 3 months of last data generated or last clinical visit',
                        disabled: false,
                      }),

                      RadioButton({
                        style: {
                          marginBottom: '2rem',
                          marginLeft: '2rem',
                          color: ' #010101',
                        },
                        id: 'checkPublicAccess_no',
                        name: 'checkPublicAccess',
                        label: 'Data will be submitted by batches over Study Timeline (e.g. based on clinical trial enrollment benchmarks)',
                        disabled: false,
                      }),
                    ]),
                  ]),
                ]),

                div({className: 'form-group'}, [
                  div(
                    {className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group'},
                    [
                      label({className: 'control-label rp-title-question common-color'}, [
                        'Data to be released will meet the timeframes specified in the NHGRI Guidance for Data Submission and Data Release',
                      ]),
                    ]),
                  div({ className: 'row no-margin' }, [
                    div({ className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 dataset-group' }, [

                      RadioButton({
                        style: {
                          margin: '2rem',
                          color: ' #010101',
                        },
                        id: 'checkPublicAccess_yes',
                        name: 'checkPublicAccess',
                        label: 'Yes',
                        disabled: false,
                      }),

                      RadioButton({
                        style: {
                          marginBottom: '2rem',
                          marginLeft: '2rem',
                          color: ' #010101',
                        },
                        id: 'checkPublicAccess_no',
                        name: 'checkPublicAccess',
                        label: 'No',
                        disabled: false,
                      }),
                    ]),
                  ]),
                ]),

                div({className: 'form-group'}, [
                  div(
                    {className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group'},
                    [
                      label({className: 'control-label rp-title-question common-color'}, [
                        'Target data delivery date',
                      ]),
                    ]),
                  div(
                    {className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group'},
                    [
                      h(Select, {
                        name: 'dac',
                        id: 'inputDac',
                        blurInputOnSelect: true,
                        openMenuOnFocus: true,
                        isDisabled: false,
                        isClearable: true,
                        isMulti: false,
                        isSearchable: true,
                        options: [],
                        placeholder: 'Select a DAC...',
                      }),
                    ])
                ]),

                div({className: 'form-group'}, [
                  div(
                    {className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group'},
                    [
                      label({className: 'control-label rp-title-question common-color'}, [
                        'Target public release dae',
                      ]),
                    ]),
                  div(
                    {className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group'},
                    [
                      h(Select, {
                        name: 'dac',
                        id: 'inputDac',
                        blurInputOnSelect: true,
                        openMenuOnFocus: true,
                        isDisabled: false,
                        isClearable: true,
                        isMulti: false,
                        isSearchable: true,
                        options: [],
                        placeholder: 'Select a DAC...',
                      }),
                    ])
                ]),

                div({className: 'form-group'}, [
                  div(
                    {className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group'},
                    [
                      label({className: 'control-label rp-title-question common-color'}, [
                        'Estimated # of bytes of data to be deposited',
                      ]),
                    ]),
                  div(
                    {className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group rp-last-group'},
                    [
                      input({
                        type: 'text',
                        name: 'description',
                        id: 'inputbytesofdata',
                        maxLength: '256',
                        className: 'form-control',
                        required: true,
                      })
                    ])
                ]),

                div({className: 'form-group'}, [
                  div(
                    {className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group'},
                    [
                      label({className: 'control-label rp-title-question common-color'}, [
                        'Estimated # of Study Participants',
                      ]),
                    ]),
                  div(
                    {className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group rp-last-group'},
                    [
                      input({
                        type: 'text',
                        name: 'studyparticipants',
                        id: 'inputstudyparticipants',
                        maxLength: '256',
                        className: 'form-control'
                      })
                    ])
                ]),

                div({className: 'form-group'}, [
                  div(
                    {className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group'},
                    [
                      label({className: 'control-label rp-title-question common-color'}, [
                        'Samples genotyped/sequenced (check all data types expected for this study)',
                      ]),
                    ]),
                  div(
                    {className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group'},
                    [
                      div({className: 'checkbox'}, [
                        input({
                          id: 'checkMethods',
                          type: 'checkbox',
                          className: 'checkbox-inline rp-checkbox',
                          name: 'methods',
                        }),
                        label({
                          className: 'regular-checkbox rp-choice-questions',
                          htmlFor: 'checkMethods',
                        }, [
                          span({},
                            ['Species']),
                          '',
                        ]),
                      ]),
                    ]),
                  div(
                    {className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group'},
                    [
                      div({className: 'checkbox'}, [
                        input({
                          id: 'checkMethods',
                          type: 'checkbox',
                          className: 'checkbox-inline rp-checkbox',
                          name: 'methods',
                        }),
                        label({
                          className: 'regular-checkbox rp-choice-questions',
                          htmlFor: 'checkMethods',
                        }, [
                          span({},
                            ['Sample Collection']),
                          '',
                        ]),
                      ]),
                    ]),
                  div(
                    {className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group'},
                    [
                      div({className: 'checkbox'}, [
                        input({
                          id: 'checkMethods',
                          type: 'checkbox',
                          className: 'checkbox-inline rp-checkbox',
                          name: 'methods',
                        }),
                        label({
                          className: 'regular-checkbox rp-choice-questions',
                          htmlFor: 'checkMethods',
                        }, [
                          span({},
                            ['Phenotype']),
                          '',
                        ]),
                      ]),
                    ]),
                  div(
                    {className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group'},
                    [
                      div({className: 'checkbox'}, [
                        input({
                          id: 'checkMethods',
                          type: 'checkbox',
                          className: 'checkbox-inline rp-checkbox',
                          name: 'methods',
                        }),
                        label({
                          className: 'regular-checkbox rp-choice-questions',
                          htmlFor: 'checkMethods',
                        }, [
                          span({},
                            ['Genotypes']),
                          '',
                        ]),
                      ]),
                    ]),
                  div(
                    {className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group'},
                    [
                      div({className: 'checkbox'}, [
                        input({
                          id: 'checkMethods',
                          type: 'checkbox',
                          className: 'checkbox-inline rp-checkbox',
                          name: 'methods',
                        }),
                        label({
                          className: 'regular-checkbox rp-choice-questions',
                          htmlFor: 'checkMethods',
                        }, [
                          span({},
                            ['General']),
                          '',
                        ]),
                      ]),
                    ]),
                  div(
                    {className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group'},
                    [
                      div({className: 'checkbox'}, [
                        input({
                          id: 'checkMethods',
                          type: 'checkbox',
                          className: 'checkbox-inline rp-checkbox',
                          name: 'methods',
                        }),
                        label({
                          className: 'regular-checkbox rp-choice-questions',
                          htmlFor: 'checkMethods',
                        }, [
                          span({},
                            ['Sequencing']),
                          '',
                        ]),
                      ]),
                    ]),
                  div(
                    {className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group'},
                    [
                      div({className: 'checkbox'}, [
                        input({
                          id: 'checkMethods',
                          type: 'checkbox',
                          className: 'checkbox-inline rp-checkbox',
                          name: 'methods',
                        }),
                        label({
                          className: 'regular-checkbox rp-choice-questions',
                          htmlFor: 'checkMethods',
                        }, [
                          span({},
                            ['Sample Types']),
                          '',
                        ]),
                      ]),
                    ]),
                  div(
                    {className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group'},
                    [
                      div({className: 'checkbox'}, [
                        input({
                          id: 'checkMethods',
                          type: 'checkbox',
                          className: 'checkbox-inline rp-checkbox',
                          name: 'methods',
                        }),
                        label({
                          className: 'regular-checkbox rp-choice-questions',
                          htmlFor: 'checkMethods',
                        }, [
                          span({},
                            ['Analyses']),
                          '',
                        ]),
                      ]),
                    ]),
                  div(
                    {className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group'},
                    [
                      div({className: 'checkbox'}, [
                        input({
                          id: 'checkMethods',
                          type: 'checkbox',
                          className: 'checkbox-inline rp-checkbox',
                          name: 'methods',
                        }),
                        label({
                          className: 'regular-checkbox rp-choice-questions',
                          htmlFor: 'checkMethods',
                        }, [
                          span({},
                            ['Array Data']),
                          '',
                        ]),
                      ]),
                    ]),
                ]),



                h3({ className: 'rp-form-title common-color' }, ['Signatures']),

                div({ className: 'form-group' }, [
                  div({ className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12' }, [
                    label({ className: 'control-label rp-title-question common-color' }, [
                      'Dataset Registration Agreement'
                    ])
                  ]),

                  div({ className: 'row no-margin' }, [
                    div({ className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group' }, [
                      label({ style: controlLabelStyle, className: 'default-color' },
                        ['By submitting this dataset registration, you agree to comply with all terms put forth in the agreement.'])
                    ]),

                    div({ className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group' }, [
                      a({
                        id: 'link_downloadAgreement', target: '_blank',
                        className: 'col-lg-4 col-md-4 col-sm-6 col-xs-12 btn-secondary btn-download-pdf hover-color'
                      }, [
                        span({ className: 'glyphicon glyphicon-download' }),
                        'Dataset Registration Agreement'
                      ])
                    ]),
                  ]),

                  div({className: 'form-group'}, [
                    div(
                      {className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group'},
                      [
                        label({className: 'control-label rp-title-question common-color'}, [
                          'Principal Investigator Signature',
                        ]),
                      ]),
                    div(
                      {className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group rp-last-group'},
                      [
                        input({
                          type: 'text',
                          name: 'piSignature',
                          id: 'piSignature',
                          maxLength: '256',
                          className: 'form-control',
                          required: true,
                        })
                      ])
                  ]),

                  div({ className: 'row no-margin' }, [
                    div({ className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12' }, [
                      a({
                        id: 'btn_submit',
                        className: 'f-right btn-primary dataset-background bold'
                      }, ['Submit to Signing Official']),
                    ])
                  ])
                ]),
              ])
            ]),
          ])
        ])
      ])
    );
  }
}

export default NIHICWebform;
