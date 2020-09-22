import { Component } from 'react';
import { a, br, div, fieldset, form, h, h3, hr, i, input, label, span, textarea } from 'react-hyperscript-helpers';
import Mailto from 'react-protected-mailto';
import { Link } from 'react-router-dom';
import ReactTooltip from 'react-tooltip';
import { Alert } from '../components/Alert';
import { ConfirmationDialog } from '../components/ConfirmationDialog';
import { Notification } from '../components/Notification';
import { PageHeading } from '../components/PageHeading';
import { DAR, Researcher } from '../libs/ajax';
import { NotificationService } from '../libs/notificationService';
import { Storage } from '../libs/storage';
import { TypeOfResearch } from './dar_application/TypeOfResearch';
import * as fp from 'lodash/fp';

import './DataAccessRequestApplication.css';


const noOptionMessage = 'Start typing a Dataset Name, Sample Collection ID, or PI';

class DatasetRegistration extends Component {

  constructor(props) {
    super(props);
    this.dialogHandlerSave = this.dialogHandlerSave.bind(this);
    this.setShowDialogSave = this.setShowDialogSave.bind(this);
    this.state = {
      otherFormData: {
        dataCustodian: '',
        datasetName: '',
        datasetRepoUrl: '',
        dataType: '',
        species: '',
        phenotype: '',
        nrParticipants: '',
        description: '',
        dac: '',
        pubRef: ''
      },
      nihValid: false,
      disableOkBtn: false,
      showValidationMessages: false,
      optionMessage: noOptionMessage,
      file: {
        name: ''
      },
      showModal: false,
      completed: '',
      showDialogSubmit: false,
      showDialogSave: false,
      formData: {
        // datasets: [],
        darCode: null,
        checkCollaborator: false,
        rus: '',
        nonTechRus: '',
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
        pediatric: '',
        illegalBehavior: '',
        addiction: '',
        sexualDiseases: '',
        stigmatizedDiseases: '',
        vulnerablePopulation: '',
        populationMigration: '',
        psychiatricTraits: '',
        notHealth: '',
        researcher: ''
      },
      problemSavingRequest: false
    };

    this.handleOpenModal = this.handleOpenModal.bind(this);
    this.handleCloseModal = this.handleCloseModal.bind(this);
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
    this.props.history.push('/dataset_registration');
    ReactTooltip.rebuild();
    const notificationData = await NotificationService.getBannerObjectById('eRACommonsOutage');
    this.setState(prev => {
      prev.notificationData = notificationData;
      return prev;
    });
  }

