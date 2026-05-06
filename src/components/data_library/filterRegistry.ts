import { QueryClause } from 'src/types/elastic'
import {
  AvailableFilters,
  AssetType,
  FilterKey,
  FilterState,
  LibraryFilterSection,
  LibraryFilterSectionControl,
} from 'src/types/library'
import { assetFilterRegistry } from 'src/libs/dataLibraryFilterConfig'

type ArrayFilterKey
  = | 'accessManagement'
    | 'dataUse'
    | 'dataType'
    | 'dac'
    | 'workspaceTools'
    | 'workspacePlatform'
    | 'clinicalTrialStatus'
    | 'clinicalTrialPhase'
    | 'clinicalTrialInterventionType'
    | 'clinicalTrialRegistry'
    | 'biospecimenType'
    | 'biospecimenDataUse'
    | 'biospecimenPostMortemIntervalUnit'

const ARRAY_FILTER_KEYS: ArrayFilterKey[] = [
  'accessManagement',
  'dataUse',
  'dataType',
  'dac',
  'workspaceTools',
  'workspacePlatform',
  'clinicalTrialStatus',
  'clinicalTrialPhase',
  'clinicalTrialInterventionType',
  'clinicalTrialRegistry',
  'biospecimenType',
  'biospecimenDataUse',
  'biospecimenPostMortemIntervalUnit',
]

const OBJECT_FILTER_KEYS: Array<
  | 'participantCount'
  | 'biospecimenPostMortemInterval'
  | 'clinicalTrialDates'
  | 'biospecimenCollectionDate'
  | 'ipFiledDate'
  | 'fundingDate'
> = [
  'participantCount',
  'biospecimenPostMortemInterval',
  'clinicalTrialDates',
  'biospecimenCollectionDate',
  'ipFiledDate',
  'fundingDate',
]

const BOOL_FILTER_KEYS: Array<'datasetsCited'> = ['datasetsCited']

const FILTER_CONTROL_BY_KEY: Record<FilterKey, LibraryFilterSectionControl> = {
  accessManagement: 'checkbox',
  dataUse: 'checkbox',
  dataType: 'checkbox',
  dac: 'checkbox',
  workspaceTools: 'checkbox',
  workspacePlatform: 'checkbox',
  clinicalTrialStatus: 'checkbox',
  clinicalTrialPhase: 'checkbox',
  clinicalTrialInterventionType: 'checkbox',
  clinicalTrialRegistry: 'checkbox',
  biospecimenType: 'checkbox',
  biospecimenDataUse: 'checkbox',
  biospecimenPostMortemIntervalUnit: 'checkbox',
  datasetsCited: 'boolean',
  participantCount: 'range',
  biospecimenPostMortemInterval: 'range',
  clinicalTrialDates: 'dateRange',
  biospecimenCollectionDate: 'dateRange',
  ipFiledDate: 'dateRange',
  fundingDate: 'dateRange',
}

export const EMPTY_FILTERS: FilterState = {
  accessManagement: [],
  dataUse: [],
  dataType: [],
  dac: [],
  workspaceTools: [],
  workspacePlatform: [],
  clinicalTrialStatus: [],
  clinicalTrialPhase: [],
  clinicalTrialInterventionType: [],
  clinicalTrialRegistry: [],
  clinicalTrialDates: {},
  biospecimenType: [],
  biospecimenDataUse: [],
  biospecimenPostMortemIntervalUnit: [],
  biospecimenPostMortemInterval: {},
  biospecimenCollectionDate: {},
  datasetsCited: undefined,
  participantCount: {},
  ipFiledDate: {},
  fundingDate: {},
}

const clearInvisibleObjectFilters = (visible: Set<FilterKey>, filters: FilterState): Pick<
  FilterState,
  'participantCount' | 'biospecimenPostMortemInterval' | 'clinicalTrialDates' | 'biospecimenCollectionDate' | 'ipFiledDate' | 'fundingDate'
> => ({
  participantCount: visible.has('participantCount') ? { ...filters.participantCount } : {},
  biospecimenPostMortemInterval: visible.has('biospecimenPostMortemInterval') ? { ...filters.biospecimenPostMortemInterval } : {},
  clinicalTrialDates: visible.has('clinicalTrialDates') ? { ...filters.clinicalTrialDates } : {},
  biospecimenCollectionDate: visible.has('biospecimenCollectionDate') ? { ...filters.biospecimenCollectionDate } : {},
  ipFiledDate: visible.has('ipFiledDate') ? { ...filters.ipFiledDate } : {},
  fundingDate: visible.has('fundingDate') ? { ...filters.fundingDate } : {},
})

const getFilterOptions = (key: FilterKey, availableFilters: AvailableFilters) => {
  switch (key) {
    case 'accessManagement':
    case 'dataUse':
    case 'dataType':
    case 'dac':
    case 'workspaceTools':
    case 'workspacePlatform':
    case 'clinicalTrialStatus':
    case 'clinicalTrialPhase':
    case 'clinicalTrialInterventionType':
    case 'clinicalTrialRegistry':
    case 'biospecimenType':
    case 'biospecimenDataUse':
    case 'biospecimenPostMortemIntervalUnit':
    case 'datasetsCited':
      return availableFilters[key]
    default:
      return undefined
  }
}

