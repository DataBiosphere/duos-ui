import { QueryClause } from 'src/types/elastic'
import {
  ActiveFilterChip,
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
    | 'soApprovalModel'

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
  'soApprovalModel',
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

const BOOL_FILTER_KEYS: Array<'datasetsCited' | 'publicationsDatasetsCited' | 'instantApproval'> = [
  'datasetsCited',
  'publicationsDatasetsCited',
  'instantApproval',
]

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
  soApprovalModel: 'checkbox',
  datasetsCited: 'boolean',
  publicationsDatasetsCited: 'boolean',
  instantApproval: 'boolean',
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
  soApprovalModel: [],
  datasetsCited: undefined,
  publicationsDatasetsCited: undefined,
  instantApproval: undefined,
  participantCount: {},
  ipFiledDate: {},
  fundingDate: {},
}

/**
 * Single source of truth for "is this filter contributing anything right now".
 *
 * Every place that needs to know whether a filter is active — the collapsed
 * panel's active-filter count (`hasSectionValue` in LibraryFilters), the external
 * filter chips (`getExternalActiveFilters`), and the query builder's
 * clinical-trial-dates guard (`FILTER_DEFINITIONS.clinicalTrialDates.buildClause`)
 * — calls this so they cannot disagree. In particular the inverted
 * clinical-trial date range (start after end) builds no query clause, so it must
 * also count as inactive everywhere; encoding that once here keeps the badge, the
 * chips, and the query in lockstep.
 */
/**
 * The two bounds of each date-range filter, lower bound first. A range whose
 * bounds cross can match nothing (both bounds are ANDed, and for the start/end
 * pairs an asset would have to end before it starts), so it builds no clause
 * and must read as inactive everywhere — see isFilterActive.
 */
const DATE_RANGE_BOUNDS = {
  clinicalTrialDates: ['startDate', 'endDate'],
  fundingDate: ['startDate', 'endDate'],
  biospecimenCollectionDate: ['after', 'before'],
  ipFiledDate: ['after', 'before'],
} as const

/**
 * True when both bounds of a date-range filter are set and crossed. The single
 * encoding of the rule: the filter panel's validation message, isFilterActive
 * (and through it the badge, the chips and the query clause), and the
 * client-side row filters in the funding/IP/biospecimen transforms all use it.
 */
export const isInvertedDateRange = (key: FilterKey, filters: FilterState): boolean => {
  const bounds = DATE_RANGE_BOUNDS[key as keyof typeof DATE_RANGE_BOUNDS]
  if (!bounds) {
    return false
  }

  const [lowerKey, upperKey] = bounds
  const value = filters[key] as Record<string, string | undefined>
  const lower = value[lowerKey]
  const upper = value[upperKey]

  return !!lower && !!upper && lower > upper
}

export const isFilterActive = (key: FilterKey, filters: FilterState): boolean => {
  switch (key) {
    // Multi-select (array) filters are active once any value is selected.
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
    case 'soApprovalModel':
      return filters[key].length > 0

    // Boolean filters are active once explicitly set to Yes/No (not "Any").
    case 'datasetsCited':
    case 'publicationsDatasetsCited':
    case 'instantApproval':
      return filters[key] !== undefined

    // Range filters are active once either bound is set.
    case 'participantCount':
    case 'biospecimenPostMortemInterval':
      return filters[key].min !== undefined || filters[key].max !== undefined

    // An inverted range builds no clause (see buildClause), so it is inactive.
    case 'clinicalTrialDates':
    case 'fundingDate': {
      if (isInvertedDateRange(key, filters)) {
        return false
      }
      const { startDate, endDate } = filters[key]
      return !!startDate || !!endDate
    }

    case 'biospecimenCollectionDate':
    case 'ipFiledDate': {
      if (isInvertedDateRange(key, filters)) {
        return false
      }
      const { after, before } = filters[key]
      return !!after || !!before
    }

    default:
      return false
  }
}

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
    case 'soApprovalModel':
    case 'datasetsCited':
    case 'publicationsDatasetsCited':
    case 'instantApproval':
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

/**
 * Clause for a nested-asset "cited datasets?" boolean.
 *
 * The grid treats a missing `citation` field as `false` (`citation ?? false`),
 * so the query must do the same or the two diverge. A bare `term: { citation:
 * false }` would exclude any asset indexed without the field — every pre-Oct-2025
 * record and any non-form ingestion path — even though the grid shows them as
 * "No". Selecting "No" therefore matches an explicit `false` OR the absence of the
 * field; "Yes" matches only an explicit `true`.
 */
const citationClause = (field: string, cited: boolean): QueryClause => {
  if (cited) {
    return { term: { [field]: true } }
  }
  return {
    bool: {
      should: [
        { term: { [field]: false } },
        { bool: { must_not: [{ exists: { field } }] } },
      ],
      minimum_should_match: 1,
    },
  }
}

