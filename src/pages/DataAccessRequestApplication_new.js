import { useEffect, useState, useCallback } from 'react';
import { a, div, form, h, i } from 'react-hyperscript-helpers';
import ResearcherInfo from './dar_application/ResearcherInfo_new';
import DataUseAgreements from './dar_application/DataUseAgreements_new';
import DataAccessRequest from './dar_application/DataAccessRequest_new';
import ResearchPurposeStatement from './dar_application/ResearchPurposeStatement_new';

import {
  Navigation,
  Notifications as NotyUtil
} from '../libs/utils';
import { ConfirmationDialog } from '../components/ConfirmationDialog';
import { Notification } from '../components/Notification';
import { PageHeading } from '../components/PageHeading';
import { Collections, DAR, User } from '../libs/ajax';
import { NotificationService } from '../libs/notificationService';
import { Storage } from '../libs/storage';
import { assign, cloneDeep, get, head, isEmpty, isNil, keys, map } from 'lodash/fp';
import './DataAccessRequestApplication.css';
import headingIcon from '../images/icon_add_access.png';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import DarValidationMessages from './dar_application/DarValidationMessages';

const ApplicationTabs = [
  { name: 'Researcher Information' },
  { name: 'Data Access Request' },
  { name: 'Research Purpose Statement' },
  { name: 'Data Use Agreement', showStep: false }
];

const fetchAllDatasets = async (dsIds) => {
  if (isEmpty(dsIds)) {
    return [];
  }
  return DataSet.getDatasetsByIds(dsIds);
};