const getFilterRange = (key: FilterKey, availableFilters: AvailableFilters) => {
  switch (key) {
    case 'participantCount':
      return availableFilters.participantCountRange
    case 'biospecimenPostMortemInterval':
      return availableFilters.biospecimenPostMortemIntervalRange
    default:
      return undefined
  }
}

interface FilterDefinition {
  label: string
  buildClause: (filters: FilterState) => QueryClause | undefined
}

const matchAny = (field: string, terms: string[]): QueryClause => ({
  bool: {
    should: terms.map(term => ({
      match_phrase: { [field]: term },
    })),
  },
})

const dateRangeClause = (field: string, range: { gte?: string, lte?: string }): QueryClause => ({
  range: {
    [field]: {
      ...(range.gte && { gte: range.gte }),
      ...(range.lte && { lte: range.lte }),
    },
  },
} as unknown as QueryClause)

const FILTER_DEFINITIONS: Record<FilterKey, FilterDefinition> = {
  accessManagement: {
    label: 'Access Management',
    buildClause: (filters) => {
      if (filters.accessManagement.length === 0) {
        return undefined
      }

      return {
        bool: {
          should: filters.accessManagement.map(term => ({
            term: { 'accessManagement.keyword': term },
          })),
        },
      }
    },
  },
  dataUse: {
    label: 'Data Use',
    buildClause: (filters) => {
      if (filters.dataUse.length === 0) {
        return undefined
      }

      return {
        bool: {
          should: filters.dataUse.map(term => ({
            match: { 'dataUse.primary.code': term },
          })),
        },
      }
    },
  },
  dataType: {
    label: 'Data Type',
    buildClause: (filters) => {
      if (filters.dataType.length === 0) {
        return undefined
      }

      return {
        bool: {
          should: filters.dataType.map(term => ({
            match: { 'study.dataTypes': term },
          })),
        },
      }
    },
  },
  dac: {
    label: 'DAC',
    buildClause: (filters) => {
      if (filters.dac.length === 0) {
        return undefined
      }

      return {
        bool: {
          should: filters.dac.map(term => ({
            match_phrase: { 'dac.dacName': term },
          })),
        },
      }
    },
  },
  participantCount: {
    label: 'Participants',
    buildClause: (filters) => {
      if (
        filters.participantCount.min === undefined
        && filters.participantCount.max === undefined
      ) {
        return undefined
      }

      return {
        range: {
          participantCount: {
            ...(filters.participantCount.min !== undefined && { gte: filters.participantCount.min }),
            ...(filters.participantCount.max !== undefined && { lte: filters.participantCount.max }),
          },
        },
      }
    },
  },
  biospecimenPostMortemInterval: {
    label: 'Post-mortem Interval',
    buildClause: (filters) => {
      if (
        filters.biospecimenPostMortemInterval.min === undefined
        && filters.biospecimenPostMortemInterval.max === undefined
      ) {
        return undefined
      }

      return {
        range: {
          'study.assets.biospecimens.postMortemInterval.value': {
            ...(filters.biospecimenPostMortemInterval.min !== undefined && { gte: filters.biospecimenPostMortemInterval.min }),
            ...(filters.biospecimenPostMortemInterval.max !== undefined && { lte: filters.biospecimenPostMortemInterval.max }),
          },
        },
      }
    },
  },
  biospecimenPostMortemIntervalUnit: {
    label: 'Post-mortem Interval Unit',
    buildClause: filters =>
      filters.biospecimenPostMortemIntervalUnit.length > 0
        ? matchAny('study.assets.biospecimens.postMortemInterval.unit', filters.biospecimenPostMortemIntervalUnit)
        : undefined,
  },
  workspaceTools: {
    label: 'Tools',
    buildClause: filters =>
      filters.workspaceTools.length > 0
        ? matchAny('study.assets.workspaces.tools', filters.workspaceTools)
        : undefined,
  },
  workspacePlatform: {
    label: 'Platform',
    buildClause: filters =>
      filters.workspacePlatform.length > 0
        ? matchAny('study.assets.workspaces.platform', filters.workspacePlatform)
        : undefined,
  },
  clinicalTrialStatus: {
    label: 'Status',
    buildClause: filters =>
      filters.clinicalTrialStatus.length > 0
        ? matchAny('study.assets.clinicalTrials.status', filters.clinicalTrialStatus)
        : undefined,
  },
  clinicalTrialPhase: {
    label: 'Phase',
    buildClause: filters =>
      filters.clinicalTrialPhase.length > 0
        ? matchAny('study.assets.clinicalTrials.phase', filters.clinicalTrialPhase)
        : undefined,
  },
  clinicalTrialInterventionType: {
    label: 'Intervention Type',
    buildClause: (filters) => {
      if (filters.clinicalTrialInterventionType.length === 0) {
        return undefined
      }

      return {
        bool: {
          should: filters.clinicalTrialInterventionType.map((term): QueryClause => ({
            match_phrase: { 'study.assets.clinicalTrials.interventionType': term },
          })),
        },
      } as QueryClause
    },
  },
  clinicalTrialRegistry: {
    label: 'Registry',
    buildClause: filters =>
      filters.clinicalTrialRegistry.length > 0
        ? matchAny('study.assets.clinicalTrials.registry', filters.clinicalTrialRegistry)
        : undefined,
  },
  clinicalTrialDates: {
    label: 'Clinical Trial Dates',
    buildClause: (filters) => {
      const { startDate, endDate } = filters.clinicalTrialDates
      if (startDate && endDate && startDate > endDate) {
        return undefined
      }
      if (!startDate && !endDate) {
        return undefined
      }

      const clauses: QueryClause[] = []
      if (startDate) {
        clauses.push(dateRangeClause('study.assets.clinicalTrials.startDate', { gte: startDate }))
      }
      if (endDate) {
        clauses.push(dateRangeClause('study.assets.clinicalTrials.endDate', { lte: endDate }))
      }

      return {
        bool: {
          must: clauses,
        },
      }
    },
  },
  biospecimenType: {
    label: 'Specimen Type',
    buildClause: filters =>
      filters.biospecimenType.length > 0
        ? matchAny('study.assets.biospecimens.specimenType', filters.biospecimenType)
        : undefined,
  },
  biospecimenCollectionDate: {
    label: 'Collection Date',
    buildClause: (filters) => {
      const { after, before } = filters.biospecimenCollectionDate
      if (!after && !before) {
        return undefined
      }

      return {
        range: {
          'study.assets.biospecimens.dateOfCollection': {
            ...(after && { gte: after }),
            ...(before && { lte: before }),
          },
        },
      } as unknown as QueryClause
    },
  },
  biospecimenDataUse: {
    label: 'Data Use',
    buildClause: filters =>
      filters.biospecimenDataUse.length > 0
        ? matchAny('study.assets.biospecimens.optionalDataUse', filters.biospecimenDataUse)
        : undefined,
  },
  datasetsCited: {
    label: 'Datasets Cited?',
    buildClause: (filters) => {
      if (filters.datasetsCited === undefined) {
        return undefined
      }

      return {
        term: { 'study.assets.presentations.citation': filters.datasetsCited },
      }
    },
  },
  ipFiledDate: {
    label: 'Filed Date',
    buildClause: (filters) => {
      const { after, before } = filters.ipFiledDate
      if (!after && !before) {
        return undefined
      }

      return {
        range: {
          'study.assets.intellectualProperties.filingDate': {
            ...(after && { gte: after }),
            ...(before && { lte: before }),
          },
        },
      } as unknown as QueryClause
    },
  },
  fundingDate: {
    label: 'Funding Dates',
    buildClause: (filters) => {
      const { startDate, endDate } = filters.fundingDate
      if (!startDate && !endDate) {
        return undefined
      }

      const clauses: QueryClause[] = []
      if (startDate) {
        clauses.push(dateRangeClause('study.assets.funding.startDate', { gte: startDate }))
      }
      if (endDate) {
        clauses.push(dateRangeClause('study.assets.funding.endDate', { lte: endDate }))
      }

      return {
        bool: {
          must: clauses,
        },
      }
    },
  },
}

