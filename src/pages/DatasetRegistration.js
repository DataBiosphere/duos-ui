import { Component } from 'react';
import { RadioButton } from '../components/RadioButton';
import { a, br, div, fieldset, form, h, h3, hr, input, label, span, textarea } from 'react-hyperscript-helpers';
import { Link } from 'react-router-dom';
import Select from 'react-select';
import { Alert } from '../components/Alert';
import { ConfirmationDialog } from '../components/ConfirmationDialog';
import { Notification } from '../components/Notification';
import { PageHeading } from '../components/PageHeading';
import {DAC, DataSet} from '../libs/ajax';
import { NotificationService } from '../libs/notificationService';
import { Storage } from '../libs/storage';
import * as fp from 'lodash/fp';
import AsyncSelect from 'react-select/async';
import DataProviderAgreement from '../assets/Data_Provider_Agreement.pdf';
import addDatasetIcon from '../images/icon_dataset_add.png';
import { searchOntologies } from '../libs/utils';
import { OntologyService } from '../libs/ontologyService';

class DatasetRegistration extends Component {

  constructor(props) {
    super(props);
    this.state = {
      dacList: [],
      selectedDac: {},
      allDatasets: '',
      allDatasetNames: [],
      updateDataset: {},
      disableOkBtn: false,
      showValidationMessages: false,
      showModal: false,
      showDialogSubmit: false,
      formData: {
        methods: false,
        genetic: false,
        publication: false,
        collaboration: false,
        ethics: false,
        geographic: false,
        moratorium: false,
        nonProfit: false,
        hmb: false,
        npoa: false,
        diseases: false,
        ontologies: [],
        other: false,
        primaryOtherText: '',
        secondaryOther: false,
        secondaryOtherText: '',
        generalUse: false
      },
      datasetData: {
        datasetName: '',
        researcher: '',
        collectionId: '',
        principalInvestigator: '',
        datasetRepoUrl: '',
        dataType: '',
        species: '',
        phenotype: '',
        nrParticipants: '',
        description: '',
        dac: '',
        consentId: '',
        needsApproval: false,
        isValidName: false
      },
      problemSavingRequest: false,
      problemLoadingUpdateDataset: false,
      submissionSuccess: false,
      errorMessage: ''
    };

    this.handleOpenModal = this.handleOpenModal.bind(this);
    this.handleCloseModal = this.handleCloseModal.bind(this);
  }

  async componentDidMount() {
    await this.init();
    const notificationData = await NotificationService.getBannerObjectById('eRACommonsOutage');
    const currentUser = await Storage.getCurrentUser();
    const allDatasets =  await DataSet.getDatasets();
    const allDatasetNames = allDatasets.map(d => {
      let name = d.properties.find(p => p.propertyName === 'Dataset Name');
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
      const ontologies = await this.getOntologies(this.state.formData.diseases);
      const formattedOntologies = this.formatOntologyItems(ontologies);
      this.setState(prev => {
        prev.formData.ontologies = formattedOntologies;
        prev.formData.diseases = !fp.isEmpty(ontologies);
        return prev;
      });
    }
  }

  async init() {
    const { datasetId } = this.props.match.params;
    let updateDataset = {};
    // update dataset case
    if (!fp.isNil(datasetId)) {
      DataSet.getDataSetsByDatasetId(datasetId).then(data => {
        updateDataset = data;
        // redirect to blank form if dataset id is invalid or inaccessible
        if (fp.isEmpty(updateDataset) || fp.isNil(updateDataset.dataSetId)) {
          this.setState(prev => {
            prev.problemLoadingUpdateDataset = true;
          });
          this.props.history.push('/dataset_registration');
        }
        else {
          this.setState(prev => {
            prev.updateDataset = updateDataset;
          });
        }
      });
    }
  }

  // fill out the form fields with old dataset properties if they already exist
  prefillDatasetFields(dataset) {
    let name = fp.find({propertyName: 'Dataset Name'})(dataset.properties);
    let collectionId = fp.find({propertyName: 'Sample Collection ID'})(dataset.properties);
    let dataType = fp.find({propertyName: 'Data Type'})(dataset.properties);
    let species = fp.find({propertyName: 'Species'})(dataset.properties);
    let phenotype = fp.find({propertyName: 'Phenotype/Indication'})(dataset.properties);
    let nrParticipants = fp.find({propertyName: '# of participants'})(dataset.properties);
    let description = fp.find({propertyName: 'Description'})(dataset.properties);
    let datasetRepoUrl = fp.find({propertyName: 'dbGAP'})(dataset.properties);
    let researcher = fp.find({propertyName: 'Data Depositor'})(dataset.properties);
    let pi = fp.find({propertyName: 'Principal Investigator(PI)'})(dataset.properties);
    let needsApproval = dataset.needsApproval;
    let dac = fp.find({dacId: dataset.dacId})(this.state.dacList);

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
      prev.datasetData.principalInvestigator = pi ? pi.propertyValue : '';
      prev.datasetData.needsApproval = needsApproval;
      prev.datasetData.dac = dac;
      prev.selectedDac = dac;
      let validName = this.validateDatasetName(prev.datasetData.datasetName);
      prev.datasetData.isValidName = validName;

      return prev;
    });

