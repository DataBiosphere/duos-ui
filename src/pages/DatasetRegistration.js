import { Component } from 'react';
import { a, br, div, fieldset, form, h, h3, hr, input, label, span, textarea } from 'react-hyperscript-helpers';
import Mailto from 'react-protected-mailto';
import { Link } from 'react-router-dom';
import Select from 'react-select';
import ReactTooltip from 'react-tooltip';
import { Alert } from '../components/Alert';
import { ConfirmationDialog } from '../components/ConfirmationDialog';
import { Notification } from '../components/Notification';
import { PageHeading } from '../components/PageHeading';
import { DAC, DataSet } from '../libs/ajax';
import { NotificationService } from '../libs/notificationService';
import { Storage } from '../libs/storage';
import { TypeOfResearch } from './dar_application/TypeOfResearch';
import * as fp from 'lodash/fp';

import './DataAccessRequestApplication.css';

class DatasetRegistration extends Component {

  constructor(props) {
    super(props);
    this.state = {
      dacList: [],
      selectedDac: {},
      allDatasets: '',
      allDatasetNames: [],
      updateDataset: {},
      nihValid: false,
      disableOkBtn: false,
      showValidationMessages: false,
      showModal: false,
      showDialogSubmit: false,
      formData: {
        methods: '',
        genetic: '',
        publication: '',
        collaboration: '',
        ethics: '',
        geographic: '',
        moratorium: '',
        populationMigration: '',
        forProfit: '',
        hmb: false,
        poa: false,
        diseases: false,
        ontologies: [],
        other: false,
        otherText: '',
        pubRef: '',
      },
      datasetData: {
        datasetName: '',
        researcher: '',
        collectionId: '',
        pi: '',
        datasetRepoUrl: '',
        dataType: '',
        species: '',
        phenotype: '',
        nrParticipants: '',
        description: '',
        dac: '',
        consentId: '',
        publicAccess: '',
        rus: ''
      },
      problemSavingRequest: false,
      submissionSuccess: false,
      errorMessage: ''
    };

    this.handleOpenModal = this.handleOpenModal.bind(this);
    this.handleCloseModal = this.handleCloseModal.bind(this);
  };

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
    const notificationData = await NotificationService.getBannerObjectById('eRACommonsOutage');
    const currentUser = await Storage.getCurrentUser();
    const allDatasets =  await DataSet.findDataSets(currentUser.dacUserId);
    const allDatasetNames = allDatasets.map(d => {
      let name = d.properties.find(p => p.propertyName === "Dataset Name");
      return name.propertyValue;
    });
    const dacs = await DAC.list();
    this.setState(prev => {
      prev.notificationData = notificationData;
      prev.datasetData['researcher'] = currentUser.displayName;
      prev.allDatasets = allDatasets;
      prev.allDatasetNames = allDatasetNames;
      prev.dacList = dacs;
      return prev;
    });
    if (!fp.isEmpty(this.state.updateDataset)) {
      this.prefillDatasetFields(this.state.updateDataset);
    }
  };

  async init() {
    const { datasetId } = this.props.match.params;
    let updateDataset = {};
    // update dataset case
    if (!fp.isNil(datasetId)) {
      DataSet.getDataSetsByDatasetId(datasetId).then(data => {
        updateDataset = data;
        // redirect to blank form if dataset id is invalid or inaccessible
        if (fp.isEmpty(updateDataset) || fp.isNil(updateDataset.dataSetId)) {
          this.props.history.push('/dataset_registration');
          ReactTooltip.rebuild();
        }
        else {
          this.setState(prev => {
            prev.updateDataset = updateDataset;
          });
        }
      });
    }
  };

  // fill out the form fields with old dataset properties if they already exist
  prefillDatasetFields(dataset) {
    let name = dataset.properties.find(p => p.propertyName === "Dataset Name");
    let collectionId = dataset.properties.find(p => p.propertyName === "Sample Collection ID");
    let dataType = dataset.properties.find(p => p.propertyName === "Data Type");
    let species = dataset.properties.find(p => p.propertyName === "Species");
    let phenotype = dataset.properties.find(p => p.propertyName === "Phenotype/Indication");
    let nrParticipants = dataset.properties.find(p => p.propertyName === "# of participants");
    let description = dataset.properties.find(p => p.propertyName === "Description");
    let datasetRepoUrl = dataset.properties.find(p => p.propertyName === "dbGAP");
    let researcher = dataset.properties.find(p => p.propertyName === "Data Depositor");
    let pi = dataset.properties.find(p => p.propertyName === "Principal Investigator(PI)");

    this.setState(prev => {
      prev.datasetData.datasetName = name ? name.propertyValue : '';
      prev.datasetData.collectionId = collectionId ? collectionId.propertyValue : '';
      prev.datasetData.dataType = dataType ? dataType.propertyValue : '';
      prev.datasetData.species = species ? species.propertyValue : '';
      prev.datasetData.phenotype = phenotype ? phenotype.propertyValue : '';
      prev.datasetData.nrParticipants = nrParticipants ? nrParticipants.propertyValue : '';
      prev.datasetData.description = description ? description.propertyValue : '';
      prev.datasetData.datasetRepoUrl = datasetRepoUrl ? datasetRepoUrl.propertyValue : '';
      prev.datasetData.researcher = researcher ? researcher.propertyValue : '';
      prev.datasetData.pi = pi ? pi.propertyValue : '';

      return prev;
    })
  };

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
      prev.datasetData[field] = value;
      prev.disableOkBtn = false;
      prev.problemSavingRequest = false;
      prev.submissionSuccess = false;
      return prev;
    });
  };

  handlePositiveIntegerOnly = (e) => {
    const field = e.target.name;
    const value = e.target.value.replace(/[^\d]/,'');

    if (value === '' || parseInt(value, 10) > -1) {
      this.setState(prev => {
        prev.datasetData[field] = value;
        prev.disableOkBtn = false;
        prev.problemSavingRequest = false;
        prev.submissionSuccess = false;
        return prev;
      });
    }
  };

  handleCheckboxChange = (e) => {
    const field = e.target.name;
    const value = e.target.checked;
    this.setState(prev => {
      prev.formData[field] = value;
      prev.disableOkBtn = false;
      prev.problemSavingRequest = false;
      prev.submissionSuccess = false;
      return prev;
    });
  };

  validateRequiredFields(formData) {
    return this.isValid(formData.researcher) &&
      this.validateDatasetName((formData.datasetName)) &&
      this.isValid(formData.datasetName) &&
      this.isValid(formData.datasetRepoUrl) &&
      this.isValid(formData.dataType) &&
      this.isValid(formData.species) &&
      this.isValid(formData.phenotype) &&
      this.isValid(formData.nrParticipants) &&
      this.isValid(formData.description);
  };

  validateDatasetName(name) {
    let oldDataset = this.state.updateDataset;
    let datasets = this.state.allDatasetNames;
    // create dataset case
    if (fp.isEmpty(oldDataset)) {
      return !fp.contains(name, datasets);
    }
    // update dataset case (include old dataset name as valid)
    else {
      let updateDatasetName = fp.find(p => p.propertyName === "Dataset Name", this.state.updateDataset.properties).propertyValue;

      return (name === updateDatasetName || !fp.contains(name, datasets));
    }
  };

  showDatasetNameErrors(name, showValidationMessages) {
    if (fp.isEmpty(name)) {
      return showValidationMessages ? 'form-control required-field-error' : 'form-control';
    }
    // if there is a name loaded in because this is an update
    if (!fp.isEmpty(this.state.updateDataset)) {
      let updateDatasetName = fp.find(p => p.propertyName === "Dataset Name", this.state.updateDataset.properties).propertyValue;
      let equalsOriginal = (name === updateDatasetName)
      if (equalsOriginal) {
        return 'form-control';
      }
      // if the old dataset name has been edited
      else {
        return this.validateDatasetName(name) ? 'form-control' : 'form-control required-field-error';
      }
    }
    // if a new dataset name is being edited
    else {
      return this.validateDatasetName(name) ? 'form-control' : 'form-control required-field-error';
    }
  };

  attestAndSave = (e) => {
    this.setState( prev => {
      let allValid = this.validateRequiredFields(prev.datasetData);
      if (allValid) {
        prev.showDialogSubmit = true;
        prev.showValidationMessages = false;
      }
      else {
        prev.showDialogSubmit = false;
        prev.showValidationMessages = true;
      }
      return prev;
    });
  };

  isValid(value) {
    let isValid = false;
    if (value !== '' && value !== null && value !== undefined) {
      isValid = true;
    }
    return isValid;
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
        for (let key in prev.datasetData) {
          if (prev.datasetData[key] === '') {
            prev.datasetData[key] = undefined;
          }
        }
        return prev;
      }, () => {
        let formData = this.state.datasetData;
        this.setState(prev => {
          prev.disableOkBtn = true;
          return prev;
        });

        if (this.state.showValidationMessages) {
          this.setState({showDialogSubmit: false});
        }
        else {
          let ds = this.formatFormData(formData);
          if (fp.isEmpty(this.state.updateDataset)) {
            DataSet.postDatasetForm(ds).then(resp => {
              this.setState({ showDialogSubmit: false, submissionSuccess: true });
              ReactTooltip.rebuild();
            }).catch(e => {
              let errorMessage = (e.status === 409) ?
                'Dataset with this name already exists: ' + this.state.datasetData.datasetName
              + '. Please choose a different name before attempting to submit again.'
                : 'Some errors occurred, Dataset Registration couldn\'t be completed.';
              this.setState(prev => {
                prev.problemSavingRequest = true;
                prev.submissionSuccess = false;
                prev.errorMessage = errorMessage;
                return prev;
              });
            });
          }
          else {
            const { datasetId } = this.props.match.params;
            DataSet.updateDataset(datasetId, ds).then(resp => {
              this.setState({ showDialogSubmit: false, submissionSuccess: true });
              ReactTooltip.rebuild();
            }).catch(e => {
              let errorMessage = 'Some errors occurred, the Dataset was not updated.';
              this.setState(prev => {
                prev.problemSavingRequest = true;
                prev.submissionSuccess = false;
                prev.errorMessage = errorMessage;
                return prev;
              });
            });
          }
        }
      });
    } else {
      this.setState({ showDialogSubmit: false });
    }
  };

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

  createProperties = () => {
    let properties = [];
    let formData = this.state.datasetData;

    if (formData.datasetName) {
      properties.push({"propertyName": "Dataset Name", "propertyValue": formData.datasetName});
    }
    if (formData.collectionId) {
      properties.push({"propertyName": "Sample Collection ID", "propertyValue": formData.collectionId});
    }
    if (formData.dataType) {
      properties.push({"propertyName": "Data Type", "propertyValue": formData.dataType});
    }
    if (formData.species) {
      properties.push({"propertyName": "Species", "propertyValue": formData.species});
    }
    if (formData.phenotype) {
      properties.push({"propertyName": "Phenotype/Indication", "propertyValue": formData.phenotype});
    }
    if (formData.nrParticipants) {
      properties.push({"propertyName": "# of participants", "propertyValue": formData.nrParticipants});
    }
    if (formData.description) {
      properties.push({"propertyName": "Description", "propertyValue": formData.description});
    }
    if (formData.datasetRepoUrl) {
      properties.push({"propertyName": "dbGAP", "propertyValue": formData.datasetRepoUrl});
    }
    if (formData.researcher) {
      properties.push({"propertyName": "Data Depositor", "propertyValue": formData.researcher});
    }
    if (formData.pi) {
      properties.push({"propertyName": "Principal Investigator(PI)", "propertyValue": formData.pi});
    }

    return properties;
  }

  dacOptions = () => {
    return this.state.dacList.map(function(item) {
      return {
        key: item.dacId,
        value: item.dacId,
        label: item.name,
        item: item
      };
    });
  };

  onDacChange = (option) => {
    this.setState(prev => {
      if (fp.isNil(option)) {
        prev.selectedDac = {};
        prev.datasetData['dac'] = '';
      } else {
        prev.selectedDac = option.item;
        prev.datasetData['dac'] = option.label;
        prev.disableOkBtn = false;
        prev.problemSavingRequest = false;
      }
      return prev;
    });
  };

  formatFormData = (data) => {
    let result = {};
    result.datasetName = data.datasetName;
    result.consentId = data.consentId;
    result.translatedUseRestriction = data.translatedUseRestriction;
    result.deletable = true;
    result.active = true;
    result.needsApproval = !data.publicAccess;
    result.isAssociatedToDataOwners = true;
    result.updateAssociationToDataOwnerAllowed = true;
    result.properties = this.createProperties();

    return result;
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

    const { problemSavingRequest, showValidationMessages, submissionSuccess } = this.state;
    const isTypeOfResearchInvalid = false;
    // NOTE: set this to always false for now to submit dataset without consent info
    // const isTypeOfResearchInvalid = this.isTypeOfResearchInvalid();

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
            div({}, [
              div({ className: 'col-lg-10 col-lg-offset-1 col-md-12 col-sm-12 col-xs-12' }, [
                fieldset({}, [
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
                        value: this.state.datasetData.researcher,
                        disabled: true,
                        className: (fp.isEmpty(this.state.datasetData.researcher) && showValidationMessages) ? 'form-control required-field-error' : 'form-control',
                        required: true
                      }),
                      span({
                        isRendered: (fp.isEmpty(this.state.datasetData.researcher) && showValidationMessages), className: 'cancel-color required-field-error-span'
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
                          name: 'datasetName',
                          id: 'inputName',
                          maxLength: '256',
                          value: this.state.datasetData.datasetName,
                          onChange: this.handleChange,
                          className: this.showDatasetNameErrors(this.state.datasetData.datasetName, showValidationMessages),
                          required: true,
                        }),
                        span({
                          className: 'cancel-color required-field-error-span',
                          isRendered: fp.includes('required-field-error', this.showDatasetNameErrors(this.state.datasetData.datasetName, showValidationMessages))
                        },
                        [this.validateDatasetName(this.state.datasetData.datasetName) ? 'Required field' : 'Dataset Name already in use']),
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
                          type: 'url',
                          name: 'datasetRepoUrl',
                          id: 'inputRepoUrl',
                          maxLength: '256',
                          placeholder: 'http://...',
                          value: this.state.datasetData.datasetRepoUrl,
                          onChange: this.handleChange,
                          className: (fp.isEmpty(this.state.datasetData.datasetRepoUrl) && showValidationMessages) ?
                            'form-control required-field-error' :
                            'form-control',
                          required: true,
                        }),
                        span({
                          className: 'cancel-color required-field-error-span',
                          isRendered: fp.isEmpty(this.state.datasetData.datasetRepoUrl) && showValidationMessages,
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
                          name: 'dataType',
                          id: 'inputDataType',
                          maxLength: '256',
                          value: this.state.datasetData.dataType,
                          onChange: this.handleChange,
                          className: (fp.isEmpty(this.state.datasetData.dataType) && showValidationMessages) ?
                            'form-control required-field-error' :
                            'form-control',
                          required: true,
                        }),
                        span({
                          className: 'cancel-color required-field-error-span',
                          isRendered: fp.isEmpty(this.state.datasetData.dataType) && showValidationMessages,
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
                          name: 'species',
                          id: 'inputSpecies',
                          maxLength: '256',
                          value: this.state.datasetData.species,
                          onChange: this.handleChange,
                          className: (fp.isEmpty(this.state.datasetData.species) && showValidationMessages) ?
                            'form-control required-field-error' :
                            'form-control',
                          required: true,
                        }),
                        span({
                          className: 'cancel-color required-field-error-span',
                          isRendered: fp.isEmpty(this.state.datasetData.species) && showValidationMessages,
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
                          name: 'phenotype',
                          id: 'inputPhenotype',
                          maxLength: '256',
                          value: this.state.datasetData.phenotype,
                          onChange: this.handleChange,
                          className: (fp.isEmpty(this.state.datasetData.phenotype) && showValidationMessages) ?
                            'form-control required-field-error' :
                            'form-control',
                          required: true,
                        }),
                        span({
                          className: 'cancel-color required-field-error-span',
                          isRendered: fp.isEmpty(this.state.datasetData.phenotype) && showValidationMessages,
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
                          type: 'number',
                          name: 'nrParticipants',
                          id: 'inputParticipants',
                          maxLength: '256',
                          min: '0',
                          value: this.state.datasetData.nrParticipants,
                          onChange: this.handlePositiveIntegerOnly,
                          className: (fp.isEmpty(this.state.datasetData.nrParticipants) && showValidationMessages) ?
                            'form-control required-field-error' :
                            'form-control',
                          required: true,
                        }),
                        span({
                          className: 'cancel-color required-field-error-span',
                          isRendered: fp.isEmpty(this.state.datasetData.nrParticipants) && showValidationMessages,
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
                          name: 'description',
                          id: 'inputDescription',
                          maxLength: '256',
                          value: this.state.datasetData.description,
                          onChange: this.handleChange,
                          className: (fp.isEmpty(this.state.datasetData.description) && showValidationMessages) ?
                            'form-control required-field-error' :
                            'form-control',
                          required: true,
                        }),
                        span({
                          className: 'cancel-color required-field-error-span',
                          isRendered: fp.isEmpty(this.state.datasetData.description) && showValidationMessages,
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
                      {className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group'},
                      [
                        h(Select, {
                          name: 'dac',
                          id: 'inputDac',
                          onChange: (option) => this.onDacChange(option),
                          blurInputOnSelect: true,
                          openMenuOnFocus: true,
                          isDisabled: false,
                          isClearable: true,
                          isMulti: false,
                          isSearchable: true,
                          options: this.dacOptions(),
                          placeholder: 'Select a DAC...',
                          className: (fp.isEmpty(this.state.datasetData.dac) && showValidationMessages) ?
                            'required-field-error' :
                            '',
                          required: true,
                        }),
                        span({
                          className: 'cancel-color required-field-error-span',
                          isRendered: fp.isEmpty(this.state.datasetData.dac) && showValidationMessages,
                        },
                        ['Required field']),
                      ])
                  ]),

                  div({className: 'form-group'}, [
                    div(
                      {className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group'},
                      [
                        label({className: 'control-label rp-title-question dataset-color'}, [
                          '1.10 Publication Reference',
                        ]),
                      ]),
                    div(
                      {className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group rp-last-group'},
                      [
                        input({
                          type: 'text',
                          name: 'pubRef',
                          id: 'inputPubRef',
                          maxLength: '256',
                          value: this.state.datasetData.pubRef,
                          onChange: this.handleChange,
                          className: 'form-control',
                          required: false,
                        })
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
                              disabled: true,
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
                                  '2.4 Secondary Data Use Terms',
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
                                className: 'checkbox-inline rp-checkbox',
                                name: 'methods',
                              }),
                              label({
                                className: 'regular-checkbox rp-choice-questions',
                                htmlFor: 'checkMethods',
                              }, [
                                span({ className: 'access-color'},
                                  ['2.4.1 No methods development or validation studies (NMDS):']),
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
                                id: 'checkGenetic',
                                type: 'checkbox',
                                className: 'checkbox-inline rp-checkbox',
                                name: 'genetic',
                              }),
                              label({
                                className: 'regular-checkbox rp-choice-questions',
                                htmlFor: 'checkGenetic',
                              }, [
                                span({ className: 'access-color'},
                                  ['2.4.2 Genetic Studies Only (GSO):']),
                                'Use is limited to genetic studies only.',
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
                                className: 'checkbox-inline rp-checkbox',
                                name: 'publication',
                              }),
                              label({
                                className: 'regular-checkbox rp-choice-questions',
                                htmlFor: 'checkPublication',
                              }, [
                                span({ className: 'access-color'},
                                  ['2.4.3 Publication Required (PUB):']),
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
                                className: 'checkbox-inline rp-checkbox',
                                name: 'collaboration',
                              }),
                              label({
                                className: 'regular-checkbox rp-choice-questions',
                                htmlFor: 'checkCollaboration',
                              }, [
                                span({ className: 'access-color'},
                                  ['2.4.4 Collaboration Required (COL):']),
                                'Approved users are required to collaborate with the primary study investigators.',
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
                                className: 'checkbox-inline rp-checkbox',
                                name: 'ethics',
                              }),
                              label({
                                className: 'regular-checkbox rp-choice-questions',
                                htmlFor: 'checkEthics',
                              }, [
                                span({ className: 'access-color'},
                                  ['2.4.5 Ethics Approval Required (IRB):']),
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
                                id: 'checkGeographic',
                                type: 'checkbox',
                                className: 'checkbox-inline rp-checkbox',
                                name: 'geographic',
                              }),
                              label({
                                className: 'regular-checkbox rp-choice-questions',
                                htmlFor: 'checkGeographic',
                              }, [
                                span({ className: 'access-color'},
                                  ['2.4.6 Geographic Restriction (GS-):']),
                                'Use limited to be within the specified geographic area.',
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
                                className: 'checkbox-inline rp-checkbox',
                                name: 'moratorium',
                              }),
                              label({
                                className: 'regular-checkbox rp-choice-questions',
                                htmlFor: 'checkMoratorium',
                              }, [
                                span({ className: 'access-color'},
                                  ['2.4.7 Publication Moratorium (MOR):']),
                                'Approved users are required to withhold from publishing until the specified date.',
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
                                className: 'checkbox-inline rp-checkbox',
                                name: 'populationMigration',
                              }),
                              label({
                                className: 'regular-checkbox rp-choice-questions',
                                htmlFor: 'checkPopulationMigration',
                              }, [
                                span({ className: 'access-color'},
                                  ['2.4.8 No Populations Origins or Ancestry Research (NPOA):']),
                                'Use for Populations, Origins, or Ancestry Research is prohibited.',
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
                                className: 'checkbox-inline rp-checkbox',
                                name: 'forProfit',
                              }),
                              label({
                                className: 'regular-checkbox rp-choice-questions',
                                htmlFor: 'checkForProfit',
                              }, [
                                span({ className: 'access-color'},
                                  ['2.4.9 Non-Profit Use Only (NPU):']),
                                'The data cannot be used by for-profit organizations nor for commercial research purposes.',
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
                            'Note, terms entered below will not be able to be structured with the Data Use Ontology, which facilitates downstream access management. Please only enter additional terms below if you are certain they should govern all future data access requests. If you have questions, please reach out to the DUOS support team ',
                            span( [h(Mailto, { email: 'duos-support@broadinstitute.zendesk.com' })]),
                          ]),
                        ]),
                      ]),
                    div(
                      {className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group'},
                      [
                        textarea({
                          value: this.state.datasetData.rus,
                          onChange: this.handleChange,
                          name: 'rus',
                          id: 'inputRUS',
                          className: 'form-control',
                          rows: '6',
                          required: false,
                          placeholder: 'Please limit your other data use terms to 1100 characters.',
                        })
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
                        id: 'chk_publicAccess',
                        name: 'publicAccess',
                        className: 'checkbox-inline rp-checkbox',
                        checked: publicAccess,
                        onChange: this.handleCheckboxChange
                      }),
                      label({ className: 'regular-checkbox rp-choice-questions', htmlFor: 'chk_publicAccess' },
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
                        title: this.state.errorMessage
                      })
                    ]),

                    div({ isRendered: submissionSuccess, className: 'rp-alert' }, [
                      Alert({
                        id: 'submissionSuccess', type: 'info',
                        title: 'Dataset was successfully registered.'
                      })
                    ]),

                    div({ className: 'row no-margin' }, [
                      div({ className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12' }, [

                        a({
                          id: 'btn_submit', onClick: this.attestAndSave,
                          className: 'f-right btn-primary dataset-background bold'
                        }, ['Register in DUOS!']),

                        ConfirmationDialog({
                          title: 'Dataset Registration Confirmation', disableOkBtn: this.state.disableOkBtn,
                          color: 'dataset', showModal: this.state.showDialogSubmit, action: { label: 'Yes', handler: this.dialogHandlerSubmit }
                        }, [div({ className: 'dialog-description' }, ['Are you sure you want to submit this Dataset Registration?'])]),
                        h(ReactTooltip, { id: 'tip_clearNihAccount', place: 'right', effect: 'solid', multiline: true, className: 'tooltip-wrapper' }),

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
