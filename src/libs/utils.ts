import { DAR } from './ajax/DAR'
import { Theme } from './theme'
import React, { RefObject } from 'react'
import {
  capitalize,
  cloneDeep,
  concat,
  every,
  filter,
  find,
  first,
  forEach,
  get,
  includes,
  isEmpty,
  isNil,
  join,
  map,
  toLower,
} from 'lodash'
import { headerTabsConfig } from '../components/DuosHeader'
import { ToastNotifications } from './ToastNotifications'
import {
  DuosUser,
  DarCollection,
  Election,
  Vote,
  LibraryCard,
  DuosUser as Researcher,
  Dataset,
  DatasetTerm,
  InstitutionInterface,
  DataAccessRequest,
  DacObject,
  UserRole,
  UserProperty,
} from '../types/model'

export const UserProperties = {
  SUGGESTED_SIGNING_OFFICIAL: 'suggestedSigningOfficial',
  SELECTED_SIGNING_OFFICIAL_ID: 'selectedSigningOfficialId',
  INSTITUTION_ID: 'institutionId',
  SUGGESTED_INSTITUTION: 'suggestedInstitution',
} as const

/// ////DAR Collection Utils///////////////////////////////////////////////////////////////////////////////////
export const isCollectionCanceled = (collection: DarCollection): boolean => {
  const { dars } = collection
  if (!dars) {
    return false
  }
  const darValues = Object.values(dars)
  return every(darValues, (dar: DataAccessRequest) => toLower(dar.data.status) === 'canceled')
}

/// ////DAR Collection Utils END/////////////////////////////////////////////////////////////////////////////////

export const goToPage = (
  value: number,
  pageCount: number,
  setCurrentPage: (page: number) => void,
): void => {
  if (value >= 1 && value <= pageCount) {
    setCurrentPage(value)
  }
}

export const findPropertyValue = (
  propName: string,
  researcher: DuosUser,
): string => {
  const props = researcher.properties
  const prop = isNil(props)
    ? null
    : find(props, (p: UserProperty) => p.propertyKey === propName)
  return isNil(prop) ? '' : prop.propertyValue
}

export const getPropertyValuesFromUser = (user: DuosUser): {
  institutionId: string
  suggestedInstitution: string
  selectedSigningOfficialId: string
  suggestedSigningOfficial: string
} => {
  const researcherProps = {
    institutionId: findPropertyValue(UserProperties.INSTITUTION_ID, user),
    suggestedInstitution: findPropertyValue(UserProperties.SUGGESTED_INSTITUTION, user),
    selectedSigningOfficialId: findPropertyValue(UserProperties.SELECTED_SIGNING_OFFICIAL_ID, user),
    suggestedSigningOfficial: findPropertyValue(UserProperties.SUGGESTED_SIGNING_OFFICIAL, user),
  }

  researcherProps.institutionId = user.institutionId?.toString() || ''
  return researcherProps
}

export const applyHoverEffects = (
  e: React.MouseEvent<HTMLElement>,
  style: Record<string, string>,
): void => {
  forEach(style, (value, key) => {
    (e.target as HTMLElement).style[key as never] = value
  })
}

// currently, dars contain a list of datasets (any length) and a list of length 1 of a datasetId
// go through the list of datasets and get the name of the dataset whose id is in the datasetId list
export const getNameOfDatasetForThisDAR = (
  datasets: Dataset[],
  datasetId: number[] | undefined,
): string => {
  const data = !isNil(datasetId) && !isEmpty(datasetId)
    ? find(datasets, (ds: Dataset) => ds.datasetId === first(datasetId)!)
    : null
  return isNil(data) ? '- -' : getDatasetNames([data])
}

export const formatDate = (dateval: number | string | null | undefined): string => {
  if (dateval === null || dateval === undefined) {
    return '- -'
  }

  if (toLower(dateval as string) === 'unsubmitted') {
    return dateval as string
  }

  const dateFormat = new Date(dateval)
  const year = dateFormat.getFullYear()
  const month = ('0' + (dateFormat.getMonth() + 1)).slice(-2)
  const day = ('0' + dateFormat.getDate()).slice(-2)
  return year + '-' + month + '-' + day
}

// Custom empty check needed on File
// lodash's isEmpty checks for enumerated keys, something a File does not have (ends up being an empty array)
// leads to incorrect evaluation of File
export const isFileEmpty = (file: File | null | undefined): boolean => {
  return isNil(file) || file.size < 1
}

