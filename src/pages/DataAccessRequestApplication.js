import { Component } from 'react';
import { a, div, form, h, hr, i, small, span } from 'react-hyperscript-helpers';
import ResearcherInfo from './dar_application/ResearcherInfo';
import DataAccessRequest from './dar_application/DataAccessRequest';
import ResearchPurposeStatement from './dar_application/ResearchPurposeStatement';
import DataUseAgreements from './dar_application/DataUseAgreements';
import {
  isFileEmpty,
  Navigation,
  Notifications as NotyUtil
} from '../libs/utils';
import { TypeOfResearch } from './dar_application/TypeOfResearch';
import { ConfirmationDialog } from '../components/ConfirmationDialog';
import { Notification } from '../components/Notification';
import { PageHeading } from '../components/PageHeading';
import { Collections, DAR, DataSet, User } from '../libs/ajax';
import { NotificationService } from '../libs/notificationService';
import { Storage } from '../libs/storage';
import { any, assign, cloneDeep, find, get, getOr, head, isEmpty, isNil, keys, map, merge, pickBy } from 'lodash/fp';
import './DataAccessRequestApplication.css';
import headingIcon from '../images/icon_add_access.png';

class DataAccessRequestApplication extends Component {
  constructor(props) {
    super(props);
    this.state = {
      nihValid: false,
      disableOkBtn: false,
      showValidationMessages: false,
      file: {
        name: ''
      },
      showDialogSubmit: false,
      showDialogSave: false,
      step: 1,
      formData: {
        datasets: [],
        darCode: null,
        labCollaborators: [],
        internalCollaborators: [],
        externalCollaborators: [],
        checkCollaborator: false,
        checkNihDataOnly: false,
        rus: '',
        nonTechRus: '',
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
        researcher: '',
        projectTitle: '',
        profileName: '',
        pubmedId: '',
        scientificUrl: '',
        signingOfficial: '',
        itDirector: '',
        anvilUse: '',
        localUse: '',
        cloudUse: '',
        cloudProvider: '',
        cloudProviderType: '',
        cloudProviderDescription: '',
        gsoAcknowledgement: false,
        pubAcknowledgement: false,
        dsAcknowledgement: false,
        irbDocumentLocation: '',
        irbDocumentName: '',
        collaborationLetterLocation: '',
        collaborationLetterName: '',
        activeDULQuestions: {}
      },
      step1: {
        inputResearcher: {
          invalid: false
        },
        inputNih: {
          invalid: false
        }
      },
      step2: {
        uploadedIrbDocument: null,
        uploadedCollaborationLetter: null
      },
      step3: {
        inputPurposes: {
          invalid: false
        }
      },
      problemSavingRequest: false
    };

    this.goToStep = this.goToStep.bind(this);
    this.formFieldChange = this.formFieldChange.bind(this);
    this.partialSave = this.partialSave.bind(this);
    this.changeDARDocument = this.changeDARDocument.bind(this);
  }

  //helper function to coordinate local state changes as well as updates to form data on the parent
  formFieldChange = (dataset) => {
    const {name, value} = dataset;
    this.setState(state => {
      state.formData[name] = value;
      return state;
    }, () => this.checkValidations());
  };

  changeDARDocument = (dataset) => {
    const { name, value } = dataset;
    const uploadedFileName = `uploaded${name[0].toUpperCase()}${name.slice(1)}`;
    const prevFileName = `${name}Name`;
    const prevFileLocation = `${name}Location`;

    //if value (new uploaded file) is not nil, update relevant fields
    //on later submit/save, save new file to cloud storage and update file name and location before submitting formData
    if(!isNil(value)) {
      this.setState(state => {
        state.formData[prevFileName] = '';
        state.formData[prevFileLocation] = '';
        state.step2[uploadedFileName] = value;
        return state;
      });
    } else {
      this.setState(prev => {
        prev.step2[uploadedFileName] = value;
        return prev;
      });
    }
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
    this.setState(prev => {
      prev.notificationData = notificationData;
      return prev;
    });
  }

  async getDatasets(formData) {
    const dsIds = get('datasetIds')(formData);
    let datasets;
    if (!isNil(dsIds)) {
      datasets = await Promise.all(map((id) => DataSet.getDataSetsByDatasetId(id))(dsIds));
      datasets = map(ds => this.formatDatasetForAutocomplete(ds))(datasets);
    } else {
      datasets = [];
    }

    return datasets;
  }

