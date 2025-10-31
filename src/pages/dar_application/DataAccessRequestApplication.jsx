import React, { useCallback, useEffect, useState } from 'react'
import ResearcherInfo from 'src/pages/dar_application/ResearcherInfo'
import { DataAccessAgreements } from 'src/pages/dar_application/DataAccessAgreements'
import { DataUseAgreements } from 'src/pages/dar_application/DataUseAgreements'
import DataAccessRequest from 'src/pages/dar_application/DataAccessRequest'
import ResearchPurposeStatement from 'src/pages/dar_application/ResearchPurposeStatement'
import { translateDataUseRestrictionsFromDataUseArray } from 'src/libs/dataUseTranslation'
import { Navigation, Notifications } from 'src/libs/utils'
import { ConfirmationDialog } from 'src/components/ConfirmationDialog_new'
import { Notification } from 'src/components/Notification'
import { PageHeading } from 'src/components/PageHeading'
import { User } from 'src/libs/ajax/User'
import { DataSet } from 'src/libs/ajax/DataSet'
import { DAR } from 'src/libs/ajax/DAR'
import { Collections } from 'src/libs/ajax/Collections'
import { NotificationService } from 'src/libs/notificationService'
import { Storage } from 'src/libs/storage'
import { get, map } from 'lodash/fp'
import 'src/pages/dar_application/DataAccessRequestApplication.css'
import DucAddendum from 'src/pages/dar_application/DucAddendum'
import { DAAUtils } from 'src/utils/DAAUtils'
import { Metrics } from 'src/libs/ajax/Metrics'
import eventList from 'src/libs/events'
import ReactMarkdown from 'react-markdown'
import { SpinnerComponent } from 'src/components/SpinnerComponent.jsx'
import loadingImage from 'src/images/loading-indicator.svg'
import { ConditionalAccordion } from 'src/components/forms/ConditionalAccordion.js'
import { ProgressReportApplication } from 'src/pages/dar_application/ProgressReportApplication'
import { ScrollableTabs } from 'src/pages/dar_application/ScrollableTabs'
import { validateDARFormData, validationFailed } from 'src/utils/darFormUtils.js'
import { assign, cloneDeep, isArray, isEmpty, isNil, isString, merge, set } from 'lodash'
import { Countries } from 'src/libs/ajax/Countries.js'
import PropTypes from 'prop-types'
import useAsyncCacheFetch from 'src/hooks/useAsyncCacheFetch'
import VotingHistoryOverview from 'src/pages/dar_application/VotingHistoryOverview.js'
import { ElectionStatus, VOTE_TYPES } from 'src/utils/DarUtils.js'
import { useParams, useNavigate } from 'react-router-dom'

// Constants
const RESEARCHER_INFO_TAB_ID = 'researcher-info'
const DATA_ACCESS_REQUEST_TAB_ID = 'data-access-request'
const RESEARCH_PURPOSE_STATEMENT_TAB_ID = 'research-purpose'
const DATA_ACCESS_AGREEMENTS_TAB_ID = 'data-access-agreements'
const PROGRESS_REPORT_TAB_ID_PREFIX = 'progress-report-'
const PROGRESS_REPORT_APPLICATION_TAB_ID = 'progress-report-app'
const ADDENDUM_TAB_ID = 'addendum'
const VOTING_HISTORY_TAB_ID = 'voting-history-info'
const ApplicationTabs = [
  { name: 'Researcher Information', id: RESEARCHER_INFO_TAB_ID },
  { name: 'Data Access Request', id: DATA_ACCESS_REQUEST_TAB_ID },
  { name: 'Research Purpose Statement', id: RESEARCH_PURPOSE_STATEMENT_TAB_ID },
]

const fetchAllDatasets = async (dsIds) => {
  const filteredDatasetIds = dsIds.filter(id => !isNil(id) && Number.isInteger(id) && id > 0)
  if (isEmpty(filteredDatasetIds)) {
    return []
  }

  // filter just for safety
  return DataSet.getDatasetsByIds(filteredDatasetIds)
}