export const isEmailAddress = (email: string): boolean => {
  const re = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)+$/
  return re.test(email)
}

export const USER_ROLES = {
  admin: 'Admin',
  chairperson: 'Chairperson',
  member: 'Member',
  researcher: 'Researcher',
  alumni: 'Alumni',
  signingOfficial: 'SigningOfficial',
  dataSubmitter: 'DataSubmitter',
  serviceAccount: 'ServiceAccount',
  all: 'All',
} as const

export const getDatasetNames = (
  datasets: Array<{ label?: string, name?: string }> | null | undefined,
): string => {
  if (!datasets) {
    return ''
  }
  const datasetNames = datasets.map((dataset) => {
    return (dataset.label) ? dataset.label : dataset.name
  })
  return datasetNames.join('\n')
}

// helper function to generate keys for rendered elements; splits on commas and whitespace
export const convertLabelToKey = (label = ''): string => {
  return label.split(/[\s,]+/).join('-')
}

/**
 * Sets the user's role status.
 * Converts a DuosUserResponse into a DuosUser.
 * @param {Partial<DuosUser>} user
 * @param {*} Storage
 * @returns converted DuosUser
 */
export const setUserRoleStatuses = (user: Partial<DuosUser> & { institution?: Partial<InstitutionInterface> }, Storage: { setCurrentUser: (user: DuosUser) => void }): DuosUser => {
  const currentUserRoles = (user.roles) ? user.roles.map(roles => roles.name) : []
  user.isChairPerson = currentUserRoles.includes(USER_ROLES.chairperson)
  user.isMember = currentUserRoles.includes(USER_ROLES.member)
  user.isAdmin = currentUserRoles.includes(USER_ROLES.admin)
  user.isResearcher = currentUserRoles.includes(USER_ROLES.researcher)
  user.isAlumni = currentUserRoles.includes(USER_ROLES.alumni)
  user.isSigningOfficial = currentUserRoles.includes(USER_ROLES.signingOfficial)
  user.isDataSubmitter = currentUserRoles.includes(USER_ROLES.dataSubmitter)
  Storage.setCurrentUser(user as DuosUser)
  return user as DuosUser
}

export const Navigation = {
  /**
   * This function is used to redirect the user to one of the following locations in order of priority:
   * - The redirectTo query parameter in the URL if it exists
   * - The first console tab that is rendered for the user if it exists
   * - The root path ("/") if no redirectTo or console tab is available
   *
   * @param user The user object to determine which console tabs are available
   * @param navigate The navigate object to use for navigation (optional)
   * @returns {Promise<void>}
   */
  console: async (user: DuosUser, navigate?: (path: string) => void): Promise<void> => {
    const queryParams = new URLSearchParams(globalThis.location.search)
    const redirectTo = queryParams?.get('redirectTo')
    const firstConsole = headerTabsConfig.find(config => config.isRendered(user))
    const page = redirectTo || (firstConsole ? firstConsole.link : '/')
    if (navigate) {
      navigate(page)
    }
    else {
      globalThis.location.href = page
    }
  },
}

export const download = (fileName: string, text: string): void => {
  const break_line = '\r\n \r\n'
  const fullText = break_line + text
  const blob = new Blob([fullText], { type: 'text/plain' })
  const url = globalThis.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName + '-restriction'
  a.click()
}

export const Notifications = {
  ...ToastNotifications,
}

/**
 * Serialize the execution of an array of promise functions
 *
 * See https://hackernoon.com/functional-javascript-resolving-promises-sequentially-7aac18c4431e
 * @param funcs List of functions that return a promise
 * @returns Array of promise results
 */
export const PromiseSerial = (funcs: Array<() => Promise<unknown>>): Promise<unknown[]> =>
  funcs.reduce((promise: Promise<unknown[]>, func: () => Promise<unknown>) =>
    promise.then((result: unknown[]) =>
      func().then((res: unknown) => [...result, res])),
  Promise.resolve([]))

//////////////////////////////////
// DAR CONSOLES UTILITY FUNCTIONS//
/////////////////////////////////

export const getElectionDate = (election: Election | null | undefined): string => {
  let formattedString = '- -'
  if (election) {
    // NOTE: some elections have a createDate attribute but not a lastUpdate attributes
    const targetDate = election.lastUpdate || election.createDate
    formattedString = formatDate(targetDate)
  }
  return formattedString
}