const DataAccessRequestApplicationNew = (props) => {
  const [formData, setFormData] = useState({
    datasetIds: [],
    darCode: null,
    labCollaborators: [],
    internalCollaborators: [],
    externalCollaborators: [],
    checkCollaborator: false,
    checkNihDataOnly: false,
    rus: '',
    nonTechRus: '',
    oneGender: null,
    methods: null,
    controls: null,
    population: '',
    hmb: null,
    poa: null,
    diseases: null,
    ontologies: [],
    other: null,
    otherText: '',
    forProfit: null,
    gender: '',
    pediatric: null,
    illegalBehavior: null,
    addiction: null,
    sexualDiseases: null,
    stigmatizedDiseases: null,
    vulnerablePopulation: null,
    populationMigration: null,
    psychiatricTraits: null,
    notHealth: null,
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
    irbProtocolExpiration: '',
    collaborationLetterLocation: '',
    collaborationLetterName: '',
  })

  const [nihValid, setNihValid] = useState(false);
  const [disableOkBtn, setDisableOkButton] = useState(false);
  
  const [showValidationMessages, setShowValidationMessages] = useState(false);
  const [validationMessages, setValidationMessages] = useState({researcherInfoErrors: [], darErrors: [], rusErrors: []});
  
  const [showDialogSave, setShowDialogSave] = useState(false);
  const [step, setStep] = useState(1);
  const [notificationData, setNotificationData] = useState(undefined);


  const [researcher, setResearcher] = useState({});
  const [allSigningOfficials, setAllSigningOfficials] = useState([]);

  const [uploadedIrbDocument, setUploadedIrbDocument] = useState(null);
  const [uploadedCollaborationLetter, setUploadedCollaborationLetter] = useState(null);
  
  const [problemSavingRequest, setProblemSavingRequest] = useState(false);
  const [forcedScroll, setForcedScroll] = useState(null);

  //helper function to coordinate local state changes as well as updates to form data on the parent
  const formFieldChange = useCallback(({key, value}) => {
      setFormData(
        (formData) => {
          return {
            ...formData,
            ...{
              [key]: value,
            }
          };
        }
      );
  }, []);

  const batchFormFieldChange = (updates) => {
    setFormData((formData) => {
      return {
      ...formData,
      ...updates,
      }
    });
  };

  const updateCollaborationLetter = (letter) => {
    batchFormFieldChange({
      collaborationLetterName: '',
      collaborationLetterLocation: '',
    });
    setUploadedCollaborationLetter(letter);
  };

  const updateIrbDocument = (document, expiration) => {
    batchFormFieldChange({
      irbDocumentName: '',
      irbDocumentLocation: '',
      irbProtocolExpiration: expiration,
    });
    setUploadedIrbDocument(document);
  };

  useEffect(() => {
    init();
    NotificationService.getBannerObjectById('eRACommonsOutage').then((notificationData) => {
      setNotificationData(notificationData);
    });

    // ran on unmount;
    return () => {
      window.removeEventListener('scroll', onScroll);
    }
  }, [init, onScroll])

  const [datasets, setDatasets] = useState([]);
  const [dataUseTranslations, setDataUseTranslations] = useState([]);


  useEffect(() => {
    fetchAllDatasets(formData.datasetIds).then((datasets) => {
      setDatasets(datasets);
    });
  }, [formData.datasetIds]);

  useEffect(() => {
    translateDataUseRestrictionsFromDataUseArray(datasets.map((ds) => ds.dataUse)).then((translations) => {
      setDataUseTranslations(translations);
    });

  }, [datasets]);


  const init = useCallback(async () => {
    const { dataRequestId, collectionId } = props.match.params;
    let formData = {};
    const researcher = await User.getMe();
    const signingOfficials = await User.getSOsForCurrentUser();
    
    setResearcher(researcher);
    setAllSigningOfficials(signingOfficials);

    if(!isNil(collectionId)) {
      // Review existing DAR application - retrieves all datasets in the collection
      // Besides the datasets, DARs split off from the collection should have the same formData
      const collection = await Collections.getCollectionById(collectionId);
      const { dars, datasets } = collection;
      const darReferenceId = head(keys(dars));
      formData = await DAR.getPartialDarRequest(darReferenceId);
      formData.datasetIds = map(ds => get('dataSetId')(ds))(datasets);
    }
    else if (!isNil(dataRequestId)) {
      // Handle the case where we have an existing DAR id
      // Same endpoint works for any dataRequestId, not just partials.
      formData = await DAR.getPartialDarRequest(dataRequestId);
    } else {
      // Lastly, try to get the form data from local storage and clear out whatever was there previously
      formData = Storage.getData('dar_application') === null ? formData : Storage.getData('dar_application');
      Storage.removeData('dar_application');
    }

    formData.researcher = isNil(researcher) ? '' : researcher.displayName;
    formData.institution = isNil(researcher)  || isNil(researcher.institution)? '' : researcher.institution.name;
    formData.userId = researcher.userId;

    batchFormFieldChange(formData);
    window.addEventListener('scroll', onScroll); // eslint-disable-line -- codacy says event listeners are dangerous
  }, [ onScroll, props.match.params]);

  // useEffect(() => {
  //   if (showValidationMessages === true) {
  //     setStep1Verified(verifyStep1());
  //     setStep2Verified(verifyStep2());
  //     setStep3Verified(verifyStep3());
  //   }
  // }, [showValidationMessages, verifyStep1, verifyStep2, verifyStep3]);

  const goToStep = (step = 1) => {
    resetForcedScrollDebounce();
    setStep(step);
    window.scroll({
      top: document.getElementsByClassName('step-container')[step - 1]?.offsetTop,
      behavior: 'smooth'
    });
  };

  const onScroll = useCallback(() => {
    if (forcedScroll) {
      resetForcedScrollDebounce();
    } else {
      const scrollPos = window.scrollY;
      const scrollBuffer = window.innerHeight * .25;
      const sectionIndex = ApplicationTabs
        .map((tab, index) => document.getElementsByClassName('step-container')[index]?.offsetTop)
        .findIndex(scrollTop => scrollTop > scrollPos + scrollBuffer);
        
      let newStep;
      if (sectionIndex === 0) {
        newStep = 1;
      } else if (sectionIndex === -1) {
        newStep = ApplicationTabs.length;
      } else {
        newStep = sectionIndex;
      }

      setStep(newStep);

    }
  }, [forcedScroll, resetForcedScrollDebounce]);

  const resetForcedScrollDebounce = useCallback(() => {
    if (forcedScroll) {
      clearTimeout(forcedScroll);
    }
    setForcedScroll(setTimeout(() => { // eslint-disable-line -- codacy says settimeout is dangerous
      setForcedScroll(null);
    }, 200));
  }, [forcedScroll]);

  // const attestAndSave = () => {
  //   // let invalidStep1 = verifyStep1();
  //   // let invalidStep2 = verifyStep2();
  //   // let invalidStep3 = verifyStep3();
  //   const invalid = false;
  //   if (!invalid) {
  //     setShowDialogSubmit(true);
  //   } else {
  //     setShowValidationMessages(true);
  //   }
  // };

  // const isValid = (value) => {
  //   let isValid = false;
  //   if (value !== '' && value !== null && value !== undefined) {
  //     isValid = true;
  //   }
  //   return isValid;
  // }

  // //NOTE: seperated out check functionality from state updates in original function to make it easier to follow
  // const step1InvalidChecks = useCallback(() => {
  //   let isResearcherInvalid = false,
  //     showValidationMessages = false,
  //     isSigningOfficialInvalid = false,
  //     isITDirectorInvalid = false,
  //     isAnvilUseInvalid = false,
  //     isCloudUseInvalid = false,
  //     isCloudProviderInvalid = false,
  //     isNihInvalid = !nihValid;

  //   const {anvilUse, localUse, cloudUse, cloudProvider, cloudProviderDescription, cloudProviderType} = formData;

  //   if (!isValid(formData.researcher)) {
  //     isResearcherInvalid = true;
  //     showValidationMessages = true;
  //   }
  //   // DUOS-565: checkCollaborator : false and nihValid : false is an invalid combination
  //   if (formData.checkCollaborator !== true &&
  //     !nihValid) {
  //     isNihInvalid = true;
  //     showValidationMessages = true;
  //   }

  //   if(!isValid(formData.signingOfficial)) {
  //     isSigningOfficialInvalid = true;
  //     showValidationMessages = true;
  //   }

  //   if(!isValid(formData.itDirector)) {
  //     isITDirectorInvalid = true;
  //     showValidationMessages = true;
  //   }

  //   if(!isValid(anvilUse)) {
  //     isAnvilUseInvalid = true;
  //     showValidationMessages = true;
  //   } else {
  //     if(!anvilUse && !localUse && !cloudUse) {
  //       isCloudUseInvalid = true;
  //       showValidationMessages = true;
  //     } else {
  //       if(cloudUse && (!isValid(cloudProvider) || !isValid(cloudProviderType) || !isValid(cloudProviderDescription))){
  //         isCloudProviderInvalid = true;
  //         showValidationMessages = true;
  //       }
  //     }
  //   }

  //   return {
  //     isResearcherInvalid,
  //     showValidationMessages,
  //     isNihInvalid,
  //     isCloudUseInvalid,
  //     isCloudProviderInvalid,
  //     isSigningOfficialInvalid,
  //     isITDirectorInvalid,
  //     isAnvilUseInvalid
  //   };
  // }, []);

  // //method to be passed to step 4 for error checks/messaging
  // const step1InvalidResult = (dataset) => {
  //   const checkCollaborator = formData.checkCollaborator;
  //   const {
  //     isResearcherInvalid,
  //     showValidationMessages,
  //     isNihInvalid,
  //     isCloudUseInvalid,
  //     isCloudProviderInvalid,
  //     isSigningOfficialInvalid,
  //     isITDirectorInvalid,
  //     isAnvilUseInvalid
  //   } = dataset;

  //   return isResearcherInvalid
  //     || showValidationMessages
  //     || (!checkCollaborator && isNihInvalid)
  //     || isCloudUseInvalid
  //     || isCloudProviderInvalid
  //     || isSigningOfficialInvalid
  //     || isITDirectorInvalid
  //     || isAnvilUseInvalid;
  // }

  // const verifyStep1 = useCallback(() => {
  //   const { isResearcherInvalid,
  //     isNihInvalid,
  //     showValidationMessages,
  //     isCloudUseInvalid,
  //     isCloudProviderInvalid,
  //     isSigningOfficialInvalid,
  //     isITDirectorInvalid,
  //     isAnvilUseInvalid
  //   } = step1InvalidChecks();
  //   setState(prev => {
  //     prev.step1.inputResearcher.invalid = isResearcherInvalid;
  //     prev.step1.inputNih.invalid = isNihInvalid;
  //     prev.isCloudUseInvalid = isCloudUseInvalid;
  //     prev.isCloudProviderInvalid = isCloudProviderInvalid;
  //     prev.isSigningOfficialInvalid = isSigningOfficialInvalid;
  //     prev.isITDirectorInvalid = isITDirectorInvalid;
  //     prev.isAnvilUseInvalid = isAnvilUseInvalid;
  //     if (prev.showValidationMessages === false) prev.showValidationMessages = showValidationMessages;
  //     return prev;
  //   });
  //   return showValidationMessages;
  // }, []);

  // const verifyStep2 = useCallback(() => {
  //   //defined attribute keys for dynamic DUL based questions
  //   const dulInvalidCheck = () => {
  //     const activeQuestions = pickBy((isActive) => isActive)(formData.activeDULQuestions);
  //     let result = false;
  //     //mapping of ontology keys to dar established keys
  //     // TODO: extract needs acknowledgement fns
  //     const dulQuestionMap = {
  //       'geneticStudiesOnly': 'gsoAcknowledgement',
  //       'publicationResults': 'pubAcknowledgement',
  //       'diseaseRestrictions': 'dsAcknowledgement',
  //       'ethicsApprovalRequired': 'irbDocument',
  //       'collaboratorRequired': 'collaborationLetter'
  //     };

  //     if (!isNil(activeQuestions) && !isEmpty(activeQuestions)) {
  //       const formData = formData;
  //       const uncappedAny = any.convert({cap: false});
  //       //uncappedAny will look for the first instance in which the dataset is false (or nil/empty) for early termination
  //       result = uncappedAny((value, question) => {
  //         const formDataKey = dulQuestionMap[question];
  //         const input = formData[formDataKey];
  //         //for the document keys, check to see if a file has recently uploaded to the front-end or has been saved previously
  //         if ((formDataKey === 'irbDocument' || formDataKey === 'collaborationLetter')) {
  //           //keys follow the syntax of 'uploaded{irbDocument|collaborationLetter} (for newly uploaded files)
  //           const newlyUploadedFileKey = `uploaded${formDataKey[0].toUpperCase()}${formDataKey.slice(1)}`;
  //           //keys follow the syntax of '{irbDocument | collaborationLetter}Location' (for previously saved files)
  //           const currentFileLocationKey = `${formDataKey}Location`;
  //           //use the establhed key to assign the newly uploaded file to a variable
  //           const newlyUploadedFile = step2[newlyUploadedFileKey];
  //           //use established key to assign the saved file location to a variable
  //           const currentFileLocation = formData[currentFileLocationKey];
  //           //confirm question status and perform empty check for files to determine rejection
  //           return isEmpty(currentFileLocation) && (isFileEmpty(newlyUploadedFile));
  //           //if question is a checkbox acknowledgement and the question is active, check to see if box was left unchecked using translated key
  //         } else if((formDataKey === 'dsAcknowledgement' || formDataKey === 'gsoAcknowledgement' || formDataKey === 'pubAcknowledgement')) {
  //           return !formData[formDataKey];
  //         //else check input directly
  //         } else {
  //           return !input;
  //         }
  //       })(activeQuestions);
  //     }
  //     return result;
  //   };

  //   const dulInvalid = dulInvalidCheck();
  //   const datasetsInvalid = isEmpty(formData.datasets);
  //   const titleInvalid = isEmpty(formData.projectTitle);
  //   const typeOfResearchInvalid = isTypeOfResearchInvalid();
  //   const rusInvalid = isEmpty(formData.rus);
  //   const summaryInvalid = isEmpty(formData.nonTechRus);
  //   return dulInvalid || datasetsInvalid || titleInvalid || typeOfResearchInvalid || rusInvalid || summaryInvalid;
  // }, []);

  // const isGenderValid = (gender, oneGender) => {
  //   let isValidGender = false;
  //   if (oneGender === false || (oneGender === true && isValid(gender))) {
  //     isValidGender = true;
  //   }
  //   return isValidGender;
  // }

  // const step3InvalidResult = () => {
  //   return !(isValid(formData.forProfit) &&
  //     isValid(formData.oneGender) &&
  //     isGenderValid(formData.gender, formData.oneGender) &&
  //     isValid(formData.pediatric) &&
  //     isValid(formData.illegalBehavior) &&
  //     isValid(formData.addiction) &&
  //     isValid(formData.sexualDiseases) &&
  //     isValid(formData.stigmatizedDiseases) &&
  //     isValid(formData.vulnerablePopulation) &&
  //     isValid(formData.populationMigration) &&
  //     isValid(formData.psychiatricTraits) &&
  //     isValid(formData.notHealth));
  // };

  // const verifyStep3 = useCallback(() => {
  //   let invalid = false;
  //   if (step3InvalidResult()) {
  //     setState(prev => {
  //       prev.step3.inputPurposes.invalid = true;
  //       prev.showValidationMessages = true;
  //       return prev;
  //     });
  //     invalid = true;
  //   } else {
  //     setState(prev => {
  //       prev.step3.inputPurposes.invalid = false;
  //       return prev;
  //     });
  //   }
  //   return invalid;
  // }, [])

  const partialSave = () => {
    setShowDialogSave(true);
  };

  //Can't do uploads in parallel since endpoints are post and they both alter attributes in json column
  //If done in parallel, updated attribute of one document will be overwritten by the outdated value on the other
  const saveDARDocuments = async (uploadedIrbDocument = null, uploadedCollaborationLetter = null, referenceId) => {
    let irbUpdate, collaborationUpdate;
    irbUpdate = await DAR.uploadDARDocument(uploadedIrbDocument, referenceId, 'irbDocument');
    collaborationUpdate = await DAR.uploadDARDocument(uploadedCollaborationLetter, referenceId, 'collaborationDocument');
    return assign(irbUpdate.data, collaborationUpdate.data);
  };

  const updateDraftResponse = (formattedFormData, referenceId) => {
    let darPartialResponse;
    if(!isNil(referenceId) && !isEmpty(referenceId)) {
      darPartialResponse = DAR.updateDarDraft(formattedFormData, referenceId);
    } else {
      darPartialResponse = DAR.postDarDraft(formattedFormData);
    }
    return darPartialResponse;
  };

  const submitDARFormData = async (answer) => {
    if (answer === true) {
      const userId = Storage.getCurrentUser().userId;
      let formattedFormData = cloneDeep(formData);

      for (var key in formattedFormData) {
        if (formattedFormData[key] === '') {
          formattedFormData[key] = undefined;
        }
      }
      formattedFormData.userId = userId;

      try {
        //NOTE: the pre-processing saves are adding time to record generation (makes front-end seem slow)
        //pre-prcessing saves are needed since you can't save documents without a reference id
        //saves ensure record has a reference id
        //actual fix would involve generating a blank draft record that is saved on console button click
        //however that would fall outside the scope of this pr, which is already large enough due to refactored code
        let referenceId = formattedFormData.referenceId;
        let darPartialResponse = await updateDraftResponse(formattedFormData, referenceId);
        referenceId = darPartialResponse.referenceId;

        if(!isNil(uploadedIrbDocument) || !isNil(uploadedCollaborationLetter)) {
          darPartialResponse = await saveDARDocuments(uploadedIrbDocument, uploadedCollaborationLetter, referenceId);
        }
        let updatedFormData = assign(formattedFormData, darPartialResponse);
        await DAR.postDar(updatedFormData);
        setShowDialogSubmit({
          showDialogSubmit: false
        }, Navigation.console(Storage.getCurrentUser(), props.history).response);
      } catch (error) {
        setShowDialogSubmit(false);
        NotyUtil.showError({
          text: 'Error: Data Access Request submission failed'
        });
      }
    } else {
      setShowDialogSubmit(false);
    }
  };

  const dialogHandlerSubmit = (answer) => () => {
    setDisableOkButton(true);
    submitDARFormData(answer);
  };

  const updateShowDialogSave = (value) => {
    setShowDialogSave(value);
    setDisableOkButton(false);
  };

  const dialogHandlerSave = (answer) => () => {
    setDisableOkButton(true);
    if (answer === true) {
      saveDarDraft();
    } else {
      updateShowDialogSave(false);
    }
  };

  const saveDarDraft = async () => {
    let formattedFormData = cloneDeep(formData);
    // DAR datasetIds needs to be a list of ids

    // Make sure we navigate back to the current DAR after saving.
    const { dataRequestId } = props.match.params;
    try {
      let referenceId = formattedFormData.referenceId;
      console.log(formattedFormData);
      setShowValidationMessages(!showValidationMessages);
      return;
      let darPartialResponse = await updateDraftResponse(formattedFormData, referenceId);
      referenceId = darPartialResponse.referenceId;
      if(isNil(dataRequestId)) {
        props.history.replace('/dar_application/' + referenceId);
      }
      //execute saveDARDocuments method only if documents are required for the DAR
      //value can be determined from activeDULQuestions, which is populated on Step 2 where document upload occurs
      if(!isNil(uploadedIrbDocument) || !isNil(uploadedCollaborationLetter)) {
        darPartialResponse = await saveDARDocuments(uploadedIrbDocument, uploadedCollaborationLetter, referenceId);
      }
      batchFormFieldChange(darPartialResponse);
      setShowDialogSave(false);
      setDisableOkButton(false);
    } catch(error) {
      setShowDialogSave(false);
      setDisableOkButton(false);
      NotyUtil.showError('Error saving partial Data Access Request update');
    }
  };

  const back = () => {
    props.history.goBack();
  };


  const { dataRequestId } = props.match.params;
  const eRACommonsDestination = isNil(dataRequestId) ? 'dar_application' : ('dar_application/' + dataRequestId);

  return (
    div({ className: 'container', style: {paddingBottom: '2%'} }, [
      div({ className: 'col-lg-10 col-lg-offset-1 col-md-12 col-sm-12 col-xs-12' }, [
        div({ className: 'row no-margin' }, [
          Notification({notificationData: notificationData}),
          div({
            className: (formData.darCode !== null ?
              'col-lg-10 col-md-9 col-sm-9 ' : 'col-lg-12 col-md-12 col-sm-12 ')
          }, [
            PageHeading({
              id: 'requestApplication', imgSrc: headingIcon, iconSize: 'medium', color: 'access',
              title: 'Data Access Request Application',
              description: 'The section below includes a series of questions intended to allow our Data Access Committee to evaluate a newly developed semi-automated process of data access control.'
            })
          ]),
          div({ isRendered: formData.darCode !== null, className: 'col-lg-2 col-md-3 col-sm-3 col-xs-12 no-padding' }, [
            a({ id: 'btn_back', onClick: back, className: 'btn-primary btn-back' }, [
              i({ className: 'glyphicon glyphicon-chevron-left' }), 'Back'
            ])
          ])
        ])
      ]),

      div({ style: { clear: 'both' } }),
      form({ name: 'form', 'noValidate': true, className: 'forms-v2' }, [
        div({ className: 'multi-step-buttons-container' }, [
          h(Tabs, {
            value: step,
            variant: 'scrollable',
            scrollButtons: 'auto',
            orientation: 'vertical',
            TabIndicatorProps: {
              style: { background: '#2BBD9B' }
            },
            onChange: (event, step) => {
              goToStep(step);
            }
          }, [
            ...ApplicationTabs.map((tabConfig, index) => {
              const { name, showStep = true } = tabConfig;
              return h(Tab, {
                key: `step-${index}-${name}`,
                label: div([
                  div({ isRendered: showStep, className: 'step' }, `Step ${index + 1}`),
                  div({ className: 'title' }, name)
                ]),
                value: index + 1
              });
            })
          ])
        ]),

        div({ id: 'form-views' }, [
          ConfirmationDialog({
            title: 'Save changes?', disableOkBtn: disableOkBtn, disableNoBtn: disableOkBtn, color: 'access',
            showModal: showDialogSave, action: { label: 'Yes', handler: dialogHandlerSave }
          }, [
            div({ className: 'dialog-description' },
              ['Are you sure you want to save this Data Access Request? Previous changes will be overwritten.'])
          ]),
          div({className: 'step-container'}, [

            h(DarValidationMessages, {
              validationErrors: validationMessages.researcherInfoErrors,
              showValidationErrors: showValidationMessages
            }),

            h(ResearcherInfo, ({
              completed: !isNil(get('institutionId', researcher)),
              darCode: formData.darCode,
              formData,
              eRACommonsDestination: eRACommonsDestination,
              formFieldChange: formFieldChange,
              location: props.location,
              nihValid: nihValid,
              onNihStatusUpdate: setNihValid,
              partialSave,
              researcher,
              showValidationMessages: showValidationMessages,
              allSigningOfficials: allSigningOfficials,
            }))
          ]),

          div({className: 'step-container'}, [
            h(DataAccessRequest, {
              formData: formData,
              datasets,
              dataUseTranslations,
              formFieldChange: formFieldChange,
              setCollaborationLetter: updateCollaborationLetter,
              setIrbDocument: updateIrbDocument,
            })
          ]),

          div({className: 'step-container'}, [
            h(ResearchPurposeStatement, {
              darCode: formData.darCode,
              formFieldChange: formFieldChange,
              formData: formData,
            })
          ]),

          div({className: 'step-container'}, [
            h(DataUseAgreements, {
              darCode: formData.darCode,
              attestAndSend: () => {},
              save: () => saveDarDraft(),
            })
          ])
        ])
      ])
    ])
  );
}

export default DataAccessRequestApplicationNew;
