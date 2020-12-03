import { Component } from 'react';
import { a, br, div, fieldset, form, h, h3, hr, i, input, label, li, ol, p, small, span, textarea } from 'react-hyperscript-helpers';
import { Link } from 'react-router-dom';
import AsyncSelect from 'react-select/async';
import ReactTooltip from 'react-tooltip';
import { Alert } from '../components/Alert';
import { ConfirmationDialog } from '../components/ConfirmationDialog';
import { eRACommons } from '../components/eRACommons';
import { Notification } from '../components/Notification';
import { PageHeading } from '../components/PageHeading';
import { YesNoRadioGroup } from '../components/YesNoRadioGroup';
import { DAR, Researcher } from '../libs/ajax';
import { NotificationService } from '../libs/notificationService';
import { Storage } from '../libs/storage';
import { TypeOfResearch } from './dar_application/TypeOfResearch';
import * as fp from 'lodash/fp';

import './DataAccessRequestApplication.css';


const noOptionMessage = 'Start typing a Dataset Name, Sample Collection ID, or PI';

/**
 * This class is for demo purposes only and is not intended to perform any data
 * saving functionality.
 */
class DataAccessRequestRenewal extends Component {

  constructor(props) {
    super(props);
    this.state = {
      nihValid: false,
      disableOkBtn: false,
      showValidationMessages: false,
      optionMessage: noOptionMessage,
      showModal: false,
      completed: '',
      showDialogSubmit: false,
      showDialogSave: false,
      step: 1,
      formData: {
        datasets: [],
        darCode: null,
        checkCollaborator: false,
        rus: '',
        nonTechRus: '',
        linkedIn: '',
        orcid: '',
        oneGender: '',
        methods: '',
        controls: '',
        population: '',
        hmb: false,
        poa: false,
        diseases: false,
        ontologies: [],
        other: false,
        otherText: '',
        forProfit: '',
        gender: '',
        pediatric: '',
        illegalBehavior: '',
        addiction: '',
        sexualDiseases: '',
        stigmatizedDiseases: '',
        vulnerablePopulation: '',
        populationMigration: '',
        psychiatricTraits: '',
        notHealth: '',
        investigator: '',
        researcher: '',
        projectTitle: '',
        researcherGate: '',
        isThePi: '',
        havePi: '',
        profileName: '',
        piName: '',
        pubmedId: '',
        scientificUrl: ''
      },
      step1: {
        inputResearcher: {
          invalid: false
        },
        inputInvestigator: {
          invalid: false
        },
        inputNih: {
          invalid: false
        }
      },
      step3: {
        inputPurposes: {
          invalid: false
        }
      },
      problemSavingRequest: false
    };
  }

  onNihStatusUpdate = (nihValid) => {
    if (this.state.nihValid !== nihValid) {
      this.setState(prev => {
        prev.nihValid = nihValid;
        return prev;
      });
    }
  };

  async componentDidMount() {
    await this.init();
    this.props.history.push('/dar_renewal');
    ReactTooltip.rebuild();
    const notificationData = await NotificationService.getBannerObjectById('eRACommonsOutage');
    this.setState(prev => {
      prev.notificationData = notificationData;
      return prev;
    });
  }

  async init() {
    let formData = Storage.getData('dar_application') === null ? this.state.formData : Storage.getData('dar_application');
    Storage.removeData('dar_application');
    if (this.props.location.props !== undefined && this.props.location.props.formData !== undefined) {
      if (this.props.location.props.formData.darCode !== undefined) {
        formData = this.props.location.props.formData;
        formData.ontologies = this.getOntologies(formData);
      } else if (this.props.location.props.formData.datasetIds !== undefined) {
        // set datasets sent by data set catalog
        formData.datasets = this.processDataSet(this.props.location.props.formData.datasetIds);
      }
    }
    let currentUserId = Storage.getCurrentUser().dacUserId;
    let rpProperties = await Researcher.getPropertiesByResearcherId(currentUserId);
    formData.darCode = formData.darCode === undefined ? null : formData.darCode;
    formData.partialDarCode = formData.partialDarCode === undefined ? null : formData.partialDarCode;

    formData.researcher = rpProperties.profileName != null ? rpProperties.profileName : '';

    if (rpProperties.piName === undefined && rpProperties.isThePI === 'true') {
      formData.investigator = rpProperties.profileName;
    } else if (rpProperties.piName === undefined && rpProperties.isThePI === 'false') {
      formData.investigator = '--';
    } else {
      formData.investigator = rpProperties.piName;
    }

    if (formData.darCode === null) {
      formData.linkedIn = rpProperties.linkedIn !== undefined ? rpProperties.linkedIn : '';
      formData.researcherGate = rpProperties.researcherGate !== undefined ? rpProperties.researcherGate : '';
      formData.orcid = rpProperties.orcid !== undefined ? rpProperties.orcid : '';
      formData.institution = rpProperties.institution != null ? rpProperties.institution : '';
      formData.department = rpProperties.department != null ? rpProperties.department : '';
      formData.division = rpProperties.division != null ? rpProperties.division : '';
      formData.address1 = rpProperties.address1 != null ? rpProperties.address1 : '';
      formData.address2 = rpProperties.address2 != null ? rpProperties.address2 : '';
      formData.city = rpProperties.city != null ? rpProperties.city : '';
      formData.zipCode = rpProperties.zipCode != null ? rpProperties.zipCode : '';
      formData.country = rpProperties.country != null ? rpProperties.country : '';
      formData.state = rpProperties.state != null ? rpProperties.state : '';
      formData.piName = rpProperties.piName !== null ? rpProperties.piName : '';
      formData.academicEmail = rpProperties.academicEmail != null ? rpProperties.academicEmail : '';
      formData.piEmail = rpProperties.piEmail != null ? rpProperties.piEmail : '';
      formData.isThePi = rpProperties.isThePI !== undefined ? rpProperties.isThePI : '';
      formData.havePi = rpProperties.havePI !== undefined ? rpProperties.havePI : '';
      formData.pubmedId = rpProperties.pubmedID !== undefined ? rpProperties.pubmedID : '';
      formData.scientificUrl = rpProperties.scientificURL !== undefined ? rpProperties.scientificURL : '';
    }

    formData.userId = Storage.getCurrentUser().dacUserId;

    if (formData.darCode !== null || formData.partialDarCode !== null) {
      formData.datasets = this.processDataSet(formData.datasetIds);
    }
    let completed = false;
    if (formData.darCode !== null) {
      completed = '';
    } else if (rpProperties.completed !== undefined) {
      completed = JSON.parse(rpProperties.completed);
    }
    this.setState(prev => {
      prev.completed = completed;
      prev.formData = formData;
      return prev;
    });

  };