export const wasVoteSubmitted = (vote: Vote): boolean => {
  // NOTE: as mentioned elsewhere, legacy code has resulted in multiple sources for timestamps
  // current code will always provide lastUpdate
  const targetDate = vote.updateDate || vote.createDate
  return !isNil(targetDate)
}

export const wasFinalVoteTrue = (voteData: Vote): boolean => {
  const { type, vote } = voteData
  // vote status capitalizes final, election status does not
  return toLower(type) === 'final' && vote === true
}

export const processElectionStatus = (
  election: Election | null | undefined,
  votes: Vote[] | Record<number, Vote> | null | undefined,
  showVotes: boolean,
): string => {
  let output: string
  const electionStatus = isNil(get(election, 'status'))
    ? null
    : toLower(election!.status)
  const votesArray = Array.isArray(votes) ? votes : Object.values(votes ?? {})

  if (isNil(electionStatus)) {
    output = 'Unreviewed'
  }
  else if (electionStatus === 'open') {
    if (!isEmpty(votesArray) && !isNil(election)) {
      const dacVotes = filter(votesArray, (vote: Vote) => toLower(vote.type) === 'dac' && vote.electionId === election.electionId)
      const completedVotes = filter(dacVotes, wasVoteSubmitted).length
      const outputSuffix = `(${completedVotes} / ${dacVotes.length} votes)`
      output = `Open${showVotes ? outputSuffix : ''}`
    }
    else {
      output = 'Open'
    }
  }
  else if (electionStatus === 'final' || electionStatus === 'closed') {
    const finalVote = find(votesArray, wasFinalVoteTrue)
    output = finalVote ? 'Approved' : 'Denied'
  }
  else {
    output = capitalize(electionStatus)
  }
  return output
}

export const calcTablePageCount = <T>(tableSize: number, filteredList: T[]): number => {
  if (isEmpty(filteredList)) {
    return 1
  }
  return Math.ceil(filteredList.length / tableSize)
}

export const calcVisibleWindow = <T>(
  currentPage: number,
  tableSize: number,
  filteredList: T[],
): T[] => {
  if (!isEmpty(filteredList)) {
    const startIndex = (currentPage - 1) * tableSize
    const endIndex = currentPage * tableSize
    return filteredList.slice(startIndex, endIndex)
  }
  return []
}

interface ElectionData {
  election: Election
  dac: DacObject
  votes: Record<number, Vote>
  dar: DataAccessRequest
}

interface SearchFilterFunctions {
  dar: (term: string, targetList: ElectionData[]) => ElectionData[]
  libraryCard: (term: string, targetList: LibraryCard[]) => LibraryCard[]
  signingOfficialResearchers: (term: string, targetList: Researcher[]) => Researcher[]
  darCollections: (term: string, targetList: DarCollection[]) => DarCollection[]
  users: (term: string, targetList: DuosUser[]) => DuosUser[]
  datasets: (term: string, targetList: Dataset[]) => Dataset[]
  datasetTerms: (term: string, targetList: DatasetTerm[]) => DatasetTerm[]
  institutions: (term: string, targetList: InstitutionInterface[]) => InstitutionInterface[]
}

const getApprovalStatus = (
  dacApproval: boolean | null | undefined,
  defaultStatus: string,
): string => {
  if (isNil(dacApproval)) return defaultStatus
  return dacApproval ? 'accepted' : 'rejected'
}

const filterDar = (term: string, targetList: ElectionData[]): ElectionData[] => {
  return filter(targetList, (electionData: ElectionData) => {
    const { election, dac, votes, dar } = electionData
    const darData = dar?.data
    const targetDarAttrs = isNil(darData)
      ? []
      : JSON.stringify([
          toLower(darData.projectTitle || ''),
          toLower(darData.darCode || ''),
          toLower(getNameOfDatasetForThisDAR(
            (darData.datasets
              ? darData.datasets.map(ds => ({
                  datasetId: Number.parseInt(ds.key),
                  name: ds.label,
                  datasetName: ds.label,
                } as Dataset))
              : []),
            dar.datasetIds)),
        ])
    const targetDacAttrs = isNil(dac) ? [] : JSON.stringify([toLower(dac.name || dac.dacName || '')])
    const targetElectionAttrs = isNil(election)
      ? []
      : JSON.stringify([
          toLower(processElectionStatus(election, votes, false)),
          getElectionDate(election),
        ])
    return (
      includes(targetDarAttrs as string, term)
      || includes(targetDacAttrs as string, term)
      || includes(targetElectionAttrs as string, term)
    )
  })
}