export const getFilterSectionsForAsset = (
  assetType: AssetType,
  availableFilters: AvailableFilters,
): LibraryFilterSection[] => {
  const config = assetFilterRegistry[assetType]
  return config.visibleFilters.map((key) => {
    const control = FILTER_CONTROL_BY_KEY[key]
    return {
      key,
      label: config.labels?.[key] ?? FILTER_DEFINITIONS[key].label,
      control,
      options: getFilterOptions(key, availableFilters),
      range: getFilterRange(key, availableFilters),
    }
  })
}

export const sanitizeFiltersForAsset = (
  assetType: AssetType,
  filters: FilterState,
): FilterState => {
  const visible = new Set(assetFilterRegistry[assetType].visibleFilters)

  const sanitized: FilterState = {
    ...filters,
    ...clearInvisibleObjectFilters(visible, filters),
    datasetsCited: visible.has('datasetsCited') ? filters.datasetsCited : undefined,
  }

  for (const key of ARRAY_FILTER_KEYS) {
    sanitized[key] = visible.has(key) ? [...filters[key]] : []
  }

  for (const key of OBJECT_FILTER_KEYS) {
    if (!visible.has(key)) {
      sanitized[key] = {}
    }
  }

  for (const key of BOOL_FILTER_KEYS) {
    if (!visible.has(key)) {
      sanitized[key] = undefined
    }
  }

  return sanitized
}

export const buildFilterClausesForAsset = (
  assetType: AssetType,
  filters: FilterState,
): QueryClause[] => {
  const sanitized = sanitizeFiltersForAsset(assetType, filters)

  return assetFilterRegistry[assetType].visibleFilters
    .map(key => FILTER_DEFINITIONS[key].buildClause(sanitized))
    .filter((clause): clause is QueryClause => clause !== undefined)
}
