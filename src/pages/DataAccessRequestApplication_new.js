import { useEffect, useState, useCallback } from 'react';
import { a, div, form, h, i } from 'react-hyperscript-helpers';
import ResearcherInfo from './dar_application/ResearcherInfo_new';
import DataUseAgreements from './dar_application/DataUseAgreements_new';
import DataAccessRequest from './dar_application/DataAccessRequest_new';
import ResearchPurposeStatement from './dar_application/ResearchPurposeStatement_new';
import { translateDataUseRestrictionsFromDataUseArray } from '../libs/dataUseTranslation';
import {
  Navigation,
  Notifications as NotyUtil
} from '../libs/utils';
import { ConfirmationDialog } from '../components/ConfirmationDialog_new';
import { Notification } from '../components/Notification';
import { PageHeading } from '../components/PageHeading';
import { Collections, DAR, User, DataSet } from '../libs/ajax';
import { NotificationService } from '../libs/notificationService';
import { Storage } from '../libs/storage';
import { assign, cloneDeep, get, head, isEmpty, isNil, keys, map } from 'lodash/fp';
import './DataAccessRequestApplication.css';
import headingIcon from '../images/icon_add_access.png';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import DarValidationMessages from './dar_application/DarValidationMessages';

import {
  validateDARFormData
} from '../utils/darFormUtils';

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
  // filter just for safety
  return DataSet.getDatasetsByIds(dsIds);//.filter((id) => !isNil(id) && isNumber(id)));
};

const validationFailed = (validation) => {
  return Object.keys(validation).some((key) => !isEmpty(validation[key]));
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
    anvilUse: null,
    localUse: null,
    cloudUse: null,
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
  });

  const [nihValid, setNihValid] = useState(false);
  const [disableOkBtn, setDisableOkButton] = useState(false);


  const [showValidationMessages, setShowValidationMessages] = useState(false);
  const [validationMessages, setValidationMessages] = useState({researcherInfoErrors: [], darErrors: [], rusErrors: []});
  const [labCollaboratorsCompleted, setLabCollaboratorsCompleted] = useState(true);
  const [internalCollaboratorsCompleted, setInternalCollaboratorsCompleted] = useState(true);
  const [externalCollaboratorsCompleted, setExternalCollaboratorsCompleted] = useState(true);

  const [showDialogSave, setShowDialogSave] = useState(false);
  const [showDialogSubmit, setShowDialogSubmit] = useState(false);

  const [step, setStep] = useState(1);
  const [notificationData, setNotificationData] = useState(undefined);

  const [researcher, setResearcher] = useState({});
  const [allSigningOfficials, setAllSigningOfficials] = useState([]);

  const [uploadedIrbDocument, setUploadedIrbDocument] = useState(null);
  const [uploadedCollaborationLetter, setUploadedCollaborationLetter] = useState(null);

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
      };
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
    };
  }, [init, onScroll]);

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
  }, [onScroll, props.match.params]);

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


  const scrollToFormErrors = (validationMessages) => {
    if (!isEmpty(validationMessages.researcherInfoErrors)) {
      goToStep(1);
    } else if (!isEmpty(validationMessages.darErrors)) {
      goToStep(2);
    } else if (!isEmpty(validationMessages.rusErrors)) {
      goToStep(3);
    } else {
      goToStep(1);
    }
  };

  const attemptSubmit = () => {
    const validation = validateDARFormData({
      formData,
      datasets,
      dataUseTranslations,
      irbDocument: uploadedIrbDocument,
      collaborationLetter: uploadedCollaborationLetter,
      internalCollaboratorsCompleted,
      labCollaboratorsCompleted,
      externalCollaboratorsCompleted,
    });

    setValidationMessages(validation);
    const isInvalidForm = validationFailed(validation);
    setShowValidationMessages(isInvalidForm);

    if (isInvalidForm) {
      scrollToFormErrors(validation);
    } else {
      setShowDialogSubmit(true);
    }
  };

  const submitDARFormData = async () => {
    const userId = Storage.getCurrentUser().userId;
    let formattedFormData = cloneDeep(formData);

    for (var key in formattedFormData) {
      if (formattedFormData[key] === '') {
        formattedFormData[key] = undefined;
      }
    }
    formattedFormData.userId = userId;

    try {
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
  };

  const onSaveConfirmation = (selectedOk) => () => {
    setDisableOkButton(true);
    if (selectedOk === true) {
      saveDarDraft();
      setDisableOkButton(false);
    } else {
      setShowDialogSave(false);
      setDisableOkButton(false);
    }
  };

  const onSubmitConfirmation = (selectedOk) => () => {
    setDisableOkButton(true);
    if (selectedOk === true) {
      submitDARFormData();
      setDisableOkButton(false);
    } else {
      setShowDialogSubmit(false);
      setDisableOkButton(false);
    }
  };


  const saveDarDraft = async () => {
    let formattedFormData = cloneDeep(formData);
    // DAR datasetIds needs to be a list of ids

    // Make sure we navigate back to the current DAR after saving.
    const { dataRequestId } = props.match.params;
    try {
      let referenceId = formattedFormData.referenceId;

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
          h(ConfirmationDialog, {
            title: 'Save changes?', disableOkBtn: disableOkBtn, disableNoBtn: disableOkBtn, color: '',
            showModal: showDialogSave, action: { label: 'Yes', handler: onSaveConfirmation }
          }, [
            div({ isRendered: validationFailed(validationMessages) }, [
              'There are issues saving this Data Access Request. Please fix them and save again.'
            ]),
            div({ className: 'dialog-description' },
              ['Are you sure you want to save this Data Access Request? Previous changes will be overwritten.']),
          ]),
          h(ConfirmationDialog, {
            title: 'Submit Data Access Request?', disableOkBtn: disableOkBtn, disableNoBtn: disableOkBtn, color: '',
            showModal: showDialogSubmit, action: { label: 'Yes', handler: onSubmitConfirmation }
          }, [
            div({ className: 'dialog-description' },
              ['Are you sure you want to submit this Data Access Request? This cannot be undone.']),
          ]),
          div({className: 'dar-steps'}, [
            div({className: 'step-container'}, [
              h(DarValidationMessages, {
                validationMessages: validationMessages.researcherInfoErrors,
                showValidationMessages
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
                researcher,
                showValidationMessages: showValidationMessages,
                allSigningOfficials: allSigningOfficials,
                setLabCollaboratorsCompleted,
                setInternalCollaboratorsCompleted,
                setExternalCollaboratorsCompleted,
              }))
            ]),

            div({className: 'step-container'}, [
              h(DarValidationMessages, {
                validationMessages: validationMessages.darErrors,
                showValidationMessages
              }),

              h(DataAccessRequest, {
                formData: formData,
                datasets,
                dataUseTranslations,
                formFieldChange,
                batchFormFieldChange,
                uploadedCollaborationLetter,
                updateCollaborationLetter,
                uploadedIrbDocument,
                updateUploadedIrbDocument: updateIrbDocument,
                setDatasets,
              })
            ]),

            div({className: 'step-container'}, [
              h(DarValidationMessages, {
                validationMessages: validationMessages.rusErrors,
                showValidationMessages
              }),

              h(ResearchPurposeStatement, {
                darCode: formData.darCode,
                formFieldChange: formFieldChange,
                formData: formData,
              })
            ]),

            div({className: 'step-container'}, [
              h(DataUseAgreements, {
                darCode: formData.darCode,
                attestAndSend: () => attemptSubmit(),
                save: () => setShowDialogSave(true),
              })
            ])
          ]),

        ])
      ])
    ])
  );
};

export default DataAccessRequestApplicationNew;