const filterLibraryCard = (term: string, targetList: LibraryCard[]): LibraryCard[] => {
  return filter(targetList, (libraryCard: LibraryCard) => {
    const { userName, createDate, userEmail } = libraryCard
    return (
      includes(toLower(userName), term)
      || includes(formatDate(createDate as unknown as number), term)
      || includes(toLower(userEmail), term)
    )
  })
}

const filterSigningOfficialResearchers = (term: string, targetList: Researcher[]): Researcher[] => {
  return filter(targetList, (researcher: Researcher) => {
    const { displayName, eraCommonsId, email } = researcher
    const roles = researcher.roles || []
    const baseAttributes = [displayName, eraCommonsId || '', email]
    const includesRoles = roles.reduce((memo, current) => {
      const roleName = current.name
      return memo || includes(toLower(roleName), term)
    }, false)
    const includesBaseAttributes = baseAttributes.reduce((memo, current) => {
      return memo || includes(toLower(current), term)
    }, false)
    return includesRoles || includesBaseAttributes
  })
}

const filterDarCollections = (term: string, targetList: DarCollection[]): DarCollection[] => {
  if (isEmpty(term)) return targetList
  return filter(targetList, (collection: DarCollection) => {
    const { darCode, createDate, updateDate } = collection
    const datasetCount = collection.datasets?.length || 0
    const formattedCreateDate = formatDate(createDate)
    const formattedUpdateDate = formatDate(updateDate)
    const searchableValues = [
      darCode,
      String(datasetCount),
      formattedCreateDate,
      formattedUpdateDate,
    ]
    const termArr = term.split(' ')
    return searchableValues.some(value =>
      termArr.some(t => includes(toLower(String(value)), toLower(t))),
    )
  })
}

const filterUsers = (term: string, targetList: DuosUser[]): DuosUser[] => {
  const lowerCaseTerm = toLower(term)
  const isMatch = (userField: string) => includes(toLower(userField), lowerCaseTerm)
  return filter(targetList, (user: DuosUser) => {
    const { displayName, email, roles, institution, libraryCard } = user
    const matchable: string[] = [displayName, email]
    if (!isNil(roles)) {
      matchable.push(...map(roles, (r: UserRole) => r.name))
    }
    if (!isNil(institution)) {
      matchable.push(institution.name)
    }
    if (!isNil(libraryCard)) {
      const hasLibraryCard = !isNil(libraryCard)
      if (hasLibraryCard) {
        matchable.push('LibraryCard')
      }
    }
    const match = find(matchable, isMatch)
    return !isNil(match)
  })
}

const filterDatasets = (term: string, targetList: Dataset[]): Dataset[] => {
  const loweredTerm = toLower(term)
  return filter(targetList, (dataset: Dataset) => {
    const name = dataset.name || dataset.datasetName
    const alias = dataset.alias
    const identifier = dataset.datasetIdentifier
    const allPropValues = dataset.properties?.map(p => p.propertyValue).join('')
    const status = getApprovalStatus(dataset.dacApproval, 'yes no')
    const studyName = dataset.study?.name
    const phsId = dataset.study?.description
    const dataUseStr = dataset.dataUse ? JSON.stringify(dataset.dataUse) : ''
    return (
      includes(toLower(alias?.toString() || ''), loweredTerm)
      || includes(toLower(name || ''), loweredTerm)
      || includes(toLower(identifier), loweredTerm)
      || includes(toLower(allPropValues || ''), loweredTerm)
      || includes(toLower(status), loweredTerm)
      || includes(toLower(studyName || ''), loweredTerm)
      || includes(toLower(phsId || ''), loweredTerm)
      || includes(toLower(dataUseStr), loweredTerm)
    )
  })
}

