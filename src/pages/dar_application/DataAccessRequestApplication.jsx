import React from 'react';
import { useEffect, useState, useCallback } from 'react';
import ResearcherInfo from './ResearcherInfo';
import DataAccessAgreements from './DataAccessAgreements';
import DataUseAgreements from './DataUseAgreements';
import DataAccessRequest from './DataAccessRequest';
import ResearchPurposeStatement from './ResearchPurposeStatement';
import { translateDataUseRestrictionsFromDataUseArray } from '../../libs/dataUseTranslation';
import {
  Navigation, Notifications,
} from '../../libs/utils';
import { ConfirmationDialog } from '../../components/ConfirmationDialog_new';
import { Notification } from '../../components/Notification';
import { PageHeading } from '../../components/PageHeading';
import { User } from '../../libs/ajax/User';
import { DataSet } from '../../libs/ajax/DataSet';
import { DAR } from '../../libs/ajax/DAR';
import { Collections } from '../../libs/ajax/Collections';
import { NotificationService } from '../../libs/notificationService';
import { Storage } from '../../libs/storage';
import { assign, cloneDeep, get, head, isEmpty, isNil, isString, keys, map } from 'lodash/fp';
import './DataAccessRequestApplication.css';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';

import {
  validateDARFormData
} from '../../utils/darFormUtils';
import { isArray, set } from 'lodash';
import DucAddendum from './DucAddendum';
import UsgOmbText from '../../components/UsgOmbText';
import {DAAUtils} from '../../utils/DAAUtils';
import {Metrics} from '../../libs/ajax/Metrics';
import eventList from '../../libs/events';
import ReactMarkdown from 'react-markdown';
import {SpinnerComponent} from "../../components/SpinnerComponent.jsx";
import loadingImage from "../../images/loading-indicator.svg";
import {ConditionalAccordian} from "../../components/forms/ConditionalAccordian";
const ApplicationTabs = [
  { name: 'Researcher Information' },
  { name: 'Data Access Request' },
  { name: 'Research Purpose Statement' }
];

const fetchAllDatasets = async (dsIds) => {
  const filteredDatasetIds = dsIds.filter((id) => !isNil(id) && Number.isInteger(id) && id > 0);
  if (isEmpty(filteredDatasetIds)) {
    return [];
  }
  // filter just for safety
  return DataSet.getDatasetsByIds(filteredDatasetIds);
};

const validationFailed = (validation) => {
  return Object.keys(validation).some((key) => !isEmpty(validation[key]));
};

