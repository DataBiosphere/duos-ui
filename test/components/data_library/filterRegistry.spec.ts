import { describe, it, expect } from 'vitest'
import {
  buildActiveFilterClauses,
  EMPTY_FILTERS,
  getExternalActiveFilters,
  getFilterSectionsForAsset,
  isFilterActive,
  removeFilterValue,
} from 'src/components/data_library/filterRegistry'
import { AssetType, AvailableFilters, FilterState } from 'src/types/library'

const availableFilters: AvailableFilters = {
  accessManagement: [],
  dataUse: [],
  dataUseModifiers: [],
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
  soApprovalModel: [],
  datasetsCited: [],
  publicationsDatasetsCited: [],
  instantApproval: [],
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

  describe('data use modifiers', () => {
    it('is offered on the tabs that carry data use, right after the primary codes', () => {
      for (const tab of [AssetType.DATASETS, AssetType.STUDIES]) {
        const keys = getFilterSectionsForAsset(tab, availableFilters).map(section => section.key)
        expect(keys).toContain('dataUseModifiers')
        expect(keys.indexOf('dataUseModifiers')).toBe(keys.indexOf('dataUse') + 1)
      }
    })

    it('matches the selected codes against the secondary data use field', () => {
      const clauses = buildActiveFilterClauses({ ...EMPTY_FILTERS, dataUseModifiers: ['NPU', 'IRB'] })
      expect(clauses).toEqual([{
        bool: {
          should: [
            { match_phrase: { 'dataUse.secondary.code': 'NPU' } },
            { match_phrase: { 'dataUse.secondary.code': 'IRB' } },
          ],
        },
      }])
    })

    it('phrase-matches, so a hyphenated code cannot spill into its siblings', () => {
      // `match` would OR the tokens of RS-G ([rs, g]) and so also hit RS-PD ([rs, pd]).
      const clauses = buildActiveFilterClauses({ ...EMPTY_FILTERS, dataUseModifiers: ['RS-G'] })
      expect(JSON.stringify(clauses)).not.toContain('"match"')
      expect(clauses).toEqual([{
        bool: { should: [{ match_phrase: { 'dataUse.secondary.code': 'RS-G' } }] },
      }])
    })

    it('builds no clause when nothing is selected', () => {
      const clauses = buildActiveFilterClauses(EMPTY_FILTERS)
      expect(JSON.stringify(clauses)).not.toContain('dataUse.secondary.code')
    })

    it('combines with a primary code as AND — separate clauses, not one OR', () => {
      const clauses = buildActiveFilterClauses({
        ...EMPTY_FILTERS,
        dataUse: ['HMB'],
        dataUseModifiers: ['NPU'],
      })
      // Two clauses land in the query's `filter` array, so both must hold.
      expect(clauses).toHaveLength(2)
      expect(JSON.stringify(clauses)).toContain('dataUse.primary.code')
      expect(JSON.stringify(clauses)).toContain('dataUse.secondary.code')
    })

    it('counts as active once a code is selected, and drops a single code on removal', () => {
      const state: FilterState = { ...EMPTY_FILTERS, dataUseModifiers: ['NPU', 'IRB'] }
      expect(isFilterActive('dataUseModifiers', state)).toBe(true)
      expect(isFilterActive('dataUseModifiers', EMPTY_FILTERS)).toBe(false)
      expect(removeFilterValue(state, 'dataUseModifiers', 'NPU').dataUseModifiers).toEqual(['IRB'])
    })

    it('surfaces as a removable chip when set from a tab that does not show it', () => {
      const chips = getExternalActiveFilters(
        AssetType.MODELS,
        { ...EMPTY_FILTERS, dataUseModifiers: ['NPU'] },
        { ...availableFilters, dataUseModifiers: [{ value: 'NPU', label: 'Non-Profit Use Only' }] },
      )
      expect(chips).toContainEqual({
        key: 'dataUseModifiers',
        sectionLabel: 'Data Use Modifiers',
        valueLabel: 'Non-Profit Use Only',
        value: 'NPU',
      })
    })
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

  describe('soApprovalModel', () => {
    it('builds no clause when nothing is selected', () => {
      const clauses = buildActiveFilterClauses(EMPTY_FILTERS)
      expect(JSON.stringify(clauses)).not.toContain('soApprovalModel')
    })

    it('matches the selected models on the keyword field', () => {
      const clauses = buildActiveFilterClauses({ ...EMPTY_FILTERS, soApprovalModel: ['PER_REQUEST'] })
      expect(clauses).toContainEqual({
        bool: { should: [{ term: { 'soApprovalModel.keyword': 'PER_REQUEST' } }] },
      })
    })

    it('ORs multiple selected models together', () => {
      const clauses = buildActiveFilterClauses({
        ...EMPTY_FILTERS,
        soApprovalModel: ['PER_REQUEST', 'PRE_AUTHORIZED'],
      })
      expect(clauses).toContainEqual({
        bool: {
          should: [
            { term: { 'soApprovalModel.keyword': 'PER_REQUEST' } },
            { term: { 'soApprovalModel.keyword': 'PRE_AUTHORIZED' } },
          ],
        },
      })
    })
  })

  describe('instantApproval', () => {
    it('builds no clause when left on "Any"', () => {
      const clauses = buildActiveFilterClauses(EMPTY_FILTERS)
      expect(JSON.stringify(clauses)).not.toContain('instantApprovalEligible')
    })

    // Unlike the citation filters, an absent flag means "unknown" rather than "No", and a bare
    // term matches only documents carrying the field, so neither side claims them.
    it('matches only what the index asserts on both sides', () => {
      const yes = buildActiveFilterClauses({ ...EMPTY_FILTERS, instantApproval: true })
      expect(yes).toContainEqual({ term: { instantApprovalEligible: true } })

      const no = buildActiveFilterClauses({ ...EMPTY_FILTERS, instantApproval: false })
      expect(no).toContainEqual({ term: { instantApprovalEligible: false } })
    })
  })

  describe('publicationsDatasetsCited (its own filter)', () => {
    it('builds a server clause on the publications citation field', () => {
      const clauses = buildActiveFilterClauses({ ...EMPTY_FILTERS, publicationsDatasetsCited: true })
      expect(JSON.stringify(clauses)).toContain('study.assets.publications.citation')
      expect(JSON.stringify(clauses)).not.toContain('study.assets.presentations.citation')
    })

    it('matches an explicit true with a bare term when "Yes" is selected', () => {
      const clauses = buildActiveFilterClauses({ ...EMPTY_FILTERS, publicationsDatasetsCited: true })
      expect(clauses).toContainEqual({ term: { 'study.assets.publications.citation': true } })
    })

    it('treats a missing citation field as "No" so legacy documents are not excluded', () => {
      // The grid renders a missing citation as false (`citation ?? false`), so
      // "No" must match an explicit false OR the absence of the field rather than
      // a bare `term: { citation: false }` that would drop legacy documents.
      const clauses = buildActiveFilterClauses({ ...EMPTY_FILTERS, publicationsDatasetsCited: false })
      expect(clauses).toContainEqual({
        bool: {
          should: [
            { term: { 'study.assets.publications.citation': false } },
            { bool: { must_not: [{ exists: { field: 'study.assets.publications.citation' } }] } },
          ],
          minimum_should_match: 1,
        },
      })
    })

    it('applies the same missing-field handling to the presentations citation filter', () => {
      const clauses = buildActiveFilterClauses({ ...EMPTY_FILTERS, datasetsCited: false })
      expect(clauses).toContainEqual({
        bool: {
          should: [
            { term: { 'study.assets.presentations.citation': false } },
            { bool: { must_not: [{ exists: { field: 'study.assets.presentations.citation' } }] } },
          ],
          minimum_should_match: 1,
        },
      })
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