  getOntologies(formData) {
    let ontologies = {};
    if (formData.ontologies !== undefined && formData.ontologies !== null) {
      ontologies = formData.ontologies.map(function(item) {
        return {
          key: item.id,
          value: item.id,
          label: item.label,
          item: item
        };
      });
    }
    return ontologies;
  }

  processDataSet(datasetIdList) {
    return datasetIdList.map(function(item) {
      return {
        value: item.id,
        label: item.concatenation
      };
    });
  }

  step1 = (e) => {
    this.setState(prev => {
      prev.step = 1;
      return prev;
    });
    window.scrollTo(0, 0);
  };

  step2 = (e) => {
    this.setState(prev => {
      prev.step = 2;
      return prev;
    });
    window.scrollTo(0, 0);
  };

  step3 = (e) => {
    this.setState(prev => {
      prev.step = 3;
      return prev;
    });
    window.scrollTo(0, 0);
  };

  step4 = (e) => {
    this.setState(prev => {
      prev.step = 4;
      return prev;
    });
    window.scrollTo(0, 0);
  };

  searchDataSets(query, callback) {
    DAR.getAutoCompleteDS(query).then(items => {
      let options = items.map(function(item) {
        return {
          key: item.id,
          value: item.id,
          label: item.concatenation
        };
      });
      callback(options);
    });

  };

  back = (e) => {
    this.props.history.goBack();
  };

