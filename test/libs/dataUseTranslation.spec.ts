import '@testing-library/jest-dom/vitest'
import { describe, expect, it } from 'vitest'
import { processDefinedLimitations, consentTranslations, ControlledAccessType, DataUseTranslation, TranslationEntry } from 'src/libs/dataUseTranslation'

describe('Data Use Translation', () => {
  describe('processDefinedLimitations()', () => {
    // The caller guards on the key being set, so the lookup is all that remains.
    it.each(['populationOriginsAncestry', 'hmbResearch', 'generalUse', 'pediatric', 'gender'])(
      'translates %s',
      (targetKey) => {
        const response = processDefinedLimitations(targetKey, consentTranslations)
        const targetTranslation = consentTranslations[targetKey] as TranslationEntry

        expect(response).toBeDefined()
        expect(response?.code).toBe(targetTranslation.code)
        expect(response?.description).toBe(targetTranslation.description)
      },
    )

    it('leaves an ontology-backed entry to the path that resolves it', () => {
      expect(processDefinedLimitations('diseaseRestrictions', consentTranslations)).toBeUndefined()
    })
  })

  // A primary Other is a permission, like OTHER in the classifier; only a secondary one is not
  describe('other restriction classification', () => {
    const findByCode = (entries: TranslationEntry[], code: string) => entries.find(entry => entry.code === code)

    it('classifies a primary Other as a permission', async () => {
      const entries = await DataUseTranslation.translateDataUseRestrictions({
        diseaseRestrictions: [],
        other: 'Bespoke restriction',
      })

      expect(findByCode(entries, 'OTH1')?.type).toBe(ControlledAccessType.permissions)
      expect(findByCode(entries, 'OTH1')?.description).toContain('Bespoke restriction')
    })

    it('classifies a secondary Other as a modifier', async () => {
      const entries = await DataUseTranslation.translateDataUseRestrictions({
        diseaseRestrictions: [],
        secondaryOther: 'Bespoke secondary restriction',
      })

      expect(findByCode(entries, 'OTH2')?.type).toBe(ControlledAccessType.modifiers)
      expect(findByCode(entries, 'OTH1')).toBeUndefined()
    })

    it('classifies each tier independently when both are present', async () => {
      const entries = await DataUseTranslation.translateDataUseRestrictions({
        diseaseRestrictions: [],
        other: 'Primary text',
        secondaryOther: 'Secondary text',
      })

      expect(findByCode(entries, 'OTH1')?.type).toBe(ControlledAccessType.permissions)
      expect(findByCode(entries, 'OTH2')?.type).toBe(ControlledAccessType.modifiers)
    })
  })
})