    if (!fp.isEmpty(dataset.dataUse)) {
      this.prefillDataUseFields(dataset.dataUse);
    }
  }

  async getOntologies(urls = []) {
    if (fp.isEmpty(urls)) {
      return [];
    } else {
      const doidArr = OntologyService.extractDOIDFromUrl(urls);
      const urlParams = doidArr.join(',');
      const ontologies = await OntologyService.searchOntology(urlParams);
      return ontologies;
    }
  }

  prefillDataUseFields(dataUse) {
    let methods = dataUse.methodsResearch;
    let genetics = dataUse.geneticStudiesOnly;
    let publication = dataUse.publicationResults;
    let collaboration = dataUse.collaboratorRequired;
    let ethics = dataUse.ethicsApprovalRequired;
    let geographic = dataUse.geographicalRestrictions;
    let moratorium = dataUse.publicationMoratorium;
    let nonProfit = fp.isNil(dataUse.commercialUse) ? false : !dataUse.commercialUse;
    let hmb = dataUse.hmbResearch;
    // if the dataset's POA value is set to false, we need to check the NPOA (or NOT POA) option
    // if the dataset's POA value is set to true, leave this unchecked
    let npoa = (dataUse.populationOriginsAncestry === false);
    let diseases = dataUse.diseaseRestrictions;
    let other = dataUse.otherRestrictions;
    let primaryOtherText = dataUse.other;
    let secondaryOther = !fp.isNil(dataUse.secondaryOther);
    let secondaryOtherText = dataUse.secondaryOther;
    let generalUse = dataUse.generalUse;

    this.setState(prev => {
      prev.formData.methods = methods;
      prev.formData.genetic = genetics;
      prev.formData.publication = publication;
      prev.formData.collaboration = collaboration;
      prev.formData.ethics = ethics;
      prev.formData.geographic = geographic;
      prev.formData.moratorium = moratorium;
      prev.formData.nonProfit = nonProfit;
      prev.formData.hmb = hmb;
      prev.formData.npoa = npoa;
      prev.formData.diseases = diseases;
      prev.formData.other = other;
      prev.formData.primaryOtherText = primaryOtherText;
      prev.formData.secondaryOther = secondaryOther;
      prev.formData.secondaryOtherText = secondaryOtherText;
      prev.formData.generalUse = generalUse;
      return prev;
    });
  }

  handleOpenModal() {
    this.setState({ showModal: true });
  }

  handleCloseModal() {
    this.setState({ showModal: false });
  }

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

  // same as handleChange, but adds call to validate dataset name and only affects state if a change has been made
  handleDatasetNameChange = async (e) => {
    const value = e.target.value;
    if (this.state.datasetData.datasetName !== value) {
      await this.validateDatasetName(value);
      this.setState(prev => {
        prev.datasetData.datasetName = value;
        prev.disableOkBtn = false;
        prev.problemSavingRequest = false;
        prev.submissionSuccess = false;
        return prev;
      });
    }
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
      this.isValid(formData.principalInvestigator) &&
      this.state.datasetData.isValidName &&
      this.isValid(this.state.datasetData.datasetName) &&
      this.isValid(formData.datasetRepoUrl) &&
      this.isValid(formData.dataType) &&
      this.isValid(formData.species) &&
      this.isValid(formData.phenotype) &&
      this.isValid(formData.nrParticipants) &&
      this.isValid(formData.description) &&
      this.isValid(this.state.selectedDac) &&
      (!fp.isEmpty(this.state.updateDataset) || !this.isTypeOfResearchInvalid());
  }

  async validateDatasetName(name) {
    return DataSet.validateDatasetName(name).then(datasetId => {
      let isValid = true;
      //if this is not an update check to make sure this name is not already in use
      if (fp.isEmpty(this.state.updateDataset)) {
        isValid = (datasetId < 0);
      }
      this.setState(prev => {
        prev.datasetData.isValidName = isValid;
        return prev;
      });
    });
  }

  // generates the css classnames based on what's in the dataset name field and if we have tried to submit
  showDatasetNameErrorHighlight(name, showValidationMessages) {
    if (fp.isEmpty(name)) {
      return showValidationMessages ? 'form-control required-field-error' : 'form-control';
    }
    // if there is a name loaded in because this is an update
    if (!fp.isEmpty(this.state.updateDataset)) {
      let updateDatasetName = fp.find(p => p.propertyName === 'Dataset Name', this.state.updateDataset.properties).propertyValue;
      if (name === updateDatasetName) {
        return 'form-control';
      }
      // if the old dataset name has been edited
      else {
        return this.state.datasetData.isValidName ? 'form-control' : 'form-control required-field-error';
      }
    }
    // if a new dataset name is being edited
    else {
      return this.state.datasetData.isValidName ? 'form-control' : 'form-control required-field-error';
    }
  }

  attestAndSave = () => {
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
  }

  dialogHandlerSubmit = (answer) => () => {
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
            DataSet.postDatasetForm(ds).then(() => {
              this.setState({ showDialogSubmit: false, submissionSuccess: true });
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
            DataSet.updateDataset(datasetId, ds).then(() => {
              this.setState({ showDialogSubmit: false, submissionSuccess: true });
            }).catch(() => {
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
   * HMB, Diseases, and Other/OtherText are all mutually exclusive
   */

  isTypeOfResearchInvalid = () => {
    const valid = (
      this.state.formData.generalUse === true ||
      this.state.formData.hmb === true ||
      (this.state.formData.diseases === true && !fp.isEmpty(this.state.formData.ontologies)) ||
      (this.state.formData.other === true && !fp.isEmpty(this.state.formData.primaryOtherText))
    );
    return !valid;
  };

  setNeedsApproval = (value) => {
    this.setState(prev => {
      prev.datasetData.needsApproval = value;
      return prev;
    });
  };

  setGeneralUse = () => {
    this.setState(prev => {
      prev.formData.generalUse = true;
      prev.formData.hmb = false;
      prev.formData.diseases = false;
      prev.formData.ontologies = [];
      prev.formData.other = false;
      prev.formData.primaryOtherText = '';
      prev.disableOkBtn = false;
      prev.problemSavingRequest = false;
      prev.submissionSuccess = false;
      return prev;
    });
  };

  setHmb = () => {
    this.setState(prev => {
      prev.formData.generalUse = false;
      prev.formData.hmb = true;
      prev.formData.diseases = false;
      prev.formData.ontologies = [];
      prev.formData.npoa = false;
      prev.formData.other = false;
      prev.formData.primaryOtherText = '';
      prev.disableOkBtn = false;
      prev.problemSavingRequest = false;
      prev.submissionSuccess = false;
      return prev;
    });
  };

  setDiseases = () => {
    this.setState(prev => {
      prev.formData.generalUse = false;
      prev.formData.hmb = false;
      prev.formData.diseases = true;
      prev.formData.npoa = false;
      prev.formData.other = false;
      prev.formData.primaryOtherText = '';
      prev.disableOkBtn = false;
      prev.problemSavingRequest = false;
      prev.submissionSuccess = false;
      return prev;
    });
  };

  onOntologiesChange = (data) => {
    this.setState(prev => {
      prev.formData.ontologies = data || [];
      prev.disableOkBtn = false;
      prev.problemSavingRequest = false;
      prev.submissionSuccess = false;
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
      prev.formData.npoa = false;
      prev.disableOkBtn = false;
      prev.problemSavingRequest = false;
      prev.submissionSuccess = false;
      return prev;
    });
  };

  setOtherText = (e, level) => {
    const value = e.target.value;
    (level === 'primary') ?
      this.setState(prev => {
        prev.formData.other = true;
        prev.formData.primaryOtherText = value;
        prev.disableOkBtn = false;
        prev.problemSavingRequest = false;
        prev.submissionSuccess = false;
        return prev;
      }) :
      this.setState(prev => {
        prev.formData.secondaryOther = true;
        prev.formData.secondaryOtherText = value;
        prev.disableOkBtn = false;
        prev.problemSavingRequest = false;
        prev.submissionSuccess = false;
        return prev;
      });
  };

  back = () => {
    this.props.history.goBack();
  };

  createProperties = () => {
    let properties = [];
    let formData = this.state.datasetData;

    if (formData.datasetName) {
      properties.push({'propertyName': 'Dataset Name', 'propertyValue': formData.datasetName});
    }
    if (formData.collectionId) {
      properties.push({'propertyName': 'Sample Collection ID', 'propertyValue': formData.collectionId});
    }
    if (formData.dataType) {
      properties.push({'propertyName': 'Data Type', 'propertyValue': formData.dataType});
    }
    if (formData.species) {
      properties.push({'propertyName': 'Species', 'propertyValue': formData.species});
    }
    if (formData.phenotype) {
      properties.push({'propertyName': 'Phenotype/Indication', 'propertyValue': formData.phenotype});
    }
    if (formData.nrParticipants) {
      properties.push({'propertyName': '# of participants', 'propertyValue': formData.nrParticipants});
    }
    if (formData.description) {
      properties.push({'propertyName': 'Description', 'propertyValue': formData.description});
    }
    if (formData.datasetRepoUrl) {
      properties.push({'propertyName': 'dbGAP', 'propertyValue': formData.datasetRepoUrl});
    }
    if (formData.researcher) {
      properties.push({'propertyName': 'Data Depositor', 'propertyValue': formData.researcher});
    }
    if (formData.principalInvestigator) {
      properties.push({'propertyName': 'Principal Investigator(PI)', 'propertyValue': formData.principalInvestigator});
    }

    return properties;
  };

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
      } else {
        prev.selectedDac = option.item;
        prev.datasetData.dac = option.item;
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
    result.dacId = this.state.selectedDac.dacId;
    result.consentId = data.consentId;
    result.translatedDataUse = data.translatedDataUse;
    result.deletable = true;
    result.active = true;
    result.needsApproval = data.needsApproval;
    result.isAssociatedToDataOwners = true;
    result.updateAssociationToDataOwnerAllowed = true;
    result.properties = this.createProperties();
    result.dataUse = fp.isEmpty(this.state.updateDataset) ? this.formatDataUse(this.state.formData) : this.state.updateDataset.dataUse;
    return result;
  };

  formatDataUse = (data) => {
    let result = {};
    if (data.methods) {
      result.methodsResearch = data.methods;
    }
    if (data.genetic) {
      result.geneticStudiesOnly = data.genetic;
    }
    if (data.publication) {
      result.publicationResults = data.publication;
    }
    if (data.collaboration) {
      result.collaboratorRequired = data.collaboration;
    }
    if (data.ethics) {
      result.ethicsApprovalRequired = data.ethics;
    }
    if (data.geographic) {
      result.geographicalRestrictions = 'Yes';
    }
    if (data.moratorium) {
      result.publicationMoratorium = data.moratorium;
    }
    if (data.npoa) {
      result.populationOriginsAncestry = false;
    }
    if (data.nonProfit) {
      result.commercialUse = !data.nonProfit;
    }
    if (data.hmb) {
      result.hmbResearch = data.hmb;
    }
    if (data.diseases) {
      let ids = data.ontologies.map(ontology => ontology.id);
      result.diseaseRestrictions = ids;
    }
    if (data.other) {
      result.otherRestrictions = data.other;
    }
    if (fp.trim(data.primaryOtherText).length > 0) {
      result.other = data.primaryOtherText;
    }
    if (data.secondaryOther) {
      result.secondaryOther = data.secondaryOtherText;
    }
    if (data.generalUse) {
      result.generalUse = data.generalUse;
    }
    return result;
  };

  formatOntologyItems = (ontologies) => {
    const ontologyItems = ontologies.map((ontology) => {
      return {
        id: ontology.id || ontology.item.id,
        key: ontology.id || ontology.item.id,
        value: ontology.id || ontology.item.id,
        label: ontology.label || ontology.item.label,
        item: ontology || ontology.item
      };
    });
    return ontologyItems;
  };

  render() {

    const controlLabelStyle = {
      fontWeight: 500,
      marginTop: '1rem',
      marginBottom: '1rem'
    };

    const {
      hmb = false,
      npoa = false,
      diseases = false,
      other = false,
      primaryOtherText = '',
      secondaryOther = false,
      secondaryOtherText = '',
      genetic = false,
      nonProfit = false,
      publication = false,
      collaboration = false,
      ethics = false,
      geographic = false,
      moratorium = false,
      methods = false,
      generalUse = false,
    } = this.state.formData;
    const { ontologies } = this.state.formData;
    const { needsApproval = false } = this.state.datasetData;
    const { problemSavingRequest, problemLoadingUpdateDataset, showValidationMessages, submissionSuccess } = this.state;
    const isTypeOfResearchInvalid = this.isTypeOfResearchInvalid();
    const isUpdateDataset = (!fp.isEmpty(this.state.updateDataset));
    const dacOptions = this.dacOptions();

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
                id: 'requestApplication', imgSrc: addDatasetIcon, iconSize: 'medium', color: 'dataset',
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
                  div({ isRendered: problemLoadingUpdateDataset, className: 'rp-alert' }, [
                    Alert({
                      id: 'problemLoadingUpdateDataset', type: 'danger',
                      title: 'The Dataset you were trying to access either does not exist or you do not have permission to edit it.'
                    })
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
                        defaultValue: this.state.datasetData.researcher,
                        onBlur: this.handleChange,
                        disabled: !isUpdateDataset,
                        className: (fp.isEmpty(this.state.datasetData.researcher) && showValidationMessages) ? 'form-control required-field-error' : 'form-control',
                        required: true
                      }),
                      span({
                        isRendered: (fp.isEmpty(this.state.datasetData.researcher) && showValidationMessages), className: 'cancel-color required-field-error-span'
                      }, ['Required field'])
                    ])
                  ]),

                  div({ className: 'form-group' }, [
                    div({ className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group' }, [
                      label({ className: 'control-label rp-title-question dataset-color' }, ['1.2 Principal Investigator (PI)*'])
                    ]),

                    div({ className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group' }, [
                      input({
                        type: 'text',
                        name: 'principalInvestigator',
                        id: 'inputPrincipalInvestigator',
                        defaultValue: this.state.datasetData.principalInvestigator,
                        onBlur: this.handleChange,
                        className: (fp.isEmpty(this.state.datasetData.principalInvestigator) && showValidationMessages) ? 'form-control required-field-error' : 'form-control',
                        required: true
                      }),
                      span({
                        isRendered: (fp.isEmpty(this.state.datasetData.principalInvestigator) && showValidationMessages), className: 'cancel-color required-field-error-span'
                      }, ['Required field'])
                    ])
                  ]),

                  div({className: 'form-group'}, [
                    div(
                      {className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group'},
                      [
                        label({className: 'control-label rp-title-question dataset-color'}, [
                          '1.3 Dataset Name* ',
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
                          defaultValue: this.state.datasetData.datasetName,
                          onBlur: this.handleDatasetNameChange,
                          className: this.showDatasetNameErrorHighlight(this.state.datasetData.datasetName, showValidationMessages),
                          required: true,
                        }),
                        span({
                          className: 'cancel-color required-field-error-span',
                          isRendered: fp.includes('required-field-error', this.showDatasetNameErrorHighlight(this.state.datasetData.datasetName, showValidationMessages))
                        },
                        [this.state.datasetData.isValidName ? 'Required field' : 'Dataset Name already in use']),
                      ])
                  ]),

                  div({className: 'form-group'}, [
                    div(
                      {className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group'},
                      [
                        label({className: 'control-label rp-title-question dataset-color'}, [
                          '1.4 Dataset Repository URL* ',
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
                          defaultValue: this.state.datasetData.datasetRepoUrl,
                          onBlur: this.handleChange,
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
                          '1.5 Data Type* ',
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
                          defaultValue: this.state.datasetData.dataType,
                          onBlur: this.handleChange,
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
                          '1.6 Species* ',
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
                          defaultValue: this.state.datasetData.species,
                          onBlur: this.handleChange,
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
                          '1.7 Phenotype/Indication* ',
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
                          defaultValue: this.state.datasetData.phenotype,
                          onBlur: this.handleChange,
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
                          '1.8 # of Participants* ',
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
                          defaultValue: this.state.datasetData.nrParticipants,
                          onBlur: this.handlePositiveIntegerOnly,
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
                          '1.9 Dataset Description* ',
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
                          defaultValue: this.state.datasetData.description,
                          onBlur: this.handleChange,
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
                          '1.10 Data Access Committee* ',
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
                          value: fp.filter((dac) => this.state.selectedDac?.dacId === dac.value, dacOptions),
                          openMenuOnFocus: true,
                          isDisabled: false,
                          isClearable: true,
                          isMulti: false,
                          isSearchable: true,
                          options: dacOptions,
                          placeholder: 'Select a DAC...',
                          className: (fp.isEmpty(this.state.selectedDac) && showValidationMessages) ?
                            'required-field-error' :
                            '',
                          required: true,
                        }),
                        span({
                          className: 'cancel-color required-field-error-span',
                          isRendered: fp.isEmpty(this.state.selectedDac) && showValidationMessages,
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
                      span({className: 'control-label rp-title-question dataset-color'}, [
                        '2.1 Primary Data Use Terms* ',
                        span({style: {marginBottom:'1.5rem'}},
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
                              id: 'checkGeneral',
                              name: 'checkPrimary',
                              value: 'general',
                              defaultChecked: generalUse,
                              onClick: this.setGeneralUse,
                              label: 'General Research Use: ',
                              description: 'Use is permitted for any research purpose',
                              disabled: isUpdateDataset,
                            }),

                            RadioButton({
                              id: 'checkHmb',
                              name: 'checkPrimary',
                              value: 'hmb',
                              defaultChecked: hmb,
                              onClick: this.setHmb,
                              label: 'Health/Medical/Biomedical Use: ',
                              description: 'Use is permitted for any health, medical, or biomedical purpose',
                              disabled: isUpdateDataset,
                            }),

                            RadioButton({
                              id: 'checkDisease',
                              name: 'checkPrimary',
                              value: 'diseases',
                              defaultChecked: diseases,
                              onClick: this.setDiseases,
                              label: 'Disease-related studies: ',
                              description: 'Use is permitted for research on the specified disease',
                              disabled: isUpdateDataset,
                            }),
                            div({
                              style: {
                                marginTop: '1rem',
                                marginBottom: '2rem',
                                color: '#777',
                                cursor: diseases ? 'pointer' : 'not-allowed',
                              },
                            }, [
                              h(AsyncSelect, {
                                id: 'sel_diseases',
                                isDisabled: isUpdateDataset || !diseases,
                                isMulti: true,
                                loadOptions: (query, callback) => searchOntologies(query, callback),
                                onChange: (option) => this.onOntologiesChange(option),
                                value: ontologies,
                                placeholder: 'Please enter one or more diseases',
                                classNamePrefix: 'select',
                              }),
                            ]),

                            RadioButton({
                              id: 'checkOther',
                              name: 'checkPrimary',
                              value: 'other',
                              defaultChecked: other,
                              onClick: this.setOther,
                              label: 'Other Use:',
                              description: 'Permitted research use is defined as follows: ',
                              disabled: isUpdateDataset,
                            }),

                            textarea({
                              style: {margin: '1rem 0'},
                              className: 'form-control',
                              value: primaryOtherText,
                              onChange: (e) => this.setOtherText(e, 'primary'),
                              name: 'primaryOtherText',
                              id: 'primaryOtherText',
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
                              label({className: 'control-label rp-title-question dataset-color'},
                                [
                                  '2.2 Secondary Data Use Terms',
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
                          {className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group', isRendered: generalUse || npoa },
                          [
                            div({className: 'checkbox'}, [
                              input({
                                checked: npoa,
                                onChange: this.handleCheckboxChange,
                                id: 'checkNpoa',
                                type: 'checkbox',
                                className: 'checkbox-inline rp-checkbox',
                                name: 'npoa',
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
                                checked: nonProfit,
                                onChange: this.handleCheckboxChange,
                                id: 'checkNonProfit',
                                type: 'checkbox',
                                className: 'checkbox-inline rp-checkbox',
                                name: 'nonProfit',
                                disabled: isUpdateDataset
                              }),
                              label({
                                className: 'regular-checkbox rp-choice-questions',
                                htmlFor: 'checkNonProfit',
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
                                checked: secondaryOther,
                                onChange: this.handleCheckboxChange,
                                id: 'checkSecondaryOther',
                                type: 'checkbox',
                                className: 'checkbox-inline rp-checkbox',
                                name: 'secondaryOther',
                                disabled: isUpdateDataset
                              }),
                              label({
                                className: 'regular-checkbox rp-choice-questions',
                                htmlFor: 'checkSecondaryOther',
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
                              defaultValue: secondaryOtherText,
                              onBlur: (e) => this.setOtherText(e, 'secondary'),
                              name: 'secondaryOtherText',
                              id: 'inputSecondaryOtherText',
                              className: 'form-control',
                              rows: '6',
                              required: false,
                              placeholder: 'Note - adding free text data use terms in the box will inhibit your dataset from being read by the DUOS Algorithm for decision support.',
                              disabled: isUpdateDataset || !secondaryOther
                            })
                          ]),
                      ]),
                    ]),
                ]),


                h3({ className: 'rp-form-title dataset-color' }, ['3. Data Provider Agreement']),

                div({ className: 'form-group' }, [
                  div({ className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12' }, [
                    label({ className: 'control-label rp-title-question dataset-color' }, [
                      '3.1 DUOS Data Provider Agreement'
                    ])
                  ]),

                  div({ className: 'row no-margin' }, [
                    div({ className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group' }, [
                      label({ style: controlLabelStyle, className: 'default-color' },
                        ['By submitting this Data Provider Agreement, you agree to comply with all terms relevant to Dataset Custodians put forth in the agreement.'])
                    ]),

                    div({ className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group' }, [
                      a({
                        id: 'link_downloadAgreement', href: DataProviderAgreement, target: '_blank',
                        className: 'col-lg-4 col-md-4 col-sm-6 col-xs-12 btn-secondary btn-download-pdf hover-color'
                      }, [
                        span({ className: 'glyphicon glyphicon-download' }),
                        'DUOS Data Provider Agreement'
                      ])
                    ]),
                  ]),

                  div({ className: 'row no-margin'}, [
                    div({ className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group' }, [
                      label({ style: controlLabelStyle, className: 'default-color' },
                        ['Do you want to make this dataset publicly available in the DUOS dataset catalog and able to receive data access requests under the assigned DAC above?']),

                      div({style: {display: 'flex'}}, [
                        RadioButton({
                          id: 'checkNeedsApproval_yes',
                          name: 'checkNeedsApproval',
                          value: 'yes',
                          defaultChecked: !needsApproval,
                          onClick: () => this.setNeedsApproval(false),
                          label: 'Yes'
                        }),

                        div({style: {width: '10%'}}),

                        RadioButton({
                          id: 'checkNeedsApproval_no',
                          name: 'checkNeedsApproval',
                          value: 'no',
                          defaultChecked: needsApproval,
                          onClick: () => this.setNeedsApproval(true),
                          label: 'No'
                        }),
                      ]),
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
                        title: isUpdateDataset ? 'Dataset was successfully updated.' : 'Dataset was successfully registered.'
                      })
                    ]),

                    div({ className: 'row no-margin' }, [
                      div({ className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12' }, [

                        a({
                          id: 'btn_submit', onClick: this.attestAndSave,
                          className: 'f-right btn-primary dataset-background bold'
                        }, [isUpdateDataset ? 'Update Dataset' : 'Register in DUOS!']),

                        ConfirmationDialog({
                          title: 'Dataset Registration Confirmation', disableOkBtn: this.state.disableOkBtn,
                          color: 'dataset', showModal: this.state.showDialogSubmit, action: { label: 'Yes', handler: this.dialogHandlerSubmit }
                        }, [div({ className: 'dialog-description' }, ['Are you sure you want to submit this Dataset Registration?'])]),

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
