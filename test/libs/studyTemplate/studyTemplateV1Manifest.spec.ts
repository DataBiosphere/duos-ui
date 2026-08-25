import { describe, it, expect } from 'vitest'
import {
  CONSENT_GROUP_FIELDS,
  EXCLUDED_CONSENT_GROUP_FIELDS,
  EXCLUDED_STUDY_FIELDS,
  FILE_TYPE_FIELDS,
  RECORD_TYPE,
  SCAFFOLD_RECORD_ID,
  STUDY_FIELDS,
  TEMPLATE_HEADER,
  TEMPLATE_VERSION,
} from 'src/libs/studyTemplate/studyTemplateV1Manifest'

describe('studyTemplateV1Manifest', () => {
  it('declares the canonical header in contract order', () => {
    expect([...TEMPLATE_HEADER]).toEqual([
      'templateVersion',
      'recordType',
      'recordId',
      'parentRecordId',
      'field',
      'value',
    ])
  })

  it('declares major version 1', () => {
    expect(TEMPLATE_VERSION).toBe('1')
  })

  it('offers every supported field and no more', () => {
    expect(STUDY_FIELDS).toHaveLength(27)
    expect(CONSENT_GROUP_FIELDS).toHaveLength(22)
    expect(FILE_TYPE_FIELDS).toHaveLength(2)
  })

  it('lists study fields in StudyRegistrationRequest wire order', () => {
    expect(STUDY_FIELDS[0]).toBe('studyName')
    expect(STUDY_FIELDS[3]).toBe('dataTypes')
    expect(STUDY_FIELDS[9]).toBe('publicVisibility')
    expect(STUDY_FIELDS[26]).toBe('controlledAccessRequiredForGenomicSummaryResultsGSRRequiredExplanation')
  })

  it('lists consent-group fields in ConsentGroupRequest wire order', () => {
    expect(CONSENT_GROUP_FIELDS[0]).toBe('consentGroupName')
    expect(CONSENT_GROUP_FIELDS[1]).toBe('accessManagement')
    expect(CONSENT_GROUP_FIELDS[21]).toBe('numberOfParticipants')
  })

  it('lists file-type fields in FileTypeObject wire order', () => {
    expect([...FILE_TYPE_FIELDS]).toEqual(['fileType', 'functionalEquivalence'])
  })

  it.each([
    ['study', STUDY_FIELDS],
    ['consentGroup', CONSENT_GROUP_FIELDS],
    ['fileType', FILE_TYPE_FIELDS],
  ])('names each %s field once', (_recordType, fields) => {
    expect(new Set(fields).size).toBe(fields.length)
  })

  // Consent rejects these by name rather than as unknown fields, so offering one would produce a
  // template that cannot validate.
  it('offers no study field excluded from v1', () => {
    const excluded = new Set<string>(EXCLUDED_STUDY_FIELDS)
    expect(STUDY_FIELDS.filter(field => excluded.has(field))).toEqual([])
  })

  it('offers no consent-group field excluded from v1', () => {
    const excluded = new Set<string>(EXCLUDED_CONSENT_GROUP_FIELDS)
    expect(CONSENT_GROUP_FIELDS.filter(field => excluded.has(field))).toEqual([])
  })

  it('excludes the free-form JSON wire properties', () => {
    expect(EXCLUDED_STUDY_FIELDS).toContain('assets')
    expect(EXCLUDED_STUDY_FIELDS).toContain('data')
    expect(EXCLUDED_CONSENT_GROUP_FIELDS).toContain('data')
  })

  it('excludes the whole alternative-sharing-plan group, not just its filename', () => {
    const alternativePlanFields = EXCLUDED_STUDY_FIELDS.filter(field =>
      field.startsWith('alternativeDataSharingPlan'))
    expect(alternativePlanFields).toHaveLength(10)
  })

  // consentGroups and fileTypes are record types, so they are neither offered as fields nor listed
  // as excluded — a producer supplies them as rows of their own recordType.
  it('treats nested wire arrays as record types rather than fields', () => {
    expect(STUDY_FIELDS).not.toContain('consentGroups')
    expect(CONSENT_GROUP_FIELDS).not.toContain('fileTypes')
    expect(Object.values(RECORD_TYPE)).toEqual(['study', 'consentGroup', 'fileType'])
  })

  it('fixes the study record id, which the contract requires to be "study"', () => {
    expect(SCAFFOLD_RECORD_ID.study).toBe('study')
  })
})