  async init() {
    const { dataRequestId, collectionId } = this.props.match.params;
    let formData = {};
    const researcher = await User.getMe();
    const signingOfficials = await User.getSOsForCurrentUser();
    this.setState(prev => {
      prev.researcher = researcher;
      prev.allSigningOfficials = signingOfficials;
      return prev;
    });

    if(!isNil(collectionId)) {
      // Review existing DAR application - retrieves all datasets in the collection
      // Besides the datasets, DARs split off from the collection should have the same formData
      const collection = await Collections.getCollectionById(collectionId);
      const { dars, datasets } = collection;
      const darReferenceId = head(keys(dars));
      formData = await DAR.getPartialDarRequest(darReferenceId);
      formData.datasetIds = map(ds => get('dataSetId')(ds))(datasets);
      formData.datasets =  map(ds => this.formatDatasetForAutocomplete(ds))(datasets);
    }
    else if (!isNil(dataRequestId)) {
      // Handle the case where we have an existing DAR id
      // Same endpoint works for any dataRequestId, not just partials.
      formData = await DAR.getPartialDarRequest(dataRequestId);
      formData.datasets = await this.getDatasets(formData);
    } else {
      // Lastly, try to get the form data from local storage and clear out whatever was there previously
      formData = Storage.getData('dar_application') === null ? this.state.formData : Storage.getData('dar_application');
      Storage.removeData('dar_application');
    }

    formData.researcher = isNil(researcher) ? '' : researcher.displayName;
    formData.institution = isNil(researcher)  || isNil(researcher.institution)? '' : researcher.institution.name;
    formData.userId = researcher.userId;

    this.setState(prev => {
      prev.formData = merge(prev.formData, formData);
      return prev;
    });

  }

  formatDatasetForAutocomplete = (dataset) => {
    const nameProp = find({'propertyName':'Dataset Name'})(dataset.properties);
    return {
      key: dataset.dataSetId,
      value: dataset.dataSetId,
      label: nameProp.propertyValue
    };
  };

  formatOntologyItems = (ontologies) => {
    return map((ontology) => {
      return {
        //item being referenced as a way to backfill older ontologies that don't have a proper label attributes
        id: ontology.id || ontology.item.id,
        key: ontology.id || ontology.item.id,
        value: ontology.id || ontology.item.id,
        label: ontology.label || ontology.item.label,
        item: ontology.item
      };
    })(ontologies);
  };

  updateShowValidationMessages = (value) => {
    this.setState((state) => {
      state.showValidationMessages = value;
      return state;
    });
  };

  checkValidations() {
    if (this.state.showValidationMessages === true && this.state.step === 1) {
      this.verifyStep1();
    } else if (this.state.showValidationMessages === true && this.state.step === 2) {
      this.verifyStep2();
    } else if (this.state.showValidationMessages === true && this.state.step === 3) {
      this.verifyStep3();
    }
  }

  handleRadioChange = (e, field, value) => {
    if (value === 'true') {
      value = true;
    } else if (value === 'false') {
      value = false;
    }
    this.setState(prev => {
      if (field === 'oneGender' && value === false) {
        prev.formData.gender = '';
      }
      prev.formData[field] = value;
      return prev;
    }, () => this.checkValidations());
  };

  //NOTE: use nextPage and previous page instead of having individual go to pages for each step
  nextPage = () => {
    this.setState(prev => {
      prev.step = prev.step + 1;
      return prev;
    });
    window.scrollTo(0,0);
  };

  prevPage = () => {
    this.setState(prev => {
      prev.step = prev.step - 1;
      return prev;
    });
    window.scrollTo(0,0);
  };

  goToStep = (step = 1) => {
    this.setState(prev => {
      prev.step = step;
      return prev;
    });
    window.scrollTo(0, 0);
  };

  attestAndSave = () => {
    let invalidStep1 = this.verifyStep1();
    let invalidStep2 = this.verifyStep2();
    let invalidStep3 = this.verifyStep3();
    if (!invalidStep1 && !invalidStep2 && !invalidStep3) {
      this.setState({ showDialogSubmit: true });
    } else {
      this.setState(state => {
        state.showValidationMessages = true;
        return state;
      });
    }
  };

  isValid(value) {
    let isValid = false;
    if (value !== '' && value !== null && value !== undefined) {
      isValid = true;
    }
    return isValid;
  }