const DataAccessRequestApplication = (props) => {
  const [formData, setFormData] = useState({
    datasetIds: [],
    darCode: null,
    labCollaborators: [],
    internalCollaborators: [],
    externalCollaborators: [],
    checkNihDataOnly: false,
    rus: '',
    nonTechRus: '',
    oneGender: null,
    methods: null,
    controls: null,
    population: null,
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
    piName: '',
    piEmail: '',
    projectTitle: '',
    profileName: '',
    pubmedId: '',
    scientificUrl: '',
    signingOfficial: '',
    signingOfficialEmail: '',
    itDirector: '',
    itDirectorEmail: '',
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

  const [formValidation, setFormValidation] = useState({ researcherInfoErrors: {}, darErrors: {}, rusErrors: {} });

  const [nihValid, setNihValid] = useState(true);
  const [showNihValidationError, setShowNihValidationError] = useState(false);

  const [disableOkBtn, setDisableOkButton] = useState(false);

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

  const [isLoading, setIsLoading] = useState(true);
  const [isAttested, setIsAttested] = useState(false);

  const [applicationTabs, setApplicationTabs] = useState([]);

  //helper function to coordinate local state changes as well as updates to form data on the parent
  const formFieldChange = useCallback(({ key, value }) => {
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

  const formValidationChange = useCallback((section, { key, validation }) => {
    setFormValidation((formValidation) => {
      const newFormValidation = cloneDeep(formValidation);

      if (isArray(key)) {
        set(newFormValidation, [section, ...key], validation);
      } else {
        set(newFormValidation, [section, key], validation);
      }

      return newFormValidation;
    });
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

  const [reverseOrderedDARs, setReverseOrderedDARs] = useState([]);
  const [datasets, setDatasets] = useState([]);
  const [selectedDatasets, setSelectedDatasets] = useState([]);
  const [dataUseTranslations, setDataUseTranslations] = useState([]);

  useEffect(() => {
    fetchAllDatasets(formData.datasetIds).then((datasets) => {
      setDatasets(datasets);
    });
    if (!props.readOnlyMode) {
      const updatedTabs = DAAUtils.isEnabled() ? [...ApplicationTabs, { name: 'Data Access Agreements (DAA)' }] : [...ApplicationTabs, { name: 'Data Use Agreement' }];
      setApplicationTabs(updatedTabs);
    }
  }, [formData.datasetIds, props.readOnlyMode]);

  useEffect(() => {
    translateDataUseRestrictionsFromDataUseArray(datasets.map((ds) => ds.dataUse)).then((translations) => {
      setDataUseTranslations(translations);
    });
  }, [datasets]);

  const goToStep = useCallback((step = 1) => {
    setStep(step);
    window.scroll({
      top: document.getElementsByClassName('step-container')[step - 1]?.offsetTop,
      behavior: 'smooth'
    });
  }, []);

  const onScroll = useCallback(() => {

    const scrollPos = window.scrollY;
    const scrollBuffer = window.innerHeight * .25;
    const sectionIndex = applicationTabs
      .map((_tab, index) => document.getElementsByClassName('step-container')[index]?.offsetTop)
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
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { collectionId } = props.match.params;
        if (props.readOnlyMode) {
          const collection = await Collections.getCollectionById(collectionId);
          setResearcher(collection.createUser);
        } else {
          const response = await User.getMe();
          const signingOfficials = await User.getSOsForCurrentUser();
          setResearcher(response);
          setAllSigningOfficials(signingOfficials);
        }
      } catch (_error) {
        setShowDialogSave(false);
        Notifications({text:'Error displaying user information. Please try again in a few moments.', });
      }
    };
    fetchData();
  }, [props.match.params, props.readOnlyMode]);

  const init = useCallback(async () => {
    const { dataRequestId, collectionId } = props.match.params;
    let formData = {};

    if (!isNil(collectionId)) {
      // Review existing DAR application - retrieves all datasets in the collection
      // Besides the datasets, DARs split off from the collection should have the same formData
      const collection = await Collections.getCollectionById(collectionId);
      const { dars, datasets } = collection;
      // TS thinks that collection.dars is an object, but it is a map
      const darMap = new Map(Object.entries(dars));
      setReverseOrderedDARs(
          [...darMap.values()].sort((a, b) => b.id - a.id)
      );
      const darReferenceId = head(keys(dars));
      // TODO - future improvement
      //  in theory, we should be able to replace this call with the info returned from the collection
      // form data = the first DAR's data
      formData = await DAR.getPartialDarRequest(darReferenceId);
      // This is a collection, so we need to get the datasets and datasetIds from the collection
      formData.datasetIds = map(ds => get('datasetId')(ds))(datasets);
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
    formData.institution = isNil(researcher) || isNil(researcher.institution) ? '' : researcher.institution.name;
    formData.userId = researcher.userId;

    batchFormFieldChange(formData);
    window.addEventListener('scroll', onScroll); // eslint-disable-line -- codacy says event listeners are dangerous
    setIsLoading(false);
  }, [onScroll, props.match.params, researcher]);

  useEffect(() => {
    if (props.readOnlyMode) {
      let appTabs = []
      if(props.createProgressReport){
        // if we are creating a new progress report, we need to add another tab for the application
        appTabs = [{ name: 'DAR Update ' + reverseOrderedDARs.length, showStep: false}]
      }
      setApplicationTabs([...appTabs,
          ...reverseOrderedDARs.map((_dar, index) => {
            const whichPRIsThis = reverseOrderedDARs.length - index - 1;
            const isLast = index === reverseOrderedDARs.length - 1;
            const itemLabel = isLast ? formData?.darCode : 'DAR Update ' + whichPRIsThis;
            return {name: itemLabel, showStep: false};
          })]);
    }
  }, [reverseOrderedDARs, formData?.darCode, props.readOnlyMode, props.createProgressReport]);

  useEffect(() => {
    init();
    NotificationService.getBannerObjectById('eRACommonsOutage').then((notificationData) => {
      setNotificationData(notificationData);
    });
  }, [init]);

  useEffect(() => {
    return () => {
      window.removeEventListener('scroll', onScroll);
    };
  }, [onScroll]);

  //Can't do uploads in parallel since endpoints are post and they both alter attributes in json column
  //If done in parallel, updated attribute of one document will be overwritten by the outdated value on the other
  const saveDARDocuments = async (uploadedIrbDocument = null, uploadedCollaborationLetter = null, referenceId) => {
    const irbUpdate = await DAR.uploadDARDocument(uploadedIrbDocument, referenceId, 'irbDocument');
    const collaborationUpdate = await DAR.uploadDARDocument(uploadedCollaborationLetter, referenceId, 'collaborationDocument');
    return assign(irbUpdate.data, collaborationUpdate.data);
  };

  const updateDraftResponse = async (formattedFormData, referenceId) => {
    let darPartialResponse;
    if (!isNil(referenceId) && !isEmpty(referenceId)) {
      darPartialResponse = await DAR.updateDarDraft(formattedFormData, referenceId);
    } else {
      darPartialResponse = await DAR.postDarDraft(formattedFormData);
    }
    return darPartialResponse;
  };


  const scrollToFormErrors = (validation, eraCommonsIdValid, hasLibraryCard) => {
    if (!isEmpty(validation.researcherInfoErrors) || !eraCommonsIdValid || !hasLibraryCard) {
      goToStep(1);
    } else if (!isEmpty(validation.darErrors)) {
      goToStep(2);
    } else if (!isEmpty(validation.rusErrors)) {
      goToStep(3);
    } else {
      goToStep(1);
    }
  };

  const addDucAddendumTab = () => {
    const tabs = [
      ...ApplicationTabs,
      { name: 'Addendum', showStep: false }
    ];
    setApplicationTabs(tabs);
  };

  const goToDucAddendum = useCallback(async () => {
    if (isAttested) {
      goToStep(5);
    }
  }, [goToStep, isAttested]);

  const attemptSubmit = async () => {
    const validation = validateDARFormData({
      formData,
      datasets: (props.draftDar && DAAUtils.isEnabled()) ? selectedDatasets : datasets,
      dataUseTranslations,
      irbDocument: uploadedIrbDocument,
      collaborationLetter: uploadedCollaborationLetter,
      researcher,
      labCollaboratorsCompleted,
      internalCollaboratorsCompleted,
      externalCollaboratorsCompleted,
    });

    setFormValidation(validation);

    const hasLibraryCard = !isEmpty(researcher.libraryCards);

    const isInvalidForm = validationFailed(validation) || !nihValid || !hasLibraryCard;
    setShowNihValidationError(!nihValid);

    if (isInvalidForm) {
      scrollToFormErrors(validation, nihValid, hasLibraryCard);
    } else {
      // noinspection ES6MissingAwait
      Metrics.captureEvent(eventList.dar, {'action': 'attest'});
      setIsAttested(true);
      addDucAddendumTab();
      await goToDucAddendum();
    }

    return !isInvalidForm;
  };

  const doSubmit = () => {
    if (attemptSubmit()) {
      setShowDialogSubmit(true);
    }
  };

  const submitDARFormData = async () => {
    const userId = Storage.getCurrentUser().userId;
    const formattedFormData = cloneDeep(formData);

    for (const key in formattedFormData) {
      if (isString(formattedFormData[key]) && formattedFormData[key].trim() && formattedFormData[key].length === 0) {
        formattedFormData[key] = undefined;
      }
    }
    formattedFormData.userId = userId;

    try {
      let referenceId = formData.referenceId;
      let darPartialResponse = await updateDraftResponse(formattedFormData, referenceId);
      referenceId = darPartialResponse.referenceId;

      if (!isNil(uploadedIrbDocument) || !isNil(uploadedCollaborationLetter)) {
        darPartialResponse = await saveDARDocuments(uploadedIrbDocument, uploadedCollaborationLetter, referenceId);
      }
      const updatedFormData = assign(formattedFormData, darPartialResponse);
      await DAR.postDar(updatedFormData);
      setShowDialogSubmit({
        showDialogSubmit: false
      }, Navigation.console(Storage.getCurrentUser(), props.history).response);
    } catch (error) {
      setShowDialogSubmit(false);
      if (error.response.data.code && error.response.data.message) {
        Notifications.showError(
            {
              text: <ReactMarkdown>{error.response.data.message}</ReactMarkdown>,
              timeout: 6000
            });
      } else {
        Notifications.showError(
            {
              text: 'Error saving Data Access Request. Please try again in a few moments.',
              timeout: 6000
            });
      }
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
    const formattedFormData = cloneDeep(formData);
    // DAR datasetIds needs to be a list of ids
    if (DAAUtils.isEnabled()) {
      formattedFormData.datasetIds = selectedDatasets.map(d => d.datasetId);
    }

    // Make sure we navigate back to the current DAR after saving.
    const { dataRequestId } = props.match.params;
    try {
      let referenceId = formattedFormData.referenceId;
      let darPartialResponse = await updateDraftResponse(formattedFormData, referenceId);
      setDatasets(await DataSet.getDatasetsByIds(formData.datasetIds));
      referenceId = darPartialResponse.referenceId;
      if (isNil(dataRequestId)) {
        props.history.replace('/dar_application/' + referenceId);
      }
      //execute saveDARDocuments method only if documents are required for the DAR
      //value can be determined from activeDULQuestions, which is populated on Step 2 where document upload occurs
      if (!isNil(uploadedIrbDocument) || !isNil(uploadedCollaborationLetter)) {
        darPartialResponse = await saveDARDocuments(uploadedIrbDocument, uploadedCollaborationLetter, referenceId);
      }
      batchFormFieldChange(darPartialResponse);
      setShowDialogSave(false);
      setDisableOkButton(false);
    } catch (error) {
      setShowDialogSave(false);
      setDisableOkButton(false);
      if (error.response.data.code && error.response.data.message){
        Notifications.showError({text: <ReactMarkdown>{error.response.data.message}</ReactMarkdown>,
          severity: 'error',
          timeout: 6000
          });
      } else {
        Notifications.showError({text:'Error saving Data Access Request. Please try again in a few moments.',
          severity: 'error',
          });
      }

    }
  };

  const back = () => {
    props.history.goBack();
  };

  const { dataRequestId } = props.match.params;
  const eRACommonsDestination = isNil(dataRequestId) ? 'dar_application' : ('dar_application/' + dataRequestId);

  if (isLoading) {
    return <SpinnerComponent
        show={true}
        name="loadingSpinner"
        loadingImage={loadingImage}
    />;
  }
  return (
    <div>
      <div className={props.readOnlyMode ? 'application-information-page' : 'container'} style={{ padding: props.readOnlyMode ? '2% 3%' : '0 0 2%', backgroundColor: props.readOnlyMode ? 'white' : '' }}>
        <div className='col-lg-12 col-md-12 col-sm-12 col-xs-12'>
          <div className='row no-margin'>
            <Notification notificationData={notificationData} />
            <div
              className={(formData.darCode !== null ?
                'col-lg-12 col-md-12 col-sm-9 ' : 'col-lg-12 col-md-12 col-sm-12 ')}>
              <PageHeading
                title={props.readOnlyMode ? formData.darCode : 'Data Access Request Application'}
                description={props.readOnlyMode ? formData.projectTitle : 'Please complete the fields below to request access to data.'}
              />
            </div>
            {formData.darCode !== null &&
              !props.readOnlyMode &&
              <div className='col-lg-2 col-md-3 col-sm-3 col-xs-12 no-padding'>
                <a id='btn_back' onClick={back} className='btn-primary btn-back'>
                  <i className='glyphicon glyphicon-chevron-left' />
                  Back
                </a>
              </div>
            }
          </div>
        </div>

        <div style={{ clear: 'both' }} />
        <form name='form' noValidate={true} className='forms-v2'>
          <div className='multi-step-buttons-container'>
            <Tabs
              value={step}
              variant='scrollable'
              scrollButtons='auto'
              orientation='vertical'
              TabIndicatorProps={{
                style: { background: '#2BBD9B' }
              }}
              onChange={(_event, step) => {
                goToStep(step);
              }}
            >
              {
                applicationTabs.map((tabConfig, index) => {
                  const { name, showStep = true } = tabConfig;
                  return <Tab
                    key={`step-${index}-${name}`}
                    label={<div>
                      {showStep && <div className='step'>{`Step ${index + 1}`}</div>}
                      <div className='title'>{name}</div>
                    </div>}
                    value={index + 1}
                  />;
                })
              }
            </Tabs>
          </div>

          <div id='form-views'>
            <ConfirmationDialog
              title='Save changes?' disableOkBtn={disableOkBtn} disableNoBtn={disableOkBtn} color=''
              showModal={showDialogSave} action={{ label: 'Yes', handler: onSaveConfirmation }}
            >
              <div className='dialog-description'>
                Are you sure you want to save this Data Access Request? Previous changes will be overwritten.
              </div>
            </ConfirmationDialog>
            <ConfirmationDialog
              title='Submit Data Access Request?' disableOkBtn={disableOkBtn} disableNoBtn={disableOkBtn} color='' id='submitConfirmationModal'
              showModal={showDialogSubmit} action={{ label: 'Yes', handler: onSubmitConfirmation }}
            >
              <div className='dialog-description'>
                Are you sure you want to submit this Data Access Request? This cannot be undone.
              </div>
            </ConfirmationDialog>

            {props.createProgressReport && (
                <div className={'dar-steps'}>
                  <h3>{'DAR Update ' + reverseOrderedDARs?.length}</h3>
                  <div className='step-container'>
                    <h4>Submit a progress report</h4>
                    <br/>
                    <h4>PLACEHOLDER FORM</h4>
                  </div>
                </div>
            )}
            {reverseOrderedDARs.length > 1  && (
                <div className={props.readOnlyMode ? 'dar-summary' : 'dar-steps'}>
                  <h3>Previous Updates</h3>
                  {reverseOrderedDARs.map((dar, index) => {
                    if ((index + 1 !== reverseOrderedDARs.length)) {
                      return (
                          <ConditionalAccordian
                              key={`dar-${index}`}
                              condition={props.readOnlyMode}
                              title={`DAR Report ${reverseOrderedDARs.length - index - 1}`}
                              defaultExpanded={index === 0}>
                            <div className='step-container'>
                              <div>
                                <h4>Progress Report Summary</h4>
                                {dar.data.progressReportSummary}
                              </div>
                              <div>
                                <h4>Intellectual Property Summary</h4>
                                {dar.data.intellectualPropertySummary}
                              </div>
                            </div>
                          </ConditionalAccordian>);
                    }
                  })
                  }
                </div>
            )}

            <div className={props.readOnlyMode ? 'dar-summary' : 'dar-steps'}>
              {props.readOnlyMode && (<h3>{formData.darCode} Summary</h3>)}
              <div className={props.readOnlyMode ? 'accordian-step-container' : 'step-container'}>
                <ConditionalAccordian
                    condition={props.readOnlyMode}
                    title="Step 1: Researcher Information"
                    defaultExpanded={reverseOrderedDARs.length === 1}>
                <ResearcherInfo
                  completed={!isNil(get('institutionId', researcher))}
                  readOnlyMode={props.readOnlyMode || isAttested}
                  includeInstructions={!props.readOnlyMode}
                  darCode={formData.darCode}
                  formData={formData}
                  validation={formValidation.researcherInfoErrors}
                  formValidationChange={(val) => formValidationChange('researcherInfoErrors', val)}
                  eRACommonsDestination={eRACommonsDestination}
                  formFieldChange={formFieldChange}
                  location={props.location}
                  nihValid={nihValid}
                  onNihStatusUpdate={setNihValid}
                  showNihValidationError={showNihValidationError}
                  researcher={researcher}
                  allSigningOfficials={allSigningOfficials}
                  setLabCollaboratorsCompleted={setLabCollaboratorsCompleted}
                  setInternalCollaboratorsCompleted={setInternalCollaboratorsCompleted}
                  setExternalCollaboratorsCompleted={setExternalCollaboratorsCompleted}
                />
                  </ConditionalAccordian>
              </div>

              <div className={props.readOnlyMode ? 'accordian-step-container' : 'step-container'}>
                <ConditionalAccordian
                    condition={props.readOnlyMode}
                    title="Step 2: Data Access Request">
                  <DataAccessRequest
                      formData={formData}
                      readOnlyMode={props.readOnlyMode || isAttested}
                      includeInstructions={!props.readOnlyMode}
                      datasets={datasets}
                      validation={formValidation.darErrors}
                      formValidationChange={(val) => formValidationChange('darErrors', val)}
                      dataUseTranslations={dataUseTranslations}
                      formFieldChange={formFieldChange}
                      batchFormFieldChange={batchFormFieldChange}
                      uploadedCollaborationLetter={uploadedCollaborationLetter}
                      updateCollaborationLetter={updateCollaborationLetter}
                      uploadedIrbDocument={uploadedIrbDocument}
                      updateUploadedIrbDocument={updateIrbDocument}
                      setDatasets={setDatasets}
                      setSelectedDatasets={setSelectedDatasets}
                      draftDar={props.draftDar}
                  />
                </ConditionalAccordian>
              </div>

              <div className={props.readOnlyMode ? 'accordian-step-container' : 'step-container'}>
                <ConditionalAccordian
                    condition={props.readOnlyMode}
                    title="Step 3: Research Purpose Statement">
                  <ResearchPurposeStatement
                      darCode={formData.darCode}
                      readOnlyMode={props.readOnlyMode || isAttested}
                      validation={formValidation.rusErrors}
                      formValidationChange={(val) => formValidationChange('rusErrors', val)}
                      formFieldChange={formFieldChange}
                      formData={formData}
                  />
                </ConditionalAccordian>
              </div>

              {!props.readOnlyMode ?
                  <div className='step-container'>
                  {DAAUtils.isEnabled() ?
                    <DataAccessAgreements
                      datasets={selectedDatasets}
                      darCode={formData.darCode}
                      cancelAttest={() => setIsAttested(false)}
                      isAttested={isAttested}
                      attest={attemptSubmit}
                      save={() => setShowDialogSave(true)}
                    /> :
                    <DataUseAgreements
                      darCode={formData.darCode}
                      cancelAttest={() => setIsAttested(false)}
                      isAttested={isAttested}
                      attest={attemptSubmit}
                      save={() => setShowDialogSave(true)}
                    />
                  }
                </div> : <div />}

              {isAttested &&
                <div className='step-container'>
                  <DucAddendum
                    doSubmit={doSubmit}
                    save={() => setShowDialogSave(true)}
                    isLoading={isLoading}
                    formData={formData}
                    datasets={DAAUtils.isEnabled() ? selectedDatasets : datasets}
                    dataUseTranslations={dataUseTranslations} />
                </div>
              }
            </div>
          </div>
        </form>
      </div>
      {!props.readOnlyMode ? <UsgOmbText /> : null}
    </div>
  );
};

export default DataAccessRequestApplication;
