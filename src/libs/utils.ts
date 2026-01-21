import { forEach as lodashForEach } from 'lodash'
import { DAR } from './ajax/DAR'
import { Theme } from './theme'
import { RefObject } from 'react'
import {
  capitalize,
  cloneDeep,
  concat,
  every,
  filter,
  find,
  first,
  forEach as lodashFPForEach,
  get,
  includes,
  isEmpty,
  isNil,
  join,
  map,
  toLower,
} from 'lodash/fp'
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
  const darValues = Object.values(dars) as DataAccessRequest[]
  return every((dar: DataAccessRequest) => toLower(dar.data.status) === 'canceled')(darValues)
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
    : find((p: UserProperty) => p.propertyKey === propName)(props)
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
  lodashForEach(style, (value, key) => {
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
    ? find((ds: Dataset) => ds.datasetId === first(datasetId)!)(datasets)
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
  user.isChairPerson = currentUserRoles.indexOf(USER_ROLES.chairperson) > -1
  user.isMember = currentUserRoles.indexOf(USER_ROLES.member) > -1
  user.isAdmin = currentUserRoles.indexOf(USER_ROLES.admin) > -1
  user.isResearcher = currentUserRoles.indexOf(USER_ROLES.researcher) > -1
  user.isAlumni = currentUserRoles.indexOf(USER_ROLES.alumni) > -1
  user.isSigningOfficial = currentUserRoles.indexOf(USER_ROLES.signingOfficial) > -1
  user.isDataSubmitter = currentUserRoles.indexOf(USER_ROLES.dataSubmitter) > -1
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
  console: async (user: DuosUser, navigate?: (path: string) => void) => {
    const queryParams = new URLSearchParams(window.location.search)
    const redirectTo = queryParams?.get('redirectTo')
    const firstConsole = headerTabsConfig.find(config => config.isRendered(user))
    const page = redirectTo || (firstConsole ? firstConsole.link : '/')
    if (navigate) {
      navigate(page)
    }
    else {
      window.location.href = page
    }
  },
}

export const download = (fileName: string, text: string): void => {
  const break_line = '\r\n \r\n'
  const fullText = break_line + text
  const blob = new Blob([fullText], { type: 'text/plain' })
  const url = window.URL.createObjectURL(blob)
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
  const electionStatus = !isNil(get('status')(election))
    ? toLower(election!.status)
    : null
  const votesArray = Array.isArray(votes) ? votes : votes ? Object.values(votes) : []

  if (isNil(electionStatus)) {
    output = 'Unreviewed'
  }
  else if (electionStatus === 'open') {
    // Null check since react doesn't necessarily perform prop updates immediately
    if (!isEmpty(votesArray) && !isNil(election)) {
      const dacVotes = filter(
        (vote: Vote) => toLower(vote.type) === 'dac' && vote.electionId === election.electionId,
      )(votesArray)
      const completedVotes = filter(wasVoteSubmitted)(dacVotes).length
      const outputSuffix = `(${completedVotes} / ${dacVotes.length} votes)`
      output = `Open${showVotes ? outputSuffix : ''}`
    }
    else {
      output = 'Open'
    }
  }
  else if (electionStatus === 'final' || electionStatus === 'closed') {
    // some elections have electionStatus === Final, others have electionStatus === Closed
    // both are, in this step of the process, technically referring to a closed election
    // therefore both values must be checked for
    const finalVote = find(wasFinalVoteTrue)(votesArray)
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

export const getSearchFilterFunctions = (): SearchFilterFunctions => {
  return {
    dar: (term, targetList) => filter((electionData: ElectionData) => {
      const { election, dac, votes, dar } = electionData
      const darData = dar?.data
      const targetDarAttrs = !isNil(darData)
        ? JSON.stringify([
            toLower(darData.projectTitle || ''),
            toLower(darData.darCode || ''),
            toLower(getNameOfDatasetForThisDAR(darData.datasets?.map(ds => ({
              datasetId: parseInt(ds.key),
              name: ds.label,
              datasetName: ds.label,
            } as Dataset)) || [], dar.datasetIds)),
          ])
        : []
      const targetDacAttrs = !isNil(dac) ? JSON.stringify([toLower(dac.name || dac.dacName || '')]) : []
      const targetElectionAttrs = !isNil(election)
        ? JSON.stringify([
            toLower(processElectionStatus(election, votes, false)),
            getElectionDate(election),
          ])
        : []
      return (
        includes(term, targetDarAttrs as string)
        || includes(term, targetDacAttrs as string)
        || includes(term, targetElectionAttrs as string)
      )
    }, targetList),

    libraryCard: (term, targetList) =>
      filter((libraryCard: LibraryCard) => {
        const { userName, createDate, userEmail } = libraryCard
        return (
          includes(term, toLower(userName))
          || includes(term, formatDate(createDate as unknown as number))
          || includes(term, toLower(userEmail))
        )
      }, targetList),

    signingOfficialResearchers: (term, targetList) =>
      filter((researcher: Researcher) => {
        const { displayName, eraCommonsId, email } = researcher
        const roles = researcher.roles || []
        const baseAttributes = [displayName, eraCommonsId || '', email]
        const includesRoles = roles.reduce((memo, current) => {
          const roleName = current.name
          return memo || includes(term, toLower(roleName))
        }, false)

        const includesBaseAttributes = baseAttributes.reduce((memo, current) => {
          return memo || includes(term, toLower(current))
        }, false)

        return includesRoles || includesBaseAttributes
      }, targetList),

    darCollections: (term, targetList) =>
      isEmpty(term)
        ? targetList
        : filter((collection: DarCollection) => {
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
              termArr.some(t => includes(toLower(t), toLower(String(value)))),
            )
          }, targetList),

    users: (term, targetList) => {
      const lowerCaseTerm = toLower(term)
      const isMatch = (userField: string) => includes(lowerCaseTerm, toLower(userField))

      return filter((user: DuosUser) => {
        const { displayName, email, roles, institution, libraryCard } = user

        const matchable: string[] = [displayName, email]
        if (!isNil(roles)) {
          matchable.push(...map((r: UserRole) => r.name)(roles))
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

        const match = find(isMatch)(matchable)
        return !isNil(match)
      }, targetList)
    },

    datasets: (term, targetList) =>
      filter((dataset: Dataset) => {
        /**
         * This filter function assumes that the dataset has been
         * pre-populated with data use codes and translations
         */
        const loweredTerm = toLower(term)
        const name = dataset.name || dataset.datasetName
        const alias = dataset.alias
        const identifier = dataset.datasetIdentifier
        const allPropValues = dataset.properties?.map(p => p.propertyValue).join('')
        // Approval status
        const status = !isNil(dataset.dacApproval)
          ? dataset.dacApproval
            ? 'accepted'
            : 'rejected'
          : 'yes no'
        const studyName = dataset.study?.name
        const phsId = dataset.study?.description
        const dataUseStr = dataset.dataUse ? JSON.stringify(dataset.dataUse) : ''
        return (
          includes(loweredTerm, toLower(alias?.toString() || ''))
          || includes(loweredTerm, toLower(name || ''))
          || includes(loweredTerm, toLower(identifier))
          || includes(loweredTerm, toLower(allPropValues || ''))
          || includes(loweredTerm, toLower(status))
          || includes(loweredTerm, toLower(studyName || ''))
          || includes(loweredTerm, toLower(phsId || ''))
          || includes(loweredTerm, toLower(dataUseStr))
        )
      }, targetList),

    datasetTerms: (term, targetList) =>
      filter((datasetTerm: DatasetTerm) => {
        /**
         * This filter function is intended for Dataset Index Terms
         */
        const loweredTerm = toLower(term)
        // Approval status
        const status = !isNil(datasetTerm.dacApproval)
          ? datasetTerm.dacApproval
            ? 'accepted'
            : 'rejected'
          : 'pending'
        const primaryCodes = datasetTerm.dataUse?.primary?.map(du => du.code) || []
        const secondaryCodes = datasetTerm.dataUse?.secondary?.map(du => du.code) || []
        const codes = join(', ')(concat(primaryCodes)(secondaryCodes))
        const dataTypes = join(', ')(datasetTerm.study?.dataTypes || [])
        const custodians = join(', ')(datasetTerm.study?.dataCustodianEmail || [])
        const dataSubmitterEmail = datasetTerm.study?.dataSubmitterEmail || ''
        return (
          includes(loweredTerm, toLower(datasetTerm.datasetName))
          || includes(loweredTerm, toLower(datasetTerm.datasetIdentifier))
          || includes(loweredTerm, toLower(datasetTerm.dac?.dacName || ''))
          || includes(loweredTerm, toLower(datasetTerm.dac?.dacEmail || ''))
          || includes(loweredTerm, toLower(datasetTerm.dataLocation))
          || includes(loweredTerm, toLower(codes as string))
          || includes(loweredTerm, toLower(datasetTerm.createUserDisplayName))
          || includes(loweredTerm, toLower(datasetTerm.url))
          || includes(loweredTerm, toLower(datasetTerm.study?.description || ''))
          || includes(loweredTerm, toLower(dataSubmitterEmail))
          || includes(loweredTerm, toLower(dataTypes as string))
          || includes(loweredTerm, toLower(custodians as string))
          || includes(loweredTerm, toLower(datasetTerm.study?.species || ''))
          || includes(loweredTerm, toLower(datasetTerm.study?.piName || ''))
          || includes(loweredTerm, toLower(datasetTerm.study?.studyName || ''))
          || includes(loweredTerm, toLower(status))
        )
      }, targetList),

    institutions: (term, targetList) =>
      filter((institution: InstitutionInterface) => {
        const loweredTerm = toLower(term)
        const soStrings = institution.signingOfficials
          ?.map((so) => {
            return so.displayName + ' ' + so.email
          })
          .join(' ')
        const domains = institution.domains?.join(' ') || ''
        return (
          includes(loweredTerm, toLower(institution.name))
          || includes(loweredTerm, toLower(institution.id?.toString() || ''))
          || includes(loweredTerm, toLower(institution.itDirectorName || ''))
          || includes(loweredTerm, toLower(institution.itDirectorEmail || ''))
          || includes(loweredTerm, toLower(institution.institutionUrl || ''))
          || includes(loweredTerm, toLower(institution.dunsNumber?.toString() || ''))
          || includes(loweredTerm, toLower(institution.orgChartUrl || ''))
          || includes(loweredTerm, toLower(institution.verificationUrl || ''))
          || includes(loweredTerm, toLower(institution.verificationFilename || ''))
          || includes(loweredTerm, toLower(institution.organizationType || ''))
          || includes(loweredTerm, toLower(institution.createUser?.displayName || ''))
          || includes(loweredTerm, toLower(institution.createUser?.email || ''))
          || includes(loweredTerm, toLower(institution.updateUser?.displayName || ''))
          || includes(loweredTerm, toLower(institution.updateUser?.email || ''))
          || includes(loweredTerm, toLower(institution.updateDate?.toString() || ''))
          || includes(loweredTerm, toLower(institution.createDate))
          || includes(loweredTerm, toLower(domains))
          || includes(loweredTerm, toLower(soStrings || ''))
        )
      }, targetList),
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
    const searchTermValues = toLower(rawSearchTerms as string).split(/\s|,/)
    if (isEmpty(searchTermValues)) {
      setFilteredList(list)
    }
    else {
      let newFilteredList: ListTypeForModel<T> = cloneDeep(list)
      lodashFPForEach((splitTerm: string) => {
        const term = splitTerm.trim()
        if (!isEmpty(term)) {
          const filterFn = filterFnMap[modelName] as unknown as (term: string, list: ListTypeForModel<T>) => ListTypeForModel<T>
          newFilteredList = filterFn(term, newFilteredList)
        }
      })(searchTermValues)
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
  try {
    return Object.assign(baseStyle, appliedStyle)
  }
  catch (_e) {
    return baseStyle
  }
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
  if (!disabled) {
    attributes = { onClick, onMouseEnter, onMouseLeave, style, 'data-tip': dataTip, id }
  }
  else {
    attributes = { style, disabled, 'data-tip': dataTip }
  }
  if (!isEmpty(dataTip)) {
    attributes['data-tip'] = dataTip
  }
  return attributes
}

interface TableCell {
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
  if (!list || !sort || sort.colIndex === undefined) {
    return list ?? []
  }
  // Sort: { dir, colIndex }
  // Mutate the original array in place and return it
  list.sort((a, b) => {
    const aVal = a[sort.colIndex].value ?? a[sort.colIndex].data
    const bVal = b[sort.colIndex].value ?? b[sort.colIndex].data

    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return (aVal > bVal ? -1 : 1) * sort.dir
    }
    if (typeof aVal === 'boolean' && typeof bVal === 'boolean') {
      return (aVal > bVal ? -1 : 1) * sort.dir
    }
    const hasType = (val: unknown): val is { type: string } =>
      typeof val === 'object' && val !== null && 'type' in val
    if (isNil(aVal) || isNil(bVal) || (hasType(aVal) && aVal.type === 'div') || (hasType(bVal) && bVal.type === 'div')) {
      return (Number(aVal) > Number(bVal) ? -1 : 1) * sort.dir
    }
    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return aVal.localeCompare(bVal, 'en', { sensitivity: 'base', numeric: true }) * sort.dir
    }
    return (Number(aVal) > Number(bVal) ? -1 : 1) * sort.dir
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
  catch (_error) {
    Notifications.showError({ text: 'Error updating table' })
  }
}

export const searchOnFilteredList = <T = unknown>(
  searchTerms: string,
  originalList: T[] | null | undefined,
  filterFn: (term: string, list: T[]) => T[],
  setFilteredList: (list: T[]) => void,
): void => {
  let searchList = (!isNil(originalList) ? [...originalList] : [])
  if (!isEmpty(searchTerms)) {
    const terms = searchTerms.split(' ')
    lodashFPForEach((term: string) => {
      searchList = filterFn(term, searchList)
    })(terms)
  }
  setFilteredList(searchList)
}

export const hasDataSubmitterRole = (user: DuosUser): boolean => {
  const roles = get('roles')(user)
  const dsRole = find({ roleId: 8 })(roles)
  return !isNil(dsRole)
}

export const partition = <T>(array: T[], size: number): T[][] => {
  const result: T[][] = []
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size))
  }
  return result
}