  //NOTE: seperated out check functionality from state updates in original function to make it easier to follow
  step1InvalidChecks = () => {
    let isResearcherInvalid = false,
      showValidationMessages = false,
      isSigningOfficialInvalid = false,
      isITDirectorInvalid = false,
      isAnvilUseInvalid = false,
      isCloudUseInvalid = false,
      isCloudProviderInvalid = false,
      isNihInvalid = !this.state.nihValid;

    const {anvilUse, localUse, cloudUse, cloudProvider, cloudProviderDescription, cloudProviderType} = this.state.formData;

    if (!this.isValid(this.state.formData.researcher)) {
      isResearcherInvalid = true;
      showValidationMessages = true;
    }
    // DUOS-565: checkCollaborator : false and nihValid : false is an invalid combination
    if (this.state.formData.checkCollaborator !== true &&
      !this.state.nihValid) {
      isNihInvalid = true;
      showValidationMessages = true;
    }

    if(!this.isValid(this.state.formData.signingOfficial)) {
      isSigningOfficialInvalid = true;
      showValidationMessages = true;
    }

    if(!this.isValid(this.state.formData.itDirector)) {
      isITDirectorInvalid = true;
      showValidationMessages = true;
    }

    if(!this.isValid(anvilUse)) {
      isAnvilUseInvalid = true;
      showValidationMessages = true;
    } else {
      if(!anvilUse && !localUse && !cloudUse) {
        isCloudUseInvalid = true;
        showValidationMessages = true;
      } else {
        if(cloudUse && (!this.isValid(cloudProvider) || !this.isValid(cloudProviderType) || !this.isValid(cloudProviderDescription))){
          isCloudProviderInvalid = true;
          showValidationMessages = true;
        }
      }
    }

    return {
      isResearcherInvalid,
      showValidationMessages,
      isNihInvalid,
      isCloudUseInvalid,
      isCloudProviderInvalid,
      isSigningOfficialInvalid,
      isITDirectorInvalid,
      isAnvilUseInvalid
    };
  };

  //method to be passed to step 4 for error checks/messaging
  step1InvalidResult(dataset) {
    const checkCollaborator = this.state.formData.checkCollaborator;
    const {
      isResearcherInvalid,
      showValidationMessages,
      isNihInvalid,
      isCloudUseInvalid,
      isCloudProviderInvalid,
      isSigningOfficialInvalid,
      isITDirectorInvalid,
      isAnvilUseInvalid
    } = dataset;

    return isResearcherInvalid
      || showValidationMessages
      || (!checkCollaborator && isNihInvalid)
      || isCloudUseInvalid
      || isCloudProviderInvalid
      || isSigningOfficialInvalid
      || isITDirectorInvalid
      || isAnvilUseInvalid;
  }

  verifyStep1() {
    const { isResearcherInvalid,
      isNihInvalid,
      showValidationMessages,
      isCloudUseInvalid,
      isCloudProviderInvalid,
      isSigningOfficialInvalid,
      isITDirectorInvalid,
      isAnvilUseInvalid
    } = this.step1InvalidChecks();
    this.setState(prev => {
      prev.step1.inputResearcher.invalid = isResearcherInvalid;
      prev.step1.inputNih.invalid = isNihInvalid;
      prev.isCloudUseInvalid = isCloudUseInvalid;
      prev.isCloudProviderInvalid = isCloudProviderInvalid;
      prev.isSigningOfficialInvalid = isSigningOfficialInvalid;
      prev.isITDirectorInvalid = isITDirectorInvalid;
      prev.isAnvilUseInvalid = isAnvilUseInvalid;
      if (prev.showValidationMessages === false) prev.showValidationMessages = showValidationMessages;
      return prev;
    });
    return showValidationMessages;
  }