const FILTER_DEFINITIONS: Record<FilterKey, FilterDefinition> = {
  soApprovalModel: {
    label: 'SO Approval',
    buildClause: (filters) => {
      if (filters.soApprovalModel.length === 0) {
        return undefined
      }

      return {
        bool: {
          should: filters.soApprovalModel.map(term => ({
            term: { 'soApprovalModel.keyword': term },
          })),
        },
      }
    },
  },
  instantApproval: {
    label: 'Instant Approval Available?',
    buildClause: (filters) => {
      if (filters.instantApproval === undefined) {
        return undefined
      }

      // Unlike citationClause, an absent flag means "unknown" rather than "No" — the index leaves
      // it unset when the DAC's rules cannot be resolved, and the grid shows no badge for those.
      // A bare term matches only documents carrying the field, so both sides exclude them.
      return { term: { instantApprovalEligible: filters.instantApproval } }
    },
  },
  accessManagement: {
    label: 'Access Request Process',
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
      // isFilterActive encodes both the empty-range and inverted-range guards, so
      // the query, the badge and the chips all agree on when this filter applies.
      if (!isFilterActive('clinicalTrialDates', filters)) {
        return undefined
      }
      const { startDate, endDate } = filters.clinicalTrialDates

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
      if (!isFilterActive('biospecimenCollectionDate', filters)) {
        return undefined
      }
      const { after, before } = filters.biospecimenCollectionDate

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
    label: 'Datasets Cited (Presentations)?',
    buildClause: (filters) => {
      if (filters.datasetsCited === undefined) {
        return undefined
      }

      return citationClause('study.assets.presentations.citation', filters.datasetsCited)
    },
  },
  publicationsDatasetsCited: {
    label: 'Datasets Cited (Publications)?',
    buildClause: (filters) => {
      if (filters.publicationsDatasetsCited === undefined) {
        return undefined
      }

      return citationClause('study.assets.publications.citation', filters.publicationsDatasetsCited)
    },
  },
  ipFiledDate: {
    label: 'Filed Date',
    buildClause: (filters) => {
      if (!isFilterActive('ipFiledDate', filters)) {
        return undefined
      }
      const { after, before } = filters.ipFiledDate

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
      if (!isFilterActive('fundingDate', filters)) {
        return undefined
      }
      const { startDate, endDate } = filters.fundingDate

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

const formatRange = (range: { min?: number, max?: number }): string => {
  if (range.min !== undefined && range.max !== undefined) {
    return `${range.min} – ${range.max}`
  }
  if (range.min !== undefined) {
    return `≥ ${range.min}`
  }
  return `≤ ${range.max}`
}

const formatDateRange = (start?: string, end?: string): string => {
  if (start && end) {
    return `${start} – ${end}`
  }
  if (start) {
    return `From ${start}`
  }
  return `Until ${end}`
}

/**
 * Format the value of an object (range/date) filter for display in a removable
 * chip. Callers gate on `isFilterActive` first, so this only ever runs for a
 * filter that holds an active value and always returns a label.
 */
const describeObjectFilter = (key: typeof OBJECT_FILTER_KEYS[number], filters: FilterState): string => {
  switch (key) {
    case 'participantCount':
    case 'biospecimenPostMortemInterval':
      return formatRange(filters[key])
    case 'clinicalTrialDates':
    case 'fundingDate': {
      const { startDate, endDate } = filters[key]
      return formatDateRange(startDate, endDate)
    }
    case 'biospecimenCollectionDate':
    case 'ipFiledDate': {
      const { after, before } = filters[key]
      return formatDateRange(after, before)
    }
    default:
      return ''
  }
}

/**
 * Collect the filters that are currently active but not shown on `assetType`'s
 * own filter panel — i.e. filters carried over from another tab. These are
 * rendered as removable chips so the user can drop them without switching tabs,
 * but cannot re-add them (the control for that lives on the owning tab).
 */
export const getExternalActiveFilters = (
  assetType: AssetType,
  filters: FilterState,
  availableFilters: AvailableFilters,
): ActiveFilterChip[] => {
  const visible = new Set(assetFilterRegistry[assetType].visibleFilters)
  const chips: ActiveFilterChip[] = []

  const labelForValue = (key: FilterKey, value: string): string =>
    getFilterOptions(key, availableFilters)?.find(option => option.value === value)?.label ?? value

  for (const key of ARRAY_FILTER_KEYS) {
    if (visible.has(key) || !isFilterActive(key, filters)) {
      continue
    }
    for (const value of filters[key]) {
      chips.push({
        key,
        sectionLabel: FILTER_DEFINITIONS[key].label,
        valueLabel: labelForValue(key, value),
        value,
      })
    }
  }

  for (const key of OBJECT_FILTER_KEYS) {
    if (visible.has(key) || !isFilterActive(key, filters)) {
      continue
    }
    chips.push({ key, sectionLabel: FILTER_DEFINITIONS[key].label, valueLabel: describeObjectFilter(key, filters) })
  }

  for (const key of BOOL_FILTER_KEYS) {
    if (!visible.has(key) && isFilterActive(key, filters)) {
      chips.push({
        key,
        sectionLabel: FILTER_DEFINITIONS[key].label,
        valueLabel: filters[key] ? 'Yes' : 'No',
      })
    }
  }

  return chips
}

/**
 * Remove a single active filter value from the filter state. For array filters
 * only the matching `value` is dropped; range/date filters are cleared entirely
 * and boolean filters are reset to undefined.
 */
export const removeFilterValue = (
  filters: FilterState,
  key: FilterKey,
  value?: string,
): FilterState => {
  if ((ARRAY_FILTER_KEYS as readonly string[]).includes(key)) {
    const arrayKey = key as ArrayFilterKey
    return { ...filters, [arrayKey]: filters[arrayKey].filter(entry => entry !== value) }
  }

  if ((OBJECT_FILTER_KEYS as readonly string[]).includes(key)) {
    return { ...filters, [key]: {} }
  }

  return { ...filters, [key]: undefined }
}

/**
 * Build Elasticsearch clauses for every active filter, regardless of which tab
 * owns it, so filters set on different tabs combine into a single query. Each
 * filter's `buildClause` inspects only its own state and returns `undefined`
 * when inactive, so inactive filters contribute nothing.
 */
export const buildActiveFilterClauses = (filters: FilterState): QueryClause[] =>
  (Object.keys(FILTER_DEFINITIONS) as FilterKey[])
    .map(key => FILTER_DEFINITIONS[key].buildClause(filters))
    .filter((clause): clause is QueryClause => clause !== undefined)
