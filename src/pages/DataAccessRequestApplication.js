import { Component } from 'react';
import { a, div, form, h, hr, i, small, span} from 'react-hyperscript-helpers';
import ReactTooltip from 'react-tooltip';
import ResearcherInfo from './dar_application/ResearcherInfo';
import DataAccessRequest from './dar_application/DataAccessRequest';
import ResearchPurposeStatement from './dar_application/ResearchPurposeStatement';
import DataUseAgreements from './dar_application/DataUseAgreements';
import {Notifications as NotyUtil } from '../libs/utils';
import { TypeOfResearch } from './dar_application/TypeOfResearch';
import { ConfirmationDialog } from '../components/ConfirmationDialog';
import { Notification } from '../components/Notification';
import { PageHeading } from '../components/PageHeading';
import { DAR, Researcher, DataSet } from '../libs/ajax';
import { NotificationService } from '../libs/notificationService';
import { Storage } from '../libs/storage';
import { Navigation } from "../libs/utils";
import * as fp from 'lodash/fp';
import { isEmpty, isNil } from 'lodash';
import { isFileEmpty } from '../libs/utils';
import './DataAccessRequestApplication.css';

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
      completed: '',
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
        inputInvestigator: {
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
    this.changeDULDocument = this.changeDULDocument.bind(this);
  }

  //helper function to coordinate local state changes as well as updates to form data on the parent
  formFieldChange = (dataset) => {
    const {name, value} = dataset;
    this.setState(state => {
      state.formData[name] = value;
      return state;
    }, () => this.checkValidations());
  };

  changeDULDocument = (dataset) => {
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
    ReactTooltip.rebuild();
    const notificationData = await NotificationService.getBannerObjectById('eRACommonsOutage');
    this.setState(prev => {
      prev.notificationData = notificationData;
      return prev;
    });
  }

  async init() {
    const { dataRequestId } = this.props.match.params;
    let formData = {};
    if (!fp.isNil(dataRequestId)) {
      // Handle the case where we have an existing DAR id
      // Same endpoint works for any dataRequestId, not just partials.
      DAR.getPartialDarRequest(dataRequestId).then(data => {
        formData = data;
        // Handle the case where the DAR is already submitted. We have to
        // show the single dataset that was selected for this DAR and not
        // all of the original datasets that may have been originally selected.
        if (!fp.isNil(formData.darCode)) {
          const dsId = fp.get('datasetIds')(formData)[0];
          formData.datasets = fp.filter({value: dsId.toString()})(formData.datasets);
        }
      });
    } else {
      // Lastly, try to get the form data from local storage and clear out whatever was there previously
      formData = Storage.getData('dar_application') === null ? this.state.formData : Storage.getData('dar_application');
      Storage.removeData('dar_application');
    }
    let currentUserId = Storage.getCurrentUser().dacUserId;
    let rpProperties = await Researcher.getPropertiesByResearcherId(currentUserId);
    formData.darCode = fp.isNil(formData.darCode) ? null : formData.darCode;
    formData.partialDarCode = fp.isNil(formData.partialDarCode) ? null : formData.partialDarCode;
    formData.ontologies = this.formatOntologyItems(formData);
    formData.researcher = rpProperties.profileName != null ? rpProperties.profileName : '';
    if (rpProperties.piName === undefined && rpProperties.isThePI === 'true') {
      formData.investigator = rpProperties.profileName;
    } else if (rpProperties.piName === undefined && rpProperties.isThePI === 'false') {
      formData.investigator = '--';
    } else {
      formData.investigator = rpProperties.piName;
    }

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
    formData.userId = Storage.getCurrentUser().dacUserId;

    let completed = false;
    if (!fp.isNil(formData.darCode)) {
      completed = '';
    } else if (rpProperties.completed !== undefined) {
      completed = JSON.parse(rpProperties.completed);
    }
    this.setState(prev => {
      prev.completed = completed;
      prev.formData = fp.merge(prev.formData, formData);
      return prev;
    });

  };

  formatOntologyItems = (formData) => {
    let ontologyItems = [];
    // Filter null values. TODO: Possible bug in saving partial dars
    let formDataOntologies = fp.pickBy(fp.identity)(formData.ontologies);
    if (!fp.isNil(formDataOntologies) && !fp.isEmpty(formDataOntologies)) {
      ontologyItems = fp.map((item) => {
        return {
          key: item.id,
          value: item.id,
          label: item.label,
          item: { id: item.id, label: item.label }
        };
      })(formDataOntologies);
    }
    return ontologyItems;
  };

  updateShowValidationMessages = (value) => {
    this.setState((state) => {
      state.showValidationMessages = value;
      return state;
    });
  }

  checkValidations() {
    if (this.state.showValidationMessages === true && this.state.step === 1) {
      this.verifyStep1();
    } else if (this.state.showValidationMessages === true && this.state.step === 2) {
      this.verifyStep2();
    } else if (this.state.showValidationMessages === true && this.state.step === 3) {
      this.verifyStep3();
    }
  };

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
  nextPage = (e) => {
    this.setState(prev => {
      prev.step = prev.step + 1;
      return prev;
    });
    window.scrollTo(0,0);
  }

  prevPage = (e) => {
    this.setState(prev => {
      prev.step = prev.step - 1;
      return prev;
    });
    window.scrollTo(0,0);
  }

  goToStep = (step = 1) => {
    this.setState(prev => {
      prev.step = step;
      return prev;
    });
    window.scrollTo(0, 0);
  }

  attestAndSave = (e) => {
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
  };

  //NOTE: seperated out check functionality from state updates in original function to make it easier to follow
  step1InvalidChecks = () => {
    let isResearcherInvalid = false,
      isInvestigatorInvalid = false,
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
    if (!this.isValid(this.state.formData.investigator)) {
      isInvestigatorInvalid = true;
      showValidationMessages = true;
    }
    if (this.state.formData.checkCollaborator !== true &&
      !this.isValid(this.state.formData.linkedIn) &&
      !this.isValid(this.state.formData.researcherGate) &&
      !this.isValid(this.state.formData.orcid) &&
      !this.state.nihValid) {
      isNihInvalid = true;
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
      isInvestigatorInvalid,
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
      isInvestigatorInvalid,
      showValidationMessages,
      isNihInvalid,
      isCloudUseInvalid,
      isCloudProviderInvalid,
      isSigningOfficialInvalid,
      isITDirectorInvalid,
      isAnvilUseInvalid
    } = dataset;

    return isResearcherInvalid
      || isInvestigatorInvalid
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
      isInvestigatorInvalid,
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
      prev.step1.inputInvestigator.invalid = isInvestigatorInvalid;
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
  };

  verifyStep2() {
    //defined attribute keys for dynamic DUL based questions
    const dulInvalidCheck = () => {
      const activeQuestions = this.state.formData.activeDULQuestions;

      const dulQuestionMap = {
        'geneticStudiesOnly': 'gsoAcknowledgement',
        'publicationResults': 'pubAcknowledgement',
        'diseaseRestrictions': 'dsAcknowledgement',
        'ethicsApprovalRequired': 'irbDocument',
        'collaboratorRequired': 'collaborationLetter'
      };
      let result = false;

      //NOTE: verify validation runs correctly here
      if (!isNil(activeQuestions) && !isEmpty(activeQuestions)) {
        const formData = this.state.formData;
        const uncappedAny = fp.any.convert({cap: false});
        result = uncappedAny((value, question) => {
          const formDataKey = dulQuestionMap[question];
          const input = formData[formDataKey];
          if (formDataKey === 'irbDocument' || formDataKey === 'collaborationLetter') {
            const newlyUploadedFileKey = `uploaded${formDataKey[0].toUpperCase()}${formDataKey.slice(1)}`;
            const currentFileLocationKey = `${formDataKey}Location`;
            const newlyUploadedFile = this.state.step2[newlyUploadedFileKey];
            //use fileLocation rather than name as an indicator of a file present
            const currentFileLocation = this.state.formData[currentFileLocationKey];          
            return isEmpty(currentFileLocation) && (isFileEmpty(newlyUploadedFile));
          } else {
            return isNil(input);
          }
        })(activeQuestions);
      }
      return result;
    };

    const dulInvalid = dulInvalidCheck();
    const datasetsInvalid = fp.isEmpty(this.state.formData.datasets);
    const titleInvalid = fp.isEmpty(this.state.formData.projectTitle);
    const typeOfResearchInvalid = this.isTypeOfResearchInvalid();
    const rusInvalid = fp.isEmpty(this.state.formData.rus);
    const summaryInvalid = fp.isEmpty(this.state.formData.nonTechRus);
    return dulInvalid || datasetsInvalid || titleInvalid || typeOfResearchInvalid || rusInvalid || summaryInvalid;
  };

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
  }

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

  partialSave = (e) => {
    this.setState({ showDialogSave: true });
  };

  //Can't do uploads in parallel since endpoints are post and they both alter attributes in json column
  //If done in parallel, updated attribute of one document will be overwritten by the outdated value on the other
  saveDULDocuments = async(uploadedIrbDocument = null, uploadedCollaborationLetter = null, referenceId) => {
    let irbUpdate, collaborationUpdate;
    irbUpdate = await DAR.uploadDULDocument(uploadedIrbDocument, referenceId, 'irbDocument');
    collaborationUpdate = await DAR.uploadDULDocument(uploadedCollaborationLetter, referenceId, 'collaborationDocument');
    return Object.assign({}, irbUpdate.data, collaborationUpdate.data);
  }

  updateDraftResponse = (formattedFormData, referenceId) => {
    let darPartialResponse;
    if(!isNil(referenceId) && !isEmpty(referenceId)) {
      darPartialResponse = DAR.updateDarDraft(formattedFormData, referenceId);
    } else {
      darPartialResponse = DAR.postDarDraft(formattedFormData);
    }
    return darPartialResponse;
  }

  submitDARFormData = async (answer) => {
    if (answer === true) {
      const userId = Storage.getCurrentUser().dacUserId;
      const {uploadedIrbDocument, uploadedCollaborationLetter} = this.state.step2;
      let formattedFormData = fp.cloneDeep(this.state.formData);
      const ontologies = fp.map((item) => {
        return {
          id: item.key,
          value: item.value
        };
      })(formattedFormData.ontologies);

      for (let ontology of this.state.formData.ontologies) {
        ontologies.push(ontology.item);
      }
      if (ontologies.length > 0) {
        formattedFormData.ontologies = ontologies;
      }
      for (var key in formattedFormData) {
        if (formattedFormData[key] === '') {
          formattedFormData[key] = undefined;
        }
      }
      
      formattedFormData.datasetIds = fp.map('value')(formattedFormData.datasets);
      formattedFormData.userId = userId;

      try {
        //NOTE: the pre-processing saves are adding time to record generation (makes front-end seem slow)
        //pre-prcessing saves are needed since you can't save documents without a reference id
        //saves ensure record has a reference id
        //actual fix would involve generating a blank draft record that is saved on console button click
        //however that would fall outside the scope of this pr, which is already large enough due to refactored code
        let referenceId = formattedFormData.referenceId;
        let darPartialResponse = this.updateDraftResponse(formattedFormData, referenceId);
        referenceId = darPartialResponse.referenceId;
        darPartialResponse = this.saveDULDocuments(uploadedIrbDocument, uploadedCollaborationLetter, referenceId);
        let updatedFormData = Object.assign({}, formattedFormData, darPartialResponse);
        await DAR.postDar(updatedFormData);
        this.setState({
          showDialogSubmit: false
        }, Navigation.console(Storage.getCurrentUser(), this.props.history));
      } catch (error) {
        this.setState({
          showDialogSubmit: false
        });
        NotyUtil.showError({
          text: 'Error: DAR submission failed'
        });
      }
    } else {
      this.setState({
        showDialogSubmit: false
      });
    }
  }

  dialogHandlerSubmit = (answer) => (e) => {
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

  dialogHandlerSave = (answer) => (e) => {
    this.setState(prev => {
      prev.disableOkBtn = true;
      return prev;
    });
    if (answer === true) {
      // DAR datasetIds needs to be a list of ids
      const datasetIds = fp.map('value')(this.state.formData.datasets);
      // DAR ontologies needs to be a list of id/labels.
      const ontologies = fp.map((o) => {return {
        id: o.key,
        label: o.value
      };})(this.state.formData.ontologies);
      this.setState(prev => {
        prev.formData.datasetIds = datasetIds;
        prev.formData.ontologies = ontologies;
        return prev;
      }, () => this.saveDarDraft());
    } else {
      this.setShowDialogSave(false);
    }
  };


  //NOTE: work on this, expect similar issue with submit?
  saveDarDraft = async () => {
    let formattedFormData = fp.cloneDeep(this.state.formData);
    // DAR datasetIds needs to be a list of ids
    formattedFormData.datasetIds = fp.map('value')(formattedFormData.datasets);
    const {uploadedIrbDocument, uploadedCollaborationLetter} = this.state.step2;
    // Make sure we navigate back to the current DAR after saving.
    const { dataRequestId } = this.props.match.params;
    try {
      let referenceId = formattedFormData.referenceId;
      let darPartialResponse = await this.updateDraftResponse(formattedFormData, referenceId);
      referenceId = darPartialResponse.referenceId;
      if(fp.isNil(dataRequestId)) {
        this.props.history.replace('/dar_application/' + referenceId);
      }
      darPartialResponse = await this.saveDULDocuments(uploadedIrbDocument, uploadedCollaborationLetter, referenceId);
      this.setState(prev => {
        prev.formData = Object.assign({}, this.state.formData, darPartialResponse);
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
      NotyUtil.showError('Error saving partial DAR update');
    }
  };

  addDataUseToDataset = async(currentDatasets) => {
    //iterate through datasets array
    //if dataUse is not on the object, api call to get the full dataset info
    //method defined here rather than step 2 component since it is a dependency of another helper method here
    if(isNil(currentDatasets) || isEmpty(currentDatasets)) {
      return null;
    }

    let datasetPromises = currentDatasets.map((partialDataset) => {
      let mappedDataset;
      if (fp.isNil(partialDataset.dataUse)) {
        mappedDataset = DataSet.getDataSetsByDatasetId(partialDataset.value);
      } else {
        mappedDataset = Promise.resolve(partialDataset);
      }
      return mappedDataset;
    });

    let dataUseArray = await Promise.all(datasetPromises);
    dataUseArray.forEach((datasetRecord, index) => {
      currentDatasets[index].dataUse = datasetRecord.dataUse;
    });
    return currentDatasets;
  }

  onDatasetsChange = async (currentDatasets, action) => {
    let updatedDatasets = null;
    if(!isNil(currentDatasets) && !isEmpty(currentDatasets)) {
      updatedDatasets = await this.addDataUseToDataset(fp.cloneDeep(currentDatasets));
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
      investigator = '',
      labCollaborators,
      internalCollaborators,
      externalCollaborators,
      ontologies = [],
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
    const eRACommonsDestination = fp.isNil(dataRequestId) ? 'dar_application' : ('dar_application/' + dataRequestId);
    const { problemSavingRequest, showValidationMessages,  step1 } = this.state;
    const isTypeOfResearchInvalid = this.isTypeOfResearchInvalid();

    const step1Invalid = this.step1InvalidResult(this.step1InvalidChecks());
    const step2Invalid = this.verifyStep2();
    const step3Invalid = this.step3InvalidResult();

    //NOTE: component is only here temporarily until component conversion has been complete
    //ideally this, along with the other variable initialization should be done with a useEffect hook
    const TORComponent = TypeOfResearch({
      hmb: hmb,
      hmbHandler: this.setHmb,
      poa: poa,
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
              onClick: (e => this.goToStep(1, false)),
              className: 'col-lg-3 col-md-3 col-sm-12 col-xs-12 access-color jumbotron box-vote multi-step-title '
                + (this.state.step === 1 ? 'active' : '')
            }, [
              small({}, ['Step 1']),
              'Researcher Information',
              span({ className: 'glyphicon glyphicon-chevron-right', 'aria-hidden': 'true' }, [])
            ]),

            a({
              id: 'btn_step_2',
              onClick: (e => this.goToStep(2, false)),
              className: 'col-lg-3 col-md-3 col-sm-12 col-xs-12 access-color jumbotron box-vote multi-step-title '
                + (this.state.step === 2 ? 'active' : '')
            }, [
              small({}, ['Step 2']),
              'Data Access Request',
              span({ className: 'glyphicon glyphicon-chevron-right', 'aria-hidden': 'true' }, [])
            ]),

            a({
              id: 'btn_step_3',
              onClick: (e => this.goToStep(3, false)),
              className: 'col-lg-3 col-md-3 col-sm-12 col-xs-12 access-color jumbotron box-vote multi-step-title '
                + (this.state.step === 3 ? 'active' : '')
            }, [
              small({}, ['Step 3']),
              'Research Purpose Statement',
              span({ className: 'glyphicon glyphicon-chevron-right', 'aria-hidden': 'true' }, [])
            ]),

            a({
              id: 'btn_step_4',
              onClick: (e => this.goToStep(4, false)),
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
              showModal: this.state.showDialogSave, action: { label: 'Yes', handler: this.dialogHandlerSave }
            }, [
              div({ className: 'dialog-description' },
                ['Are you sure you want to save this Data Access Request? Previous changes will be overwritten.'])
            ]),
            div({ isRendered: this.state.step === 1 }, [
              h(ResearcherInfo, ({
                checkCollaborator: checkCollaborator,
                completed: this.state.completed,
                darCode: this.state.formData.darCode,
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
                internalCollaborators,
                labCollaborators,
                externalCollaborators,
                partialSave: this.partialSave,
                researcher: this.state.formData.researcher,
                researcherGate: researcherGate,
                showValidationMessages: showValidationMessages,
                nextPage: this.nextPage,
                signingOfficial,
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
                forProfit,
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
                changeDULDocument: this.changeDULDocument,
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
                populationMigration: this.state.formData.populationMigration,
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