  verifyStep2() {
    //defined attribute keys for dynamic DUL based questions
    const dulInvalidCheck = () => {
      const activeQuestions = pickBy((isActive) => isActive)(this.state.formData.activeDULQuestions);
      let result = false;
      //mapping of ontology keys to dar established keys
      const dulQuestionMap = {
        'geneticStudiesOnly': 'gsoAcknowledgement',
        'publicationResults': 'pubAcknowledgement',
        'diseaseRestrictions': 'dsAcknowledgement',
        'ethicsApprovalRequired': 'irbDocument',
        'collaboratorRequired': 'collaborationLetter'
      };

      if (!isNil(activeQuestions) && !isEmpty(activeQuestions)) {
        const formData = this.state.formData;
        const uncappedAny = any.convert({cap: false});
        //uncappedAny will look for the first instance in which the dataset is false (or nil/empty) for early termination
        result = uncappedAny((value, question) => {
          const formDataKey = dulQuestionMap[question];
          const input = formData[formDataKey];
          //for the document keys, check to see if a file has recently uploaded to the front-end or has been saved previously
          if ((formDataKey === 'irbDocument' || formDataKey === 'collaborationLetter')) {
            //keys follow the syntax of 'uploaded{irbDocument|collaborationLetter} (for newly uploaded files)
            const newlyUploadedFileKey = `uploaded${formDataKey[0].toUpperCase()}${formDataKey.slice(1)}`;
            //keys follow the syntax of '{irbDocument | collaborationLetter}Location' (for previously saved files)
            const currentFileLocationKey = `${formDataKey}Location`;
            //use the establhed key to assign the newly uploaded file to a variable
            const newlyUploadedFile = this.state.step2[newlyUploadedFileKey];
            //use established key to assign the saved file location to a variable
            const currentFileLocation = this.state.formData[currentFileLocationKey];
            //confirm question status and perform empty check for files to determine rejection
            return isEmpty(currentFileLocation) && (isFileEmpty(newlyUploadedFile));
            //if question is a checkbox acknowledgement and the question is active, check to see if box was left unchecked using translated key
          } else if((formDataKey === 'dsAcknowledgement' || formDataKey === 'gsoAcknowledgement' || formDataKey === 'pubAcknowledgement')) {
            return !this.state.formData[formDataKey];
          //else check input directly
          } else {
            return !input;
          }
        })(activeQuestions);
      }
      return result;
    };

    const dulInvalid = dulInvalidCheck();
    const datasetsInvalid = isEmpty(this.state.formData.datasets);
    const titleInvalid = isEmpty(this.state.formData.projectTitle);
    const typeOfResearchInvalid = this.isTypeOfResearchInvalid();
    const rusInvalid = isEmpty(this.state.formData.rus);
    const summaryInvalid = isEmpty(this.state.formData.nonTechRus);
    return dulInvalid || datasetsInvalid || titleInvalid || typeOfResearchInvalid || rusInvalid || summaryInvalid;
  }

  isGenderValid(gender, oneGender) {
    let isValidGender = false;
    if (oneGender === false || (oneGender === true && this.isValid(gender))) {
      isValidGender = true;
    }
    return isValidGender;
  }

  step3InvalidResult = () => {
    return !(this.isValid(this.state.formData.forProfit) &&
      this.isValid(this.state.formData.oneGender) &&
      this.isGenderValid(this.state.formData.gender, this.state.formData.oneGender) &&
      this.isValid(this.state.formData.pediatric) &&
      this.isValid(this.state.formData.illegalBehavior) &&
      this.isValid(this.state.formData.addiction) &&
      this.isValid(this.state.formData.sexualDiseases) &&
      this.isValid(this.state.formData.stigmatizedDiseases) &&
      this.isValid(this.state.formData.vulnerablePopulation) &&
      this.isValid(this.state.formData.populationMigration) &&
      this.isValid(this.state.formData.psychiatricTraits) &&
      this.isValid(this.state.formData.notHealth));
  };

  verifyStep3() {
    let invalid = false;
    if (this.step3InvalidResult()) {
      this.setState(prev => {
        prev.step3.inputPurposes.invalid = true;
        prev.showValidationMessages = true;
        return prev;
      });
      invalid = true;
    } else {
      this.setState(prev => {
        prev.step3.inputPurposes.invalid = false;
        return prev;
      });
    }
    return invalid;
  }

  partialSave = () => {
    this.setState({ showDialogSave: true });
  };

  //Can't do uploads in parallel since endpoints are post and they both alter attributes in json column
  //If done in parallel, updated attribute of one document will be overwritten by the outdated value on the other
  saveDARDocuments = async(uploadedIrbDocument = null, uploadedCollaborationLetter = null, referenceId) => {
    let irbUpdate, collaborationUpdate;
    irbUpdate = await DAR.uploadDARDocument(uploadedIrbDocument, referenceId, 'irbDocument');
    collaborationUpdate = await DAR.uploadDARDocument(uploadedCollaborationLetter, referenceId, 'collaborationDocument');
    return assign(irbUpdate.data, collaborationUpdate.data);
  };

  updateDraftResponse = (formattedFormData, referenceId) => {
    let darPartialResponse;
    if(!isNil(referenceId) && !isEmpty(referenceId)) {
      darPartialResponse = DAR.updateDarDraft(formattedFormData, referenceId);
    } else {
      darPartialResponse = DAR.postDarDraft(formattedFormData);
    }
    return darPartialResponse;
  };

