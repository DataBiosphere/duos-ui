import { Component } from 'react';
import { RadioButton } from '../components/RadioButton';
import { a, br, div, fieldset, form, h, h3, hr, input, label, span, textarea } from 'react-hyperscript-helpers';
import { Link } from 'react-router-dom';
import Select from 'react-select';
import ReactTooltip from 'react-tooltip';
import { Alert } from '../components/Alert';
import { Notification } from '../components/Notification';
import { PageHeading } from '../components/PageHeading';
import {DAR, DataSet} from '../libs/ajax';
import { searchOntology } from '../libs/ontologyService';
import * as fp from 'lodash/fp';
import AsyncSelect from 'react-select/async';

class NIHICWebform extends Component {

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
        generalUse: false
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
        publicAccess: false,
      },
      problemSavingRequest: false,
      problemLoadingUpdateDataset: false,
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



  // fill out the form fields with old dataset properties if they already exist
  prefillDatasetFields(dataset) {
    let name = fp.find({propertyName: "Dataset Name"})(dataset.properties);
    let collectionId = fp.find({propertyName: "Sample Collection ID"})(dataset.properties);
    let dataType = fp.find({propertyName: "Data Type"})(dataset.properties);
    let species = fp.find({propertyName: "Species"})(dataset.properties);
    let phenotype = fp.find({propertyName: "Phenotype/Indication"})(dataset.properties);
    let nrParticipants = fp.find({propertyName: "# of participants"})(dataset.properties);
    let description = fp.find({propertyName: "Description"})(dataset.properties);
    let datasetRepoUrl = fp.find({propertyName: "dbGAP"})(dataset.properties);
    let researcher = fp.find({propertyName: "Data Depositor"})(dataset.properties);
    let pi = fp.find({propertyName: "Principal Investigator(PI)"})(dataset.properties);
    let publicAccess = !dataset.needsApproval;

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
      prev.datasetData.publicAccess = publicAccess;

      return prev;
    });

    this.prefillDataUseFields(dataset.dataUse);
  };

  async getOntologies(urls) {
    if (fp.isEmpty(urls)) {
      return [];
    }
    else {
      let ontologies = await Promise.all(
        urls.map(url => searchOntology(url)
          .then(data => { return data; })
        ));
      return ontologies;
    }
  };

  prefillDataUseFields(dataUse) {
    let methods = dataUse.methodsResearch;
    let genetics = dataUse.geneticStudiesOnly;
    let publication = dataUse.publicationResults;
    let collaboration = dataUse.collaboratorRequired;
    let ethics = dataUse.ethicsApprovalRequired;
    let geographic = dataUse.geographicalRestrictions;
    let forProfit = !dataUse.commercialUse;
    let hmb = dataUse.hmbResearch;
    let poa = dataUse.populationOriginsAncestry;
    let diseases = dataUse.diseaseRestrictions;
    let other = !fp.isEmpty(dataUse.other);
    let otherText = dataUse.other;
    let generalUse = dataUse.generalUse;

    this.setState(prev => {
      prev.formData.methods = methods;
      prev.formData.genetic = genetics;
      prev.formData.publication = publication;
      prev.formData.collaboration = collaboration;
      prev.formData.ethics = ethics;
      prev.formData.geographic = geographic;
      prev.formData.forProfit = forProfit;
      prev.formData.hmb = hmb;
      prev.formData.poa = poa;
      prev.formData.diseases = diseases;
      prev.formData.other = !fp.isEmpty(other);
      prev.formData.otherText = otherText;
      prev.formData.generalUse = generalUse;
      return prev;
    });
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
      if (name === updateDatasetName) {
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
        prev.problemLoadingUpdateDataset = false;
        prev.showValidationMessages = false;
      }
      else {
        prev.showDialogSubmit = false;
        prev.problemLoadingUpdateDataset = false;
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
      this.state.formData.generalUse === true ||
      this.state.formData.hmb === true ||
      this.state.formData.poa === true ||
      (this.state.formData.diseases === true && !fp.isEmpty(this.state.formData.ontologies)) ||
      (this.state.formData.other === true && !fp.isEmpty(this.state.formData.otherText))
    );
    return !valid;
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

  setPublicAccess = (value) => {
    this.setState(prev => {
      prev.datasetData.publicAccess = value;
      return prev;
    });
  }

  setGeneralUse = () => {
    this.setState(prev => {
      prev.formData.generalUse = true;
      prev.formData.hmb = false;
      prev.formData.diseases = false;
      prev.formData.ontologies = [];
      return prev;
    });
  }

  setHmb = () => {
    this.setState(prev => {
      prev.formData.generalUse = false;
      prev.formData.hmb = true;
      prev.formData.diseases = false;
      prev.formData.ontologies = [];
      return prev;
    });
  };

  setPoa = () => {
    this.setState(prev => {
      prev.formData.generalUse = false;
      prev.formData.hmb = false;
      prev.formData.poa = true;
      prev.formData.diseases = false;
      prev.formData.ontologies = [];
      return prev;
    });
  };

  setDiseases = () => {
    this.setState(prev => {
      prev.formData.generalUse = false;
      prev.formData.hmb = false;
      prev.formData.diseases = true;
      return prev;
    });
  };

  onOntologiesChange = (data) => {
    this.setState(prev => {
      prev.formData.ontologies = data || [];
      return prev;
    });
  };

  setOther = () => {
    this.setState(prev => {
      prev.formData.generalUse = false;
      prev.formData.hmb = false;
      prev.formData.diseases = false;
      prev.formData.other = true;
      prev.formData.ontologies = [];
      return prev;
    });
  };

  setOtherText = (e) => {
    const value = e.target.value;
    this.setState(prev => {
      prev.formData.other = true;
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
        prev.problemLoadingUpdateDataset = false;
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

  formatOntologyItems = (ontologies) => {
    const ontologyItems = ontologies.map((ontology) => {
      return {
        id: ontology.id || ontology.item.id,
        key: ontology.id || ontology.item.id,
        value: ontology.id || ontology.item.id,
        label: ontology.label || ontology.item.label,
        definition: ontology.definition || ontology.item.definition,
        item: ontology || ontology.item
      };
    });
    return ontologyItems;
  };

  render() {

    const controlLabelStyle = {
      fontWeight: 500,
      marginBottom: 0
    };

    const {
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
      generalUse = false,
    } = this.state.formData;
    const ontologies = this.formatOntologyItems(this.state.formData.ontologies);
    const { publicAccess = false } = this.state.datasetData;
    const { npoa } = !poa;
    const { problemSavingRequest, problemLoadingUpdateDataset, showValidationMessages, submissionSuccess } = this.state;
    const isTypeOfResearchInvalid = false;
    const isUpdateDataset = (!fp.isEmpty(this.state.updateDataset));
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
                  div({ isRendered: this.state.completed === false, className: 'rp-alert' }, [
                    Alert({ id: 'profileUnsubmitted', type: 'danger', title: profileUnsubmitted })
                  ]),
                  div({ isRendered: problemLoadingUpdateDataset, className: 'rp-alert' }, [
                    Alert({
                      id: 'problemLoadingUpdateDataset', type: 'danger',
                      title: "The Dataset you were trying to access either does not exist or you do not have permission to edit it."
                    })
                  ]),
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
                        label({className: 'control-label rp-title-question common-color'}, [
                          'Principal Investigator Title* ',
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
                        label({className: 'control-label rp-title-question common-color'}, [
                          'Principal Investigator Email* ',
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
                          placeholder: 'email@domain.org',
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
                        label({className: 'control-label rp-title-question common-color'}, [
                          'Principal Investigator Institution* ',
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
                        label({className: 'control-label rp-title-question common-color'}, [
                          'Assitant/Submitter Name (if applicable)',
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
                        label({className: 'control-label rp-title-question common-color'}, [
                          'Assistant Submitter Email',
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
                            id: 'checkPublicAccess_yes',
                            name: 'checkPublicAccess',
                            value: 'yes',
                            defaultChecked: publicAccess,
                            onClick: () => this.setPublicAccess(true),
                            label: 'Yes',
                            disabled: isUpdateDataset,
                          }),

                          RadioButton({
                            style: {
                              marginBottom: '2rem',
                              marginLeft: '2rem',
                              color: ' #010101',
                            },
                            id: 'checkPublicAccess_no',
                            name: 'checkPublicAccess',
                            value: 'no',
                            defaultChecked: !publicAccess,
                            onClick: () => this.setPublicAccess(false),
                            label: 'No',
                            disabled: isUpdateDataset,
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
                          placeholder: 'Select a Program Officer...',
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
                        label({className: 'control-label rp-title-question common-color'}, [
                      'NIH Institute/Center for Submission',
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
                          placeholder: 'Select an NIH IC...',
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
                        label({className: 'control-label rp-title-question common-color'}, [
                          'NIH Genomic Program Administrator Name',
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
                          placeholder: 'Select a Genomic Program Administrator...',
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
                      label({className: 'control-label rp-title-question common-color'}, [
                        'Study Type',
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
                        placeholder: 'Select a study type...',
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
                      label({className: 'control-label rp-title-question common-color'}, [
                        'Project title for data to be submitted',
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
                          id: 'checkPublicAccess_yes',
                          name: 'checkPublicAccess',
                          value: 'yes',
                          defaultChecked: publicAccess,
                          onClick: () => this.setPublicAccess(true),
                          label: 'Yes',
                          disabled: isUpdateDataset,
                        }),

                        RadioButton({
                          style: {
                            marginBottom: '2rem',
                            marginLeft: '2rem',
                            color: ' #010101',
                          },
                          id: 'checkPublicAccess_no',
                          name: 'checkPublicAccess',
                          value: 'no',
                          defaultChecked: !publicAccess,
                          onClick: () => this.setPublicAccess(false),
                          label: 'No',
                          disabled: isUpdateDataset,
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
                          value: 'yes',
                          defaultChecked: publicAccess,
                          onClick: () => this.setPublicAccess(true),
                          label: 'Yes',
                          disabled: isUpdateDataset,
                        }),

                        RadioButton({
                          style: {
                            marginBottom: '2rem',
                            marginLeft: '2rem',
                            color: ' #010101',
                          },
                          id: 'checkPublicAccess_no',
                          name: 'checkPublicAccess',
                          value: 'no',
                          defaultChecked: !publicAccess,
                          onClick: () => this.setPublicAccess(false),
                          label: 'No',
                          disabled: isUpdateDataset,
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
                          value: 'yes',
                          defaultChecked: publicAccess,
                          onClick: () => this.setPublicAccess(true),
                          label: 'Yes',
                          disabled: isUpdateDataset,
                        }),

                        RadioButton({
                          style: {
                            marginBottom: '2rem',
                            marginLeft: '2rem',
                            color: ' #010101',
                          },
                          id: 'checkPublicAccess_no',
                          name: 'checkPublicAccess',
                          value: 'no',
                          defaultChecked: !publicAccess,
                          onClick: () => this.setPublicAccess(false),
                          label: 'No',
                          disabled: isUpdateDataset,
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
                      label({className: 'control-label rp-title-question common-color'}, [
                        'Consent Group 1 - Name:',
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
                                RadioButton({
                                  style: {
                                    marginBottom: '2rem',
                                    color: ' #010101',
                                  },
                                  id: 'checkGeneral',
                                  name: 'checkPrimary',
                                  value: 'general',
                                  defaultChecked: generalUse,
                                  onClick: this.setGeneralUse,
                                  label: 'General Research Use: ',
                                  description: 'use is permitted for any research purpose',
                                  disabled: isUpdateDataset,
                                }),

                                RadioButton({
                                  style: {
                                    marginBottom: '2rem',
                                    color: ' #010101',
                                  },
                                  id: 'checkHmb',
                                  name: 'checkPrimary',
                                  value: 'hmb',
                                  defaultChecked: hmb,
                                  onClick: this.setHmb,
                                  label: 'Health/Medical/Biomedical Use: ',
                                  description: 'use is permitted for any health, medical, or biomedical purpose',
                                  disabled: isUpdateDataset,
                                }),

                                RadioButton({
                                  style: {
                                    marginBottom: '2rem',
                                    color: ' #010101',
                                  },
                                  id: 'checkDisease',
                                  name: 'checkPrimary',
                                  value: 'diseases',
                                  defaultChecked: diseases,
                                  onClick: this.setDiseases,
                                  label: 'Disease-related studies: ',
                                  description: 'use is permitted for research on the specified disease',
                                  disabled: isUpdateDataset,
                                }),
                                div({
                                  style: {
                                    marginBottom: '2rem',
                                    color: ' #010101',
                                    cursor: diseases ? 'pointer' : 'not-allowed',
                                  },
                                }, [
                                  h(AsyncSelect, {
                                    id: 'sel_diseases',
                                    isDisabled: isUpdateDataset || !diseases,
                                    isMulti: true,
                                    loadOptions: (query, callback) => this.searchOntologies(query, callback),
                                    onChange: (option) => this.onOntologiesChange(option),
                                    value: ontologies,
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
                                  defaultChecked: poa,
                                  onClick: this.setPoa,
                                  label: 'Populations, Origins, Ancestry Use: ',
                                  description: 'use is permitted exclusively for populations, origins, or ancestry research',
                                  disabled: isUpdateDataset,
                                }),

                                RadioButton({
                                  style: {
                                    marginBottom: '2rem',
                                    color: ' #010101',
                                  },
                                  id: 'checkOther',
                                  name: 'checkPrimary',
                                  value: 'other',
                                  defaultChecked: other,
                                  onClick: this.setOther,
                                  label: 'Other Use:',
                                  description: 'permitted research use is defined as follows: ',
                                  disabled: isUpdateDataset,
                                }),

                                textarea({
                                  className: 'form-control',
                                  value: otherText,
                                  onChange: this.setOtherText,
                                  name: 'otherText',
                                  id: 'otherText',
                                  maxLength: '512',
                                  rows: '2',
                                  required: other,
                                  placeholder: 'Please specify if selected (max. 512 characters)',
                                  disabled: isUpdateDataset || !other,
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
                                    checked: methods,
                                    onChange: this.handleCheckboxChange,
                                    id: 'checkMethods',
                                    type: 'checkbox',
                                    className: 'checkbox-inline rp-checkbox',
                                    name: 'methods',
                                    disabled: isUpdateDataset
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
                                    checked: genetic,
                                    onChange: this.handleCheckboxChange,
                                    id: 'checkGenetic',
                                    type: 'checkbox',
                                    className: 'checkbox-inline rp-checkbox',
                                    name: 'genetic',
                                    disabled: isUpdateDataset
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
                                    checked: publication,
                                    onChange: this.handleCheckboxChange,
                                    id: 'checkPublication',
                                    type: 'checkbox',
                                    className: 'checkbox-inline rp-checkbox',
                                    name: 'publication',
                                    disabled: isUpdateDataset
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
                                    checked: collaboration,
                                    onChange: this.handleCheckboxChange,
                                    id: 'checkCollaboration',
                                    type: 'checkbox',
                                    className: 'checkbox-inline rp-checkbox',
                                    name: 'collaboration',
                                    disabled: isUpdateDataset
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
                                    checked: ethics,
                                    onChange: this.handleCheckboxChange,
                                    id: 'checkEthics',
                                    type: 'checkbox',
                                    className: 'checkbox-inline rp-checkbox',
                                    name: 'ethics',
                                    disabled: isUpdateDataset
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
                                    checked: geographic,
                                    onChange: this.handleCheckboxChange,
                                    id: 'checkGeographic',
                                    type: 'checkbox',
                                    className: 'checkbox-inline rp-checkbox',
                                    name: 'geographic',
                                    disabled: isUpdateDataset
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
                                    checked: moratorium,
                                    onChange: this.handleCheckboxChange,
                                    id: 'checkMoratorium',
                                    type: 'checkbox',
                                    className: 'checkbox-inline rp-checkbox',
                                    name: 'moratorium',
                                    disabled: isUpdateDataset
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
                                    checked: npoa,
                                    onChange: this.handleCheckboxChange,
                                    id: 'checkNpoa',
                                    type: 'checkbox',
                                    className: 'checkbox-inline rp-checkbox',
                                    name: 'poa',
                                    disabled: isUpdateDataset
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
                                    checked: forProfit,
                                    onChange: this.handleCheckboxChange,
                                    id: 'checkForProfit',
                                    type: 'checkbox',
                                    className: 'checkbox-inline rp-checkbox',
                                    name: 'forProfit',
                                    disabled: isUpdateDataset
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
                                    checked: other,
                                    onChange: this.handleCheckboxChange,
                                    id: 'checkOtherSecondary',
                                    type: 'checkbox',
                                    className: 'checkbox-inline rp-checkbox',
                                    name: 'other',
                                    disabled: isUpdateDataset
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
                                  value: otherText,
                                  onChange: this.setOtherText,
                                  name: 'otherText',
                                  id: 'inputOtherText',
                                  className: 'form-control',
                                  rows: '6',
                                  required: false,
                                  placeholder: 'Note - adding free text data use terms in the box will inhibit your dataset from being read by the DUOS Algorithm for decision support.',
                                  disabled: isUpdateDataset || !other
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
                    }, [isUpdateDataset ? 'Update Dataset' : 'Add Consent Group']),
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
                          value: 'yes',
                          defaultChecked: publicAccess,
                          onClick: () => this.setPublicAccess(true),
                          label: 'Yes',
                          disabled: isUpdateDataset,
                        }),

                        RadioButton({
                          style: {
                            marginBottom: '2rem',
                            marginLeft: '2rem',
                            color: ' #010101',
                          },
                          id: 'checkPublicAccess_no',
                          name: 'checkPublicAccess',
                          value: 'no',
                          defaultChecked: !publicAccess,
                          onClick: () => this.setPublicAccess(false),
                          label: 'No',
                          disabled: isUpdateDataset,
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
                      label({className: 'control-label rp-title-question common-color'}, [
                        'If needed, please attach additional information to this document',
                      ]),
                    ]),

                ]),

                div({className: 'form-group'}, [
                  div(
                    {className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group'},
                    [
                      label({className: 'control-label rp-title-question common-color'}, [
                        'Acknowledgement Statement',
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
                          value: 'yes',
                          defaultChecked: publicAccess,
                          onClick: () => this.setPublicAccess(true),
                          label: 'Within 3 months of last data generated or last clnical visit',
                          disabled: isUpdateDataset,
                        }),

                        RadioButton({
                          style: {
                            marginBottom: '2rem',
                            marginLeft: '2rem',
                            color: ' #010101',
                          },
                          id: 'checkPublicAccess_no',
                          name: 'checkPublicAccess',
                          value: 'no',
                          defaultChecked: !publicAccess,
                          onClick: () => this.setPublicAccess(false),
                          label: 'Data will be submitted by batches over Study Timeline (e.g. based on clinical trial enrollment benchmarks)',
                          disabled: isUpdateDataset,
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
                          value: 'yes',
                          defaultChecked: publicAccess,
                          onClick: () => this.setPublicAccess(true),
                          label: 'Yes',
                          disabled: isUpdateDataset,
                        }),

                        RadioButton({
                          style: {
                            marginBottom: '2rem',
                            marginLeft: '2rem',
                            color: ' #010101',
                          },
                          id: 'checkPublicAccess_no',
                          name: 'checkPublicAccess',
                          value: 'no',
                          defaultChecked: !publicAccess,
                          onClick: () => this.setPublicAccess(false),
                          label: 'No',
                          disabled: isUpdateDataset,
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
                      label({className: 'control-label rp-title-question common-color'}, [
                        'Estimated # of Study Participants',
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

                  div({ className: 'row no-margin' }, [
                    div({ className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12' }, [
                      a({
                        id: 'btn_submit',
                        className: 'f-right btn-primary dataset-background bold'
                      }, [isUpdateDataset ? 'Update Dataset' : 'Submit to Signing Official']),
                    ])
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
                        title: isUpdateDataset ? 'Dataset was successfully updated.' : 'Dataset was successfully registered.'
                      })
                    ]),


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