  render() {

    const {
      orcid = '',
      researcherGate = '',
      checkCollaborator = false,
      darCode,
      hmb = false,
      poa = false,
      diseases = false,
      other = false,
      otherText = '',
      population = false,
      forProfit = false,
      controls = false,
      methods = false,
      linkedIn = '',
      investigator = ''
    } = this.state.formData;
    const { ontologies } = this.state;

    const { problemSavingRequest, showValidationMessages, step1, step3 } = this.state;
    const isTypeOfResearchInvalid = false;
    const genderLabels = ['Female', 'Male'];
    const genderValues = ['F', 'M'];

    const profileUnsubmitted = span({}, [
      'Please submit ',
      h(Link, { to: '/profile', className: 'hover-color' }, ['Your Profile']),
      ' to be able to create a Data Access Request'
    ]);

    const profileSubmitted = span({}, [
      'Please make sure ',
      h(Link, { to: '/profile', className: 'hover-color' }, ['Your Profile']),
      ' is updated, as it will be submited with your DAR Renewal'
    ]);

    return (

      div({ className: 'container' }, [
        div({ className: 'col-lg-10 col-lg-offset-1 col-md-12 col-sm-12 col-xs-12' }, [
          div({ className: 'row no-margin' }, [
            Notification({notificationData: this.state.notificationData}),
            div({
              className: (this.state.formData.darCode !== null ?
                'col-lg-10 col-md-9 col-sm-9 ' :
                this.state.formData.darCode === null ? 'col-lg-12 col-md-12 col-sm-12 ' : 'col-xs-12 no-padding')
            }, [
              PageHeading({
                id: 'requestApplication', imgSrc: '/images/icon_add_access.png', iconSize: 'medium', color: 'access',
                title: 'Data Access Request Renewal',
                description: 'The section below includes a series of questions intended to allow our Data Access Committee to evaluate the renewal of your previously approved Data Access Request.'
              })
            ]),
            div({ isRendered: this.state.formData.darCode !== null, className: 'col-lg-2 col-md-3 col-sm-3 col-xs-12 no-padding' }, [
              a({ id: 'btn_back', onClick: this.back, className: 'btn-primary btn-back' }, [
                i({ className: 'glyphicon glyphicon-chevron-left' }), 'Back'
              ])
            ])
          ]),
          hr({ className: 'section-separator' }),

          div({ className: 'row fsi-row-lg-level fsi-row-md-level multi-step-buttons no-margin' }, [

            a({
              id: 'btn_step_1',
              onClick: this.step1,
              className: 'col-lg-3 col-md-3 col-sm-12 col-xs-12 access-color jumbotron box-vote multi-step-title '
                + (this.state.step === 1 ? 'active' : '')
            }, [
              small({}, ['Step 1']),
              'Researcher Information',
              span({ className: 'glyphicon glyphicon-chevron-right', 'aria-hidden': 'true' }, [])
            ]),

            a({
              id: 'btn_step_2',
              onClick: this.step2,
              className: 'col-lg-3 col-md-3 col-sm-12 col-xs-12 access-color jumbotron box-vote multi-step-title '
                + (this.state.step === 2 ? 'active' : '')
            }, [
              small({}, ['Step 2']),
              'Data Access Request',
              span({ className: 'glyphicon glyphicon-chevron-right', 'aria-hidden': 'true' }, [])
            ]),

            a({
              id: 'btn_step_3',
              onClick: this.step3,
              className: 'col-lg-3 col-md-3 col-sm-12 col-xs-12 access-color jumbotron box-vote multi-step-title '
                + (this.state.step === 3 ? 'active' : '')
            }, [
              small({}, ['Step 3']),
              'Research Purpose Statement',
              span({ className: 'glyphicon glyphicon-chevron-right', 'aria-hidden': 'true' }, [])
            ]),

            a({
              id: 'btn_step_4',
              onClick: this.step4,
              className: 'col-lg-3 col-md-3 col-sm-12 col-xs-12 access-color jumbotron box-vote multi-step-title '
                + (this.state.step === 4 ? 'active' : '')
            }, [
              small({}, ['Step 4']),
              'Data Use Agreements',
              span({ className: 'glyphicon glyphicon-chevron-right', 'aria-hidden': 'true' }, [])
            ])
          ])
        ]),
        form({ name: 'form', 'noValidate': true }, [
          div({ id: 'form-views' }, [

            ConfirmationDialog({
              title: 'Save changes?', disableOkBtn: this.state.disableOkBtn, disableNoBtn: this.state.disableOkBtn, color: 'access',
              showModal: this.state.showDialogSave, action: { label: 'Yes', handler: () => {} }
            }, [
              div({ className: 'dialog-description' },
                ['Are you sure you want to save this Data Access Request? Previous changes will be overwritten.'])
            ]),

            div({ isRendered: this.state.step === 1 }, [
              div({ className: 'col-lg-10 col-lg-offset-1 col-md-12 col-sm-12 col-xs-12' }, [
                fieldset({ disabled: this.state.formData.darCode !== null }, [

                  div({ isRendered: this.state.completed === false, className: 'rp-alert' }, [
                    Alert({ id: 'profileUnsubmitted', type: 'danger', title: profileUnsubmitted })
                  ]),
                  div({ isRendered: this.state.completed === true, className: 'rp-alert' }, [
                    Alert({ id: 'profileSubmitted', type: 'info', title: profileSubmitted })
                  ]),

                  h3({ className: 'rp-form-title access-color' }, ['1. Researcher Identification']),

                  div({ className: 'form-group' }, [
                    div({ className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group' }, [
                      label({ className: 'control-label rp-title-question' }, ['1.1 Researcher*'])
                    ]),

                    div({ className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group' }, [
                      input({
                        type: 'text',
                        name: 'researcher',
                        id: 'inputResearcher',
                        value: this.state.formData.researcher,
                        disabled: true,
                        className: step1.inputResearcher.invalid && showValidationMessages ? 'form-control required-field-error' : 'form-control',
                        required: true
                      }),
                      span({
                        isRendered: (step1.inputResearcher.invalid) && (showValidationMessages), className: 'cancel-color required-field-error-span'
                      }, ['Required field'])
                    ]),

                    div({ className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group checkbox' }, [
                      input({
                        type: 'checkbox',
                        id: 'chk_collaborator',
                        name: 'checkCollaborator',
                        className: 'checkbox-inline rp-checkbox',
                        disabled: this.state.formData.darCode !== null,
                        checked: checkCollaborator,
                        onChange: () => {}
                      }),
                      label({ className: 'regular-checkbox rp-choice-questions', htmlFor: 'chk_collaborator' },
                        ['I am an NIH Intramural researcher (NIH email required) and/or collaborator of the PI/Data Custodian for the selected dataset(s)'])
                    ]),

                    div({ className: 'col-lg-12 col-md-12 col-sm-6 col-xs-12' }, [
                      label({ className: 'control-label rp-title-question' }, [
                        '1.2 Researcher Identification',
                        div({ isRendered: this.state.formData.checkCollaborator !== true, className: 'display-inline' }, ['*']),
                        div({ isRendered: this.state.formData.checkCollaborator === true, className: 'display-inline italic' }, [' (optional)']),
                        span({ className: 'default-color' },
                          ['Please authenticate your eRA Commons account. Other profiles are optional:'])
                      ])
                    ]),

                    span({
                      isRendered: (showValidationMessages && !this.state.nihValid), className: 'col-lg-12 col-md-12 col-sm-6 col-xs-12 cancel-color required-field-error-span'
                    }, ['NIH eRA Authentication is required']),

                    div({ className: 'row no-margin' }, [
                      eRACommons({
                        className: 'col-lg-6 col-md-6 col-sm-6 col-xs-12 rp-group',
                        destination: 'dar_application',
                        onNihStatusUpdate: this.onNihStatusUpdate,
                        location: this.props.location,
                        validationError: showValidationMessages
                      }),
                      div({ className: 'col-lg-6 col-md-6 col-sm-6 col-xs-12 rp-group' }, [
                        label({ className: 'control-label' }, ['LinkedIn Profile']),
                        input({
                          type: 'text',
                          name: 'linkedIn',
                          id: 'inputLinkedIn',
                          value: linkedIn,
                          onChange: () => {},
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
                          onChange: () => {},
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
                          onChange: () => {},
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
                        value: investigator,
                        disabled: true,
                        className: step1.inputInvestigator.invalid && showValidationMessages ? 'form-control required-field-error' : 'form-control',
                        required: true
                      }),
                      span({
                        className: 'cancel-color required-field-error-span', isRendered: (step1.inputInvestigator.invalid) && (showValidationMessages)
                      }, ['Required field'])
                    ])
                  ])
                ]),

                h3({ className: 'rp-form-title access-color' }, ['DAR Renewal - Progress Report']),

                div({ className: 'form-group' }, [
                  div({ className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group' }, [
                    label({ className: 'control-label rp-title-question' }, [
                      '1.4 Progress Report* ',
                      span({}, [
                        'Please describe research progresses and intellectual properties resulting from analyzing the requested data in the box below. ',
                        br(),
                        'This is the second paragraph ',
                        a({ target: '_blank', href: 'https://www.ncbi.nlm.nih.gov/books/NBK482114/' }, ['this is a link'], '.')
                      ])
                    ])
                  ]),

                  div({ className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group' }, [
                    textarea({
                      value: this.state.formData.rus, onChange: () => {},
                      name: 'rus',
                      id: 'inputRUS',
                      className: 'form-control',
                      rows: '6',
                      required: true,
                      placeholder: 'Please limit your RUS to 2200 characters.',
                      disabled: this.state.formData.darCode !== null
                    }),
                  ])
                ]),

                div({ className: 'col-lg-12 col-md-12 col-sm-6 col-xs-12' }, [
                  label({ className: 'control-label rp-title-question' }, [
                    '1.5 Publications',
                    div({ isRendered: this.state.formData.checkCollaborator === true, className: 'display-inline italic' }, [' (optional)']),
                    span({ className: 'default-color' },
                      ['Please add publications resulting from the use of the requested datasets in the renewal application. Resulting publications from the requested dataset(s) should include the dbGaP accession number (i.e. PHS number) or DUOS ID if one is not aviaiable, and the recommended acknowledgment statement as described on the dbGaP study page. '])
                  ])
                ]),

                div({ className: 'col-lg-6 col-md-6 col-sm-6 col-xs-12 rp-group' }, [
                  label({ className: 'control-label' }, ['Title*']),
                  input({
                    type: 'text',
                    name: 'linkedIn',
                    id: 'inputLinkedIn',
                    value: linkedIn,
                    onChange: () => {},
                    disabled: false,
                    className: 'form-control',
                    required: true
                  })
                ]),

                div({ className: 'row no-margin' }, [
                  div({ className: 'col-lg-6 col-md-6 col-sm-6 col-xs-12' }, [
                    label({ className: 'control-label' }, ['Link*']),
                    input({
                      type: 'text',
                      name: 'orcid',
                      id: 'inputOrcid',
                      value: orcid,
                      onChange: () => {},
                      disabled: false,
                      className: 'form-control',
                      required: true
                    })
                  ])
                ]),

                div({ className: 'row no-margin' }, [
                  div({ className: 'col-lg-6 col-md-6 col-sm-6 col-xs-12' }, [
                    label({ className: 'control-label' }, ['Authors*']),
                    input({
                      type: 'text',
                      name: 'orcid',
                      id: 'inputOrcid',
                      value: orcid,
                      onChange: () => {},
                      disabled: false,
                      className: 'form-control',
                      required: true
                    })
                  ]),

                  div({ className: 'col-lg-6 col-md-6 col-sm-6 col-xs-12' }, [
                    label({ className: 'control-label' }, ['Submitted Date*']),
                    input({
                      type: 'text',
                      name: 'researcherGate',
                      id: 'inputResearcherGate',
                      value: researcherGate,
                      onChange: () => {},
                      disabled: false,
                      className: 'form-control',
                      required: true
                    })
                  ])
                ]),

                div({ className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group' }, [
                  label({ className: 'control-label rp-choice-questions' },
                    ['Did you cite the dataset(s) used in the publication?*'])
                ]),
                div({ className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group' }, [
                  YesNoRadioGroup({
                    value: this.state.formData.forProfit, onChange: () => {}, id: 'forProfit', name: 'forProfit',
                    required: true
                  })
                ]),

                div({ className: 'row no-margin' }, [
                  div({ className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group' }, [
                    label({ className: 'control-label default-color' },
                    )
                  ]),

                div(
                  {className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group rp-group'},
                  [
                    span({},
                      ['Please paste the citation used in your publication here*']),
                    input({
                      type: 'text',
                      name: 'projectTitle',
                      id: 'inputTitle',
                      maxLength: '256',
                      value: this.state.formData.projectTitle,
                        onChange: () => {},
                      className: (fp.isEmpty(this.state.formData.projectTitle) && showValidationMessages) ?
                        'form-control required-field-error' :
                        'form-control',
                      required: true,
                      disabled: this.state.formData.darCode !== null,
                    }),
                    span({
                      className: 'cancel-color required-field-error-span',
                      isRendered: fp.isEmpty(this.state.formData.projectTitle) && showValidationMessages,
                    },
                    ['Required field']),
                  ]),


                  div({ className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group' }, [
                    a({
                      id: 'link_downloadAgreement', href: 'BroadDataAccessAgreement.pdf', target: '_blank',
                      className: 'col-lg-4 col-md-4 col-sm-6 col-xs-12 btn-secondary btn-download-pdf hover-color'
                    }, [
                      span({ className: 'glyphicon glyphicon-download' }),
                      'Add Another Publication'
                    ])
                  ])
                ]),

                div({ className: 'col-lg-12 col-md-12 col-sm-6 col-xs-12' }, [
                  label({ className: 'control-label rp-title-question' }, [
                    '1.6 Presentations',
                    div({ isRendered: this.state.formData.checkCollaborator === true, className: 'display-inline italic' }, [' (optional)']),
                    span({ className: 'default-color' },
                      ['Please add publications resulting from the use of the requested datasets in the renewal application. Resulting publications from the requested dataset(s) should include the dbGaP accession number (i.e. PHS number) or DUOS ID if one is not aviaiable, and the recommended acknowledgment statement as described on the dbGaP study page. '])
                  ])
                ]),

                div({ className: 'col-lg-6 col-md-6 col-sm-6 col-xs-12 rp-group' }, [
                  label({ className: 'control-label' }, ['Title*']),
                  input({
                    type: 'text',
                    name: 'linkedIn',
                    id: 'inputLinkedIn',
                    value: linkedIn,
                    onChange: () => {},
                    disabled: false,
                    className: 'form-control',
                    required: true
                  })
                ]),

                div({ className: 'row no-margin' }, [
                  div({ className: 'col-lg-6 col-md-6 col-sm-6 col-xs-12' }, [
                    label({ className: 'control-label' }, ['Link*']),
                    input({
                      type: 'text',
                      name: 'orcid',
                      id: 'inputOrcid',
                      value: orcid,
                      onChange: () => {},
                      disabled: false,
                      className: 'form-control',
                      required: true
                    })
                  ])
                ]),

                div({ className: 'row no-margin' }, [
                  div({ className: 'col-lg-6 col-md-6 col-sm-6 col-xs-12' }, [
                    label({ className: 'control-label' }, ['Authors*']),
                    input({
                      type: 'text',
                      name: 'orcid',
                      id: 'inputOrcid',
                      value: orcid,
                      onChange: () => {},
                      disabled: false,
                      className: 'form-control',
                      required: true
                    })
                  ]),

                  div({ className: 'col-lg-6 col-md-6 col-sm-6 col-xs-12' }, [
                    label({ className: 'control-label' }, ['Presentation Date*']),
                    input({
                      type: 'text',
                      name: 'researcherGate',
                      id: 'inputResearcherGate',
                      value: researcherGate,
                      onChange: () => {},
                      disabled: false,
                      className: 'form-control',
                      required: true
                    })
                  ])
                ]),

                div({ className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group' }, [
                  label({ className: 'control-label rp-choice-questions' },
                    ['Did you cite the dataset(s) used in the publication?*'])
                ]),
                div({ className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group' }, [
                  YesNoRadioGroup({
                    value: this.state.formData.forProfit, onChange: () => {}, id: 'forProfit', name: 'forProfit',
                    required: true
                  })
                ]),

                div({ className: 'row no-margin' }, [
                  div({ className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group' }, [
                    label({ className: 'control-label default-color' },
                    )
                  ]),

                div(
                  {className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group rp-group'},
                  [
                    span({},
                      ['Please paste the citation used in your presentation here*']),
                    input({
                      type: 'text',
                      name: 'projectTitle',
                      id: 'inputTitle',
                      maxLength: '256',
                      value: this.state.formData.projectTitle,
                      onChange: () => {},
                      className: (fp.isEmpty(this.state.formData.projectTitle) && showValidationMessages) ?
                        'form-control required-field-error' :
                        'form-control',
                      required: true,
                      disabled: this.state.formData.darCode !== null,
                    }),
                    span({
                      className: 'cancel-color required-field-error-span',
                      isRendered: fp.isEmpty(this.state.formData.projectTitle) && showValidationMessages,
                    },
                    ['Required field']),
                  ]),

                  div({ className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group' }, [
                    a({
                      id: 'link_downloadAgreement', href: 'BroadDataAccessAgreement.pdf', target: '_blank',
                      className: 'col-lg-4 col-md-4 col-sm-6 col-xs-12 btn-secondary btn-download-pdf hover-color'
                    }, [
                      span({ className: 'glyphicon glyphicon-download' }),
                      'Add Another Presentation'
                    ])
                  ])
                ]),

                div({ className: 'form-group' }, [
                  div({ className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group' }, [
                    label({ className: 'control-label rp-title-question' }, [
                      '1.7 Data Management Incidents',
                      span({}, [
                        'Please describe any incidents related to mismanagement or misuse of the data below.'
                      ])
                    ])
                  ]),
                  div({ className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group' }, [
                    textarea({
                      value: this.state.formData.nonTechRus,
                      onChange: () => {},
                      name: 'nonTechRus',
                      id: 'inputNonTechRUS',
                      className: 'form-control',
                      rows: '3',
                      required: false,
                      placeholder: 'Please limit your non-technical summary to 1100 characters.',
                      disabled: this.state.formData.darCode !== null
                    }),
                  ])
                ]),

                div({ className: 'row no-margin' }, [
                  div({ className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12' }, [
                    a({ id: 'btn_next', onClick: this.step2, className: 'btn-primary f-right access-background' }, [
                      'Next Step', span({ className: 'glyphicon glyphicon-chevron-right', 'aria-hidden': 'true' })
                    ]),

                    a({
                      id: 'btn_save', isRendered: this.state.formData.darCode === null, onClick: () => {},
                      className: 'btn-secondary f-right access-color'
                    }, ['Save'])
                  ])
                ])
              ])
            ]),

            div({ isRendered: this.state.step === 2 }, [
              div({ className: 'col-lg-10 col-lg-offset-1 col-md-12 col-sm-12 col-xs-12' }, [
                fieldset({ disabled: this.state.formData.darCode !== null }, [

                  h3({ className: 'rp-form-title access-color' }, ['2. Data Access Request']),

                  div({ className: 'form-group' }, [
                    div({ className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group' }, [
                      label({ className: 'control-label rp-title-question' }, [
                        '2.1 Select Dataset(s)*',
                        span({},
                          ['Please start typing the Dataset Name, Sample Collection ID, or PI of the dataset(s) for which you would like to request access:'])
                      ])
                    ]),
                    div({ className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group' }, [
                      h(AsyncSelect, {
                        id: 'sel_datasets',
                        key: fp.isEmpty(this.state.formData.datasets) ? null : this.state.formData.datasets.value,
                        isDisabled: this.state.formData.darCode !== null,
                        isMulti: true,
                        loadOptions: (query, callback) => this.searchDataSets(query, callback),
                        onChange: () => {},
                        value: this.state.formData.datasets,
                        noOptionsMessage: () => this.state.optionMessage,
                        loadingMessage: () => this.state.optionMessage,
                        classNamePrefix: 'select',
                        placeholder: 'Dataset Name, Sample Collection ID, or PI',
                        className: (fp.isEmpty(this.state.formData.datasets) && showValidationMessages) ?
                          ' required-select-error select-autocomplete' :
                          'select-autocomplete'

                      }),
                      span({
                        className: 'cancel-color required-field-error-span',
                        isRendered: fp.isEmpty(this.state.formData.datasets) && showValidationMessages,
                      },
                      ['Required field']),
                    ])
                  ]),

                  div({className: 'form-group'}, [
                    div(
                      {className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group'},
                      [
                        label({className: 'control-label rp-title-question'}, [
                          '2.2 Descriptive Title of Project* ',
                          span({},
                            ['Please note that coordinated requests by collaborating institutions should each use the same title.']),
                        ]),
                      ]),
                    div(
                      {className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group rp-last-group'},
                      [
                        input({
                          type: 'text',
                          name: 'projectTitle',
                          id: 'inputTitle',
                          maxLength: '256',
                          value: this.state.formData.projectTitle,
                          onChange: () => {},
                          className: (fp.isEmpty(this.state.formData.projectTitle) && showValidationMessages) ?
                            'form-control required-field-error' :
                            'form-control',
                          required: true,
                          disabled: this.state.formData.darCode !== null,
                        }),
                        span({
                          className: 'cancel-color required-field-error-span',
                          isRendered: fp.isEmpty(this.state.formData.projectTitle) && showValidationMessages,
                        },
                        ['Required field']),
                      ]),
                  ]),

                  div({className: 'form-group'}, [
                    div(
                      {className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group'},
                      [
                        label({className: 'control-label rp-title-question'}, [
                          '2.3 Type of Research* ',
                          span({},
                            ['Please select one of the following options.']),
                        ]),
                      ]),
                    div({
                      style: {'marginLeft': '15px'},
                      className: 'row'
                    }, [
                      span({
                        className: 'cancel-color required-field-error-span',
                        isRendered: isTypeOfResearchInvalid && showValidationMessages,
                      }, [
                        'One of the following fields is required.', br(),
                        'Disease related studies require a disease selection.', br(),
                        'Other studies require additional details.'])
                    ]),

                    div(
                      {className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group'},
                      [
                        TypeOfResearch({
                          hmb: hmb,
                          hmbHandler: () => {},
                          poa: poa,
                          poaHandler: () => {},
                          diseases: diseases,
                          diseasesHandler: () => {},
                          disabled: (darCode !== null),
                          ontologies: ontologies,
                          ontologiesHandler: () => {},
                          other: other,
                          otherHandler: () => {},
                          otherText: otherText,
                          otherTextHandler: () => {}
                        })
                      ]),

                    div({className: 'form-group'}, [
                      div(
                        {className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group'},
                        [
                          label({className: 'control-label rp-title-question'},
                            [
                              '2.4 Research Designations ',
                              span({}, ['Select all applicable options.']),
                            ]),
                        ]),
                    ]),

                    div(
                      {className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group'},
                      [
                        div({className: 'checkbox'}, [
                          input({
                            checked: methods,
                            onChange: () => {},
                            id: 'checkMethods',
                            type: 'checkbox',
                            disabled: (this.state.formData.darCode !== null),
                            className: 'checkbox-inline rp-checkbox',
                            name: 'methods',
                          }),
                          label({
                            className: 'regular-checkbox rp-choice-questions',
                            htmlFor: 'checkMethods',
                          }, [
                            span({},
                              ['2.4.1 Methods development and validation studies: ']),
                            'The primary purpose of the research is to develop and/or validate new methods for analyzing or interpreting data (e.g., developing more powerful methods to detect epistatic, gene-environment, or other types of complex interactions in genome-wide association studies). Data will be used for developing and/or validating new methods.',
                          ]),
                        ]),
                      ]),

                    div(
                      {className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group'},
                      [
                        div({className: 'checkbox'}, [
                          input({
                            checked: controls,
                            onChange: () => {},
                            id: 'checkControls',
                            type: 'checkbox',
                            disabled: (this.state.formData.darCode !== null),
                            className: 'checkbox-inline rp-checkbox',
                            name: 'controls',
                          }),
                          label({
                            className: 'regular-checkbox rp-choice-questions',
                            htmlFor: 'checkControls',
                          }, [
                            span({}, ['2.4.2 Controls: ']),
                            'The reason for this request is to increase the number of controls available for a comparison group (e.g., a case-control study).',
                          ]),
                        ]),
                      ]),

                    div(
                      {className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group'},
                      [
                        div({className: 'checkbox'}, [
                          input({
                            checked: population,
                            onChange: () => {},
                            id: 'checkPopulation',
                            type: 'checkbox',
                            disabled: (this.state.formData.darCode !== null),
                            className: 'checkbox-inline rp-checkbox',
                            name: 'population',
                          }),
                          label({
                            className: 'regular-checkbox rp-choice-questions',
                            htmlFor: 'checkPopulation',
                          }, [
                            span({},
                              ['2.4.3 Population structure or normal variation studies: ']),
                            'The primary purpose of the research is to understand variation in the general population (e.g., genetic substructure of a population).',
                          ]),
                        ]),
                      ]),

                    div(
                      {className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group'},
                      [
                        div({className: 'checkbox'}, [
                          input({
                            checked: forProfit,
                            onChange: () => {},
                            id: 'checkForProfit',
                            type: 'checkbox',
                            disabled: (this.state.formData.darCode !== null),
                            className: 'checkbox-inline rp-checkbox',
                            name: 'forProfit',
                          }),
                          label({
                            className: 'regular-checkbox rp-choice-questions',
                            htmlFor: 'checkForProfit',
                          }, [
                            span({},
                              ['2.4.4 Commercial or For-Profit Purpose: ']),
                            'The primary purpose of the research is exclusively or partially for a commercial purpose',
                          ]),
                        ]),
                      ]),
                  ]),
                ]),

                div({className: 'form-group'}, [
                  div(
                    {className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group'},
                    [
                      label({className: 'control-label rp-title-question'}, [
                        '2.5 Research Use Statement (RUS)* ',
                        span({}, [
                          'A RUS is a brief description of the applicant’s proposed use of the dataset(s). The RUS will be reviewed by all parties responsible for data covered by this Data Access Request. Please note that if access is approved, you agree that the RUS, along with your name and institution, will be included on this website to describe your research project to the public.',
                          br(),
                          'Please enter your RUS in the area below. The RUS should be one or two paragraphs in length and include research objectives, the study design, and an analysis plan (including the phenotypic characteristics that will be tested for association with genetic variants). If you are requesting multiple datasets, please describe how you will use them. Examples of RUS can be found at ',
                          a({
                            target: '_blank',
                            href: 'https://www.ncbi.nlm.nih.gov/books/NBK482114/',
                          }, ['here'], '.'),
                        ]),
                      ]),
                    ]),
                  div(
                    {className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group'},
                    [
                      textarea({
                        value: this.state.formData.rus,
                        onChange: () => {},
                        name: 'rus',
                        id: 'inputRUS',
                        className: (fp.isEmpty(this.state.formData.rus) && showValidationMessages) ?
                          ' required-field-error form-control' :
                          'form-control',
                        rows: '6',
                        required: true,
                        placeholder: 'Please limit your RUS to 2200 characters.',
                        disabled: this.state.formData.darCode !== null,
                      }),
                      span({
                        className: 'cancel-color required-field-error-span',
                        isRendered: fp.isEmpty(this.state.formData.rus) && showValidationMessages,
                      },
                      ['Required field']),
                    ]),
                ]),

                div({className: 'form-group'}, [
                  div(
                    {className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group'},
                    [
                      label({className: 'control-label rp-title-question'}, [
                        '2.6 Non-Technical Summary* ',
                        span({}, [
                          'Please enter below a non-technical summary of your RUS suitable for understanding by the general public (written at a high school reading level or below).',
                        ]),
                      ]),
                    ]),
                  div(
                    {className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group'},
                    [
                      textarea({
                        value: this.state.formData.nonTechRus,
                        onChange: () => {},
                        name: 'nonTechRus',
                        id: 'inputNonTechRUS',
                        className: (fp.isEmpty(this.state.formData.nonTechRus) && showValidationMessages) ?
                          'required-field-error form-control' :
                          'form-control',
                        rows: '3',
                        required: true,
                        placeholder: 'Please limit your non-technical summary to 1100 characters.',
                        disabled: this.state.formData.darCode !== null,
                      }),
                      span(
                        {
                          className: 'cancel-color required-field-error-span',
                          isRendered: fp.isEmpty(this.state.formData.nonTechRus) && showValidationMessages,
                        },
                        ['Required field']),
                    ]),
                ]),

                div({ className: 'row no-margin' }, [
                  div({ className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12' }, [
                    a({ id: 'btn_prev', onClick: this.step1, className: 'btn-primary f-left access-background' }, [
                      span({ className: 'glyphicon glyphicon-chevron-left', 'aria-hidden': 'true' }), 'Previous Step'
                    ]),

                    a({ id: 'btn_next', onClick: this.step3, className: 'btn-primary f-right access-background' }, [
                      'Next Step', span({ className: 'glyphicon glyphicon-chevron-right', 'aria-hidden': 'true' })
                    ]),

                    a({
                      id: 'btn_save', isRendered: this.state.formData.darCode === null, onClick: () => {},
                      className: 'btn-secondary f-right access-color'
                    }, ['Save'])
                  ])
                ])
              ])
            ]),

            div({ isRendered: this.state.step === 3 }, [
              div({ className: 'col-lg-10 col-lg-offset-1 col-md-12 col-sm-12 col-xs-12' }, [
                fieldset({ disabled: this.state.formData.darCode !== null }, [

                  h3({ className: 'rp-form-title access-color' }, ['3. Research Purpose Statement']),

                  div({ className: 'form-group' }, [
                    div({ className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group' }, [
                      label({ className: 'control-label rp-title-question' },
                        ['3.1 In order to ensure appropriate review, please answer the questions below:'])
                    ]),
                    div({ className: 'row no-margin' }, [
                      span({
                        className: 'cancel-color required-field-error-span', isRendered: step3.inputPurposes.invalid && showValidationMessages,
                        style: { 'marginLeft': '15px' }
                      }, ['All fields are required'])
                    ]),
                    div({ className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group' }, [
                      label({ className: 'control-label rp-choice-questions' },
                        ['3.1.1 Will this data be used exclusively or partially for a commercial purpose?'])
                    ]),
                    div({ className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group' }, [
                      YesNoRadioGroup({
                        value: this.state.formData.forProfit, onChange: () => {}, id: 'forProfit', name: 'forProfit',
                        required: true
                      })
                    ]),

                    div({ className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group' }, [
                      label({ className: 'control-label rp-choice-questions' }, ['3.1.2 Please indicate if this study is limited to one gender?'])
                    ]),

                    div({ className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group' }, [
                      YesNoRadioGroup({
                        value: this.state.formData.oneGender, onChange: () => {}, id: 'oneGender', name: 'oneGender',
                        required: true
                      }),
                      div({
                        isRendered: this.state.formData.oneGender === 'true' || this.state.formData.oneGender === true,
                        className: 'multi-step-fields', disabled: (this.state.formData.darCode !== null)
                      }, [
                        span({}, ['Please specify']),
                        div({ className: 'radio-inline' }, [
                          genderLabels.map((option, ix) => {
                            return (
                              label({
                                key: 'gender' + ix,
                                onClick: () => {},
                                id: 'lbl_gender_' + ix,
                                htmlFor: 'rad_gender_' + ix,
                                className: 'radio-wrapper'
                              }, [
                                input({
                                  type: 'radio',
                                  id: 'rad_gender_' + ix,
                                  name: this.state.name,
                                  checked: this.state.formData.gender === genderValues[ix],
                                  onChange: () => { }
                                }),
                                span({ className: 'radio-check' }),
                                span({ className: 'radio-label' }, [genderLabels[ix]])
                              ])
                            );
                          })
                        ])
                      ])
                    ]),

                    div({ className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group' }, [
                      label({ className: 'control-label rp-choice-questions' },
                        ['3.1.3 Please indicate if this study is restricted to a  pediatric population (under the age of 18)?'])
                    ]),
                    div({ className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group' }, [
                      YesNoRadioGroup({
                        value: this.state.formData.pediatric, onChange: () => {}, id: 'pediatric', name: 'pediatric', required: true
                      })
                    ]),

                    div({ className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group' }, [
                      label({ className: 'control-label rp-choice-questions' },
                        ['3.1.4 Does the research aim involve the study of illegal behaviors (violence, domestic abuse, prostitution, sexual victimization)?'])
                    ]),
                    div({ className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group' }, [
                      YesNoRadioGroup({
                        value: this.state.formData.illegalBehavior, onChange: () => {}, id: 'illegalBehavior', name: 'illegalBehavior',
                        required: true
                      })
                    ]),

                    div({ className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group' }, [
                      label({ className: 'control-label rp-choice-questions' },
                        ['3.1.5 Does the research aim involve the study of alcohol or drug abuse, or abuse of other addictive products?'])
                    ]),
                    div({ className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group' }, [
                      YesNoRadioGroup({
                        value: this.state.formData.addiction, onChange: () => {}, id: 'addiction', name: 'addiction', required: true
                      })
                    ]),

                    div({ className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group' }, [
                      label({ className: 'control-label rp-choice-questions' },
                        ['3.1.6 Does the research aim involve the study of sexual preferences or sexually transmitted diseases?'])
                    ]),
                    div({ className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group' }, [
                      YesNoRadioGroup({
                        value: this.state.formData.sexualDiseases, onChange: () => {}, id: 'sexualDiseases', name: 'sexualDiseases',
                        required: true
                      })
                    ]),

                    div({ className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group' }, [
                      label({ className: 'control-label rp-choice-questions' },
                        ['3.1.7 Does the research aim involve the study of any stigmatizing illnesses?'])
                    ]),
                    div({ className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group' }, [
                      YesNoRadioGroup({
                        value: this.state.formData.stigmatizedDiseases, onChange: () => {}, id: 'stigmatizedDiseases',
                        name: 'stigmatizedDiseases', required: true
                      })
                    ]),

                    div({ className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group' }, [
                      label({ className: 'control-label rp-choice-questions' },
                        ['3.1.8 Does the study target a vulnerable population as defined in 456 CFR (children, prisoners, pregnant women, mentally disabled persons, or ["SIGNIFICANTLY"] economically or educationally disadvantaged persons)?'])
                    ]),

                    div({ className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group' }, [
                      YesNoRadioGroup({
                        value: this.state.formData.vulnerablePopulation, onChange: () => {}, id: 'vulnerablePopulation', name: 'vulnerablePopulation',
                        required: true
                      })
                    ]),

                    div({ className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group' }, [
                      label({ className: 'control-label rp-choice-questions' },
                        ['3.1.9 Does the research aim involve the study of Population Origins/Migration patterns?'])
                    ]),
                    div({ className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group' }, [
                      YesNoRadioGroup({
                        value: this.state.formData.populationMigration, onChange: () => {}, id: 'populationMigration', name: 'populationMigration',
                        required: true
                      })
                    ]),

                    div({ className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group' }, [
                      label({ className: 'control-label rp-choice-questions' },
                        ['3.1.10 Does the research aim involve the study of psychological traits, including intelligence, attention, emotion?'])
                    ]),
                    div({ className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group' }, [
                      YesNoRadioGroup({
                        value: this.state.formData.psychiatricTraits, onChange: () => {}, id: 'psychiatricTraits', name: 'psychiatricTraits',
                        required: true
                      })
                    ]),

                    div({ className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group' }, [
                      label({ className: 'control-label rp-choice-questions' },
                        ['3.1.11 Does the research correlate ethnicity, race, or gender with genotypic or other phenotypic variables, for purposes beyond biomedical or health-related research, or in ways that are not easily related to Health?'])
                    ]),
                    div({ className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group rp-last-group' }, [
                      YesNoRadioGroup({
                        value: this.state.formData.notHealth, onChange: () => {}, id: 'notHealth', name: 'notHealth', required: true
                      })
                    ])
                  ])
                ]),

                div({ className: 'row no-margin' }, [
                  div({ className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12' }, [
                    a({ id: 'btn_prev', onClick: this.step2, className: 'btn-primary f-left access-background' }, [
                      span({ className: 'glyphicon glyphicon-chevron-left', 'aria-hidden': 'true' }), 'Previous Step'
                    ]),

                    a({ id: 'btn_next', onClick: this.step4, className: 'btn-primary f-right access-background' }, [
                      'Next Step', span({ className: 'glyphicon glyphicon-chevron-right', 'aria-hidden': 'true' })
                    ]),

                    a({
                      id: 'btn_save', isRendered: this.state.formData.darCode === null, onClick: () => {},
                      className: 'f-right btn-secondary access-color'
                    }, ['Save'])
                  ])
                ])
              ])
            ]),

            div({ isRendered: this.state.step === 4 }, [
              div({ className: 'col-lg-10 col-lg-offset-1 col-md-12 col-sm-12 col-xs-12' }, [
                fieldset({ disabled: this.state.formData.darCode !== null }, [

                  h3({ className: 'rp-form-title access-color' }, ['4. Data Use Agreements']),

                  div({ className: 'form-group' }, [
                    div({ className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12' }, [
                      label({ className: 'control-label rp-title-question' }, [
                        '4.1 DUOS Library Card Data Access Agreement'
                      ])
                    ]),

                    div({ className: 'row no-margin' }, [
                      div({ className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group' }, [
                        label({ className: 'control-label default-color' },
                          ['By submitting this data access request, you agree to comply with all terms relevant to Authorized Users put forth in the agreement.'])
                      ]),

                      div({ className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group' }, [
                        a({
                          id: 'link_downloadAgreement', href: '/DUOSLibraryCardAgreement_10.14.2020.pdf', target: '_blank',
                          className: 'col-lg-4 col-md-4 col-sm-6 col-xs-12 btn-secondary btn-download-pdf hover-color'
                        }, [
                          span({ className: 'glyphicon glyphicon-download' }),
                          'DUOS Library Card Agreement'
                        ])
                      ]),

                      div({ className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group' }, [
                        p({ className: 'rp-agreement' },
                          ['For your request to be reviewed, your Signing Official must authorize you by sending a signed Library Card data access agreement']),
                        a({ href: '/home_about', target: '_blank' }, '(instructions here)')
                      ])
                    ]),

                    div({ className: 'row no-margin' }, [
                      div({ className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12' }, [
                        label({ className: 'control-label rp-title-question' }, ['4.2 Attestation Statement'])
                      ]),

                      div({ className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12' }, [
                        label({ className: 'control-label default-color' }, ['I attest to the following:']),

                        ol({ className: 'rp-agreement rp-last-group' }, [
                          li({}, ['Data will only be used for approved research']),
                          li({},
                            ['Data confidentiality will be protected and the investigator will never make any attempt at "re-identification"']),
                          li({},
                            ['All applicable laws, local institutional policies, and terms and procedures specific to the study’s data access policy will be followed.']),
                          li({}, ['No attempts will be made to identify individual study participants from whom data were obtained.']),
                          li({}, ['Data will not be sold or shared with third parties.']),
                          li({},
                            ['The contributing investigator(s) who conducted the original study and the funding organizations involved in supporting the original study will be acknowledged in publications resulting from the analysis of those data.'])
                        ])
                      ])
                    ]),

                    div({ className: 'row no-margin' }, [
                      div({ isRendered: showValidationMessages, className: 'rp-alert' }, [
                        Alert({ id: 'formErrors', type: 'danger', title: 'Please, complete all required fields.' })
                      ]),

                      div({ isRendered: problemSavingRequest, className: 'rp-alert' }, [
                        Alert({
                          id: 'problemSavingRequest', type: 'danger',
                          title: 'Some errors occurred, Data Access Request Renewal couldn\'t be created.'
                        })
                      ])
                    ])
                  ])
                ]),

                div({ className: 'row no-margin' }, [
                  div({ className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12' }, [
                    a({ id: 'btn_prev', onClick: this.step3, className: 'f-left btn-primary access-background' }, [
                      span({ className: 'glyphicon glyphicon-chevron-left', 'aria-hidden': 'true' }), 'Previous Step'
                    ]),

                    a({
                      id: 'btn_submit', isRendered: this.state.formData.darCode === null, onClick: () => {},
                      className: 'f-right btn-primary access-background bold'
                    }, ['Attest and Send']),

                    ConfirmationDialog({
                      title: 'Data Request Confirmation', disableOkBtn: this.state.disableOkBtn, disableNoBtn: this.state.disableOkBtn,
                      color: 'access', showModal: this.state.showDialogSubmit, action: { label: 'Yes', handler: () => {} }
                    }, [div({ className: 'dialog-description' }, ['Are you sure you want to send this Data Access Request Renewal?'])]),
                    h(ReactTooltip, { id: 'tip_clearNihAccount', place: 'right', effect: 'solid', multiline: true, className: 'tooltip-wrapper' }),

                    a({
                      id: 'btn_save', isRendered: this.state.formData.darCode === null, onClick: () => {},
                      className: 'f-right btn-secondary access-color'
                    }, ['Save'])
                  ])
                ])
              ])
            ])
          ])
        ])
      ])
    );
  }
}

export default DataAccessRequestRenewal;