  submitDARFormData = async (answer) => {
    if (answer === true) {
      const userId = Storage.getCurrentUser().userId;
      const {uploadedIrbDocument, uploadedCollaborationLetter} = this.state.step2;
      let formattedFormData = cloneDeep(this.state.formData);
      const ontologies = this.formatOntologyItems(this.state.formData.ontologies);

      if (ontologies.length > 0) {
        formattedFormData.ontologies = ontologies;
      }
      for (var key in formattedFormData) {
        if (formattedFormData[key] === '') {
          formattedFormData[key] = undefined;
        }
      }
      formattedFormData.datasetIds = map('value')(formattedFormData.datasets);
      formattedFormData.userId = userId;

      try {
        //NOTE: the pre-processing saves are adding time to record generation (makes front-end seem slow)
        //pre-prcessing saves are needed since you can't save documents without a reference id
        //saves ensure record has a reference id
        //actual fix would involve generating a blank draft record that is saved on console button click
        //however that would fall outside the scope of this pr, which is already large enough due to refactored code
        let referenceId = formattedFormData.referenceId;
        let darPartialResponse = await this.updateDraftResponse(formattedFormData, referenceId);
        referenceId = darPartialResponse.referenceId;

        //execute saveDARDocuments method only if documents are required for the DAR
        //value can be determined from activeDULQuestions, which is populated on Step 2 where document upload occurs
        const {activeDULQuestions} = this.state.formData;
        if(activeDULQuestions.ethicsApprovalRequired || activeDULQuestions.collaboratorRequired) {
          darPartialResponse = await this.saveDARDocuments(uploadedIrbDocument, uploadedCollaborationLetter, referenceId);
        }
        let updatedFormData = assign(formattedFormData, darPartialResponse);
        await DAR.postDar(updatedFormData);
        this.setState({
          showDialogSubmit: false
        }, Navigation.console(Storage.getCurrentUser(), this.props.history).response);
      } catch (error) {
        this.setState({
          showDialogSubmit: false
        });
        NotyUtil.showError({
          text: 'Error: Data Access Request submission failed'
        });
      }
    } else {
      this.setState({
        showDialogSubmit: false
      });
    }
  };

  dialogHandlerSubmit = (answer) => () => {
    this.setState(prev => {
      prev.disableOkButton = true;
      return prev;
    });
    this.submitDARFormData(answer);
  };

  setShowDialogSave = (value) => {
    this.setState(prev => {
      prev.showDialogSave = value;
      prev.disableOkBtn = false;
      return prev;
    });
  };

  dialogHandlerSave = (answer) => () => {
    this.setState(prev => {
      prev.disableOkBtn = true;
      return prev;
    });
    if (answer === true) {
      // DAR datasetIds needs to be a list of ids
      const datasetIds = map('value')(this.state.formData.datasets);
      // DAR ontologies needs to be a list of id/labels.
      const ontologies = this.formatOntologyItems(this.state.formData.ontologies);
      this.setState(prev => {
        prev.formData.datasetIds = datasetIds;
        prev.formData.ontologies = ontologies;
        return prev;
      }, () => this.saveDarDraft());
    } else {
      this.setShowDialogSave(false);
    }
  };

  saveDarDraft = async () => {
    let formattedFormData = cloneDeep(this.state.formData);
    // DAR datasetIds needs to be a list of ids
    formattedFormData.datasetIds = map('value')(formattedFormData.datasets);
    const {uploadedIrbDocument, uploadedCollaborationLetter} = this.state.step2;
    // Make sure we navigate back to the current DAR after saving.
    const { dataRequestId } = this.props.match.params;
    try {
      let referenceId = formattedFormData.referenceId;
      let darPartialResponse = await this.updateDraftResponse(formattedFormData, referenceId);
      referenceId = darPartialResponse.referenceId;
      if(isNil(dataRequestId)) {
        this.props.history.replace('/dar_application/' + referenceId);
      }
      //execute saveDARDocuments method only if documents are required for the DAR
      //value can be determined from activeDULQuestions, which is populated on Step 2 where document upload occurs
      const {activeDULQuestions} = this.state.formData;
      if(activeDULQuestions.ethicsApprovalRequired || activeDULQuestions.collaboratorRequired) {
        darPartialResponse = await this.saveDARDocuments(uploadedIrbDocument, uploadedCollaborationLetter, referenceId);
      }
      this.setState(prev => {
        prev.formData = assign(prev.formData, darPartialResponse);
        prev.showDialogSave = false;
        prev.disableOkBtn = false;
        return prev;
      });
    } catch(error) {
      this.setState(prev => {
        prev.showDialogSave = false;
        prev.disableOkBtn = false;
        return prev;
      });
      NotyUtil.showError('Error saving partial Data Access Request update');
    }
  };