const filterDatasetTerms = (term: string, targetList: DatasetTerm[]): DatasetTerm[] => {
  const loweredTerm = toLower(term)
  return filter(targetList, (datasetTerm: DatasetTerm) => {
    const status = getApprovalStatus(datasetTerm.dacApproval, 'pending')
    const primaryCodes = datasetTerm.dataUse?.primary?.map(du => du.code) || []
    const secondaryCodes = datasetTerm.dataUse?.secondary?.map(du => du.code) || []
    const codes = join(concat(primaryCodes, secondaryCodes), ', ')
    const dataTypes = join(datasetTerm.study?.dataTypes || [], ', ')
    const custodians = join(datasetTerm.study?.dataCustodianEmail || [], ', ')
    const dataSubmitterEmail = datasetTerm.study?.dataSubmitterEmail || ''
    return (
      includes(toLower(datasetTerm.datasetName), loweredTerm)
      || includes(toLower(datasetTerm.datasetIdentifier), loweredTerm)
      || includes(toLower(datasetTerm.dac?.dacName || ''), loweredTerm)
      || includes(toLower(datasetTerm.dac?.dacEmail || ''), loweredTerm)
      || includes(toLower(datasetTerm.dataLocation), loweredTerm)
      || includes(toLower(codes as string), loweredTerm)
      || includes(toLower(datasetTerm.createUserDisplayName), loweredTerm)
      || includes(toLower(datasetTerm.url), loweredTerm)
      || includes(toLower(datasetTerm.study?.description || ''), loweredTerm)
      || includes(toLower(dataSubmitterEmail), loweredTerm)
      || includes(toLower(dataTypes as string), loweredTerm)
      || includes(toLower(custodians as string), loweredTerm)
      || includes(toLower(datasetTerm.study?.species || ''), loweredTerm)
      || includes(toLower(datasetTerm.study?.piName || ''), loweredTerm)
      || includes(toLower(datasetTerm.study?.studyName || ''), loweredTerm)
      || includes(toLower(status), loweredTerm)
    )
  })
}

const filterInstitutions = (term: string, targetList: InstitutionInterface[]): InstitutionInterface[] => {
  const loweredTerm = toLower(term)
  return filter(targetList, (institution: InstitutionInterface) => {
    const soStrings = institution.signingOfficials
      ?.map((so) => {
        return so.displayName + ' ' + so.email
      })
      .join(' ')
    const domains = (institution.domains || []).join(' ')
    return (
      includes(toLower(institution.name), loweredTerm)
      || includes(toLower(institution.id?.toString() || ''), loweredTerm)
      || includes(toLower(institution.itDirectorName || ''), loweredTerm)
      || includes(toLower(institution.itDirectorEmail || ''), loweredTerm)
      || includes(toLower(institution.institutionUrl || ''), loweredTerm)
      || includes(toLower(institution.dunsNumber?.toString() || ''), loweredTerm)
      || includes(toLower(institution.orgChartUrl || ''), loweredTerm)
      || includes(toLower(institution.verificationUrl || ''), loweredTerm)
      || includes(toLower(institution.verificationFilename || ''), loweredTerm)
      || includes(toLower(institution.organizationType || ''), loweredTerm)
      || includes(toLower(institution.createUser?.displayName || ''), loweredTerm)
      || includes(toLower(institution.createUser?.email || ''), loweredTerm)
      || includes(toLower(institution.updateUser?.displayName || ''), loweredTerm)
      || includes(toLower(institution.updateUser?.email || ''), loweredTerm)
      || includes(toLower(institution.updateDate?.toString() || ''), loweredTerm)
      || includes(toLower(institution.createDate), loweredTerm)
      || includes(toLower(domains), loweredTerm)
      || includes(toLower(soStrings || ''), loweredTerm)
    )
  })
}

export const getSearchFilterFunctions = (): SearchFilterFunctions => {
  return {
    dar: filterDar,
    libraryCard: filterLibraryCard,
    signingOfficialResearchers: filterSigningOfficialResearchers,
    darCollections: filterDarCollections,
    users: filterUsers,
    datasets: filterDatasets,
    datasetTerms: filterDatasetTerms,
    institutions: filterInstitutions,
  }
}

type ListTypeForModel<T extends keyof SearchFilterFunctions>
  = T extends 'dar' ? ElectionData[]
    : T extends 'libraryCard' ? LibraryCard[]
      : T extends 'signingOfficialResearchers' ? Researcher[]
        : T extends 'darCollections' ? DarCollection[]
          : T extends 'users' ? DuosUser[]
            : T extends 'datasets' ? Dataset[]
              : T extends 'datasetTerms' ? DatasetTerm[]
                : T extends 'institutions' ? InstitutionInterface[]
                  : unknown[]

