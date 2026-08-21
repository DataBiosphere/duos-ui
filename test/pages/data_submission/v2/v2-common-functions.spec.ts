import { describe, it, expect } from 'vitest'
import { buildConsentGroupsFromStudy, extractThroughBioId } from 'src/pages/data_submission/v2/v2-common-functions'
import { Study } from 'src/pages/data_submission/v2/v2-models'
import { DataUse } from 'src/types/model'

describe('extractThroughBioId', () => {
  const validUrls: [string, string][] = [
    ['https://through.bio/abc123', 'abc123'],
    ['https://through.bio/xyz', 'xyz'],
    ['https://through.bio/abc/def', 'abc/def'],
  ]
  validUrls.forEach(([input, expected]) => {
    it(`extracts ID "${expected}" from "${input}"`, () => {
      expect(extractThroughBioId(input)).toBe(expected)
    })
  })

  const invalidUrls = [
    'https://example.com/abc123',
    'https://throughbio.com/abc',
  ]
  invalidUrls.forEach((input) => {
    it(`returns empty string for invalid URL "${input}"`, () => {
      expect(extractThroughBioId(input)).toBe('')
    })
  })

  const nonUrlStrings: [string, string][] = [
    ['  myid  ', 'myid'],
    ['anotherId', 'anotherId'],
  ]
  nonUrlStrings.forEach(([input, expected]) => {
    it(`returns trimmed input "${expected}" for non-URL "${input}"`, () => {
      expect(extractThroughBioId(input)).toBe(expected)
    })
  })

  const emptyInputs = ['', '   ']
  emptyInputs.forEach((input) => {
    it(`returns empty string for empty input "${JSON.stringify(input)}"`, () => {
      expect(extractThroughBioId(input)).toBe('')
    })
  })
})

describe('buildConsentGroupsFromStudy primary data use', () => {
  const studyWithDataUse = (dataUse: DataUse): Study => ({
    datasets: [{ datasetId: 1, name: 'DS 1', dataUse, properties: [] }],
  } as unknown as Study)

  // An empty array would light the Disease-Specific radio beside the record's real primary
  it('treats an empty diseaseRestrictions as no disease-specific primary', () => {
    const [consentGroup] = buildConsentGroupsFromStudy(studyWithDataUse({ diseaseRestrictions: [], other: 'Not for profit' } as DataUse))

    expect(consentGroup.diseaseSpecificUse).toBeUndefined()
    expect(consentGroup.otherPrimary).toBe('Not for profit')
  })

  it('keeps a populated diseaseRestrictions', () => {
    const [consentGroup] = buildConsentGroupsFromStudy(studyWithDataUse({ diseaseRestrictions: ['DOID_1'] } as DataUse))

    expect(consentGroup.diseaseSpecificUse).toEqual(['DOID_1'])
  })
})