  addDataUseToDataset = async(currentDatasets) => {
    //iterate through datasets array
    //if dataUse is not on the object, api call to get the full dataset info
    //method defined here rather than step 2 component since it is a dependency of another helper method here
    if(isNil(currentDatasets) || isEmpty(currentDatasets)) {
      return null;
    }

    let datasetPromises = map((partialDataset) => {
      let mappedDataset;
      if (isNil(partialDataset.dataUse)) {
        mappedDataset = DataSet.getDataSetsByDatasetId(partialDataset.value);
      } else {
        mappedDataset = Promise.resolve(partialDataset);
      }
      return mappedDataset;
    })(currentDatasets);

    let dataUseArray = await Promise.all(datasetPromises);
    dataUseArray.forEach((datasetRecord, index) => {
      currentDatasets[index].dataUse = datasetRecord.dataUse || {};
    });
    return currentDatasets;
  };

  onDatasetsChange = async (currentDatasets) => {
    let updatedDatasets = null;
    if(!isNil(currentDatasets) && !isEmpty(currentDatasets)) {
      updatedDatasets = await this.addDataUseToDataset(cloneDeep(currentDatasets));
    }
    this.setState(prev => {
      prev.formData.datasets = updatedDatasets;
      return prev;
    }, () => this.checkValidations());
  };

  /**
   * HMB, POA, Diseases, and Other/OtherText are all mutually exclusive
   */

  isTypeOfResearchInvalid = () => {
    const valid = (
      this.state.formData.hmb === true ||
      this.state.formData.poa === true ||
      (this.state.formData.diseases === true && !isEmpty(this.state.formData.ontologies)) ||
      (this.state.formData.other === true && !isEmpty(this.state.formData.otherText))
    );
    return !valid;
  };

  setHmb = () => {
    this.setState(prev => {
      prev.formData.hmb = true;
      prev.formData.poa = false;
      prev.formData.populationMigration = false;
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
      //populationMigration's value is the same as poa since they're the same question
      //however business context requires the two questions to exist on both step 2 and 3
      //therefore both keys needed to distinguish position in application
      //therefore populationMigration (step 3 question) will have it's value set by poa
      //ui element for populationMigration will be disables on step 3
      prev.formData.populationMigration = true;
      prev.formData.diseases = false;
      prev.formData.other = false;
      prev.formData.otherText = '';
      prev.formData.ontologies = [];
      return prev;
    });
  };