export const tableSearchHandler = <T extends keyof SearchFilterFunctions>(
  list: ListTypeForModel<T>,
  setFilteredList: (list: ListTypeForModel<T>) => void,
  setCurrentPage: (page: number) => void,
  modelName: T,
) => {
  const filterFnMap = getSearchFilterFunctions()
  return (searchTerms: string | { current: { value: string } } | RefObject<HTMLInputElement>) => {
    let rawSearchTerms: unknown
    if (typeof searchTerms === 'string') {
      rawSearchTerms = searchTerms
    }
    else if ('current' in searchTerms && searchTerms.current) {
      rawSearchTerms = (searchTerms as RefObject<HTMLInputElement>).current?.value
    }
    else {
      rawSearchTerms = ''
    }
    const searchTermValues = toLower(rawSearchTerms as string).split(/\s|,/) // remains unchanged
    if (isEmpty(searchTermValues)) {
      setFilteredList(list)
    }
    else {
      let newFilteredList: ListTypeForModel<T> = cloneDeep(list)
      forEach(searchTermValues, (splitTerm: string) => {
        const term = splitTerm.trim()
        if (!isEmpty(term)) {
          const filterFn = filterFnMap[modelName] as unknown as (term: string, list: ListTypeForModel<T>) => ListTypeForModel<T>
          newFilteredList = filterFn(term, newFilteredList)
        }
      })
      setFilteredList(newFilteredList)
    }
    setCurrentPage(1)
  }
}

type OntologyOption = {
  key: string
  value: string
  label: string
  item?: unknown
  id?: string
}

type OntologyTermOption = {
  displayText: string
  id: string
}

type OntologyTermEntry = {
  displayText: string
  id: string
  key?: string
  value?: string
  label?: string
}

export const searchOntologies = (
  query: string,
  callback: (options: OntologyOption[]) => void,
): void => {
  let options: OntologyOption[] = []
  DAR.getAutoCompleteOT(query).then(
    (items: unknown[]) => {
      options = items.map(function (item) {
        const typedItem = item as { id: string, label: string }
        return {
          key: typedItem.id,
          value: typedItem.id,
          label: typedItem.label,
          item: item,
        }
      })
      if (isEmpty(options)) {
        options = [{ key: query, value: query, label: query, id: query }]
      }
      callback(options)
    })
}

export const searchOntologyTerm = async (
  query: string,
  callback: (options: OntologyTermOption[]) => void,
): Promise<void> => {
  let options: OntologyTermOption[] = []
  DAR.getAutoCompleteOT([query]).then(
    (items: unknown[]) => {
      options = items.map(function (item) {
        const typedItem = item as { label: string, id: string }
        return { displayText: typedItem.label, id: typedItem.id }
      })
      if (isEmpty(options)) {
        options = [{ displayText: query, id: query }]
      }
      callback(options)
    })
}

export const findOntologyTerms = async (
  ids: string[],
): Promise<OntologyTermEntry[]> => {
  const urls = ids.filter(id => id.startsWith('http'))
  const nonUrls = ids.filter(id => !id.startsWith('http'))
  const items = await DAR.searchOntologyIdList(urls)
  const foundEntries: OntologyTermEntry[] = items.map(function (item: unknown) {
    const typedItem = item as { label: string, id: string }
    return { displayText: typedItem.label, id: typedItem.id }
  })

  for (const entry of nonUrls) {
    foundEntries.push({ displayText: entry, key: entry, value: entry, label: entry, id: entry })
  }
  return foundEntries
}

export const setStyle = (
  disabled: boolean,
  baseStyle: Record<string, unknown>,
  targetColorAttribute: string,
): Record<string, unknown> => {
  const appliedStyle = disabled ? { [targetColorAttribute]: Theme.palette.disabled } : {}
  return Object.assign(baseStyle, appliedStyle)
}

interface DivAttributes {
  'onClick'?: () => void
  'onMouseEnter'?: () => void
  'onMouseLeave'?: () => void
  'style'?: Record<string, string>
  'data-tip'?: string
  'id'?: string
  'disabled'?: boolean
}

export const setDivAttributes = (
  disabled: boolean,
  onClick?: () => void,
  style?: Record<string, string>,
  dataTip?: string,
  onMouseEnter?: () => void,
  onMouseLeave?: () => void,
  id?: string,
): DivAttributes => {
  let attributes: DivAttributes
  if (disabled) {
    attributes = { style, disabled, 'data-tip': dataTip }
  }
  else {
    attributes = { onClick, onMouseEnter, onMouseLeave, style, 'data-tip': dataTip, id }
  }
  if (!isEmpty(dataTip)) {
    attributes['data-tip'] = dataTip
  }
  return attributes
}