const DataAccessRequestApplication = (props) => {
  const params = useParams()
  const { collectionId, dataRequestId } = params
  const navigate = useNavigate()
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
    aiLlmUse: null,
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
    piCountryOfOperation: Countries.DEFAULT_COUNTRY,
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
  })

  const { existingDarsReadOnlyMode, draftDar, isProgressReportApplication, collection } = props

  const [formValidation, setFormValidation] = useState({ researcherInfoErrors: {}, darErrors: {}, rusErrors: {} })

  const [nihValid, setNihValid] = useState(true)
  const [showNihValidationError, setShowNihValidationError] = useState(false)

  const [disableOkBtn, setDisableOkBtn] = useState(false)

  const [labCollaboratorsCompleted, setLabCollaboratorsCompleted] = useState(true)
  const [internalCollaboratorsCompleted, setInternalCollaboratorsCompleted] = useState(true)
  const [externalCollaboratorsCompleted, setExternalCollaboratorsCompleted] = useState(true)

  const [showDialogSave, setShowDialogSave] = useState(false)
  const [showDialogSubmit, setShowDialogSubmit] = useState(false)

  const [tab, setTab] = useState(undefined)
  const [notificationData, setNotificationData] = useState(undefined)

  const [researcher, setResearcher] = useState({})
  const [allSigningOfficials, setAllSigningOfficials] = useState([])

  const [uploadedIrbDocument, setUploadedIrbDocument] = useState(null)
  const [uploadedCollaborationLetter, setUploadedCollaborationLetter] = useState(null)

  const [isLoading, setIsLoading] = useState(true)
  const [isAttested, setIsAttested] = useState(false)

  const [applicationTabs, setApplicationTabs] = useState([])

  const [countriesOfOperation, setCountriesOfOperation] = useState([])

  // helper function to coordinate local state changes as well as updates to form data on the parent
  const formFieldChange = useCallback(({ key, value }) => {
    setFormData(
      (formData) => {
        return {
          ...formData,
          ...{
            [key]: value,
          },
        }
      },
    )
  }, [])

  const formValidationChange = useCallback((section, { key, validation }) => {
    setFormValidation((formValidation) => {
      const newFormValidation = cloneDeep(formValidation)
      if (isArray(key)) {
        set(newFormValidation, [section, ...key], validation)
      }
      else {
        set(newFormValidation, [section, key], validation)
      }
      return newFormValidation
    })
  }, [])

  const batchFormFieldChange = (updates) => {
    setFormData((formData) => {
      return {
        ...formData,
        ...updates,
      }
    })
  }

  const updateCollaborationLetter = (letter) => {
    batchFormFieldChange({
      collaborationLetterName: '',
      collaborationLetterLocation: '',
    })
    setUploadedCollaborationLetter(letter)
  }

  const updateIrbDocument = (document, expiration) => {
    batchFormFieldChange({
      irbDocumentName: '',
      irbDocumentLocation: '',
      irbProtocolExpiration: expiration,
    })
    setUploadedIrbDocument(document)
  }

  // Initialize cache with collection if available
  const initialCache = {
    [collection?.darCollectionId]: collection,
  }

  const { fetchWithCache } = useAsyncCacheFetch(initialCache)

  const getDarCollection = collectionId => fetchWithCache(collectionId, Collections.getCollectionById)
  const getPartialDarRequest = darId => fetchWithCache(darId, DAR.getPartialDarRequest)

  const [reverseOrderedDARs, setReverseOrderedDARs] = useState([])
  const [datasets, setDatasets] = useState([])
  const [selectedDatasets, setSelectedDatasets] = useState([])
  const [dataUseTranslations, setDataUseTranslations] = useState([])

  useEffect(() => {
    fetchAllDatasets(formData.datasetIds).then((datasets) => {
      setDatasets(datasets)
      setSelectedDatasets(datasets)
    })
    if (!existingDarsReadOnlyMode) {
      const tabName = DAAUtils.isEnabled() ? 'Data Access Agreements (DAA)' : 'Data Use Agreement'
      const updatedTabs = [...ApplicationTabs, { name: tabName, id: DATA_ACCESS_AGREEMENTS_TAB_ID }]
      setApplicationTabs(updatedTabs)
    }
  }, [formData.datasetIds, existingDarsReadOnlyMode])

  useEffect(() => {
    translateDataUseRestrictionsFromDataUseArray(datasets.map(ds => ds.dataUse)).then((translations) => {
      setDataUseTranslations(translations)
    })
  }, [datasets])

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (existingDarsReadOnlyMode) {
          const { createUser } = await getDarCollection(collectionId)
          setResearcher(createUser)
        }
        else {
          const response = await User.getMe()
          const signingOfficials = await User.getSOsForCurrentUser()
          setResearcher(response)
          setAllSigningOfficials(signingOfficials)
        }
      }
      catch (_error) {
        setShowDialogSave(false)
        Notifications({ text: 'Error displaying user information. Please try again in a few moments.' })
      }
    }
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existingDarsReadOnlyMode])

  const init = useCallback(async () => {
    let formData = {}

    if (!isNil(collectionId)) {
      // Review existing DAR application - retrieves all datasets in the collection
      // Besides the datasets, DARs split off from the collection should have the same formData
      const { dars, datasets } = await getDarCollection(collectionId)

      // Add elections to DAR data passed into form, to enable showing approved datasets
      const darEntries = dars ? Object.values(dars) : []
      darEntries.forEach((dar) => {
        dar.data.elections = dar.elections
        dar.data.datasetIds = dar.datasetIds
      })
      // TS thinks that collection.dars is an object, but it is a map
      const darMap = new Map(Object.entries(dars || {}))
      const newReverseOrderedDARs = [...darMap.values()].sort((a, b) => b.id - a.id)
      setReverseOrderedDARs(newReverseOrderedDARs)
      // form data = the "root" DAR's data
      const darId = darEntries.length > 0 ? darEntries.sort((a, b) => a.id - b.id)[0].referenceId : undefined
      formData = darId ? await getPartialDarRequest(darId) : {}

      // This is a collection, so we need to get the datasets and datasetIds from the collection
      formData.datasetIds = map(ds => get('datasetId')(ds))(datasets)
    }
    else if (!isNil(dataRequestId)) {
      // Handle the case where we have an existing DAR id
      // Same endpoint works for any dataRequestId, not just partials.
      formData = await getPartialDarRequest(dataRequestId)
    }
    else {
      // Lastly, try to get the form data from local storage and clear out whatever was there previously
      formData = Storage.getData('dar_application') === null ? formData : Storage.getData('dar_application')
      Storage.removeData('dar_application')
    }

    formData.researcher = isNil(researcher) ? '' : researcher.displayName
    formData.piName = existingDarsReadOnlyMode ? formData.piName : formData.researcher
    formData.piEmail = existingDarsReadOnlyMode ? formData.piEmail : (isNil(researcher) ? '' : researcher.email)
    formData.institution = isNil(researcher) || isNil(researcher.institution) ? '' : researcher.institution.name
    formData.userId = researcher.userId

    batchFormFieldChange(formData)
    setIsLoading(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [researcher, existingDarsReadOnlyMode])

  useEffect(() => {
    if (existingDarsReadOnlyMode) {
      let appTabs = []
      if (isProgressReportApplication) {
        // if we are creating a new progress report, we need to add another tab for the application
        appTabs = [{ name: 'Progress Report ' + reverseOrderedDARs.length, id: PROGRESS_REPORT_APPLICATION_TAB_ID, showStep: false }]
      }
      setApplicationTabs([...appTabs,
        ...reverseOrderedDARs.map((_dar, index) => {
          const whichPRIsThis = reverseOrderedDARs.length - index - 1
          const isLast = index === reverseOrderedDARs.length - 1
          const itemLabel = isLast ? formData?.darCode : 'Progress Report ' + whichPRIsThis
          return { name: itemLabel, id: `${PROGRESS_REPORT_TAB_ID_PREFIX}${whichPRIsThis}`, showStep: false }
        }),
        { name: 'Voting History', id: VOTING_HISTORY_TAB_ID, showStep: false },
      ])
    }
  }, [formData?.darCode, isProgressReportApplication, existingDarsReadOnlyMode, reverseOrderedDARs])

  useEffect(() => {
    init()
    NotificationService.getBannerObjectById('eRACommonsOutage').then((notificationData) => {
      setNotificationData(notificationData)
    })
    Countries.getCountries().then((isoCountriesData) => {
      setCountriesOfOperation(isoCountriesData)
    })
  }, [init])

  // Can't do uploads in parallel since endpoints are post and they both alter attributes in json column
  // If done in parallel, updated attribute of one document will be overwritten by the outdated value on the other
  const saveDARDocuments = async (uploadedIrbDocument = null, uploadedCollaborationLetter = null, referenceId) => {
    const irbUpdate = await DAR.uploadDARDocument(uploadedIrbDocument, referenceId, 'irbDocument')
    const collaborationUpdate = await DAR.uploadDARDocument(uploadedCollaborationLetter, referenceId, 'collaborationDocument')
    return assign(irbUpdate.data, collaborationUpdate.data)
  }

  const updateDraftResponse = async (formattedFormData, referenceId) => {
    let darPartialResponse
    if (!isNil(referenceId) && !isEmpty(referenceId)) {
      darPartialResponse = await DAR.updateDarDraft(formattedFormData, referenceId)
    }
    else {
      darPartialResponse = await DAR.postDarDraft(formattedFormData)
    }
    return darPartialResponse
  }

  const scrollToFormErrors = (validation, eraCommonsIdValid, hasLibraryCard) => {
    if (!isEmpty(validation.researcherInfoErrors) || !eraCommonsIdValid || !hasLibraryCard) {
      setTab(RESEARCHER_INFO_TAB_ID)
    }
    else if (!isEmpty(validation.darErrors)) {
      setTab(DATA_ACCESS_REQUEST_TAB_ID)
    }
    else if (!isEmpty(validation.rusErrors)) {
      setTab(RESEARCH_PURPOSE_STATEMENT_TAB_ID)
    }
    else {
      setTab(RESEARCHER_INFO_TAB_ID)
    }
  }

  const addDucAddendumTab = () => {
    const hasAddendumTab = applicationTabs.filter(tab => tab.id === ADDENDUM_TAB_ID).length > 0
    if (!hasAddendumTab) {
      const tabs = [
        ...applicationTabs,
        { name: 'Addendum', id: ADDENDUM_TAB_ID, showStep: false },
      ]
      setApplicationTabs(tabs)
    }
  }

  const removeAddendumTab = () => {
    const hasAddendumTab = applicationTabs.filter(tab => tab.id === ADDENDUM_TAB_ID).length > 0
    if (hasAddendumTab) {
      const tabs = applicationTabs.filter(tab => tab.id !== ADDENDUM_TAB_ID)
      setApplicationTabs(tabs)
    }
  }

  const attemptSubmit = async () => {
    const validation = validateDARFormData({
      formData,
      datasets: draftDar ? selectedDatasets : datasets,
      dataUseTranslations,
      irbDocument: uploadedIrbDocument,
      collaborationLetter: uploadedCollaborationLetter,
      researcher,
      labCollaboratorsCompleted,
      internalCollaboratorsCompleted,
      externalCollaboratorsCompleted,
    })
    setFormValidation(validation)

    const hasLibraryCard = !isNil(researcher.libraryCard)

    const isInvalidForm = validationFailed(validation) || !nihValid || !hasLibraryCard
    setShowNihValidationError(!nihValid)

    if (isInvalidForm) {
      scrollToFormErrors(validation, nihValid, hasLibraryCard)
    }
    else {
      // noinspection ES6MissingAwait
      Metrics.captureEvent(eventList.dar, { action: 'attest' })
      setIsAttested(true)
      setTab(ADDENDUM_TAB_ID)
      addDucAddendumTab()
    }

    return !isInvalidForm
  }

  const doSubmit = () => {
    if (attemptSubmit()) {
      setShowDialogSubmit(true)
    }
  }

  const submitDARFormData = async () => {
    const userId = Storage.getCurrentUser().userId
    const formattedFormData = cloneDeep(formData)

    for (const key in formattedFormData) {
      if (isString(formattedFormData[key]) && formattedFormData[key].trim() && formattedFormData[key].length === 0) {
        formattedFormData[key] = undefined
      }
    }
    formattedFormData.userId = userId

    try {
      let referenceId = formData.referenceId
      let darPartialResponse = await updateDraftResponse(formattedFormData, referenceId)
      referenceId = darPartialResponse.referenceId

      if (!isNil(uploadedIrbDocument) || !isNil(uploadedCollaborationLetter)) {
        darPartialResponse = await saveDARDocuments(uploadedIrbDocument, uploadedCollaborationLetter, referenceId)
      }
      const updatedFormData = assign(formattedFormData, darPartialResponse)
      await DAR.postDar(updatedFormData)
      setShowDialogSubmit({
        showDialogSubmit: false,
      }, Navigation.console(Storage.getCurrentUser(), navigate).response)
    }
    catch (error) {
      setShowDialogSubmit(false)

      // Make DAR editable if we get a 400 status (Bad Request) error
      if (error.response && error.response.status === 400) {
        setIsAttested(false)
      }

      if (error.response.data.code && error.response.data.message) {
        Notifications.showError(
          {
            text: <ReactMarkdown>{error.response.data.message}</ReactMarkdown>,
            timeout: 6000,
          })
      }
      else {
        Notifications.showError(
          {
            text: 'Error saving Data Access Request. Please try again in a few moments.',
            timeout: 6000,
          })
      }
    }
  }

  const onSaveConfirmation = selectedOk => () => {
    setDisableOkBtn(true)
    if (selectedOk === true) {
      saveDarDraft()
      setDisableOkBtn(false)
    }
    else {
      setShowDialogSave(false)
      setDisableOkBtn(false)
    }
  }

  const onSubmitConfirmation = selectedOk => () => {
    setDisableOkBtn(true)
    if (selectedOk === true) {
      submitDARFormData()
      setDisableOkBtn(false)
    }
    else {
      setShowDialogSubmit(false)
      setDisableOkBtn(false)
    }
  }

  const saveDarDraft = async () => {
    const formattedFormData = cloneDeep(formData)
    // DAR datasetIds needs to be a list of ids
    formattedFormData.datasetIds = selectedDatasets.map(d => d.datasetId)

    // Make sure we navigate back to the current DAR after saving.
    try {
      let referenceId = formattedFormData.referenceId
      let darPartialResponse = await updateDraftResponse(formattedFormData, referenceId)
      setDatasets(await DataSet.getDatasetsByIds(formData.datasetIds))
      referenceId = darPartialResponse.referenceId
      if (isNil(dataRequestId)) {
        navigate('/dar_application/' + referenceId, { replace: true })
      }
      // execute saveDARDocuments method only if documents are required for the DAR
      // value can be determined from activeDULQuestions, which is populated on Step 2 where document upload occurs
      if (!isNil(uploadedIrbDocument) || !isNil(uploadedCollaborationLetter)) {
        darPartialResponse = await saveDARDocuments(uploadedIrbDocument, uploadedCollaborationLetter, referenceId)
      }
      batchFormFieldChange(darPartialResponse)
      setShowDialogSave(false)
      setDisableOkBtn(false)
    }
    catch (error) {
      setShowDialogSave(false)
      setDisableOkBtn(false)
      if (error.response.data.code && error.response.data.message) {
        Notifications.showError({ text: <ReactMarkdown>{error.response.data.message}</ReactMarkdown>,
          severity: 'error',
          timeout: 6000,
        })
      }
      else {
        Notifications.showError({ text: 'Error saving Data Access Request. Please try again in a few moments.',
          severity: 'error',
        })
      }
    }
  }

  const votes = reverseOrderedDARs.map((dar) => {
    const election = dar.elections
      ? Object.values(dar.elections).find(e => e.electionType === 'DataAccess')
      : undefined

    // Find the Final vote for decision and rationale
    let finalVoteDecision = 'Pending'
    let finalVoteRationale = 'No rationale provided.'
    let finalVoteDate = election?.createDate
    if (election?.votes) {
      const votesArr = Array.isArray(election.votes)
        ? election.votes
        : Object.values(election.votes)
      const finalVote = votesArr.find(v => v.type === VOTE_TYPES.FINAL)
      if (finalVote) {
        finalVoteDate = finalVote.createDate
        finalVoteDecision = finalVote.vote === true ? 'Approved' : finalVote.vote === false ? 'Denied' : 'Pending'
        finalVoteRationale = finalVote.rationale || 'No rationale provided.'
      }
    }

    return {
      datasetName: datasets.find(d => d.datasetId === election?.datasetId)?.name || 'Unknown Dataset',
      voteDate: new Date(finalVoteDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
      requestType: dar.progressReport ? 'Progress Report' : 'Initial DAR',
      linkedDarId: dar?.collectionId,
      voteResult: {
        decision: finalVoteDecision,
        rationale: finalVoteRationale,
      },
      status: election?.status || 'Completed',
    }
  })

  const dar = {
    referenceId: formData?.darCode || '',
    piName: formData?.piName || '',
    institution: formData?.institution || '',
    status: votes.some(vote => vote.status === ElectionStatus.OPEN) ? ElectionStatus.OPEN : ElectionStatus.CLOSED,
  }

  const back = () => {
    navigate.goBack()
  }

  const eRACommonsDestination = isNil(dataRequestId) ? 'dar_application' : ('dar_application/' + dataRequestId)

  if (isLoading) {
    return (
      <SpinnerComponent
        show={true}
        name="loadingSpinner"
        loadingImage={loadingImage}
      />
    )
  }

  return (
    <div>
      <div className={existingDarsReadOnlyMode ? 'application-information-page' : 'container'} style={{ padding: existingDarsReadOnlyMode ? '2% 3%' : '0 0 2%', backgroundColor: existingDarsReadOnlyMode ? 'white' : '' }}>
        <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12">
          <div className="row no-margin">
            <Notification notificationData={notificationData} />
            <div
              className={(formData.darCode !== null
                ? 'col-lg-12 col-md-12 col-sm-9 '
                : 'col-lg-12 col-md-12 col-sm-12 ')}
            >
              <PageHeading
                title={existingDarsReadOnlyMode ? formData.darCode : 'Data Access Request Application'}
                description={existingDarsReadOnlyMode ? formData.projectTitle : 'Please complete the fields below to request access to data.'}
              />
            </div>
            {formData.darCode !== null
              && !existingDarsReadOnlyMode
              && (
                <div className="col-lg-2 col-md-3 col-sm-3 col-xs-12 no-padding">
                  <a id="btn_back" onClick={back} className="btn-primary btn-back">
                    <i className="glyphicon glyphicon-chevron-left" />
                    Back
                  </a>
                </div>
              )}
          </div>
        </div>

        <div style={{ clear: 'both' }} />
        <form name="form" noValidate={true} className="forms-v2">
          <ScrollableTabs applicationTabs={applicationTabs} formSelectedTabId={tab} onTabChange={setTab} />

          <div id="form-views">
            <ConfirmationDialog
              title="Save changes?"
              disableOkBtn={disableOkBtn}
              disableNoBtn={disableOkBtn}
              color=""
              showModal={showDialogSave}
              action={{ label: 'Yes', handler: onSaveConfirmation }}
            >
              <div className="dialog-description">
                Are you sure you want to save this Data Access Request? Previous changes will be overwritten.
              </div>
            </ConfirmationDialog>
            <ConfirmationDialog
              title="Submit Data Access Request?"
              disableOkBtn={disableOkBtn}
              disableNoBtn={disableOkBtn}
              color=""
              id="submitConfirmationModal"
              showModal={showDialogSubmit}
              action={{ label: 'Yes', handler: onSubmitConfirmation }}
            >
              <div className="dialog-description">
                Are you sure you want to submit this Data Access Request? This cannot be undone.
              </div>
            </ConfirmationDialog>

            {isProgressReportApplication && (
              <div id={PROGRESS_REPORT_APPLICATION_TAB_ID} className="dar-steps">
                <ConditionalAccordion
                  condition={false}
                  title={`Progress Report ${reverseOrderedDARs.length}`}
                >
                  <ProgressReportApplication
                    readOnlyMode={false}
                    datasets={datasets}
                    dar={merge(reverseOrderedDARs[0]?.data, reverseOrderedDARs[0])}
                    researcher={researcher}
                    countriesOfOperation={countriesOfOperation}
                  />
                </ConditionalAccordion>
              </div>
            )}
            {existingDarsReadOnlyMode && reverseOrderedDARs.length > 1 && (
              <div className="dar-summary">
                <h3>Previous Updates</h3>
                {reverseOrderedDARs.map((dar, index) => {
                  if ((index + 1 !== reverseOrderedDARs.length)) {
                    return (
                      <div key={`dar-${index}`} id={`${PROGRESS_REPORT_TAB_ID_PREFIX}${reverseOrderedDARs.length - index - 1}`}>
                        <ConditionalAccordion
                          key={`dar-${index}`}
                          condition={true}
                          title={`Progress Report ${reverseOrderedDARs.length - index - 1}`}
                          defaultExpanded={index === 0}
                        >
                          <ProgressReportApplication
                            readOnlyMode={true}
                            datasets={datasets}
                            dar={merge(dar?.data, dar)}
                            researcher={researcher}
                            countriesOfOperation={countriesOfOperation}
                          />
                        </ConditionalAccordion>
                      </div>
                    )
                  }
                })}
              </div>
            )}
            <div id={`${PROGRESS_REPORT_TAB_ID_PREFIX}0`} className={existingDarsReadOnlyMode ? 'dar-summary' : 'dar-steps'}>
              {existingDarsReadOnlyMode && (
                <h3>
                  {formData.darCode}
                  {' '}
                  Summary
                </h3>
              )}
              <div id={RESEARCHER_INFO_TAB_ID} className={existingDarsReadOnlyMode ? 'accordion-step-container' : 'step-container'}>
                <ConditionalAccordion
                  condition={existingDarsReadOnlyMode}
                  title="Step 1: Researcher Information"
                  defaultExpanded={reverseOrderedDARs.length === 1}
                >
                  <ResearcherInfo
                    completed={!isNil(get('institutionId', researcher))}
                    readOnlyMode={existingDarsReadOnlyMode || isAttested}
                    includeInstructions={!existingDarsReadOnlyMode}
                    darCode={formData.darCode}
                    formData={formData}
                    validation={formValidation.researcherInfoErrors}
                    formValidationChange={val => formValidationChange('researcherInfoErrors', val)}
                    eRACommonsDestination={eRACommonsDestination}
                    formFieldChange={formFieldChange}
                    nihValid={nihValid}
                    onNihStatusUpdate={setNihValid}
                    showNihValidationError={showNihValidationError}
                    researcher={researcher}
                    allSigningOfficials={allSigningOfficials}
                    setLabCollaboratorsCompleted={setLabCollaboratorsCompleted}
                    setInternalCollaboratorsCompleted={setInternalCollaboratorsCompleted}
                    setExternalCollaboratorsCompleted={setExternalCollaboratorsCompleted}
                    countriesOfOperation={countriesOfOperation}
                    eraCommonsId={reverseOrderedDARs.at(-1)?.eraCommonsId}
                  />
                </ConditionalAccordion>
              </div>

              <div id={DATA_ACCESS_REQUEST_TAB_ID} className={existingDarsReadOnlyMode ? 'accordion-step-container' : 'step-container'}>
                <ConditionalAccordion
                  condition={existingDarsReadOnlyMode}
                  title="Step 2: Data Access Request"
                >
                  <DataAccessRequest
                    formData={formData}
                    readOnlyMode={existingDarsReadOnlyMode || isAttested}
                    includeInstructions={!existingDarsReadOnlyMode}
                    datasets={datasets}
                    validation={formValidation.darErrors}
                    formValidationChange={val => formValidationChange('darErrors', val)}
                    dataUseTranslations={dataUseTranslations}
                    formFieldChange={formFieldChange}
                    batchFormFieldChange={batchFormFieldChange}
                    uploadedCollaborationLetter={uploadedCollaborationLetter}
                    updateCollaborationLetter={updateCollaborationLetter}
                    uploadedIrbDocument={uploadedIrbDocument}
                    updateUploadedIrbDocument={updateIrbDocument}
                    setDatasets={setDatasets}
                    setSelectedDatasets={setSelectedDatasets}
                    referenceId={formData.referenceId}
                    draftDar={draftDar}
                  />
                </ConditionalAccordion>
              </div>

              <div id={RESEARCH_PURPOSE_STATEMENT_TAB_ID} className={existingDarsReadOnlyMode ? 'accordion-step-container' : 'step-container'}>
                <ConditionalAccordion
                  condition={existingDarsReadOnlyMode}
                  title="Step 3: Research Purpose Statement"
                >
                  <ResearchPurposeStatement
                    darCode={formData.darCode}
                    readOnlyMode={existingDarsReadOnlyMode || isAttested}
                    validation={formValidation.rusErrors}
                    formValidationChange={val => formValidationChange('rusErrors', val)}
                    formFieldChange={formFieldChange}
                    formData={formData}
                  />
                </ConditionalAccordion>
              </div>

              {!existingDarsReadOnlyMode
                ? (
                    <div id={DATA_ACCESS_AGREEMENTS_TAB_ID} className="step-container">
                      {DAAUtils.isEnabled()
                        ? (
                            <DataAccessAgreements
                              datasets={selectedDatasets}
                              isDraft={draftDar}
                              cancelAttest={() => {
                                setIsAttested(false)
                                removeAddendumTab()
                              }}
                              isAttested={isAttested}
                              attest={attemptSubmit}
                              save={() => setShowDialogSave(true)}
                            />
                          )
                        : (
                            <DataUseAgreements
                              isDraft={draftDar}
                              cancelAttest={() => {
                                setIsAttested(false)
                                removeAddendumTab()
                              }}
                              isAttested={isAttested}
                              attest={attemptSubmit}
                              save={() => setShowDialogSave(true)}
                            />
                          )}
                    </div>
                  )
                : <div />}

              {isAttested
                && (
                  <div id={ADDENDUM_TAB_ID} className="step-container">
                    <DucAddendum
                      doSubmit={doSubmit}
                      save={() => setShowDialogSave(true)}
                      isLoading={isLoading}
                      formData={formData}
                      datasets={selectedDatasets}
                      dataUseTranslations={dataUseTranslations}
                    />
                  </div>
                )}
              {!isEmpty(votes)
                && (
                  <div id={VOTING_HISTORY_TAB_ID} className={existingDarsReadOnlyMode ? 'accordion-step-container' : 'step-container'}>
                    <VotingHistoryOverview dar={dar} votes={votes} />
                  </div>
                )}
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

export default DataAccessRequestApplication

DataAccessRequestApplication.propTypes = {
  draftDar: PropTypes.bool.isRequired,
  isProgressReportApplication: PropTypes.bool.isRequired,
  existingDarsReadOnlyMode: PropTypes.bool,
  collection: PropTypes.object,
}
