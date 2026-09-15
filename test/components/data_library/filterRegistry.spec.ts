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
  modelFormat: [],
  modelLicense: [],
  modelCloud: [],
  modelTags: [],
  workspaceTools: [],
  workspacePlatform: [],
  workspaceCloud: [],
  workspaceAccess: [],
  clinicalTrialStatus: [],
  clinicalTrialPhase: [],
  clinicalTrialInterventionType: [],
  clinicalTrialRegistry: [],
  biospecimenType: [],
  biospecimenDataUse: [],
  biospecimenPostMortemIntervalUnit: [],
  soApprovalModel: [],
  ipType: [],
  ipStatus: [],
  presentationEvent: [],
  presentationFormat: [],
  presentationAccess: [],
  publicationJournal: [],
  publicationAccess: [],
  fundingFunderName: [],
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
    presentationEvent: ['ASHG'],
  }

  it('returns asset-specific visible filters', () => {
    const publicationFilters = getFilterSectionsForAsset(AssetType.PUBLICATIONS, availableFilters)
    expect(publicationFilters.map(section => section.key)).toEqual([
      'publicationJournal',
      'publicationAccess',
      'publicationPublishedDate',
    ])
  })

  it('returns the model-specific filters', () => {
    const modelFilters = getFilterSectionsForAsset(AssetType.MODELS, availableFilters)
    expect(modelFilters.map(section => section.key)).toEqual(['modelFormat', 'modelLicense', 'modelCloud', 'modelTags'])
  })

  it('returns presentation-specific filters', () => {
    const presentationFilters = getFilterSectionsForAsset(AssetType.PRESENTATIONS, availableFilters)
    expect(presentationFilters.map(section => section.key)).toEqual([
      'presentationEvent',
      'presentationFormat',
      'presentationAccess',
      'presentationDate',
    ])
  })

  it('builds clauses for every active filter regardless of tab so rules combine', () => {
    const clauses = buildActiveFilterClauses(filters)
    // accessManagement, dataType, participantCount and presentationEvent are all set.
    expect(clauses).toHaveLength(4)
    const serialized = JSON.stringify(clauses)

    expect(serialized).toContain('accessManagement.keyword')
    expect(serialized).toContain('study.dataTypes')
    expect(serialized).toContain('participantCount')
    expect(serialized).toContain('study.assets.presentations.event')
  })

  // A wrong path builds a valid query that matches nothing, which neither
  // typecheck nor a row-level test can catch.
  // Cross-tab scoping can drop a selected value out of the corpus its options
  // come from; the checkbox has to survive that or the filter cannot be cleared.
  describe('selected values in option lists', () => {
    const withModelFormats = (values: string[]): AvailableFilters => ({
      ...availableFilters,
      modelFormat: values.map(value => ({ value, label: value })),
    })

    it('re-adds a selected value the corpus no longer offers', () => {
      const sections = getFilterSectionsForAsset(
        AssetType.MODELS,
        withModelFormats(['ONNX']),
        { ...EMPTY_FILTERS, modelFormat: ['ONNX', 'PyTorch'] },
      )
      const format = sections.find(section => section.key === 'modelFormat')

      expect(format?.options?.map(o => o.value)).toEqual(['ONNX', 'PyTorch'])
    })

    it('leaves the corpus options untouched when every selection is present', () => {
      const sections = getFilterSectionsForAsset(
        AssetType.MODELS,
        withModelFormats(['ONNX', 'PyTorch']),
        { ...EMPTY_FILTERS, modelFormat: ['ONNX'] },
      )
      const format = sections.find(section => section.key === 'modelFormat')

      expect(format?.options?.map(o => o.value)).toEqual(['ONNX', 'PyTorch'])
    })

    it('does not touch a date-range section, which has no options', () => {
      const sections = getFilterSectionsForAsset(
        AssetType.PRESENTATIONS,
        availableFilters,
        { ...EMPTY_FILTERS, presentationDate: { after: '2020-01-01' } },
      )

      expect(sections.find(section => section.key === 'presentationDate')?.options).toBeUndefined()
    })
  })

  describe('asset filter field paths', () => {
    const checkboxCases: Array<[keyof FilterState, string]> = [
      ['modelFormat', 'study.assets.models.format'],
      ['modelLicense', 'study.assets.models.license'],
      ['modelCloud', 'study.assets.models.cloud'],
      ['modelTags', 'study.assets.models.tags'],
      ['workspaceTools', 'study.assets.workspaces.tools'],
      ['workspacePlatform', 'study.assets.workspaces.platform'],
      ['workspaceCloud', 'study.assets.workspaces.cloud'],
      ['workspaceAccess', 'study.assets.workspaces.access'],
      ['ipType', 'study.assets.intellectualProperties.type'],
      ['ipStatus', 'study.assets.intellectualProperties.status'],
      ['presentationEvent', 'study.assets.presentations.event'],
      ['presentationFormat', 'study.assets.presentations.format'],
      ['presentationAccess', 'study.assets.presentations.access'],
      ['publicationJournal', 'study.assets.publications.journal'],
      ['publicationAccess', 'study.assets.publications.access'],
      ['fundingFunderName', 'study.assets.funding.funderName'],
    ]

    it.each(checkboxCases)('%s phrase-matches on %s', (key, field) => {
      const clauses = buildActiveFilterClauses({ ...EMPTY_FILTERS, [key]: ['a', 'b'] })

      // Two selected values OR together in one clause, so both stay reachable.
      expect(clauses).toEqual([{
        bool: {
          should: [
            { match_phrase: { [field]: 'a' } },
            { match_phrase: { [field]: 'b' } },
          ],
        },
      }])
    })

    it.each(checkboxCases)('%s builds no clause when nothing is selected', (_key, field) => {
      expect(JSON.stringify(buildActiveFilterClauses(EMPTY_FILTERS))).not.toContain(field)
    })

    const dateCases: Array<[keyof FilterState, string]> = [
      ['ipFiledDate', 'study.assets.intellectualProperties.filingDate'],
      ['biospecimenCollectionDate', 'study.assets.biospecimens.dateOfCollection'],
      ['presentationDate', 'study.assets.presentations.date'],
      ['publicationPublishedDate', 'study.assets.publications.publishedDate'],
    ]

    it.each(dateCases)('%s ranges over %s', (key, field) => {
      const clauses = buildActiveFilterClauses({
        ...EMPTY_FILTERS,
        [key]: { after: '2020-01-01', before: '2021-12-31' },
      })

      expect(clauses).toEqual([{
        range: { [field]: { gte: '2020-01-01', lte: '2021-12-31' } },
      }])
    })

    it.each(dateCases)('%s builds no clause when its bounds are inverted', (key, field) => {
      const clauses = buildActiveFilterClauses({
        ...EMPTY_FILTERS,
        [key]: { after: '2021-12-31', before: '2020-01-01' },
      })

      expect(JSON.stringify(clauses)).not.toContain(field)
    })
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
      // None of accessManagement/dataType/participantCount/presentationEvent are among
      // Models' own visible filters, so all of them are "external" here.
      const chips = getExternalActiveFilters(AssetType.MODELS, filters, labelledFilters)
      const keys = chips.map(chip => chip.key)

      expect(keys).toContain('accessManagement')
      expect(keys).toContain('dataType')
      expect(keys).toContain('participantCount')
      expect(keys).toContain('presentationEvent')
    })

    it('resolves value labels from available filters and formats ranges/booleans', () => {
      const chips = getExternalActiveFilters(AssetType.MODELS, filters, labelledFilters)

      expect(chips).toContainEqual({ key: 'accessManagement', sectionLabel: 'Access Request Process', valueLabel: 'via DUOS', value: 'controlled' })
      expect(chips).toContainEqual({ key: 'participantCount', sectionLabel: 'Participants', valueLabel: '10 – 100' })

      const boolChips = getExternalActiveFilters(AssetType.MODELS, { ...EMPTY_FILTERS, instantApproval: true }, availableFilters)
      expect(boolChips).toContainEqual({ key: 'instantApproval', sectionLabel: 'Instant Approval Available?', valueLabel: 'Yes' })
    })

    it('excludes filters that the current tab renders itself', () => {
      // Datasets renders accessManagement, dataType and participantCount, so only
      // presentationEvent (not a datasets filter) remains external.
      const chips = getExternalActiveFilters(AssetType.DATASETS, filters, labelledFilters)
      expect(chips.map(chip => chip.key)).toEqual(['presentationEvent'])
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

    it('does not surface any inverted date range (builds no clause, so no chip)', () => {
      const inverted: FilterState = {
        ...EMPTY_FILTERS,
        fundingDate: { startDate: '2024-01-01', endDate: '2023-01-01' },
        biospecimenCollectionDate: { after: '2024-01-01', before: '2020-01-01' },
        ipFiledDate: { after: '2024-01-01', before: '2020-01-01' },
      }
      const chips = getExternalActiveFilters(AssetType.MODELS, inverted, availableFilters)
      const chipKeys = chips.map(chip => chip.key)
      expect(chipKeys).not.toContain('fundingDate')
      expect(chipKeys).not.toContain('biospecimenCollectionDate')
      expect(chipKeys).not.toContain('ipFiledDate')

      const clauses = JSON.stringify(buildActiveFilterClauses(inverted))
      expect(clauses).not.toContain('funding.startDate')
      expect(clauses).not.toContain('dateOfCollection')
      expect(clauses).not.toContain('filingDate')
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

    // An absent flag means "unknown" rather than "No", and a bare term matches only
    // documents carrying the field, so neither side claims them.
    it('matches only what the index asserts on both sides', () => {
      const yes = buildActiveFilterClauses({ ...EMPTY_FILTERS, instantApproval: true })
      expect(yes).toContainEqual({ term: { instantApprovalEligible: true } })

      const no = buildActiveFilterClauses({ ...EMPTY_FILTERS, instantApproval: false })
      expect(no).toContainEqual({ term: { instantApprovalEligible: false } })
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
      const next = removeFilterValue({ ...filters, instantApproval: true }, 'instantApproval')
      expect(next.instantApproval).toBeUndefined()
    })
  })
})