export interface TableCell {
  data: unknown
  value?: string | number | boolean
  cellStyle?: Record<string, unknown>
  label?: string
  id?: number
  [key: string]: unknown
}

interface SortConfig {
  colIndex: number
  dir: number
}

const compareTableCellValues = (aVal: unknown, bVal: unknown, dir: number): number => {
  const hasType = (val: unknown): val is { type: string } =>
    typeof val === 'object' && val !== null && 'type' in val

  // Handle string comparison
  if (typeof aVal === 'string' && typeof bVal === 'string') {
    return aVal.localeCompare(bVal, 'en', { sensitivity: 'base', numeric: true }) * dir
  }

  // Handle number comparison
  if (typeof aVal === 'number' && typeof bVal === 'number') {
    return (aVal > bVal ? -1 : 1) * dir
  }

  // Handle boolean comparison
  if (typeof aVal === 'boolean' && typeof bVal === 'boolean') {
    return (aVal > bVal ? -1 : 1) * dir
  }

  // Handle nil or 'div' type
  if (
    isNil(aVal) || isNil(bVal)
    || (hasType(aVal) && aVal.type === 'div')
    || (hasType(bVal) && bVal.type === 'div')
  ) {
    return (Number(aVal) > Number(bVal) ? -1 : 1) * dir
  }

  // Fallback to number comparison
  return (Number(aVal) > Number(bVal) ? -1 : 1) * dir
}

// each item in the list is an array of metadata representing a single table row
// the metadata for each cell needs a data (exactly what is displayed in the table)
// or value (string or number alternative) property which determines sorting
export const sortVisibleTable = <T extends TableCell = TableCell>({
  list,
  sort,
}: {
  list: T[][] | undefined
  sort: SortConfig | undefined
}): T[][] => {
  if (!list?.length || !sort?.colIndex) {
    return list ?? []
  }
  list.sort((a, b) => {
    const aVal = a[sort.colIndex].value ?? a[sort.colIndex].data
    const bVal = b[sort.colIndex].value ?? b[sort.colIndex].data
    return compareTableCellValues(aVal, bVal, sort.dir)
  })
  return list
}

interface RecalculateTableParams<T = unknown> {
  tableSize: number
  pageCount: number
  filteredList: T[]
  currentPage: number
  setPageCount: (count: number) => void
  setCurrentPage: (page: number) => void
  setVisibleList: (list: T[]) => void
  sort?: SortConfig
}

// Functions that are commonly used between tables//
export const recalculateVisibleTable = async <T = unknown>({
  tableSize,
  pageCount,
  filteredList,
  currentPage,
  setPageCount,
  setCurrentPage,
  setVisibleList,
  sort,
}: RecalculateTableParams<T>): Promise<void> => {
  try {
    let sortedList = filteredList
    // Sort data before applying paging
    if (sort) {
      const sorted = sortVisibleTable({ list: filteredList as unknown as TableCell[][], sort })
      if (sorted) {
        sortedList = sorted as unknown as T[]
      }
    }

    // Set paging variables and truncate the list
    setPageCount(calcTablePageCount(tableSize, sortedList))
    if (currentPage > pageCount) {
      setCurrentPage(pageCount)
    }
    const visibleList = calcVisibleWindow(currentPage, tableSize, sortedList)
    setVisibleList(visibleList)
  }
  catch (error) {
    Notifications.showError({ text: 'Error updating table' })
    console.error('Error updating table:', error)
  }
}

export const searchOnFilteredList = <T = unknown>(
  searchTerms: string,
  originalList: T[] | null | undefined,
  filterFn: (term: string, list: T[]) => T[],
  setFilteredList: (list: T[]) => void,
): void => {
  let searchList = (isNil(originalList) ? [] : [...originalList])
  if (!isEmpty(searchTerms)) {
    const terms = searchTerms.split(' ')
    forEach(terms, (term: string) => {
      searchList = filterFn(term, searchList)
    })
  }
  setFilteredList(searchList)
}

export const hasDataSubmitterRole = (user: DuosUser): boolean => {
  const roles = get(user, 'roles')
  const dsRole = find(roles, { roleId: 8 })
  return !isNil(dsRole)
}

export const partition = <T>(array: T[], size: number): T[][] => {
  const result: T[][] = []
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size))
  }
  return result
}
