import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { firstNonEmptyPropertyValue, getRadarEnabledDatasetsWithRules, getSoApprovalModelByDatasetId, isOnlyGRUorHMB } from 'src/utils/DatasetUtils'
import type {
  Dataset,
  DataUseSummary,
  DatasetProperty,
  StudyProperty,
  DataUseTerm,
  Study,
  DatasetTerm,
} from 'src/types/model'
import { DAC } from 'src/libs/ajax/DAC'

const minimalStudy: Study & {
  studyName: string
  phsId: string
  phenotype: string
  species: string
  dataType: string
  consentCodes: string[]
  dataSubmitterEmail: string
  dataSubmitterId: number
  dataCustodianEmail: string[]
} = {
  studyId: 2,
  name: '',
  description: '',
  dataTypes: [],
  piName: '',
  publicVisibility: false,
  datasetIds: [],
  datasets: [],
  properties: [],
  createDate: '',
  createUserId: 0,
  studyName: '',
  phsId: '',
  phenotype: '',
  species: '',
  dataType: '',
  consentCodes: [],
  dataSubmitterEmail: '',
  dataSubmitterId: 0,
  dataCustodianEmail: [],
}

describe('firstNonEmptyPropertyValue', () => {
  it('ensure no errors when no study properties', () => {
    const dataset: Partial<Dataset> = { datasetId: 1, study: { ...minimalStudy } }
    const result = firstNonEmptyPropertyValue(dataset, ['test'])
    expect(result).toBe('')
  })

  it('ensure no errors when no dataset properties', () => {
    const dataset: Partial<Dataset> = { datasetId: 1 }
    const result = firstNonEmptyPropertyValue(dataset, ['test'])
    expect(result).toBe('')
  })

  it('ensure no errors when incorrect properties', () => {
    const dataset: Partial<Dataset> = {
      datasetId: 1,
      study: { ...minimalStudy, properties: [{ key: 'hello', value: 'goodbye' }] as StudyProperty[] },
    }
    const result = firstNonEmptyPropertyValue(dataset, ['test'])
    expect(result).toBe('')
  })

  it('ensure no errors when empty study property values', () => {
    const dataset: Partial<Dataset> = {
      datasetId: 1,
      study: { ...minimalStudy, properties: [{ key: 'hello' }] as StudyProperty[] },
    }
    const result = firstNonEmptyPropertyValue(dataset, ['hello'])
    expect(result).toBe('')
  })

  it('ensure no errors when empty dataset property values', () => {
    const dataset: Partial<Dataset> = {
      datasetId: 1,
      properties: [{ propertyName: 'hello', propertyValue: undefined } as unknown as DatasetProperty],
    }
    const result = firstNonEmptyPropertyValue(dataset, ['hello'])
    expect(result).toBe('')
  })

  it('extract hello property from study', () => {
    const dataset: Partial<Dataset> = {
      datasetId: 1,
      study: { ...minimalStudy, properties: [{ key: 'hello', value: 'goodbye' }] as StudyProperty[] },
    }
    const result = firstNonEmptyPropertyValue(dataset, ['hello'])
    expect(result).toBe('goodbye')
  })

  it('extract hello property from dataset', () => {
    const dataset: Partial<Dataset> = {
      datasetId: 1,
      properties: [{ propertyName: 'hello', propertyValue: 'goodbye' } as DatasetProperty],
    }
    const result = firstNonEmptyPropertyValue(dataset, ['hello'])
    expect(result).toBe('goodbye')
  })

  it('prioritize study property over dataset property', () => {
    const dataset: Partial<Dataset> = {
      datasetId: 1,
      properties: [{ propertyName: 'hello', propertyValue: 'goodbye' } as DatasetProperty],
      study: { ...minimalStudy, properties: [{ key: 'hello', value: 'world' }] as StudyProperty[] },
    }
    const result = firstNonEmptyPropertyValue(dataset, ['hello'])
    expect(result).toBe('world')
  })

  it('extract first available property from study', () => {
    const dataset: Partial<Dataset> = {
      datasetId: 1,
      study: {
        ...minimalStudy,
        properties: [
          { key: 'hello', value: 'goodbye' } as StudyProperty,
          { key: 'world', value: 'hello' } as StudyProperty,
        ],
      },
    }
    const result = firstNonEmptyPropertyValue(dataset, ['hello', 'world'])
    expect(result).toBe('goodbye')
  })

  it('extract first available property from dataset', () => {
    const dataset: Partial<Dataset> = {
      datasetId: 1,
      properties: [
        { propertyName: 'hello', propertyValue: 'goodbye' } as DatasetProperty,
        { propertyName: 'world', propertyValue: 'hello' } as DatasetProperty,
      ],
    }
    const result = firstNonEmptyPropertyValue(dataset, ['hello', 'world'])
    expect(result).toBe('goodbye')
  })

  it('extract mix of properties from study and dataset', () => {
    const dataset: Partial<Dataset> = {
      datasetId: 1,
      properties: [{ propertyName: 'hello', propertyValue: 'goodbye' } as DatasetProperty],
      study: { ...minimalStudy, properties: [{ key: 'world', value: 'hello' }] as StudyProperty[] },
    }
    const result = firstNonEmptyPropertyValue(dataset, ['world', 'hello'])
    expect(result).toBe('hello')
  })
})

