import '@testing-library/jest-dom/vitest'
import { describe, expect, it } from 'vitest'
import { processDefinedLimitations, consentTranslations, TranslationEntry } from 'src/libs/dataUseTranslation'
import { isEmpty, cloneDeep } from 'src/utils/NodashUtil'
import { DataUse } from 'src/types/model'

interface MockDataUse extends DataUse {
  [key: string]: boolean | string | string[] | undefined
}

const mockDataUse: MockDataUse = {
  diseaseRestrictions: [],
}

const makeDataUse = (overrides: Partial<MockDataUse>): MockDataUse => ({
  ...cloneDeep(mockDataUse),
  ...overrides,
})

const expectTranslatedLimitation = (targetKey: string, dataUse: MockDataUse) => {
  const response = processDefinedLimitations(targetKey, dataUse, consentTranslations)
  const targetTranslation = consentTranslations[targetKey] as TranslationEntry

  expect(response).toBeDefined()
  expect(Object.keys(response!)).not.toHaveLength(0)
  expect(response?.code).toBe(targetTranslation.code)
  expect(response?.description).toBe(targetTranslation.description)
}

describe('Data Use Translation', () => {
  describe('processDefinedLimitations()', () => {
    it('translates Populations, Origins, and Ancestry (POA) if it has been marked in the data use', () => {
      const targetKey = 'populationOriginsAncestry'
      const modifiedMockData = makeDataUse({ diseaseRestrictions: [], populationOriginsAncestry: true })

      expectTranslatedLimitation(targetKey, modifiedMockData)
    })

    it('translates HMB if it\'s been marked in the data use', () => {
      const targetKey = 'hmbResearch'
      const modifiedMockData = makeDataUse({ [targetKey]: true, diseaseRestrictions: [] })

      expectTranslatedLimitation(targetKey, modifiedMockData)
    })

    it('translates HMB if diseaseRestrictions is an empty array', () => {
      const targetKey = 'hmbResearch'
      const modifiedMockData = makeDataUse({ diseaseRestrictions: [], [targetKey]: true })

      expectTranslatedLimitation(targetKey, modifiedMockData)
    })

    it('does not translate HMB if diseaseRestrictions is populated', () => {
      const targetKey = 'hmbResearch'
      const modifiedMockData = makeDataUse({
        diseaseRestrictions: ['test'],
        [targetKey]: true,
      })
      const response = processDefinedLimitations(targetKey, modifiedMockData, consentTranslations)

      expect(isEmpty(response)).toBe(true)
    })

    it('translates General Research Use (GRU) if selected', () => {
      const targetKey = 'generalUse'
      const modifiedMockData = makeDataUse({
        [targetKey]: true,
        diseaseRestrictions: [],
      })

      expectTranslatedLimitation(targetKey, modifiedMockData)
    })

    it('does not translate GRU if HMB is selected', () => {
      const targetKey = 'generalUse'
      const modifiedMockData = makeDataUse({
        [targetKey]: true,
        hmbResearch: true,
        diseaseRestrictions: [],
      })
      const response = processDefinedLimitations(targetKey, modifiedMockData, consentTranslations)

      expect(isEmpty(response)).toBe(true)
    })

    it('does not translate GRU if diseaseRestrictions is populated', () => {
      const targetKey = 'generalUse'
      const modifiedMockData = makeDataUse({
        [targetKey]: true,
        diseaseRestrictions: ['test'],
      })
      const response = processDefinedLimitations(targetKey, modifiedMockData, consentTranslations)

      expect(isEmpty(response)).toBe(true)
    })

    it('does not translate GRU if POA is selected', () => {
      const targetKey = 'generalUse'
      const modifiedMockData = makeDataUse({
        [targetKey]: true,
        populationOriginsAncestry: true,
        diseaseRestrictions: [],
      })
      const response = processDefinedLimitations(targetKey, modifiedMockData, consentTranslations)

      expect(isEmpty(response)).toBe(true)
    })

    it('translates Pediatric Studies (PSO) if pediatric is selected', () => {
      const targetKey = 'pediatric'
      const modifiedMockData = makeDataUse({
        [targetKey]: true,
        diseaseRestrictions: [],
      })

      expectTranslatedLimitation(targetKey, modifiedMockData)
    })

    it('translates Gender Studies (GSO) if gender is selected', () => {
      const targetKey = 'gender'
      const modifiedMockData = makeDataUse({
        [targetKey]: 'female',
        diseaseRestrictions: [],
      })

      expectTranslatedLimitation(targetKey, modifiedMockData)
    })
  })
})
