import React, { useEffect, useState, useCallback } from 'react';
import ResearcherInfo from './ResearcherInfo';
import DataUseAgreements from './DataUseAgreements';
import DataAccessRequest from './DataAccessRequest';
import ResearchPurposeStatement from './ResearchPurposeStatement';
import { translateDataUseRestrictionsFromDataUseArray } from '../../libs/dataUseTranslation';
import {
  Navigation,
  Notifications as NotyUtil
} from '../../libs/utils';
import { ConfirmationDialog } from '../../components/ConfirmationDialog_new';
import { Notification } from '../../components/Notification';
import { PageHeading } from '../../components/PageHeading';
import { Collections, DAR, User, DataSet } from '../../libs/ajax';
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
const ApplicationTabs = [
  { name: 'Researcher Information' },
  { name: 'Data Access Request' },
  { name: 'Research Purpose Statement' }
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

const DataAccessRequestApplication = (props) => {
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

  const [applicationTabs, setApplicationTabs] = useState(ApplicationTabs);

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

  const [datasets, setDatasets] = useState([]);
  const [dataUseTranslations, setDataUseTranslations] = useState([]);

  useEffect(() => {
    fetchAllDatasets(formData.datasetIds).then((datasets) => {
      setDatasets(datasets);
    });
    if (!props.readOnlyMode) {
      ApplicationTabs.push({ name: 'Data Use Agreement' });
      setApplicationTabs(ApplicationTabs)
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
  }, []);

  const init = useCallback(async () => {
    const { dataRequestId, collectionId } = props.match.params;
    let formData = {};
    const researcher = await User.getMe();
    const signingOfficials = await User.getSOsForCurrentUser();

    setResearcher(researcher);
    setAllSigningOfficials(signingOfficials);
    setIsLoading(false);

    if (!isNil(collectionId)) {
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
    formData.institution = isNil(researcher) || isNil(researcher.institution) ? '' : researcher.institution.name;
    formData.userId = researcher.userId;

    batchFormFieldChange(formData);
    window.addEventListener('scroll', onScroll); // eslint-disable-line -- codacy says event listeners are dangerous
  }, [onScroll, props.match.params]);

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
    let irbUpdate, collaborationUpdate;
    irbUpdate = await DAR.uploadDARDocument(uploadedIrbDocument, referenceId, 'irbDocument');
    collaborationUpdate = await DAR.uploadDARDocument(uploadedCollaborationLetter, referenceId, 'collaborationDocument');
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

  const attemptSubmit = () => {
    const validation = validateDARFormData({
      formData,
      datasets,
      dataUseTranslations,
      irbDocument: uploadedIrbDocument,
      collaborationLetter: uploadedCollaborationLetter,
      researcher,
      labCollaboratorsCompleted,
      internalCollaboratorsCompleted,
      externalCollaboratorsCompleted,
    });

    setFormValidation(validation);

    const eraCommonsIdValid = nihValid === true || formData.checkCollaborator === true;

    const hasLibraryCard = !isEmpty(researcher.libraryCards);

    const isInvalidForm = validationFailed(validation) || !eraCommonsIdValid || !hasLibraryCard;
    setShowNihValidationError(!eraCommonsIdValid);

    if (isInvalidForm) {
      scrollToFormErrors(validation, eraCommonsIdValid, hasLibraryCard);
    } else {
      setIsAttested(true);
      addDucAddendumTab();
      goToDucAddendum();
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
    let formattedFormData = cloneDeep(formData);

    for (var key in formattedFormData) {
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
      let updatedFormData = assign(formattedFormData, darPartialResponse);
      await DAR.postDar(updatedFormData);
      setShowDialogSubmit({
        showDialogSubmit: false
      }, Navigation.console(Storage.getCurrentUser(), props.history).response);
    } catch (error) {
      setShowDialogSubmit(false);
      NotyUtil.showError({
        text: 'Data Access Request submission failed. Please save and try submitting again.'
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
      NotyUtil.showError('Error saving Data Access Request. Please try again in a few moments.');
    }
  };

  const back = () => {
    props.history.goBack();
  };

  const { dataRequestId } = props.match.params;
  const eRACommonsDestination = isNil(dataRequestId) ? 'dar_application' : ('dar_application/' + dataRequestId);

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
                title='Data Access Request Application'
                description={props.readOnlyMode ? '' : 'Please complete the fields below to request access to data.'}
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
              onChange={(event, step) => {
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

            <div className='dar-steps'>
              <div className='step-container'>
                <ResearcherInfo
                  completed={!isNil(get('institutionId', researcher))}
                  readOnlyMode={props.readOnlyMode || isAttested}
                  researcherProfile={props.researcherProfile}
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
              </div>

              <div className='step-container'>
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
                />
              </div>

              <div className='step-container'>
                <ResearchPurposeStatement
                  darCode={formData.darCode}
                  readOnlyMode={props.readOnlyMode || isAttested}
                  validation={formValidation.rusErrors}
                  formValidationChange={(val) => formValidationChange('rusErrors', val)}
                  formFieldChange={formFieldChange}
                  formData={formData}
                />
              </div>

              {!props.readOnlyMode ?
                <div className='step-container'>
                  <DataUseAgreements
                    darCode={formData.darCode}
                    cancelAttest={() => setIsAttested(false)}
                    isAttested={isAttested}
                    attest={attemptSubmit}
                    save={() => setShowDialogSave(true)}
                  />
                </div> : <div />}

              {isAttested &&
                <div className='step-container'>
                  <DucAddendum doSubmit={doSubmit} save={() => setShowDialogSave(true)} isLoading={isLoading} formData={formData} datasets={datasets} dataUseTranslations={dataUseTranslations} />
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
