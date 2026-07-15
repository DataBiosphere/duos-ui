import React, { useCallback, useEffect, useRef, useState } from 'react'
import ResearcherInfo from 'src/pages/dar_application/ResearcherInfo'
import { DataAccessAgreements } from 'src/pages/dar_application/DataAccessAgreements'
import DataAccessRequest, { OntologyOption } from 'src/pages/dar_application/DataAccessRequest'
import ResearchPurposeStatement from 'src/pages/dar_application/ResearchPurposeStatement'
import { translateDataUseRestrictionsFromDataUseArray, TranslationEntry } from 'src/libs/dataUseTranslation'
import { Navigation, Notifications } from 'src/libs/utils'
import { AsyncConfirmationDialog } from 'src/components/AsyncConfirmationDialog'
import { Notification } from 'src/components/Notification'
import { PageHeading } from 'src/components/PageHeading'
import { User } from 'src/libs/ajax/User'
import { DataSet } from 'src/libs/ajax/DataSet'
import { DAR } from 'src/libs/ajax/DAR'
import { Collections } from 'src/libs/ajax/Collections'
import { NotificationService, Banner } from 'src/libs/notificationService'
import { Storage } from 'src/libs/storage'
import 'src/pages/dar_application/DataAccessRequestApplication.css'
import DucAddendum from 'src/pages/dar_application/DucAddendum'
import { Metrics } from 'src/libs/ajax/Metrics'
import eventList from 'src/libs/events'
import ReactMarkdown from 'react-markdown'
import { SpinnerComponent } from 'src/components/SpinnerComponent'
import loadingImage from 'src/images/loading-indicator.svg'
import { ConditionalAccordion } from 'src/components/forms/ConditionalAccordion'
import { ProgressReportApplication } from 'src/pages/dar_application/ProgressReportApplication'
import { ScrollableTabs } from 'src/pages/dar_application/ScrollableTabs'
import { validateDARFormData, validationFailed, DARFormValidationResult } from 'src/utils/darFormUtils'
import { assign, cloneDeep, get, isArray, isEmpty, isEqual, isNil, isString, map, merge, set } from 'src/utils/NodashUtil'
import { usePageTitle } from 'src/hooks/usePageTitle'
import { Countries } from 'src/libs/ajax/Countries'
import useAsyncCacheFetch from 'src/hooks/useAsyncCacheFetch'
import VotingHistoryOverview from 'src/pages/dar_application/VotingHistoryOverview'
import { ElectionStatus, VOTE_TYPES } from 'src/utils/DarUtils'
import { useNavigate, useParams } from 'react-router-dom'
import {
  CombinedDataAccessRequest,
  DarCollection,
  DataAccessRequest as DataAccessRequestModel,
  Dataset,
  DuosUser,
  Election,
  SimplifiedDuosUser,
} from 'src/types/model'
import { ValidationError } from 'src/pages/dar_application/FormValidationState'

// Constants
const RESEARCHER_INFO_TAB_ID = 'researcher-info'
const DATA_ACCESS_REQUEST_TAB_ID = 'data-access-request'
const RESEARCH_PURPOSE_STATEMENT_TAB_ID = 'research-purpose'
const DATA_ACCESS_AGREEMENTS_TAB_ID = 'data-access-agreements'
const PROGRESS_REPORT_TAB_ID_PREFIX = 'progress-report-'
const PROGRESS_REPORT_APPLICATION_TAB_ID = 'progress-report-app'
const ADDENDUM_TAB_ID = 'addendum'
const VOTING_HISTORY_TAB_ID = 'voting-history-info'

interface AppTab {
  name: string
  id: string
  showStep?: boolean
}

const ApplicationTabs: AppTab[] = [
  { name: 'Researcher Information', id: RESEARCHER_INFO_TAB_ID },
  { name: 'Data Access Request', id: DATA_ACCESS_REQUEST_TAB_ID },
  { name: 'Research Purpose Statement', id: RESEARCH_PURPOSE_STATEMENT_TAB_ID },
]

// This component's form state is a superset of CombinedDataAccessRequest: `researcher` is a
// display-name string used for validation/piName-fallback (separate from the `researcher`
// DuosUser state), and `profileName`/`pubmedId`/`scientificUrl` are legacy fields that are no
// longer read anywhere but are still submitted with the DAR, so they're preserved here.
type DarFormData = Omit<Partial<CombinedDataAccessRequest>, 'ontologies'> & {
  ontologies?: OntologyOption[]
  researcher?: string
  institution?: string
  profileName?: string
  pubmedId?: string
  scientificUrl?: string
}