  async init() {
    let formData = Storage.getData('dataset_registration') === null ? this.state.formData : Storage.getData('dataset_registration');
    Storage.removeData('dataset_registration');
    // if (this.props.location.props !== undefined && this.props.location.props.formData !== undefined) {
      // if (this.props.location.props.formData.darCode !== undefined) {
      //   formData = this.props.location.props.formData;
        formData.ontologies = this.getOntologies(formData);
        console.log(formData.ontologies)
      // } else if (this.props.location.props.formData.datasetIds !== undefined) {
        // set datasets sent by data set catalog
        // formData.datasets = this.processDataSet(this.props.location.props.formData.datasetIds);
      // }
    // }
    let currentUserId = Storage.getCurrentUser().dacUserId;
    let rpProperties = await Researcher.getPropertiesByResearcherId(currentUserId);
    // formData.darCode = formData.darCode === undefined ? null : formData.darCode;
    // formData.partialDarCode = formData.partialDarCode === undefined ? null : formData.partialDarCode;

    formData.researcher = rpProperties.profileName != null ? rpProperties.profileName : Storage.getCurrentUser().displayName ;

    formData.userId = Storage.getCurrentUser().dacUserId;

    // if (formData.darCode !== null || formData.partialDarCode !== null) {
    //   formData.datasets = this.processDataSet(formData.datasetIds);
    // }
    let completed = false;
    if (formData.darCode !== null) {
      completed = '';
    } else if (rpProperties.completed !== undefined) {
      completed = JSON.parse(rpProperties.completed);
    }
    this.setState(prev => {
      prev.completed = completed;
      prev.formData = formData;
      if (formData.nameDAA !== '') {
        prev.file.name = formData.nameDAA;
      }
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

  handleOpenModal() {
    this.setState({ showModal: true });
  };

  handleCloseModal() {
    this.setState({ showModal: false });
  };

  handleChange = (e) => {
    const field = e.target.name;
    const value = e.target.value;
    this.setState(prev => {
      prev.formData[field] = value;
      return prev;
    });
  };

  handleCheckboxChange = (e) => {
    const field = e.target.name;
    const value = e.target.checked;
    this.setState(prev => {
      prev.formData[field] = value;
      return prev;
    });
  };

  attestAndSave = (e) => {
    this.setState({ showDialogSubmit: true });
  };

  isValid(value) {
    let isValid = false;
    if (value !== '' && value !== null && value !== undefined) {
      isValid = true;
    }
    return isValid;
  };

  partialSave = (e) => {
    this.setState({ showDialogSave: true });
  };

  dialogHandlerSubmit = (answer) => (e) => {
    if (answer === true) {
      let ontologies = [];
      for (let ontology of this.state.formData.ontologies) {
        ontologies.push(ontology.item);
      }
      this.setState(prev => {
        if (ontologies.length > 0) {
          prev.formData.ontologies = ontologies;
        }
        for (var key in prev.formData) {
          if (prev.formData[key] === '') {
            prev.formData[key] = undefined;
          }

        }
        return prev;
      }, () => {
        let formData = this.state.formData;
        let ds = [];
        // this.state.formData.datasets.forEach(dataset => {
        //   ds.push(dataset.value);
        // });
        formData.datasetIds = ds;
        formData.userId = Storage.getCurrentUser().dacUserId;
        this.setState(prev => {
          prev.disableOkBtn = true;
          return prev;
        });
        // DAR.postDAA(this.state.file.name, this.state.file, '').then(response => {
        //   formData.urlDAA = response.urlDAA;
        //   formData.nameDAA = response.nameDAA;
        //   if (formData.darCode !== undefined && formData.darCode !== null) {
        //     DAR.updateDar(formData, formData.darCode).then(response => {
        //       this.setState({ showDialogSubmit: false });
        //       this.props.history.push('researcher_console');
        //     });
        //   } else {
        //     DAR.postDataAccessRequest(formData).then(response => {
        //       this.setState({ showDialogSubmit: false });
        //       this.props.history.push('researcher_console');
        //     }).catch(e =>
        //       this.setState(prev => {
        //         prev.problemSavingRequest = true;
        //         return prev;
        //       }));
        //   }
        // });
      });
    } else {
      this.setState({ showDialogSubmit: false });
    }
  };

  setShowDialogSave(value) {
    this.setState(prev => {
      prev.showDialogSave = value;
      prev.disableOkBtn = false;
      return prev;
    });
  };

  dialogHandlerSave = (answer) => (e) => {
    this.setState(prev => {
      prev.disableOkBtn = true;
      return prev;
    });
    if (answer === true) {
      let ontologies = [];
      for (let ontology of this.state.formData.ontologies) {
        ontologies.push(ontology.item);
      }
      // let datasets = this.state.formData.datasets.map(function(item) {
      //   return {
      //     id: item.value,
      //     concatenation: item.label
      //   };
      // });
      this.setState(prev => {
        // prev.formData.datasetIds = datasets;
        prev.formData.ontologies = ontologies;
        return prev;
      }, () => this.savePartial());
    } else {
      this.setShowDialogSave(false);
    }
  };

  savePartial() {
    if (this.state.file !== undefined && this.state.file.name !== '') {
      DAR.postDAA(this.state.file.name, this.state.file, '').then(response => {
        this.saveDAR(response);
      });
    } else {
      this.saveDAR(null);
    }
  };

  saveDAR(response) {
    let formData = this.state.formData;
    if (response !== null) {
      formData.urlDAA = response.urlDAA;
      formData.nameDAA = response.nameDAA;
    }
    if (formData.partialDarCode === null) {
      // DAR.postPartialDarRequest(formData).then(resp => {
      //   this.setShowDialogSave(false);
      //   this.props.history.push('researcher_console');
      // });
    } else {
      // DAR.updatePartialDarRequest(formData).then(resp => {
      //   this.setShowDialogSave(false);
      //   this.props.history.push({ pathname: 'researcher_console' });
      // });
    }
  }

  /**
   * HMB, POA, Diseases, and Other/OtherText are all mutually exclusive
   */

  isTypeOfResearchInvalid = () => {
    const valid = (
      this.state.formData.hmb === true ||
      this.state.formData.poa === true ||
      (this.state.formData.diseases === true && !fp.isEmpty(this.state.formData.ontologies)) ||
      (this.state.formData.other === true && !fp.isEmpty(this.state.formData.otherText))
    );
    return !valid;
  };

  setHmb = () => {
    this.setState(prev => {
      prev.formData.hmb = true;
      prev.formData.poa = false;
      prev.formData.diseases = false;
      prev.formData.other = false;
      prev.formData.otherText = '';
      prev.formData.ontologies = [];
      return prev;
    });
  };

  setPoa = () => {
    this.setState(prev => {
      prev.formData.hmb = false;
      prev.formData.poa = true;
      prev.formData.diseases = false;
      prev.formData.other = false;
      prev.formData.otherText = '';
      prev.formData.ontologies = [];
      return prev;
    });
  };

  setDiseases = () => {
    this.setState(prev => {
      prev.formData.hmb = false;
      prev.formData.poa = false;
      prev.formData.diseases = true;
      prev.formData.other = false;
      prev.formData.otherText = '';
      return prev;
    });
  };

  onOntologiesChange = (data) => {
    this.setState(prev => {
      prev.formData.ontologies = data;
      return prev;
    });
  };

  setOther = () => {
    this.setState(prev => {
      prev.formData.hmb = false;
      prev.formData.poa = false;
      prev.formData.diseases = false;
      prev.formData.other = true;
      prev.formData.ontologies = [];
      return prev;
    });
  };

  setOtherText = (e) => {
    const value = e.target.value;
    this.setState(prev => {
      prev.formData.otherText = value;
      return prev;
    });
  };

  back = (e) => {
    this.props.history.goBack();
  };

  render() {

    const {
      publicAccess = false,
      hmb = false,
      poa = false,
      diseases = false,
      other = false,
      otherText = '',
      genetic = false,
      forProfit = false,
      publication = false,
      collaboration = false,
      ethics = false,
      geographic = false,
      moratorium = false,
      methods = false,
      populationMigration = false
    } = this.state.formData;
    const { ontologies } = this.state;

    const { problemSavingRequest, showValidationMessages } = this.state;
    const isTypeOfResearchInvalid = this.isTypeOfResearchInvalid();

    const profileUnsubmitted = span({}, [
      'Please make sure ',
      h(Link, { to: '/profile', className: 'hover-color' }, ['Your Profile']),
      ' is updated, as it will be linked to your dataset for future correspondence'
    ]);

    return (

      div({ className: 'container' }, [
        div({ className: 'col-lg-10 col-lg-offset-1 col-md-12 col-sm-12 col-xs-12' }, [
          div({ className: 'row no-margin' }, [
            Notification({notificationData: this.state.notificationData}),
            div({
              className: ( 'col-lg-12 col-md-12 col-sm-12 ' )
            }, [
              PageHeading({
                id: 'requestApplication', imgSrc: '/images/icon_dataset_add.png', iconSize: 'medium', color: 'dataset',
                title: 'Dataset Registration',
                description: 'This is an easy way to register a dataset in DUOS!'
              })
            ])
          ]),
          hr({ className: 'section-separator' }),
        ]),

        form({ name: 'form', 'noValidate': true }, [
          div({ id: 'form-views' }, [
            ConfirmationDialog({
              title: 'Save changes?', disableOkBtn: this.state.disableOkBtn, disableNoBtn: this.state.disableOkBtn, color: 'dataset',
              showModal: this.state.showDialogSave, action: { label: 'Yes', handler: this.dialogHandlerSave }
            }, [
              div({ className: 'dialog-description' },
                ['Are you sure you want to save this Dataset Registration? Previous changes will be overwritten.'])
            ]),

            div({ }, [
              div({ className: 'col-lg-10 col-lg-offset-1 col-md-12 col-sm-12 col-xs-12' }, [
                fieldset({ disabled: this.state.formData.darCode !== null }, [

                  div({ isRendered: this.state.completed === false, className: 'rp-alert' }, [
                    Alert({ id: 'profileUnsubmitted', type: 'danger', title: profileUnsubmitted })
                  ]),

                  h3({ className: 'rp-form-title dataset-color' }, ['1. Dataset Information']),

                  div({ className: 'form-group' }, [
                    div({ className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group' }, [
                      label({ className: 'control-label rp-title-question dataset-color' }, ['1.1 Data Custodian*'])
                    ]),

                    div({ className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group' }, [
                      input({
                        type: 'text',
                        name: 'researcher',
                        id: 'inputResearcher',
                        value: this.state.formData.researcher,
                        disabled: true,
                        className: showValidationMessages ? 'form-control required-field-error' : 'form-control',
                        required: true
                      }),
                      span({
                        isRendered: (showValidationMessages), className: 'cancel-color required-field-error-span'
                      }, ['Required field'])
                    ])
                  ]),

                  div({className: 'form-group'}, [
                    div(
                      {className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group'},
                      [
                        label({className: 'control-label rp-title-question dataset-color'}, [
                          '1.2 Dataset Name* ',
                          span({},
                            ['Please provide a publicly displayable name for the dataset']),
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
                          value: this.state.otherFormData.datasetName,
                          onChange: this.handleChange,
                          className: (fp.isEmpty(this.state.otherFormData.datasetName) && showValidationMessages) ?
                            'form-control required-field-error' :
                            'form-control',
                          required: true,
                          disabled: this.state.formData.darCode !== null,
                        }),
                        span({
                          className: 'cancel-color required-field-error-span',
                          isRendered: fp.isEmpty(this.state.otherFormData.datasetName) && showValidationMessages,
                        },
                        ['Required field']),
                      ])
                  ]),

                  div({className: 'form-group'}, [
                    div(
                      {className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group'},
                      [
                        label({className: 'control-label rp-title-question dataset-color'}, [
                          '1.3 Dataset Repository URL* ',
                          span({},
                            ['Please provide the URL at which approved requestors can access the data']),
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
                          value: this.state.otherFormData.datasetRepoUrl,
                          onChange: this.handleChange,
                          className: (fp.isEmpty(this.state.otherFormData.datasetRepoUrl) && showValidationMessages) ?
                            'form-control required-field-error' :
                            'form-control',
                          required: true,
                          disabled: this.state.formData.darCode !== null,
                        }),
                        span({
                          className: 'cancel-color required-field-error-span',
                          isRendered: fp.isEmpty(this.state.otherFormData.datasetRepoUrl) && showValidationMessages,
                        },
                        ['Required field']),
                      ])
                  ]),

                  div({className: 'form-group'}, [
                    div(
                      {className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group'},
                      [
                        label({className: 'control-label rp-title-question dataset-color'}, [
                          '1.4 Data Type* ',
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
                          value: this.state.otherFormData.dataType,
                          onChange: this.handleChange,
                          className: (fp.isEmpty(this.state.otherFormData.dataType) && showValidationMessages) ?
                            'form-control required-field-error' :
                            'form-control',
                          required: true,
                          disabled: this.state.formData.darCode !== null,
                        }),
                        span({
                          className: 'cancel-color required-field-error-span',
                          isRendered: fp.isEmpty(this.state.otherFormData.dataType) && showValidationMessages,
                        },
                        ['Required field']),
                      ])
                  ]),

                  div({className: 'form-group'}, [
                    div(
                      {className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group'},
                      [
                        label({className: 'control-label rp-title-question dataset-color'}, [
                          '1.5 Species* ',
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
                          value: this.state.otherFormData.species,
                          onChange: this.handleChange,
                          className: (fp.isEmpty(this.state.otherFormData.species) && showValidationMessages) ?
                            'form-control required-field-error' :
                            'form-control',
                          required: true,
                          disabled: this.state.formData.darCode !== null,
                        }),
                        span({
                          className: 'cancel-color required-field-error-span',
                          isRendered: fp.isEmpty(this.state.otherFormData.species) && showValidationMessages,
                        },
                        ['Required field']),
                      ])
                  ]),

                  div({className: 'form-group'}, [
                    div(
                      {className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group'},
                      [
                        label({className: 'control-label rp-title-question dataset-color'}, [
                          '1.6 Phenotype/Indication* ',
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
                          value: this.state.otherFormData.phenotype,
                          onChange: this.handleChange,
                          className: (fp.isEmpty(this.state.otherFormData.phenotype) && showValidationMessages) ?
                            'form-control required-field-error' :
                            'form-control',
                          required: true,
                          disabled: this.state.formData.darCode !== null,
                        }),
                        span({
                          className: 'cancel-color required-field-error-span',
                          isRendered: fp.isEmpty(this.state.otherFormData.projectTitle) && showValidationMessages,
                        },
                        ['Required field']),
                      ])
                  ]),

                  div({className: 'form-group'}, [
                    div(
                      {className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group'},
                      [
                        label({className: 'control-label rp-title-question dataset-color'}, [
                          '1.7 # of Participants* ',
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
                          value: this.state.otherFormData.nrParticipants,
                          onChange: this.handleChange,
                          className: (fp.isEmpty(this.state.otherFormData.nrParticipants) && showValidationMessages) ?
                            'form-control required-field-error' :
                            'form-control',
                          required: true,
                          disabled: this.state.formData.darCode !== null,
                        }),
                        span({
                          className: 'cancel-color required-field-error-span',
                          isRendered: fp.isEmpty(this.state.otherFormData.nrParticipants) && showValidationMessages,
                        },
                        ['Required field']),
                      ])
                  ]),

                  div({className: 'form-group'}, [
                    div(
                      {className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group'},
                      [
                        label({className: 'control-label rp-title-question dataset-color'}, [
                          '1.8 Dataset Description* ',
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
                          value: this.state.otherFormData.description,
                          onChange: this.handleChange,
                          className: (fp.isEmpty(this.state.otherFormData.description) && showValidationMessages) ?
                            'form-control required-field-error' :
                            'form-control',
                          required: true,
                          disabled: this.state.formData.darCode !== null,
                        }),
                        span({
                          className: 'cancel-color required-field-error-span',
                          isRendered: fp.isEmpty(this.state.otherFormData.description) && showValidationMessages,
                        },
                        ['Required field']),
                      ])
                  ]),

                  div({className: 'form-group'}, [
                    div(
                      {className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group'},
                      [
                        label({className: 'control-label rp-title-question dataset-color'}, [
                          '1.9 Data Access Committee* ',
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
                          value: this.state.otherFormData.dac,
                          onChange: this.handleChange,
                          className: (fp.isEmpty(this.state.otherFormData.dac) && showValidationMessages) ?
                            'form-control required-field-error' :
                            'form-control',
                          required: true,
                          disabled: this.state.formData.darCode !== null,
                        }),
                        span({
                          className: 'cancel-color required-field-error-span',
                          isRendered: fp.isEmpty(this.state.otherFormData.dac) && showValidationMessages,
                        },
                        ['Required field']),
                      ])
                  ]),

                  div({className: 'form-group'}, [
                    div(
                      {className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group'},
                      [
                        label({className: 'control-label rp-title-question dataset-color'}, [
                          '1.10 Publication Reference* ',
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
                          value: this.state.otherFormData.pubRef,
                          onChange: this.handleChange,
                          className: (fp.isEmpty(this.state.otherFormData.pubRef) && showValidationMessages) ?
                            'form-control required-field-error' :
                            'form-control',
                          required: true,
                          disabled: this.state.formData.darCode !== null,
                        }),
                        span({
                          className: 'cancel-color required-field-error-span',
                          isRendered: fp.isEmpty(this.state.otherFormData.pubRef) && showValidationMessages,
                        },
                        ['Required field']),
                      ])
                  ]),
                ]),


                h3({ className: 'rp-form-title dataset-color' }, ['2. Data Use Terms']),

                div({className: 'form-group'}, [
                  div(
                    {className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group'},
                    [
                      label({className: 'control-label rp-title-question dataset-color'}, [
                        '2.1 Primary Data Use Terms* ',
                        span({},
                          ['Please select one of the following options.']),

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
                              hmbHandler: this.setHmb,
                              poa: poa,
                              poaHandler: this.setPoa,
                              diseases: diseases,
                              diseasesHandler: this.setDiseases,
                              ontologies: ontologies,
                              ontologiesHandler: this.onOntologiesChange,
                              other: other,
                              otherHandler: this.setOther,
                              otherText: otherText,
                              otherTextHandler: this.setOtherText
                            })
                          ]),

                        div({className: 'form-group'}, [
                          div(
                            {className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group'},
                            [
                              label({className: 'control-label rp-title-question dataset-color'},
                                [
                                  '2.4 Secondary Data Use Terms ',
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
                                onChange: this.handleCheckboxChange,
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
                                span({ classname: 'access-color'},
                                  ['2.4.1 No methods development or validation studies (NMDS): ']),
                                'Use for methods development research (e.g., development of software or algorithms) is only permissible within the bounds of other use limitations.',
                              ]),
                            ]),
                          ]),

                        div(
                          {className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group'},
                          [
                            div({className: 'checkbox'}, [
                              input({
                                checked: genetic,
                                onChange: this.handleCheckboxChange,
                                id: 'checkControls',
                                type: 'checkbox',
                                disabled: (this.state.formData.darCode !== null),
                                className: 'checkbox-inline rp-checkbox',
                                name: 'genetic',
                              }),
                              label({
                                className: 'regular-checkbox rp-choice-questions',
                                htmlFor: 'checkControls',
                              }, [
                                span({}, ['2.4.2 Genetic Studies Only (GSO): ']),
                                'Use is limited to genetic studies only',
                              ]),
                            ]),
                          ]),

                        div(
                          {className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group'},
                          [
                            div({className: 'checkbox'}, [
                              input({
                                checked: publication,
                                onChange: this.handleCheckboxChange,
                                id: 'checkPublication',
                                type: 'checkbox',
                                disabled: (this.state.formData.darCode !== null),
                                className: 'checkbox-inline rp-checkbox',
                                name: 'publication',
                              }),
                              label({
                                className: 'regular-checkbox rp-choice-questions',
                                htmlFor: 'checkPublication',
                              }, [
                                span({},
                                  ['2.4.3 Publication Required (PUB): ']),
                                'Approved users are required to make results of studies using the data available to the larger scientific community.',
                              ]),
                            ]),
                          ]),

                        div(
                          {className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group'},
                          [
                            div({className: 'checkbox'}, [
                              input({
                                checked: collaboration,
                                onChange: this.handleCheckboxChange,
                                id: 'checkCollaboration',
                                type: 'checkbox',
                                disabled: (this.state.formData.darCode !== null),
                                className: 'checkbox-inline rp-checkbox',
                                name: 'collaboration',
                              }),
                              label({
                                className: 'regular-checkbox rp-choice-questions',
                                htmlFor: 'checkCollaboration',
                              }, [
                                span({},
                                  ['2.4.4 Collaboration Required (COL): ']),
                                'Approved users are required to collaborate with the primary study investigators',
                              ]),
                            ]),
                          ]),

                        div(
                          {className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group'},
                          [
                            div({className: 'checkbox'}, [
                              input({
                                checked: ethics,
                                onChange: this.handleCheckboxChange,
                                id: 'checkEthics',
                                type: 'checkbox',
                                disabled: (this.state.formData.darCode !== null),
                                className: 'checkbox-inline rp-checkbox',
                                name: 'ethics',
                              }),
                              label({
                                className: 'regular-checkbox rp-choice-questions',
                                htmlFor: 'checkEthics',
                              }, [
                                span({},
                                  ['2.4.5 Ethics Approval Required (IRB): ']),
                                'Approved users are required to provide documentation of local IRB/REB approval.',
                              ]),
                            ]),
                          ]),

                        div(
                          {className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group'},
                          [
                            div({className: 'checkbox'}, [
                              input({
                                checked: geographic,
                                onChange: this.handleCheckboxChange,
                                id: 'checkPopulation',
                                type: 'checkbox',
                                disabled: (this.state.formData.darCode !== null),
                                className: 'checkbox-inline rp-checkbox',
                                name: 'geographic',
                              }),
                              label({
                                className: 'regular-checkbox rp-choice-questions',
                                htmlFor: 'checkPopulation',
                              }, [
                                span({},
                                  ['2.4.6 Geographic Restriction (GS-) ']),
                                'Use limited to be within the specified geographic area',
                              ]),
                            ]),
                          ]),

                        div(
                          {className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group'},
                          [
                            div({className: 'checkbox'}, [
                              input({
                                checked: moratorium,
                                onChange: this.handleCheckboxChange,
                                id: 'checkMoratorium',
                                type: 'checkbox',
                                disabled: (this.state.formData.darCode !== null),
                                className: 'checkbox-inline rp-checkbox',
                                name: 'moratorium',
                              }),
                              label({
                                className: 'regular-checkbox rp-choice-questions',
                                htmlFor: 'checkMoratorium',
                              }, [
                                span({},
                                  ['2.4.7 Publication Moratorium (MOR) ']),
                                'Approved users are required to withhold from publishing until the specified date',
                              ]),
                            ]),
                          ]),

                        div(
                          {className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group'},
                          [
                            div({className: 'checkbox'}, [
                              input({
                                checked: populationMigration,
                                onChange: this.handleCheckboxChange,
                                id: 'checkPopulationMigration',
                                type: 'checkbox',
                                disabled: (this.state.formData.darCode !== null),
                                className: 'checkbox-inline rp-checkbox',
                                name: 'populationMigration',
                              }),
                              label({
                                className: 'regular-checkbox rp-choice-questions',
                                htmlFor: 'checkPopulationMigration',
                              }, [
                                span({},
                                  ['2.4.8 No Populations Origins or Ancestry Research (NPOA)']),
                                'Use for Populations, Origins, or Ancestry Research is prohibited',
                              ]),
                            ]),
                          ]),

                        div(
                          {className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group'},
                          [
                            div({className: 'checkbox'}, [
                              input({
                                checked: forProfit,
                                onChange: this.handleCheckboxChange,
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
                                  ['2.4.9 Non-Profit Use Only (NPU): ']),
                                'The data cannot be used by for-profit organizations nor for commercial research purposes',
                              ]),
                            ]),
                          ]),
                      ]),
                    ]),

                  div({className: 'form-group'}, [
                    div(
                      {className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group'},
                      [
                        label({className: 'control-label rp-title-question dataset-color'}, [
                          '2.5 Other Data Use Terms ',
                          span({}, [
                            'If there are additional data use terms governing the future use of this dataset, please include them here.',
                            br(),
                            'Note, terms entered below will not be able to be structured with the Data Use Ontology, which facilitates downstream access management. Please only enter additional terms below if you are certain they should govern all future data access request. If you have questions, please reach out to the DUOS support team ',
                            span( [h(Mailto, { email: 'duos-support@broadinstitute.zendesk.com' })]),
                          ]),
                        ]),
                      ]),
                    div(
                      {className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group'},
                      [
                        textarea({
                          value: this.state.formData.rus,
                          onChange: this.handleChange,
                          name: 'rus',
                          id: 'inputRUS',
                          className: (fp.isEmpty(this.state.formData.rus) && showValidationMessages) ?
                            ' required-field-error form-control' :
                            'form-control',
                          rows: '6',
                          required: true,
                          placeholder: 'Please limit your other data use terms to 1100 characters.',
                          disabled: this.state.formData.darCode !== null,
                        }),
                        span({
                          className: 'cancel-color required-field-error-span',
                          isRendered: fp.isEmpty(this.state.formData.rus) && showValidationMessages,
                        },
                        ['Required field']),
                      ]),
                  ]),
                ]),


                h3({ className: 'rp-form-title dataset-color' }, ['3. Dataset Registration Agreements']),

                div({ className: 'form-group' }, [
                  div({ className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12' }, [
                    label({ className: 'control-label rp-title-question dataset-color' }, [
                      '3.1 DUOS Dataset Registration Agreement'
                    ])
                  ]),

                  div({ className: 'row no-margin' }, [
                    div({ className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group' }, [
                      label({ className: 'control-label default-color' },
                        ['By submitting this dataset registration, you agree to comply with all terms relevant to Dataset Custodians put forth in the agreement.'])
                    ]),

                    div({ className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group' }, [
                      a({
                        id: 'link_downloadAgreement', href: '/duos_librarycardagreementtemplate_rev_2020-04-14.pdf', target: '_blank',
                        className: 'col-lg-4 col-md-4 col-sm-6 col-xs-12 btn-secondary btn-download-pdf hover-color'
                      }, [
                        span({ className: 'glyphicon glyphicon-download' }),
                        'DUOS Dataset Registration Agreement'
                      ])
                    ]),

                    div({ className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group checkbox' }, [
                      input({
                        type: 'checkbox',
                        id: 'chk_collaborator',
                        name: 'publicAccess',
                        className: 'checkbox-inline rp-checkbox',
                        disabled: this.state.formData.darCode !== null,
                        checked: publicAccess,
                        onChange: this.handleCheckboxChange
                      }),
                      label({ className: 'regular-checkbox rp-choice-questions', htmlFor: 'chk_collaborator' },
                        ['I would like this dataset to be made publicly available for data access requests via the DUOS Dataset Catalog'])
                    ]),

                  ]),

                  div({ className: 'row no-margin' }, [
                    div({ isRendered: showValidationMessages, className: 'rp-alert' }, [
                      Alert({ id: 'formErrors', type: 'danger', title: 'Please, complete all required fields.' })
                    ]),

                    div({ isRendered: problemSavingRequest, className: 'rp-alert' }, [
                      Alert({
                        id: 'problemSavingRequest', type: 'danger',
                        title: 'Some errors occurred, Dataset Registration couldn\'t be completed.'
                      })
                    ]),


                    div({ className: 'row no-margin' }, [
                      div({ className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12' }, [

                        a({
                          id: 'btn_submit', isRendered: this.state.formData.darCode === null, onClick: this.attestAndSave,
                          className: 'f-right btn-primary dataset-background bold'
                        }, ['Register in DUOS!']),

                        ConfirmationDialog({
                          title: 'Data Request Confirmation', disableOkBtn: this.state.disableOkBtn, disableNoBtn: this.state.disableOkBtn,
                          color: 'dataset', showModal: this.state.showDialogSubmit, action: { label: 'Yes', handler: this.dialogHandlerSubmit }
                        }, [div({ className: 'dialog-description' }, ['Are you sure you want to send this Data Access Request Application?'])]),
                        h(ReactTooltip, { id: 'tip_clearNihAccount', place: 'right', effect: 'solid', multiline: true, className: 'tooltip-wrapper' }),

                        a({
                          id: 'btn_save', isRendered: this.state.formData.darCode === null, onClick: this.partialSave,
                          className: 'f-right btn-secondary dataset-color'
                        }, ['Save'])
                      ])
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

export default DatasetRegistration;
