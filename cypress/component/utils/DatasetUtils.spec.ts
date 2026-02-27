import { firstNonEmptyPropertyValue, getRadarEnabledDatasetsWithRules, isOnlyGRUorHMB } from 'src/utils/DatasetUtils'
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
    cy.wrap(result).should('be.empty')
  })
  it('ensure no errors when no dataset properties', () => {
    const dataset: Partial<Dataset> = { datasetId: 1 }
    const result = firstNonEmptyPropertyValue(dataset, ['test'])
    cy.wrap(result).should('be.empty')
  })
  it('ensure no errors when incorrect properties', () => {
    const dataset: Partial<Dataset> = {
      datasetId: 1,
      study: { ...minimalStudy, properties: [{ key: 'hello', value: 'goodbye' }] as StudyProperty[] },
    }
    const result = firstNonEmptyPropertyValue(dataset, ['test'])
    cy.wrap(result).should('be.empty')
  })
  it('ensure no errors when empty study property values', () => {
    const dataset: Partial<Dataset> = {
      datasetId: 1,
      study: { ...minimalStudy, properties: [{ key: 'hello' }] as StudyProperty[] },
    }
    const result = firstNonEmptyPropertyValue(dataset, ['hello'])
    cy.wrap(result).should('be.empty')
  })
  it('ensure no errors when empty dataset property values', () => {
    const dataset: Partial<Dataset> = {
      datasetId: 1,
      properties: [{ propertyName: 'hello', propertyValue: undefined } as unknown as DatasetProperty],
    }
    const result = firstNonEmptyPropertyValue(dataset, ['hello'])
    cy.wrap(result).should('be.empty')
  })
  it('extract hello property from study', () => {
    const dataset: Partial<Dataset> = {
      datasetId: 1,
      study: { ...minimalStudy, properties: [{ key: 'hello', value: 'goodbye' }] as StudyProperty[] },
    }
    const result = firstNonEmptyPropertyValue(dataset, ['hello'])
    cy.wrap(result).should('equal', 'goodbye')
  })
  it('extract hello property from dataset', () => {
    const dataset: Partial<Dataset> = {
      datasetId: 1,
      properties: [{ propertyName: 'hello', propertyValue: 'goodbye' } as DatasetProperty],
    }
    const result = firstNonEmptyPropertyValue(dataset, ['hello'])
    cy.wrap(result).should('equal', 'goodbye')
  })
  it('prioritize study property over dataset property', () => {
    const dataset: Partial<Dataset> = {
      datasetId: 1,
      properties: [{ propertyName: 'hello', propertyValue: 'goodbye' } as DatasetProperty],
      study: { ...minimalStudy, properties: [{ key: 'hello', value: 'world' }] as StudyProperty[] },
    }
    const result = firstNonEmptyPropertyValue(dataset, ['hello'])
    cy.wrap(result).should('equal', 'world')
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
    cy.wrap(result).should('equal', 'goodbye')
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
    cy.wrap(result).should('equal', 'goodbye')
  })
  it('extract mix of properties from study and dataset', () => {
    const dataset: Partial<Dataset> = {
      datasetId: 1,
      properties: [{ propertyName: 'hello', propertyValue: 'goodbye' } as DatasetProperty],
      study: { ...minimalStudy, properties: [{ key: 'world', value: 'hello' }] as StudyProperty[] },
    }
    const result = firstNonEmptyPropertyValue(dataset, ['world', 'hello'])
    cy.wrap(result).should('equal', 'hello')
  })
})

describe('isOnlyGRUorHMB', () => {
  const makeTerm = (code: string): DataUseTerm => ({ code, description: '' })

  it('returns true for only GRU', () => {
    const dataUse: DataUseSummary = { primary: [makeTerm('GRU')], secondary: [] }
    cy.wrap(isOnlyGRUorHMB(dataUse)).should('equal', true)
  })
  it('returns true for only HMB', () => {
    const dataUse: DataUseSummary = { primary: [makeTerm('HMB')], secondary: [] }
    cy.wrap(isOnlyGRUorHMB(dataUse)).should('equal', true)
  })
  it('returns false for GRU with modifier', () => {
    const dataUse: DataUseSummary = { primary: [makeTerm('GRU')], secondary: [makeTerm('IRB')] }
    cy.wrap(isOnlyGRUorHMB(dataUse)).should('equal', false)
  })
  it('returns false for multiple primary codes', () => {
    const dataUse: DataUseSummary = { primary: [makeTerm('GRU'), makeTerm('HMB')], secondary: [] }
    cy.wrap(isOnlyGRUorHMB(dataUse)).should('equal', false)
  })
  it('returns false for other code', () => {
    const dataUse: DataUseSummary = { primary: [makeTerm('DS')], secondary: [] }
    cy.wrap(isOnlyGRUorHMB(dataUse)).should('equal', false)
  })
})

describe('getRadarEnabledDatasetsWithRules', () => {
  beforeEach(() => {
    cy.stub(DAC, 'fetchDACbotRules').callsFake((dacId: number) => {
      if (dacId === 2) {
        return Promise.resolve([{ activationDate: 123, ruleType: 'GRU_V1' }])
      }
      return Promise.resolve([])
    })
  })

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

  it('returns set of eligible dataset IDs', () => {
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
    cy.wrap(getRadarEnabledDatasetsWithRules(datasets)).then((result) => {
      expect(result).to.be.instanceOf(Set)
      expect(Array.from(result as Set<number>)).to.deep.equal([1])
    })
  })

  it('returns undefined for empty datasets', () => {
    cy.wrap(getRadarEnabledDatasetsWithRules([])).then((result) => {
      cy.wrap(result).should('be.undefined')
    })
  })

  it('returns empty set if no eligible datasets', () => {
    const datasets: DatasetTerm[] = [
      {
        datasetId: 3,
        dacId: 3,
        dataUse: {} as never,
        ...minimalDataset,
      },
    ]
    cy.wrap(getRadarEnabledDatasetsWithRules(datasets)).then((result) => {
      cy.wrap(Array.from(result as Set<number>)).should('deep.equal', [])
    })
  })
})
