import { beforeEach, describe, it, expect, vi } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import {
  datasetSchemaSubmissionToStudy,
  extractThroughBioId,
  getStudyPropertyValueByKey,
  studyToDatasetSchemaSubmission,
} from 'src/pages/data_submission/v2/v2-common-functions'
import { DatasetRegistrationSchemaV1 } from 'src/pages/data_submission/v2/v2-models'
import { DraftDetail } from 'src/types/draft'

vi.mock('src/libs/storage', () => ({
  Storage: {
    // The form falls back to the submitter's institution when a document carries none. Held empty
    // so a round trip shows what the document said rather than what the session would add.
    getCurrentUser: () => ({}),
  },
}))

const draftDocument = (): DatasetRegistrationSchemaV1 => {
  const detail: DraftDetail<DatasetRegistrationSchemaV1> = JSON.parse(readFileSync(
    resolve(__dirname, '../../../fixtures/study-template/v1/draft/minimal-valid-draft-detail.json'),
    'utf8',
  ))
  return detail.document
}

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

describe('datasetSchemaSubmissionToStudy', () => {
  it('populates the scalar fields the form reads directly', () => {
    const study = datasetSchemaSubmissionToStudy(draftDocument())

    expect(study.name).toBe('Synthetic Minimal Study')
    expect(study.description).toBe('A synthetic study used only for contract tests.')
    expect(study.dataTypes).toEqual(['Genomic'])
    expect(study.piName).toBe('Synthetic Investigator')
    expect(study.publicVisibility).toBe(true)
  })

  it('populates the fields the form reads as study properties', () => {
    const study = datasetSchemaSubmissionToStudy(draftDocument())

    expect(getStudyPropertyValueByKey(study, 'nihAnvilUse'))
      .toBe('I am not NHGRI funded and do not plan to store data in AnVIL')
  })

  it('carries consent groups as assets, with their ordering', () => {
    const document = draftDocument()
    document.consentGroups = [
      { consentGroupName: 'First', accessManagement: 'open', numberOfParticipants: 1 },
      { consentGroupName: 'Second', accessManagement: 'controlled', numberOfParticipants: 2 },
    ] as DatasetRegistrationSchemaV1['consentGroups']

    const study = datasetSchemaSubmissionToStudy(document)

    expect(study.assets?.consentGroups?.map(group => group.consentGroupName))
      .toEqual(['First', 'Second'])
  })

  it('writes no property for a field the document leaves out', () => {
    // The document omits what the producer left empty, so a property written here would submit a
    // value they never gave.
    const study = datasetSchemaSubmissionToStudy(draftDocument())

    expect(study.properties?.map(property => property.key)).not.toContain('embargoReleaseDate')
    expect(study.properties?.map(property => property.key)).not.toContain('phenotypeIndication')
    expect(study.piEmail).toBeUndefined()
  })

  it('does not share structure with the document it mapped', () => {
    const document = draftDocument()

    const study = datasetSchemaSubmissionToStudy(document)
    study.assets!.consentGroups![0].consentGroupName = 'Edited in the form'

    expect(document.consentGroups[0].consentGroupName).toBe('Synthetic Open Dataset')
  })
})

describe('draft document round trip', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns every field the document carried', () => {
    const document = draftDocument()

    const submitted = studyToDatasetSchemaSubmission(datasetSchemaSubmissionToStudy(document))

    Object.entries(document).forEach(([field, value]) => {
      expect(submitted[field as keyof DatasetRegistrationSchemaV1]).toEqual(value)
    })
  })

  it('invents nothing the document left out', () => {
    const document = draftDocument()

    const submitted = JSON.parse(JSON.stringify(
      studyToDatasetSchemaSubmission(datasetSchemaSubmissionToStudy(document)),
    ))

    // Two additions, neither a value the producer gave: the form always carries the metadata bag,
    // and the forward mapper always emits an assets object once consent groups are lifted out of
    // it. Both are empty.
    expect(Object.keys(submitted).sort())
      .toEqual([...Object.keys(document), 'data', 'assets'].sort())
    expect(submitted.data).toEqual({})
    expect(submitted.assets).toEqual({})
  })

  it('round trips the optional fields a fuller document carries', () => {
    const document: DatasetRegistrationSchemaV1 = {
      ...draftDocument(),
      piEmail: 'investigator@example.org',
      phenotypeIndication: 'Synthetic indication',
      species: 'Homo sapiens',
      dataCustodianEmail: ['custodian@example.org'],
      embargoReleaseDate: '2030-01-01',
      piInstitution: 7,
      multiCenterStudy: true,
      collaboratingSites: ['Site A', 'Site B'],
      alternativeDataSharingPlan: true,
      alternativeDataSharingPlanExplanation: 'Synthetic explanation',
    }

    const submitted = studyToDatasetSchemaSubmission(datasetSchemaSubmissionToStudy(document))

    Object.entries(document).forEach(([field, value]) => {
      expect(submitted[field as keyof DatasetRegistrationSchemaV1]).toEqual(value)
    })
  })

  it('round trips a boolean the document set to false', () => {
    const document: DatasetRegistrationSchemaV1 = {
      ...draftDocument(),
      submittingToAnvil: false,
      multiCenterStudy: false,
      controlledAccessRequiredForGenomicSummaryResultsGSR: false,
      alternativeDataSharingPlan: false,
      alternativeDataSharingPlanDataReleased: false,
    }

    const submitted = studyToDatasetSchemaSubmission(datasetSchemaSubmissionToStudy(document))

    expect(submitted.submittingToAnvil).toBe(false)
    expect(submitted.multiCenterStudy).toBe(false)
    expect(submitted.controlledAccessRequiredForGenomicSummaryResultsGSR).toBe(false)
    expect(submitted.alternativeDataSharingPlan).toBe(false)
    expect(submitted.alternativeDataSharingPlanDataReleased).toBe(false)
  })
})