  setDiseases = (e) => {
    let applyToState = {
      poa: false,
      populationMigration: false,
      other: false,
      otherText: ''
    };
    if(!isEmpty(e.target.value)) {
      applyToState.hmb = false;
      applyToState.diseases = true;
    } else {
      applyToState.hmb = true;
      applyToState.diseases = false;
      applyToState.ontologies = [];
    }
    this.setState(prev => {
      prev.formData = assign(prev.formData, applyToState);
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
      prev.formData.hmb = false;
      prev.formData.poa = false;
      prev.formData.populationMigration = false;
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

  back = () => {
    this.props.history.goBack();
  };

  render() {
    const {
      checkCollaborator = false,
      checkNihDataOnly = false,
      darCode,
      hmb = false,
      poa = false,
      diseases = false,
      other = false,
      otherText = '',
      population = false,
      controls = false,
      methods = false,
      labCollaborators,
      internalCollaborators,
      externalCollaborators,
      signingOfficial = '',
      itDirector = '',
      cloudUse = false,
      localUse = false,
      anvilUse = false,
      cloudProvider = '',
      cloudProviderType = '',
      irbDocumentLocation = '', //file storage location of uploaded file,
      irbDocumentName = '', //name of uploaded file
      collaborationLetterLocation = '', //file storage location of uploaded letter
      collaborationLetterName = '', //name of uploaded letter
      cloudProviderDescription = '',
      gsoAcknowledgement,
      pubAcknowledgement,
      dsAcknowledgement,
      referenceId
    } = this.state.formData;

    const { dataRequestId } = this.props.match.params;
    const eRACommonsDestination = isNil(dataRequestId) ? 'dar_application' : ('dar_application/' + dataRequestId);
    const { problemSavingRequest, showValidationMessages,  step1 } = this.state;
    const isTypeOfResearchInvalid = this.isTypeOfResearchInvalid();
    const ontologies = this.formatOntologyItems(this.state.formData.ontologies);
    const step1Invalid = this.step1InvalidResult(this.step1InvalidChecks());
    const step2Invalid = this.verifyStep2();
    const step3Invalid = this.step3InvalidResult();
    const libraryCardInvalid = isEmpty(getOr([], 'libraryCards', this.state.researcher)) && !checkNihDataOnly;

    //NOTE: component is only here temporarily until component conversion has been complete
    //ideally this, along with the other variable initialization should be done with a useEffect hook

    const TORComponent = TypeOfResearch({
      hmb: hmb,
      hmbHandler: this.setHmb,
      poa: poa,
      populationMigration: this.state.formData.populationMigration,
      poaHandler: this.setPoa,
      diseases: diseases,
      diseasesHandler: this.setDiseases,
      disabled: (darCode !== null),
      ontologies: ontologies,
      ontologiesHandler: this.onOntologiesChange,
      other: other,
      otherHandler: this.setOther,
      otherText: otherText,
      otherTextHandler: this.setOtherText
    });

    const ConfirmationDialogComponent = ConfirmationDialog({
      title: 'Data Request Confirmation',
      disableOkBtn: this.state.disableOkBtn,
      disableNoBtn: this.state.disableOkBtn,
      color: 'access',
      showModal: this.state.showDialogSubmit,
      action: {
        label: 'Yes',
        handler: this.dialogHandlerSubmit
      }
    }, [div({
      className: 'dialog-description'
    }, ['Are you sure you want to send this Data Access Request Application?'])]);
    return (
      div({ className: 'container', style: {paddingBottom: '2%'} }, [
        div({ className: 'col-lg-10 col-lg-offset-1 col-md-12 col-sm-12 col-xs-12' }, [
          div({ className: 'row no-margin' }, [
            Notification({notificationData: this.state.notificationData}),
            div({
              className: (this.state.formData.darCode !== null ?
                'col-lg-10 col-md-9 col-sm-9 ' : 'col-lg-12 col-md-12 col-sm-12 ')
            }, [
              PageHeading({
                id: 'requestApplication', imgSrc: headingIcon, iconSize: 'medium', color: 'access',
                title: 'Data Access Request Application',
                description: 'The section below includes a series of questions intended to allow our Data Access Committee to evaluate a newly developed semi-automated process of data access control.'
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
              onClick: (() => this.goToStep(1, false)),
              className: 'col-lg-3 col-md-3 col-sm-12 col-xs-12 access-color jumbotron box-vote multi-step-title '
                + (this.state.step === 1 ? 'active' : '')
            }, [
              small({}, ['Step 1']),
              'Researcher Information',
              span({ className: 'glyphicon glyphicon-chevron-right', 'aria-hidden': 'true' }, [])
            ]),

            a({
              id: 'btn_step_2',
              onClick: (() => this.goToStep(2, false)),
              className: 'col-lg-3 col-md-3 col-sm-12 col-xs-12 access-color jumbotron box-vote multi-step-title '
                + (this.state.step === 2 ? 'active' : '')
            }, [
              small({}, ['Step 2']),
              'Data Access Request',
              span({ className: 'glyphicon glyphicon-chevron-right', 'aria-hidden': 'true' }, [])
            ]),

            a({
              id: 'btn_step_3',
              onClick: (() => this.goToStep(3, false)),
              className: 'col-lg-3 col-md-3 col-sm-12 col-xs-12 access-color jumbotron box-vote multi-step-title '
                + (this.state.step === 3 ? 'active' : '')
            }, [
              small({}, ['Step 3']),
              'Research Purpose Statement',
              span({ className: 'glyphicon glyphicon-chevron-right', 'aria-hidden': 'true' }, [])
            ]),

            a({
              id: 'btn_step_4',
              onClick: (() => this.goToStep(4, false)),
              className: 'col-lg-3 col-md-3 col-sm-12 col-xs-12 access-color jumbotron box-vote multi-step-title '
                + (this.state.step === 4 ? 'active' : '')
            }, [
              small({}, ['Step 4']),
              'Attestation & Agreements',
              span({ className: 'glyphicon glyphicon-chevron-right', 'aria-hidden': 'true' }, [])
            ])
          ])
        ]),
        form({ name: 'form', 'noValidate': true }, [
          div({ id: 'form-views' }, [

            ConfirmationDialog({
              title: 'Save changes?', disableOkBtn: this.state.disableOkBtn, disableNoBtn: this.state.disableOkBtn, color: 'access',
              showModal: this.state.showDialogSave, action: { label: 'Yes', handler: this.dialogHandlerSave }
            }, [
              div({ className: 'dialog-description' },
                ['Are you sure you want to save this Data Access Request? Previous changes will be overwritten.'])
            ]),
            div({ isRendered: this.state.step === 1 && (this.state.formData.researcher !== '') }, [
              h(ResearcherInfo, ({
                checkCollaborator: checkCollaborator,
                checkNihDataOnly: checkNihDataOnly,
                completed: !isNil(get('institution', this.state.researcher)),
                darCode: this.state.formData.darCode,
                eRACommonsDestination: eRACommonsDestination,
                formFieldChange: this.formFieldChange,
                invalidResearcher: step1.inputResearcher.invalid,
                location: this.props.location,
                nihValid: this.state.nihValid,
                onNihStatusUpdate: this.onNihStatusUpdate,
                internalCollaborators,
                labCollaborators,
                externalCollaborators,
                partialSave: this.partialSave,
                researcher: this.state.formData.researcher,
                researcherUser: this.state.researcher,
                showValidationMessages: showValidationMessages,
                nextPage: this.nextPage,
                allSigningOfficials: this.state.allSigningOfficials,
                signingOfficial: {displayName: signingOfficial},
                itDirector,
                anvilUse,
                cloudUse,
                localUse,
                cloudProviderType,
                cloudProvider,
                cloudProviderDescription,
                isCloudUseInvalid: this.state.isCloudUseInvalid,
                isCloudProviderInvalid: this.state.isCloudProviderInvalid,
                isSigningOfficialInvalid: this.state.isSigningOfficialInvalid,
                isITDirectorInvalid: this.state.isITDirectorInvalid,
                isAnvilUseInvalid: this.state.isAnvilUseInvalid
              }))
            ]),

            div({ isRendered: this.state.step === 2 }, [
              h(DataAccessRequest, {
                darCode: darCode,
                datasets: this.state.formData.datasets,
                onDatasetsChange: this.onDatasetsChange,
                showValidationMessages: showValidationMessages,
                formFieldChange: this.formFieldChange,
                projectTitle: this.state.formData.projectTitle,
                initializeDatasets: this.addDataUseToDataset,
                isTypeOfResearchInvalid: isTypeOfResearchInvalid,
                TypeOfResearch: TORComponent,
                methods,
                controls,
                population,
                rus: this.state.formData.rus,
                nonTechRus: this.state.formData.nonTechRus,
                gsoAcknowledgement,
                pubAcknowledgement,
                dsAcknowledgement,
                nextPage: this.nextPage,
                prevPage: this.prevPage,
                partialSave: this.partialSave,
                irbDocumentLocation,
                irbDocumentName,
                collaborationLetterLocation,
                collaborationLetterName,
                changeDARDocument: this.changeDARDocument,
                uploadedCollaborationLetter: this.state.step2.uploadedCollaborationLetter,
                uploadedIrbDocument: this.state.step2.uploadedIrbDocument,
                referenceId
              })
            ]),

            div({ isRendered: this.state.step === 3 }, [
              h(ResearchPurposeStatement, {
                addiction: this.state.formData.addiction,
                darCode: darCode,
                formFieldChange: this.formFieldChange,
                forProfit: this.state.formData.forProfit,
                gender: this.state.formData.gender,
                handleRadioChange: this.handleRadioChange,
                illegalBehavior: this.state.formData.illegalBehavior,
                nextPage: this.nextPage,
                notHealth: this.state.formData.notHealth,
                oneGender: this.state.formData.oneGender,
                partialSave: this.partialSave,
                pediatric: this.state.formData.pediatric,
                /*
                  NOTE: Assignment below is intentional. populationMigration and POA will have the same value with
                  poa as the determinant variable. populationMigration will exists as an indicator of its presence on step 3.
                  Values for both poa and populationMigration will be updated on selection handlers for step 2.
                  Display value for step 3 need to be based off of poa since older DARs were not created under this standard
                  Standard decision made on 01/28/2021, will add implementation date later
                */
                populationMigration: this.state.formData.poa,
                prevPage: this.prevPage,
                psychiatricTraits: this.state.formData.psychiatricTraits,
                sexualDiseases: this.state.formData.sexualDiseases,
                showValidationMessages: showValidationMessages,
                stigmatizedDiseases: this.state.formData.stigmatizedDiseases,
                vulnerablePopulation: this.state.formData.vulnerablePopulation
              })
            ]),

            div({ isRendered: this.state.step === 4 }, [
              h(DataUseAgreements, {
                darCode: darCode,
                problemSavingRequest,
                attestAndSave: this.attestAndSave,
                ConfirmationDialogComponent,
                partialSave: this.partialSave,
                prevPage: this.prevPage,
                step1Invalid,
                step2Invalid,
                step3Invalid,
                libraryCardInvalid,
                showValidationMessages,
                updateShowValidationMessages: this.updateShowValidationMessages,
                goToStep: this.goToStep
              })
            ])
          ])
        ])
      ])
    );
  }
}

export default DataAccessRequestApplication;
