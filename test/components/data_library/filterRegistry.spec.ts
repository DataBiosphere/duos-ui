import { describe, it, expect } from 'vitest'
import {
  buildActiveFilterClauses,
  EMPTY_FILTERS,
  getExternalActiveFilters,
  getFilterSectionsForAsset,
  removeFilterValue,
} from 'src/components/data_library/filterRegistry'
import { AssetType, AvailableFilters, FilterState } from 'src/types/library'

const availableFilters: AvailableFilters = {
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
  biospecimenType: [],
  biospecimenDataUse: [],
  biospecimenPostMortemIntervalUnit: [],
  datasetsCited: [],
  publicationsDatasetsCited: [],
  biospecimenPostMortemIntervalRange: { min: 0, max: 10 },
  participantCountRange: { min: 0, max: 10 },
}

describe('filterRegistry', () => {
  const filters: FilterState = {
    ...EMPTY_FILTERS,
    accessManagement: ['controlled'],
    dataType: ['Genomic'],
    participantCount: { min: 10, max: 100 },
    datasetsCited: true,
  }

  it('returns asset-specific visible filters', () => {
    const publicationFilters = getFilterSectionsForAsset(AssetType.PUBLICATIONS, availableFilters)
    expect(publicationFilters.map(section => section.key)).toEqual(['publicationsDatasetsCited'])
  })

  it('returns no visible filters for models', () => {
    const modelFilters = getFilterSectionsForAsset(AssetType.MODELS, availableFilters)
    expect(modelFilters.map(section => section.key)).toEqual([])
  })

  it('returns presentation-specific datasets cited filter', () => {
    const presentationFilters = getFilterSectionsForAsset(AssetType.PRESENTATIONS, availableFilters)
    expect(presentationFilters.map(section => section.key)).toEqual(['datasetsCited'])
  })

  it('builds clauses for every active filter regardless of tab so rules combine', () => {
    const clauses = buildActiveFilterClauses(filters)
    // accessManagement, dataType, participantCount and datasetsCited are all set.
    expect(clauses).toHaveLength(4)
    const serialized = JSON.stringify(clauses)

    expect(serialized).toContain('accessManagement.keyword')
    expect(serialized).toContain('study.dataTypes')
    expect(serialized).toContain('participantCount')
    expect(serialized).toContain('study.assets.presentations.citation')
  })

  describe('getExternalActiveFilters', () => {
    const labelledFilters: AvailableFilters = {
      ...availableFilters,
      accessManagement: [{ value: 'controlled', label: 'via DUOS' }],
    }

    it('lists active filters not shown on the current tab as removable chips', () => {
      // Models has no visible filters, so every active filter is "external".
      const chips = getExternalActiveFilters(AssetType.MODELS, filters, labelledFilters)
      const keys = chips.map(chip => chip.key)

      expect(keys).toContain('accessManagement')
      expect(keys).toContain('dataType')
      expect(keys).toContain('participantCount')
      expect(keys).toContain('datasetsCited')
    })

    it('resolves value labels from available filters and formats ranges/booleans', () => {
      const chips = getExternalActiveFilters(AssetType.MODELS, filters, labelledFilters)

      expect(chips).toContainEqual({ key: 'accessManagement', sectionLabel: 'Access Request Process', valueLabel: 'via DUOS', value: 'controlled' })
      expect(chips).toContainEqual({ key: 'participantCount', sectionLabel: 'Participants', valueLabel: '10 – 100' })
      expect(chips).toContainEqual({ key: 'datasetsCited', sectionLabel: 'Datasets Cited (Presentations)?', valueLabel: 'Yes' })
    })

    it('excludes filters that the current tab renders itself', () => {
      // Datasets renders accessManagement, dataType and participantCount, so only
      // datasetsCited (not a datasets filter) remains external.
      const chips = getExternalActiveFilters(AssetType.DATASETS, filters, labelledFilters)
      expect(chips.map(chip => chip.key)).toEqual(['datasetsCited'])
    })

    it('falls back to the raw value when no label is available', () => {
      const chips = getExternalActiveFilters(AssetType.MODELS, filters, availableFilters)
      expect(chips).toContainEqual({ key: 'accessManagement', sectionLabel: 'Access Request Process', valueLabel: 'controlled', value: 'controlled' })
    })

    it('does not surface an inverted clinical-trial date range (builds no clause, so no chip)', () => {
      const inverted: FilterState = {
        ...EMPTY_FILTERS,
        clinicalTrialDates: { startDate: '2020-01-01', endDate: '2019-01-01' },
      }
      const chips = getExternalActiveFilters(AssetType.MODELS, inverted, availableFilters)
      expect(chips.map(chip => chip.key)).not.toContain('clinicalTrialDates')
    })

    it('formats a funding date range chip (startDate/endDate shape)', () => {
      const state: FilterState = {
        ...EMPTY_FILTERS,
        fundingDate: { startDate: '2021-01-01', endDate: '2022-01-01' },
      }
      const chips = getExternalActiveFilters(AssetType.MODELS, state, availableFilters)
      expect(chips).toContainEqual({ key: 'fundingDate', sectionLabel: 'Funding Dates', valueLabel: '2021-01-01 – 2022-01-01' })
    })

    it('formats an open-ended collection date chip (after-only, before-only, before/after shape)', () => {
      const afterOnly = getExternalActiveFilters(
        AssetType.MODELS,
        { ...EMPTY_FILTERS, biospecimenCollectionDate: { after: '2020-05-01' } },
        availableFilters,
      )
      expect(afterOnly).toContainEqual({ key: 'biospecimenCollectionDate', sectionLabel: 'Collection Date', valueLabel: 'From 2020-05-01' })

      const beforeOnly = getExternalActiveFilters(
        AssetType.MODELS,
        { ...EMPTY_FILTERS, ipFiledDate: { before: '2019-12-31' } },
        availableFilters,
      )
      expect(beforeOnly).toContainEqual({ key: 'ipFiledDate', sectionLabel: 'Filed Date', valueLabel: 'Until 2019-12-31' })
    })

    it('omits date filters that hold no active value', () => {
      const chips = getExternalActiveFilters(AssetType.MODELS, EMPTY_FILTERS, availableFilters)
      const dateKeys = ['fundingDate', 'biospecimenCollectionDate', 'ipFiledDate', 'clinicalTrialDates']
      expect(chips.map(chip => chip.key).filter(key => dateKeys.includes(key))).toEqual([])
    })
  })

  describe('publicationsDatasetsCited (its own filter)', () => {
    it('builds a server clause on the publications citation field', () => {
      const clauses = buildActiveFilterClauses({ ...EMPTY_FILTERS, publicationsDatasetsCited: true })
      expect(JSON.stringify(clauses)).toContain('study.assets.publications.citation')
      expect(JSON.stringify(clauses)).not.toContain('study.assets.presentations.citation')
    })

    it('is a visible filter on the Publications tab (not an external chip there)', () => {
      const sections = getFilterSectionsForAsset(AssetType.PUBLICATIONS, availableFilters)
      expect(sections.map(s => s.key)).toContain('publicationsDatasetsCited')

      const chips = getExternalActiveFilters(
        AssetType.PUBLICATIONS,
        { ...EMPTY_FILTERS, publicationsDatasetsCited: true },
        availableFilters,
      )
      expect(chips.map(chip => chip.key)).not.toContain('publicationsDatasetsCited')
    })

    it('appears as a removable external chip on tabs that do not own it', () => {
      const chips = getExternalActiveFilters(
        AssetType.STUDIES,
        { ...EMPTY_FILTERS, publicationsDatasetsCited: true },
        availableFilters,
      )
      expect(chips).toContainEqual({ key: 'publicationsDatasetsCited', sectionLabel: 'Datasets Cited (Publications)?', valueLabel: 'Yes' })
    })

    it('gives the two citation filters distinct chip labels so they are not confused', () => {
      const chips = getExternalActiveFilters(
        AssetType.STUDIES,
        { ...EMPTY_FILTERS, datasetsCited: true, publicationsDatasetsCited: false },
        availableFilters,
      )
      const labels = chips
        .filter(chip => chip.key === 'datasetsCited' || chip.key === 'publicationsDatasetsCited')
        .map(chip => chip.sectionLabel)
      expect(new Set(labels).size).toEqual(2)
    })
  })

  describe('removeFilterValue', () => {
    it('removes a single value from an array filter', () => {
      const next = removeFilterValue({ ...filters, accessManagement: ['controlled', 'open'] }, 'accessManagement', 'controlled')
      expect(next.accessManagement).toEqual(['open'])
    })

    it('clears an object (range/date) filter entirely', () => {
      const next = removeFilterValue(filters, 'participantCount')
      expect(next.participantCount).toEqual({})
    })

    it('resets a boolean filter to undefined', () => {
      const next = removeFilterValue(filters, 'datasetsCited')
      expect(next.datasetsCited).toBeUndefined()
    })
  })
})
