import { describe, it, expect } from 'vitest'
import { processDefinedLimitations, consentTranslations, TranslationEntry } from 'src/libs/dataUseTranslation'
import { cloneDeep } from 'src/utils/NodashUtil'
import { DataUse } from 'src/types/model'

interface MockDataUse extends DataUse {
  [key: string]: boolean | string | string[] | undefined
}

const mockDataUse: MockDataUse = {
  diseaseRestrictions: [],
}

describe('Data Use Translation', () => {
  describe('procesDefinedLimitations()', () => {
    it.each([
      ['populationOriginsAncestry', 'Populations, Origins, and Ancestry (POA)'],
      ['hmbResearch', 'HMB'],
      ['generalUse', 'General Research Use (GRU)'],
      ['pediatric', 'Pediatric Studies (PSO)'],
      ['gender', 'Gender Studies (GSO)'],
    ])('translates %s (%s) when marked in the data use', (targetKey) => {
      const modifiedMockData: MockDataUse = Object.assign(cloneDeep(mockDataUse), { [targetKey]: true, diseaseRestrictions: [] })
      const resp = processDefinedLimitations(targetKey, modifiedMockData, consentTranslations)
      const targetTranslation = consentTranslations[targetKey] as TranslationEntry
      expect(resp).toBeDefined()
      expect(resp?.code).toBe(targetTranslation.code)
      expect(resp?.description).toBe(targetTranslation.description)
    })

    it('does not translate HMB if diseaseRestrictions is populated', () => {
      const targetKey = 'hmbResearch'
      const modifiedMockData: MockDataUse = Object.assign(cloneDeep(mockDataUse), {
        diseaseRestrictions: ['test'],
        [targetKey]: true,
      })
      expect(processDefinedLimitations(targetKey, modifiedMockData, consentTranslations)).toBeUndefined()
    })

    it('does not translate GRU if HMB is selected', () => {
      const targetKey = 'generalUse'
      const modifiedMockData: MockDataUse = Object.assign(cloneDeep(mockDataUse), {
        [targetKey]: true,
        hmbResearch: true,
        diseaseRestrictions: [],
      })
      expect(processDefinedLimitations(targetKey, modifiedMockData, consentTranslations)).toBeUndefined()
    })

    it('does not translate GRU if diseaseRestrictions is populated', () => {
      const targetKey = 'generalUse'
      const modifiedMockData: MockDataUse = Object.assign(cloneDeep(mockDataUse), {
        [targetKey]: true,
        diseaseRestrictions: ['test'],
      })
      expect(processDefinedLimitations(targetKey, modifiedMockData, consentTranslations)).toBeUndefined()
    })

    it('does not translate GRU if POA is selected', () => {
      const targetKey = 'generalUse'
      const modifiedMockData: MockDataUse = Object.assign(cloneDeep(mockDataUse), {
        [targetKey]: true,
        populationOriginsAncestry: true,
        diseaseRestrictions: [],
      })
      expect(processDefinedLimitations(targetKey, modifiedMockData, consentTranslations)).toBeUndefined()
    })
  })
})
