import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { firstNonEmptyPropertyValue, getRadarEnabledDatasetIds, getSoApprovalModelByDatasetId } from 'src/utils/DatasetUtils'
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

describe('getRadarEnabledDatasetIds', () => {
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
    dac: { dacId: 2, dacName: '', dacEmail: '' },
    piName: '',
    dataUse: { primary: [], secondary: [] },
  }

  const buildDataset = (datasetId: number, instantApprovalEligible?: boolean): DatasetTerm =>
    ({ datasetId, dacId: 2, ...minimalDataset, instantApprovalEligible } as DatasetTerm)

  it('collects the datasets the search index marked eligible', () => {
    const result = getRadarEnabledDatasetIds([
      buildDataset(1, true),
      buildDataset(2, false),
      buildDataset(3, true),
    ])
    expect(Array.from(result)).toEqual([1, 3])
  })

  // A document indexed before DT-3888, or reindexed while the DAC rule lookup was failing
  it('treats a dataset with no flag as ineligible rather than guessing', () => {
    expect(getRadarEnabledDatasetIds([buildDataset(1)]).size).toEqual(0)
  })

  it('returns an empty set for an empty dataset list', () => {
    expect(getRadarEnabledDatasetIds([]).size).toEqual(0)
  })

  it('does not fetch DAC rules', () => {
    const fetchRules = vi.spyOn(DAC, 'fetchDACbotRules')
    getRadarEnabledDatasetIds([buildDataset(1, true)])
    expect(fetchRules).not.toHaveBeenCalled()
    vi.restoreAllMocks()
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
    dac: { dacId: 2, dacName: '', dacEmail: '' },
    piName: '',
    dataUse: { primary: [], secondary: [] },
  }

  const buildDataset = (datasetId: number, soApprovalModel?: string): DatasetTerm =>
    ({ datasetId, dacId: 2, ...minimalDataset, soApprovalModel } as DatasetTerm)

  it('maps the models the search index supplies', () => {
    const result = getSoApprovalModelByDatasetId([
      buildDataset(1, 'PER_REQUEST'),
      buildDataset(2, 'PRE_AUTHORIZED'),
    ])
    expect(result.get(1)).toEqual('per-request')
    expect(result.get(2)).toEqual('pre-authorized')
  })

  // A document indexed before DT-3888, or reindexed while the DAC rule lookup was failing
  it('maps a dataset with no model to unknown rather than guessing', () => {
    const result = getSoApprovalModelByDatasetId([buildDataset(1)])
    expect(result.get(1)).toEqual('unknown')
  })

  it('maps an unrecognised model to unknown', () => {
    const result = getSoApprovalModelByDatasetId([buildDataset(1, 'SOMETHING_NEW')])
    expect(result.get(1)).toEqual('unknown')
  })

  it('returns an empty map for an empty dataset list', () => {
    expect(getSoApprovalModelByDatasetId([]).size).toEqual(0)
  })

  it('does not fetch DAC rules', () => {
    const fetchRules = vi.spyOn(DAC, 'fetchDACbotRules')
    getSoApprovalModelByDatasetId([buildDataset(1, 'PER_REQUEST')])
    expect(fetchRules).not.toHaveBeenCalled()
    vi.restoreAllMocks()
  })
})
