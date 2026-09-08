import { describe, it, expect } from 'vitest'
import { ConsentGroup, selectedPrimaryGroup } from 'src/pages/data_submission/consent_group/consentGroupUtils'

describe('selectedPrimaryGroup', () => {
  it.each([
    ['generalResearchUse', { generalResearchUse: true }],
    ['hmb', { hmb: true }],
    ['poa', { poa: true }],
    ['diseaseSpecificUse', { diseaseSpecificUse: ['DOID_1234'] }],
    ['otherPrimary', { otherPrimary: 'Bespoke restriction' }],
  ] satisfies [string, ConsentGroup][])('selects %s when it is the only primary', (expected, consentGroup) => {
    expect(selectedPrimaryGroup(consentGroup)).toBe(expected)
  })

  it('returns undefined when no primary is set', () => {
    expect(selectedPrimaryGroup({} as ConsentGroup)).toBeUndefined()
  })

  it('returns undefined for a nil consent group', () => {
    expect(selectedPrimaryGroup(undefined as unknown as ConsentGroup)).toBeUndefined()
  })

  it('ignores a false boolean primary', () => {
    const consentGroup: ConsentGroup = { generalResearchUse: false, hmb: true }

    expect(selectedPrimaryGroup(consentGroup)).toBe('hmb')
  })

  // Only audited legacy records hold more than one primary; Consent rejects such writes now.
  describe('legacy multi-primary records resolve in the canonical classifier order', () => {
    it.each([
      ['generalResearchUse', { generalResearchUse: true, hmb: true, poa: true, diseaseSpecificUse: ['DOID_1'], otherPrimary: 'x' }],
      ['hmb', { hmb: true, poa: true, diseaseSpecificUse: ['DOID_1'], otherPrimary: 'x' }],
      ['poa', { poa: true, diseaseSpecificUse: ['DOID_1'], otherPrimary: 'x' }],
      ['diseaseSpecificUse', { diseaseSpecificUse: ['DOID_1'], otherPrimary: 'x' }],
    ] satisfies [string, ConsentGroup][])('resolves to %s', (expected, consentGroup) => {
      expect(selectedPrimaryGroup(consentGroup)).toBe(expected)
    })

    // The one multi-primary shape the production audit found
    it('resolves HMB+OTHER to hmb', () => {
      const consentGroup: ConsentGroup = { hmb: true, otherPrimary: 'Not for profit' }

      expect(selectedPrimaryGroup(consentGroup)).toBe('hmb')
    })

    // POA precedes DS in DataUsePrimaryCategory, unlike the previous DS-first order
    it('resolves POA+DS to poa', () => {
      const consentGroup: ConsentGroup = { poa: true, diseaseSpecificUse: ['DOID_1'] }

      expect(selectedPrimaryGroup(consentGroup)).toBe('poa')
    })
  })

  // Deliberate divergence from the classifier, which needs a non-empty list to classify as DS:
  // the radio has to stay lit while the user is still picking diseases. calcErrors blocks the save.
  it('treats an empty disease list as a selected primary', () => {
    const consentGroup: ConsentGroup = { diseaseSpecificUse: [] }

    expect(selectedPrimaryGroup(consentGroup)).toBe('diseaseSpecificUse')
  })
})