const fetchAllDatasets = async (dsIds: number[]): Promise<Dataset[]> => {
  const filteredDatasetIds = dsIds.filter(id => !isNil(id) && Number.isInteger(id) && id > 0)
  if (isEmpty(filteredDatasetIds)) {
    return []
  }

  // filter just for safety
  return DataSet.getDatasetsByIds(filteredDatasetIds)
}

export interface DataAccessRequestApplicationProps {
  draftDar: boolean
  isProgressReportApplication: boolean
  existingDarsReadOnlyMode?: boolean
  collection?: DarCollection | Record<string, never>
}

const DataAccessRequestApplication = (props: Readonly<DataAccessRequestApplicationProps>) => {
  const params = useParams()
  const { collectionId, dataRequestId } = params
  const navigate = useNavigate()
  const [formData, setFormData] = useState<DarFormData>({
    datasetIds: [],
    daaIds: [],
    darCode: undefined,
    labCollaborators: [],
    internalCollaborators: [],
    externalCollaborators: [],
    checkNihDataOnly: false,
    rus: '',
    nonTechRus: '',
    oneGender: undefined,
    methods: undefined,
    aiLlmUse: undefined,
    controls: undefined,
    population: undefined,
    hmb: undefined,
    poa: undefined,
    diseases: undefined,
    ontologies: [],
    other: undefined,
    otherText: '',
    forProfit: undefined,
    gender: '',
    pediatric: undefined,
    illegalBehavior: undefined,
    addiction: undefined,
    sexualDiseases: undefined,
    stigmatizedDiseases: undefined,
    vulnerablePopulation: undefined,
    populationMigration: undefined,
    psychiatricTraits: undefined,
    notHealth: undefined,
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
    anvilUse: undefined,
    localUse: undefined,
    cloudUse: undefined,
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

  // Set page title based on mode
  let pageTitle = 'DAR Application'
  if (isProgressReportApplication) {
    pageTitle = 'Progress Report'
  }
  else if (existingDarsReadOnlyMode) {
    pageTitle = 'DAR Application Review'
  }
  usePageTitle(pageTitle)

  const [formValidation, setFormValidation] = useState<DARFormValidationResult>({
    researcherInfoErrors: {},
    darErrors: {},
    rusErrors: {},
    nihValid: true,
  })

  const [nihValid, setNihValid] = useState(true)
  const [showNihValidationError, setShowNihValidationError] = useState(false)

  const [disableOkBtn, setDisableOkBtn] = useState(false)

  const [labCollaboratorsCompleted, setLabCollaboratorsCompleted] = useState(true)
  const [internalCollaboratorsCompleted, setInternalCollaboratorsCompleted] = useState(true)
  const [externalCollaboratorsCompleted, setExternalCollaboratorsCompleted] = useState(true)

  const [showDialogSave, setShowDialogSave] = useState(false)
  const [showDialogSubmit, setShowDialogSubmit] = useState(false)

  const [tab, setTab] = useState<string | undefined>(undefined)
  const [notificationData, setNotificationData] = useState<Banner | null | undefined>(undefined)

  const [researcher, setResearcher] = useState<DuosUser | Record<string, never>>({})
  const [allSigningOfficials, setAllSigningOfficials] = useState<SimplifiedDuosUser[]>([])

  const [uploadedIrbDocument, setUploadedIrbDocument] = useState<File | null>(null)
  const [uploadedCollaborationLetter, setUploadedCollaborationLetter] = useState<File | null>(null)

  const [isLoading, setIsLoading] = useState(true)
  const [isAttested, setIsAttested] = useState(false)

  const [applicationTabs, setApplicationTabs] = useState<AppTab[]>([])

  const [countriesOfOperation, setCountriesOfOperation] = useState<string[]>([])

  // helper function to coordinate local state changes as well as updates to form data on the parent
  const formFieldChange = useCallback(({ key, value }: { key: string, value: unknown }) => {
    setFormData(
      (formData) => {
        return {
          ...formData,
          [key]: value,
        } as DarFormData
      },
    )
  }, [])

  const formValidationChange = useCallback((section: keyof DARFormValidationResult, { key, validation }: { key: string | Array<string | number>, validation: ValidationError }) => {
    setFormValidation((formValidation) => {
      const newFormValidation = cloneDeep(formValidation)
      if (isArray(key)) {
        set(newFormValidation, [section, ...key].map(String), validation)
      }
      else {
        set(newFormValidation, [section, key], validation)
      }
      return newFormValidation
    })
  }, [])

  const batchFormFieldChange = useCallback((updates: Record<string, unknown>) => {
    setFormData((formData) => {
      return {
        ...formData,
        ...updates,
      } as DarFormData
    })
  }, [])

  const onDaaIdsChange = useCallback((ids: number[]) => {
    const normalizedIds = [...new Set((ids ?? [])
      .map(Number)
      .filter(id => Number.isInteger(id) && id > 0))]
    setFormData((prevFormData) => {
      if (isEqual(prevFormData.daaIds, normalizedIds)) {
        return prevFormData
      }
      return {
        ...prevFormData,
        daaIds: normalizedIds,
      }
    })
  }, [])

  const updateCollaborationLetter = (letter: File | undefined) => {
    batchFormFieldChange({
      collaborationLetterName: '',
      collaborationLetterLocation: '',
    })
    setUploadedCollaborationLetter(letter ?? null)
  }

  const updateIrbDocument = (document: File | undefined, expiration: string) => {
    batchFormFieldChange({
      irbDocumentName: '',
      irbDocumentLocation: '',
      irbProtocolExpiration: expiration,
    })
    setUploadedIrbDocument(document ?? null)
  }

  // Initialize cache with collection if available
  const initialCollectionCache: Record<number, DarCollection> = collection && 'darCollectionId' in collection && collection.darCollectionId
    ? { [collection.darCollectionId]: collection as DarCollection }
    : {}

  const { fetchWithCache: fetchCollectionWithCache } = useAsyncCacheFetch<number, DarCollection>(initialCollectionCache)
  const { fetchWithCache: fetchDarWithCache } = useAsyncCacheFetch<string, DataAccessRequestModel>({})

  const getDarCollection = useCallback(
    (id: string) => fetchCollectionWithCache(Number(id), Collections.getCollectionById),
    [fetchCollectionWithCache],
  )
  const getPartialDarRequest = useCallback(
    (darId: string) => fetchDarWithCache(darId, DAR.getPartialDarRequest),
    [fetchDarWithCache],
  )

  const [reverseOrderedDARs, setReverseOrderedDARs] = useState<DataAccessRequestModel[]>([])
  const [datasets, setDatasets] = useState<Dataset[]>([])
  const [selectedDatasets, setSelectedDatasets] = useState<Dataset[]>([])
  const [dataUseTranslations, setDataUseTranslations] = useState<(TranslationEntry | undefined)[][]>([])

  // Guards the fire-and-forget promises below against resolving after unmount - without
  // it, a late resolution (e.g. in a test that unmounts before the mock promise settles)
  // can trip React's "document is not defined anymore" invariant during effect cleanup.
  const isMountedRef = useRef(true)
  useEffect(() => {
    return () => {
      isMountedRef.current = false
    }
  }, [])

  React.useEffect(() => {
    fetchAllDatasets(formData.datasetIds ?? []).then((datasets) => {
      if (!isMountedRef.current) return
      setDatasets(datasets)
      setSelectedDatasets(datasets)
    })
    if (!existingDarsReadOnlyMode) {
      const updatedTabs = [...ApplicationTabs, { name: 'Data Access Agreements (DAA)', id: DATA_ACCESS_AGREEMENTS_TAB_ID }]
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setApplicationTabs(updatedTabs)
    }
  }, [formData.datasetIds, existingDarsReadOnlyMode])

  useEffect(() => {
    translateDataUseRestrictionsFromDataUseArray(datasets.map(ds => ds.dataUse)).then((translations) => {
      if (!isMountedRef.current) return
      setDataUseTranslations(translations)
    })
  }, [datasets])

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (existingDarsReadOnlyMode && collectionId) {
          const { createUser } = await getDarCollection(collectionId)
          if (!isMountedRef.current) return
          setResearcher(createUser ?? {})
        }
        else {
          const response = await User.getMe()
          const signingOfficials = await User.getSOsForCurrentUser()
          if (!isMountedRef.current) return
          setResearcher(response)
          setAllSigningOfficials(signingOfficials)
        }
      }
      catch {
        if (!isMountedRef.current) return
        setShowDialogSave(false)
        Notifications.showError({ text: 'Error displaying user information. Please try again in a few moments.' })
      }
    }
    void fetchData()
  }, [existingDarsReadOnlyMode, collectionId, getDarCollection])

  const resolveInitialFormData = useCallback(async (): Promise<DarFormData> => {
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
      const darId = darEntries.length > 0 ? darEntries.toSorted((a, b) => a.id - b.id)[0].referenceId : undefined
      const nextFormData: DarFormData = darId ? await getPartialDarRequest(darId) : {}

      // This is a collection, so we need to get the datasets and datasetIds from the collection
      nextFormData.datasetIds = map(datasets, ds => get(ds, 'datasetId'))
      return nextFormData
    }

    if (isNil(dataRequestId)) {
      // Lastly, try to get the form data from local storage and clear out whatever was there previously
      const storedFormData = Storage.getData<DarFormData>('dar_application')
      Storage.removeData('dar_application')
      return storedFormData ?? {}
    }

    // Handle the case where we have an existing DAR id
    // Same endpoint works for any dataRequestId, not just partials.
    return getPartialDarRequest(dataRequestId)
  }, [collectionId, dataRequestId, getDarCollection, getPartialDarRequest])

  const init = useCallback(async () => {
    const nextFormData = await resolveInitialFormData()
    if (!isMountedRef.current) return

    const isResearcherEmpty = isNil(researcher) || isEmpty(researcher)
    const researcherEmail = isResearcherEmpty ? '' : (researcher as DuosUser).email
    nextFormData.researcher = isResearcherEmpty ? '' : (researcher as DuosUser).displayName
    nextFormData.piName = existingDarsReadOnlyMode ? nextFormData.piName : nextFormData.researcher
    nextFormData.piEmail = existingDarsReadOnlyMode ? nextFormData.piEmail : researcherEmail
    nextFormData.institution = isResearcherEmpty || isNil((researcher as DuosUser).institution) ? '' : (researcher as DuosUser).institution?.name
    nextFormData.userId = (researcher as DuosUser).userId

    batchFormFieldChange(nextFormData)
    setIsLoading(false)
  }, [researcher, existingDarsReadOnlyMode, resolveInitialFormData, batchFormFieldChange])

  React.useEffect(() => {
    if (existingDarsReadOnlyMode) {
      let appTabs: AppTab[] = []
      if (isProgressReportApplication) {
        // if we are creating a new progress report, we need to add another tab for the application
        appTabs = [{ name: 'Progress Report ' + reverseOrderedDARs.length, id: PROGRESS_REPORT_APPLICATION_TAB_ID, showStep: false }]
      }
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setApplicationTabs([...appTabs,
        ...reverseOrderedDARs.map((_dar, index) => {
          const whichPRIsThis = reverseOrderedDARs.length - index - 1
          const isLast = index === reverseOrderedDARs.length - 1
          const itemLabel = isLast ? formData.darCode : 'Progress Report ' + whichPRIsThis
          return { name: itemLabel ?? '', id: `${PROGRESS_REPORT_TAB_ID_PREFIX}${whichPRIsThis}`, showStep: false }
        }),
        { name: 'Voting History', id: VOTING_HISTORY_TAB_ID, showStep: false },
      ])
    }
  }, [formData.darCode, isProgressReportApplication, existingDarsReadOnlyMode, reverseOrderedDARs])

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    init()
    NotificationService.getBannerObjectById('eRACommonsOutage').then((notificationData) => {
      if (!isMountedRef.current) return
      setNotificationData(notificationData)
    })
    Countries.getCountries().then((isoCountriesData: string[]) => {
      if (!isMountedRef.current) return
      setCountriesOfOperation(isoCountriesData)
    })
  }, [init])

  // Can't do uploads in parallel since endpoints are post and they both alter attributes in JSON column
  // If done in parallel, updated attribute of one document will be overwritten by the outdated value on the other
  const saveDARDocuments = async (uploadedIrbDocument: File | null, uploadedCollaborationLetter: File | null, referenceId: string): Promise<DataAccessRequestModel> => {
    const irbUpdate = await DAR.uploadDARDocument(uploadedIrbDocument, referenceId, 'irbDocument')
    const collaborationUpdate = await DAR.uploadDARDocument(uploadedCollaborationLetter, referenceId, 'collaborationDocument')
    return assign(irbUpdate.data ?? {}, collaborationUpdate.data ?? {}) as DataAccessRequestModel
  }

  const updateDraftResponse = async (formattedFormData: Record<string, unknown>, referenceId: string | undefined) => {
    let darPartialResponse
    if (!isNil(referenceId) && !isEmpty(referenceId)) {
      darPartialResponse = await DAR.updateDarDraft(formattedFormData, referenceId)
    }
    else {
      darPartialResponse = await DAR.postDarDraft(formattedFormData)
    }
    return darPartialResponse
  }

  const getErrorTabId = (validation: DARFormValidationResult, isResearcherInfoValid: boolean): string => {
    if (!isEmpty(validation.researcherInfoErrors) || !isResearcherInfoValid) {
      return RESEARCHER_INFO_TAB_ID
    }
    if (!isEmpty(validation.darErrors)) {
      return DATA_ACCESS_REQUEST_TAB_ID
    }
    if (isEmpty(validation.rusErrors)) {
      return RESEARCHER_INFO_TAB_ID
    }
    return RESEARCH_PURPOSE_STATEMENT_TAB_ID
  }

  const addDucAddendumTab = () => {
    const hasAddendumTab = applicationTabs.some(tab => tab.id === ADDENDUM_TAB_ID)
    if (!hasAddendumTab) {
      const tabs = [
        ...applicationTabs,
        { name: 'Addendum', id: ADDENDUM_TAB_ID, showStep: false },
      ]
      setApplicationTabs(tabs)
    }
  }

  const removeAddendumTab = () => {
    const hasAddendumTab = applicationTabs.some(tab => tab.id === ADDENDUM_TAB_ID)
    if (hasAddendumTab) {
      const tabs = applicationTabs.filter(tab => tab.id !== ADDENDUM_TAB_ID)
      setApplicationTabs(tabs)
    }
  }

  const attemptSubmit = async (): Promise<boolean> => {
    const validation = validateDARFormData({
      formData,
      datasets: draftDar ? selectedDatasets : datasets,
      dataUseTranslations,
      irbDocument: uploadedIrbDocument,
      collaborationLetter: uploadedCollaborationLetter,
      researcher: researcher as DuosUser,
      labCollaboratorsCompleted,
      internalCollaboratorsCompleted,
      externalCollaboratorsCompleted,
    })
    setFormValidation(validation)

    const hasLibraryCard = !isNil((researcher as DuosUser).libraryCard)

    const isInvalidForm = validationFailed(validation) || !nihValid || !hasLibraryCard
    setShowNihValidationError(!nihValid)

    if (isInvalidForm) {
      setTab(getErrorTabId(validation, nihValid && hasLibraryCard))
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
    attemptSubmit().then((isValid) => {
      if (isValid) {
        setShowDialogSubmit(true)
      }
    })
  }

  const submitDARFormData = async () => {
    const userId = Storage.getCurrentUser().userId
    const formattedFormData: Record<string, unknown> = cloneDeep(formData)

    for (const key in formattedFormData) {
      const value = formattedFormData[key]
      if (isString(value) && value.trim().length === 0) {
        formattedFormData[key] = undefined
      }
    }
    formattedFormData.userId = userId
    formattedFormData.daaIds = [...new Set(((formData.daaIds ?? []) as number[])
      .map(Number)
      .filter(id => Number.isInteger(id) && id > 0))]

    try {
      const referenceId = formData.referenceId
      let darPartialResponse = await updateDraftResponse(formattedFormData, referenceId)
      const updatedReferenceId = darPartialResponse.referenceId

      if (!isNil(uploadedIrbDocument) || !isNil(uploadedCollaborationLetter)) {
        darPartialResponse = await saveDARDocuments(uploadedIrbDocument, uploadedCollaborationLetter, updatedReferenceId)
      }
      const updatedFormData = assign(formattedFormData, darPartialResponse)
      await DAR.postDar(updatedFormData)
      setShowDialogSubmit(false)
      await Navigation.console(Storage.getCurrentUser(), navigate)
    }
    catch (error) {
      setShowDialogSubmit(false)

      const responseError = error as { response?: { status?: number, data?: { code?: string, message?: string } } }

      // Make DAR editable if we get a 400 status (Bad Request) error
      if (responseError.response?.status === 400) {
        setIsAttested(false)
      }

      if (responseError.response?.data?.code && responseError.response.data.message) {
        Notifications.showError(
          {
            text: <ReactMarkdown>{responseError.response.data.message}</ReactMarkdown>,
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

  const onSaveConfirmation = (selectedOk: boolean) => async () => {
    setDisableOkBtn(true)
    if (selectedOk) {
      await saveDarDraft()
      setDisableOkBtn(false)
    }
    else {
      setShowDialogSave(false)
      setDisableOkBtn(false)
    }
  }

  const onSubmitConfirmation = (selectedOk: boolean) => async () => {
    setDisableOkBtn(true)
    if (selectedOk) {
      await submitDARFormData()
      setDisableOkBtn(false)
    }
    else {
      setShowDialogSubmit(false)
      setDisableOkBtn(false)
    }
  }

  const saveDarDraft = async () => {
    const formattedFormData: Record<string, unknown> = cloneDeep(formData)
    // DAR datasetIds needs to be a list of ids
    formattedFormData.datasetIds = selectedDatasets.map(d => d.datasetId)
    formattedFormData.daaIds = [...new Set(((formData.daaIds ?? []) as number[])
      .map(Number)
      .filter(id => Number.isInteger(id) && id > 0))]

    // Make sure we navigate back to the current DAR after saving.
    try {
      const referenceId = formData.referenceId
      let darPartialResponse = await updateDraftResponse(formattedFormData, referenceId)
      setDatasets(await DataSet.getDatasetsByIds(formData.datasetIds ?? []))
      const updatedReferenceId = darPartialResponse.referenceId
      if (isNil(dataRequestId)) {
        navigate('/dar_application/' + updatedReferenceId, { replace: true })
      }
      // execute saveDARDocuments method only if documents are required for the DAR
      // value can be determined from activeDULQuestions, which is populated on Step 2 where document upload occurs
      if (!isNil(uploadedIrbDocument) || !isNil(uploadedCollaborationLetter)) {
        darPartialResponse = await saveDARDocuments(uploadedIrbDocument, uploadedCollaborationLetter, updatedReferenceId)
      }
      batchFormFieldChange({ ...darPartialResponse })
      setShowDialogSave(false)
      setDisableOkBtn(false)
    }
    catch (error) {
      setShowDialogSave(false)
      setDisableOkBtn(false)
      const responseError = error as { response?: { data?: { code?: string, message?: string } } }
      if (responseError.response?.data?.code && responseError.response.data.message) {
        Notifications.showError({
          text: <ReactMarkdown>{responseError.response.data.message}</ReactMarkdown>,
          severity: 'error',
          timeout: 6000,
        })
      }
      else {
        Notifications.showError({
          text: 'Error saving Data Access Request. Please try again in a few moments.',
          severity: 'error',
        })
      }
    }
  }

  const NO_ELECTION_STATUS = 'Awaiting Election Opening'
  const NO_FINAL_VOTE_STATUS = 'Awaiting Final Vote'
  const PENDING_STATUS = 'Pending'

  const createVoteRecord = (dar: DataAccessRequestModel, datasetId: number, election: Election | undefined, datasets: Dataset[]) => {
    const getElectionVotes = (election: Election | undefined) => {
      if (Array.isArray(election?.votes)) {
        return election.votes
      }
      return election?.votes ? Object.values(election.votes) : []
    }

    const votes = getElectionVotes(election)

    const finalVote = votes.find(v => v.type === VOTE_TYPES.FINAL || v.type === VOTE_TYPES.RADAR_APPROVE)
    const hasFinalVote = finalVote?.vote !== undefined && finalVote?.vote !== null
    const hasFinalVoteRationale = hasFinalVote && typeof finalVote?.rationale === 'string' && finalVote.rationale.trim().length > 0

    const dataset = datasets.find(d => d.datasetId === datasetId)
    const datasetName = dataset?.name ?? NO_ELECTION_STATUS

    const formatDate = (dateString: string | number): string => {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    }

    const isElectionClosed = !hasFinalVote && (election?.status === ElectionStatus.CLOSED || election?.status === 'Canceled')

    const getVoteDate = () => {
      if (finalVote?.updateDate) {
        return formatDate(finalVote.updateDate)
      }
      if (isElectionClosed && election?.createDate) {
        return formatDate(election.createDate)
      }
      return NO_FINAL_VOTE_STATUS
    }

    const getDecision = () => {
      if (finalVote?.vote === true) {
        return 'Approved'
      }
      if (finalVote?.vote === false) {
        return 'Denied'
      }
      if (isElectionClosed && election) {
        return election.status
      }
      return PENDING_STATUS
    }

    const getRationale = () => {
      if (hasFinalVoteRationale) {
        return finalVote?.rationale ?? ''
      }
      if (hasFinalVote) {
        return 'No rationale provided.'
      }
      if (isElectionClosed) {
        return 'Election Closed - No Final Vote'
      }
      return NO_FINAL_VOTE_STATUS
    }

    const voteDate = getVoteDate()
    const decision = getDecision()
    const rationale = getRationale()

    return {
      datasetId,
      datasetName,
      voteDate,
      voteDateRaw: finalVote?.updateDate || finalVote?.createDate || null,
      requestType: dar.progressReport ? 'Progress Report' : 'Initial DAR',
      linkedDarId: String(dar.collectionId),
      voteResult: { decision, rationale },
      status: election?.status ?? NO_ELECTION_STATUS,
    }
  }

  const votes = reverseOrderedDARs.flatMap((dar) => {
    const elections = dar.elections
      ? Object.values(dar.elections).filter(e => e.electionType === 'DataAccess')
      : []

    return (dar.datasetIds || []).map((datasetId) => {
      const election = elections.find(e => e.datasetId === datasetId)
      return createVoteRecord(dar, datasetId, election, datasets)
    })
  }).sort((a, b) => {
    // Compare by vote date (most recent first)
    if (a.voteDateRaw && b.voteDateRaw) {
      const dateCompare = new Date(b.voteDateRaw).getTime() - new Date(a.voteDateRaw).getTime()
      if (dateCompare !== 0) return dateCompare
    }
    // Handle cases where one or both dates are missing
    else if (!a.voteDateRaw && b.voteDateRaw) return -1
    else if (a.voteDateRaw && !b.voteDateRaw) return 1

    // Compare by election status (Open > Closed > Awaiting Election)
    const statusOrder: Record<string, number> = { [ElectionStatus.OPEN]: 0, [ElectionStatus.CLOSED]: 1, [NO_ELECTION_STATUS]: 2 }
    const statusCompare = (statusOrder[a.status] ?? 3) - (statusOrder[b.status] ?? 3)
    if (statusCompare !== 0) return statusCompare

    // Compare by request type (Initial DAR vs Progress Report)
    const typeCompare = a.requestType.localeCompare(b.requestType)
    if (typeCompare !== 0) return typeCompare

    // Compare by dataset name as final tiebreaker
    return a.datasetName.localeCompare(b.datasetName)
  })

  const getDarStatus = (votes: { status: string }[]): string => {
    if (votes.some(vote => vote.status === ElectionStatus.OPEN)) {
      return ElectionStatus.OPEN
    }
    if (votes.every(vote => vote.status === NO_ELECTION_STATUS)) {
      return NO_ELECTION_STATUS
    }
    return ElectionStatus.CLOSED
  }

  const dar = {
    referenceId: formData.darCode || '',
    piName: formData.piName || '',
    institution: formData.institution || '',
    status: getDarStatus(votes),
  }

  const back = () => {
    navigate(-1)
  }

  const eRACommonsDestination = isNil(dataRequestId) ? 'dar_application' : ('dar_application/' + dataRequestId)

  const stepContainerClassName = existingDarsReadOnlyMode ? 'accordion-step-container' : 'step-container'

  if (isLoading) {
    return (
      <SpinnerComponent
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
              className={(formData.darCode === null
                ? 'col-lg-12 col-md-12 col-sm-12 '
                : 'col-lg-12 col-md-12 col-sm-9 ')}
            >
              <PageHeading
                id="dar-application-heading"
                title={(existingDarsReadOnlyMode ? formData.darCode : 'Data Access Request Application') ?? ''}
                description={existingDarsReadOnlyMode ? formData.projectTitle : 'Please complete the fields below to request access to data.'}
              />
            </div>
            {formData.darCode !== null
              && !existingDarsReadOnlyMode
              && (
                <div className="col-lg-2 col-md-3 col-sm-3 col-xs-12 no-padding">
                  <button id="btn_back" type="button" onClick={back} className="btn-primary btn-back">
                    <i className="glyphicon glyphicon-chevron-left" />
                    {' '}
                    Back
                  </button>
                </div>
              )}
          </div>
        </div>

        <div style={{ clear: 'both' }} />
        <form name="form" noValidate={true} className="forms-v2">
          <ScrollableTabs applicationTabs={applicationTabs} formSelectedTabId={tab} onTabChange={setTab} />

          <div id="form-views">
            <AsyncConfirmationDialog
              title="Save changes?"
              disableOkBtn={disableOkBtn}
              disableNoBtn={disableOkBtn}
              showModal={showDialogSave}
              action={{ label: 'Yes', handler: onSaveConfirmation }}
            >
              <div className="dialog-description">
                Are you sure you want to save this Data Access Request? Previous changes will be overwritten.
              </div>
            </AsyncConfirmationDialog>
            <AsyncConfirmationDialog
              title="Submit Data Access Request?"
              disableOkBtn={disableOkBtn}
              disableNoBtn={disableOkBtn}
              showModal={showDialogSubmit}
              action={{ label: 'Yes', handler: onSubmitConfirmation }}
            >
              <div className="dialog-description">
                Are you sure you want to submit this Data Access Request? This cannot be undone.
              </div>
            </AsyncConfirmationDialog>

            {isProgressReportApplication && (
              <div id={PROGRESS_REPORT_APPLICATION_TAB_ID} className="dar-steps">
                <ConditionalAccordion
                  condition={false}
                  title={`Progress Report ${reverseOrderedDARs.length}`}
                >
                  <ProgressReportApplication
                    readOnlyMode={false}
                    datasets={datasets}
                    dar={merge({}, reverseOrderedDARs[0]?.data, reverseOrderedDARs[0]) as CombinedDataAccessRequest}
                    researcher={researcher as DuosUser}
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
                      <div key={dar.referenceId} id={`${PROGRESS_REPORT_TAB_ID_PREFIX}${reverseOrderedDARs.length - index - 1}`}>
                        <ConditionalAccordion
                          key={dar.referenceId}
                          condition={true}
                          title={`Progress Report ${reverseOrderedDARs.length - index - 1}`}
                          defaultExpanded={index === 0}
                        >
                          <ProgressReportApplication
                            readOnlyMode={true}
                            datasets={datasets}
                            dar={merge({}, dar?.data, dar) as CombinedDataAccessRequest}
                            researcher={researcher as DuosUser}
                            countriesOfOperation={countriesOfOperation}
                          />
                        </ConditionalAccordion>
                      </div>
                    )
                  }
                  return null
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
              <div id={RESEARCHER_INFO_TAB_ID} className={stepContainerClassName}>
                <ConditionalAccordion
                  condition={!!existingDarsReadOnlyMode}
                  title="Step 1: Researcher Information"
                  defaultExpanded={reverseOrderedDARs.length === 1}
                >
                  <ResearcherInfo
                    readOnlyMode={existingDarsReadOnlyMode || isAttested}
                    includeInstructions={!existingDarsReadOnlyMode}
                    darCode={formData.darCode}
                    formData={formData}
                    validation={formValidation.researcherInfoErrors}
                    formValidationChange={val => formValidationChange('researcherInfoErrors', val)}
                    eRACommonsDestination={eRACommonsDestination}
                    formFieldChange={formFieldChange}
                    onNihStatusUpdate={setNihValid}
                    showNihValidationError={showNihValidationError}
                    researcher={researcher as DuosUser}
                    allSigningOfficials={allSigningOfficials}
                    setLabCollaboratorsCompleted={setLabCollaboratorsCompleted}
                    setInternalCollaboratorsCompleted={setInternalCollaboratorsCompleted}
                    setExternalCollaboratorsCompleted={setExternalCollaboratorsCompleted}
                    countriesOfOperation={countriesOfOperation}
                    eraCommonsId={reverseOrderedDARs.at(-1)?.eraCommonsId}
                  />
                </ConditionalAccordion>
              </div>

              <div id={DATA_ACCESS_REQUEST_TAB_ID} className={stepContainerClassName}>
                <ConditionalAccordion
                  condition={!!existingDarsReadOnlyMode}
                  title="Step 2: Data Access Request"
                >
                  <DataAccessRequest
                    formData={formData}
                    readOnlyMode={(existingDarsReadOnlyMode || isAttested)}
                    includeInstructions={!existingDarsReadOnlyMode}
                    datasets={datasets}
                    validation={formValidation.darErrors}
                    formValidationChange={(val: { key: string, validation: ValidationError }) => formValidationChange('darErrors', val)}
                    dataUseTranslations={dataUseTranslations}
                    formFieldChange={formFieldChange}
                    batchFormFieldChange={batchFormFieldChange}
                    uploadedCollaborationLetter={uploadedCollaborationLetter}
                    updateCollaborationLetter={updateCollaborationLetter}
                    uploadedIrbDocument={uploadedIrbDocument}
                    updateUploadedIrbDocument={updateIrbDocument}
                    setSelectedDatasets={setSelectedDatasets}
                    referenceId={formData.referenceId}
                  />
                </ConditionalAccordion>
              </div>

              <div id={RESEARCH_PURPOSE_STATEMENT_TAB_ID} className={stepContainerClassName}>
                <ConditionalAccordion
                  condition={!!existingDarsReadOnlyMode}
                  title="Step 3: Research Purpose Statement"
                >
                  <ResearchPurposeStatement
                    darCode={formData.darCode}
                    readOnlyMode={(existingDarsReadOnlyMode || isAttested)}
                    validation={formValidation.rusErrors}
                    formValidationChange={(val: { key: string, validation: ValidationError }) => formValidationChange('rusErrors', val)}
                    formFieldChange={formFieldChange}
                    formData={formData}
                  />
                </ConditionalAccordion>
              </div>

              {existingDarsReadOnlyMode
                ? <div />
                : (
                    <div id={DATA_ACCESS_AGREEMENTS_TAB_ID} className="step-container">
                      <DataAccessAgreements
                        datasets={selectedDatasets}
                        onDaaIdsChange={onDaaIdsChange}
                        researcherDaaIds={(researcher as DuosUser).libraryCard?.daaIds}
                        isDraft={draftDar}
                        cancelAttest={() => {
                          setIsAttested(false)
                          removeAddendumTab()
                        }}
                        isAttested={isAttested}
                        attest={() => {
                          void attemptSubmit()
                        }}
                        save={() => setShowDialogSave(true)}
                      />
                    </div>
                  )}

              {isAttested
                && (
                  <div id={ADDENDUM_TAB_ID} className="step-container">
                    <DucAddendum
                      doSubmit={doSubmit}
                      save={() => setShowDialogSave(true)}
                      isLoading={isLoading}
                      datasets={selectedDatasets}
                    />
                  </div>
                )}
              {!isEmpty(votes)
                && (
                  <div id={VOTING_HISTORY_TAB_ID} className={stepContainerClassName}>
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