describe('isOnlyGRUorHMB', () => {
  const makeTerm = (code: string): DataUseTerm => ({ code, description: '' })

  it('returns true for only GRU', () => {
    const dataUse: DataUseSummary = { primary: [makeTerm('GRU')], secondary: [] }
    expect(isOnlyGRUorHMB(dataUse)).toBe(true)
  })

  it('returns true for only HMB', () => {
    const dataUse: DataUseSummary = { primary: [makeTerm('HMB')], secondary: [] }
    expect(isOnlyGRUorHMB(dataUse)).toBe(true)
  })

  it('returns false for GRU with modifier', () => {
    const dataUse: DataUseSummary = { primary: [makeTerm('GRU')], secondary: [makeTerm('IRB')] }
    expect(isOnlyGRUorHMB(dataUse)).toBe(false)
  })

  it('returns false for multiple primary codes', () => {
    const dataUse: DataUseSummary = { primary: [makeTerm('GRU'), makeTerm('HMB')], secondary: [] }
    expect(isOnlyGRUorHMB(dataUse)).toBe(false)
  })

  it('returns false for other code', () => {
    const dataUse: DataUseSummary = { primary: [makeTerm('DS')], secondary: [] }
    expect(isOnlyGRUorHMB(dataUse)).toBe(false)
  })
})

describe('getRadarEnabledDatasetsWithRules', () => {
  const minimalDataset: Omit<DatasetTerm, 'datasetId' | 'dacId' | 'dataUse'> = {
    createUserId: 0,
    createUserDisplayName: '',
    datasetIdentifier: '',
    deletable: false,
    datasetName: '',
    participantCount: 0,
    dataLocation: '',
    url: '',
    dacApproval: false,
    accessManagement: 'open',
    approvedUserIds: [],
    study: minimalStudy,
    submitter: { userId: 0, displayName: '', institution: { id: 0, name: '' } },
    updateUser: { userId: 0, displayName: '', institution: { id: 0, name: '' } },
    dac: { dacId: 0, dacName: '', dacEmail: '' },
    piName: '',
  }

  beforeEach(() => {
    vi.spyOn(DAC, 'fetchDACbotRules').mockImplementation((dacId: number) => {
      if (dacId === 2) {
        return Promise.resolve([{ activationDate: 123, ruleType: 'GRU_V1' }] as never)
      }
      return Promise.resolve([] as never)
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns set of eligible dataset IDs', async () => {
    const datasets: DatasetTerm[] = [
      {
        datasetId: 1,
        dacId: 2,
        dataUse: { primary: [{ code: 'GRU', description: '' }], secondary: [] },
        ...minimalDataset,
      },
      {
        datasetId: 2,
        dacId: 3,
        dataUse: { primary: [{ code: 'DS', description: '' }], secondary: [] },
        ...minimalDataset,
      },
    ]
    const result = await getRadarEnabledDatasetsWithRules(datasets)
    expect(result).toBeInstanceOf(Set)
    expect(Array.from(result as Set<number>)).toEqual([1])
  })

  it('returns undefined for empty datasets', async () => {
    const result = await getRadarEnabledDatasetsWithRules([])
    expect(result).toBeUndefined()
  })

  it('does not flag a dataset as eligible when the DAC only enabled the other code (GRU rule enabled, dataset is HMB)', async () => {
    const datasets: DatasetTerm[] = [
      {
        datasetId: 4,
        dacId: 2,
        dataUse: { primary: [{ code: 'HMB', description: '' }], secondary: [] },
        ...minimalDataset,
      },
    ]
    const result = await getRadarEnabledDatasetsWithRules(datasets)
    expect(Array.from(result as Set<number>)).toEqual([])
  })

  it('flags a dataset as eligible when the DAC has enabled that dataset\'s own code', async () => {
    vi.spyOn(DAC, 'fetchDACbotRules').mockImplementation((dacId: number) => {
      if (dacId === 2) {
        return Promise.resolve([{ activationDate: 123, ruleType: 'HMB_V1' }] as never)
      }
      return Promise.resolve([] as never)
    })
    const datasets: DatasetTerm[] = [
      {
        datasetId: 5,
        dacId: 2,
        dataUse: { primary: [{ code: 'HMB', description: '' }], secondary: [] },
        ...minimalDataset,
      },
    ]
    const result = await getRadarEnabledDatasetsWithRules(datasets)
    expect(Array.from(result as Set<number>)).toEqual([5])
  })

  it('returns empty set if no eligible datasets', async () => {
    const datasets: DatasetTerm[] = [
      {
        datasetId: 3,
        dacId: 3,
        dataUse: {} as never,
        ...minimalDataset,
      },
    ]
    const result = await getRadarEnabledDatasetsWithRules(datasets)
    expect(Array.from(result as Set<number>)).toEqual([])
  })
})

describe('getSoApprovalModelByDatasetId', () => {
  const minimalDataset: Omit<DatasetTerm, 'datasetId' | 'dacId'> = {
    createUserId: 0,
    createUserDisplayName: '',
    datasetIdentifier: '',
    deletable: false,
    datasetName: '',
    participantCount: 0,
    dataLocation: '',
    url: '',
    dacApproval: false,
    accessManagement: 'open',
    approvedUserIds: [],
    study: minimalStudy,
    submitter: { userId: 0, displayName: '', institution: { id: 0, name: '' } },
    updateUser: { userId: 0, displayName: '', institution: { id: 0, name: '' } },
    dac: { dacId: 0, dacName: '', dacEmail: '' },
    piName: '',
    dataUse: { primary: [], secondary: [] },
  }

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('marks datasets per-dar when their DAC has REQUIRE_SO_DAR_APPROVAL enabled', async () => {
    vi.spyOn(DAC, 'fetchDACbotRules').mockImplementation((dacId: number) => {
      if (dacId === 2) {
        return Promise.resolve([{ ruleType: 'REQUIRE_SO_DAR_APPROVAL', enabledByUserId: 99 }] as never)
      }
      return Promise.resolve([{ ruleType: 'REQUIRE_SO_DAR_APPROVAL', enabledByUserId: null }] as never)
    })
    const datasets: DatasetTerm[] = [
      { datasetId: 1, dacId: 2, ...minimalDataset },
      { datasetId: 2, dacId: 3, ...minimalDataset },
    ]
    const result = await getSoApprovalModelByDatasetId(datasets)
    expect(result.get(1)).toEqual('per-dar')
    expect(result.get(2)).toEqual('pre-authorized')
  })

  it('marks every dataset pre-authorized when no DAC requires SO approval', async () => {
    vi.spyOn(DAC, 'fetchDACbotRules').mockResolvedValue([{ ruleType: 'REQUIRE_SO_DAR_APPROVAL', enabledByUserId: null }] as never)
    const datasets: DatasetTerm[] = [{ datasetId: 1, dacId: 2, ...minimalDataset }]
    const result = await getSoApprovalModelByDatasetId(datasets)
    expect(result.get(1)).toEqual('pre-authorized')
  })

  it('returns an empty map for an empty dataset list', async () => {
    const result = await getSoApprovalModelByDatasetId([])
    expect(result.size).toEqual(0)
  })

  // Requirement 7: a dataset with no DAC has no per-DAR approval step, and must not error
  it('treats a dataset with no DAC as pre-authorized without fetching rules', async () => {
    const fetchRules = vi.spyOn(DAC, 'fetchDACbotRules')
    const datasets = [{ datasetId: 1, ...minimalDataset }] as unknown as DatasetTerm[]
    const result = await getSoApprovalModelByDatasetId(datasets)
    expect(result.get(1)).toEqual('pre-authorized')
    expect(fetchRules).not.toHaveBeenCalled()
  })

  // Requirement 8: one failing DAC must not take down the rest of the grid
  it('marks only the failing DAC unknown and still resolves the other DACs', async () => {
    vi.spyOn(DAC, 'fetchDACbotRules').mockImplementation((dacId: number) => {
      if (dacId === 2) return Promise.reject(new Error('500'))
      return Promise.resolve([{ ruleType: 'REQUIRE_SO_DAR_APPROVAL', enabledByUserId: 99 }] as never)
    })
    const datasets: DatasetTerm[] = [
      { datasetId: 1, dacId: 2, ...minimalDataset },
      { datasetId: 2, dacId: 3, ...minimalDataset },
    ]
    const result = await getSoApprovalModelByDatasetId(datasets)
    expect(result.get(1)).toEqual('unknown')
    expect(result.get(2)).toEqual('per-dar')
  })
})
