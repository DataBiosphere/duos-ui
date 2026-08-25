import { describe, it, expect } from 'vitest'
import {
  buildBlankStudyTemplateV1,
  escapeCsvCell,
} from 'src/libs/studyTemplate/studyTemplateV1Csv'
import {
  CONSENT_GROUP_FIELDS,
  FILE_TYPE_FIELDS,
  SCAFFOLD_RECORD_ID,
  STUDY_FIELDS,
} from 'src/libs/studyTemplate/studyTemplateV1Manifest'
import { parseTemplateCsv } from './csvTestParser'

const CANONICAL_HEADER = 'templateVersion,recordType,recordId,parentRecordId,field,value'

describe('escapeCsvCell', () => {
  it.each([
    ['=SUM(A1:A2)', '\'=SUM(A1:A2)'],
    ['+1234', '\'+1234'],
    ['-1234', '\'-1234'],
    ['@example', '\'@example'],
  ])('neutralizes the formula prefix in %s', (input, expected) => {
    expect(escapeCsvCell(input)).toBe(expected)
  })

  it('neutralizes a formula prefix hidden behind leading whitespace', () => {
    expect(escapeCsvCell('  =SUM(A1)')).toBe('\'  =SUM(A1)')
  })

  it.each([
    ['plain text', 'plain text'],
    ['', ''],
    ['a-b', 'a-b'],
    ['user@example.org', 'user@example.org'],
  ])('leaves %s alone', (input, expected) => {
    expect(escapeCsvCell(input)).toBe(expected)
  })

  it('quotes cells containing a comma', () => {
    expect(escapeCsvCell('one, two')).toBe('"one, two"')
  })

  it('doubles and quotes embedded quotes', () => {
    expect(escapeCsvCell('say "hi"')).toBe('"say ""hi"""')
  })

  it('quotes cells containing a newline', () => {
    expect(escapeCsvCell('line one\nline two')).toBe('"line one\nline two"')
  })

  it('neutralizes and quotes when a cell needs both', () => {
    expect(escapeCsvCell('=one, two')).toBe('"\'=one, two"')
  })
})

describe('buildBlankStudyTemplateV1', () => {
  const csv = buildBlankStudyTemplateV1()
  const { header, rows } = parseTemplateCsv(csv)

  it('starts with the canonical header, byte for byte', () => {
    expect(csv.startsWith(`${CANONICAL_HEADER}\r\n`)).toBe(true)
  })

  it('parses the header back to the six contract columns', () => {
    expect(header).toEqual(['templateVersion', 'recordType', 'recordId', 'parentRecordId', 'field', 'value'])
  })

  it('uses CRLF separators and no BOM', () => {
    expect(csv.startsWith('\uFEFF')).toBe(false)
    expect(csv).toContain('\r\n')
    expect(csv.replaceAll('\r\n', '')).not.toContain('\n')
  })

  it('emits one row per offered field', () => {
    expect(rows).toHaveLength(STUDY_FIELDS.length + CONSENT_GROUP_FIELDS.length + FILE_TYPE_FIELDS.length)
    expect(rows).toHaveLength(51)
  })

  it('leaves every value cell empty', () => {
    expect(rows.every(row => row.value === '')).toBe(true)
  })

  it('marks every row as major version 1', () => {
    expect(new Set(rows.map(row => row.templateVersion))).toEqual(new Set(['1']))
  })

  it('scaffolds the study record with the required id and no parent', () => {
    const studyRows = rows.filter(row => row.recordType === 'study')
    expect(studyRows.map(row => row.field)).toEqual([...STUDY_FIELDS])
    expect(studyRows.every(row => row.recordId === 'study')).toBe(true)
    expect(studyRows.every(row => row.parentRecordId === '')).toBe(true)
  })

  it('parents the consent group to the study record', () => {
    const consentGroupRows = rows.filter(row => row.recordType === 'consentGroup')
    expect(consentGroupRows.map(row => row.field)).toEqual([...CONSENT_GROUP_FIELDS])
    expect(consentGroupRows.every(row => row.recordId === SCAFFOLD_RECORD_ID.consentGroup)).toBe(true)
    expect(consentGroupRows.every(row => row.parentRecordId === SCAFFOLD_RECORD_ID.study)).toBe(true)
  })

  it('parents the file type to the consent group record, not the study', () => {
    const fileTypeRows = rows.filter(row => row.recordType === 'fileType')
    expect(fileTypeRows.map(row => row.field)).toEqual([...FILE_TYPE_FIELDS])
    expect(fileTypeRows.every(row => row.recordId === SCAFFOLD_RECORD_ID.fileType)).toBe(true)
    expect(fileTypeRows.every(row => row.parentRecordId === SCAFFOLD_RECORD_ID.consentGroup)).toBe(true)
  })

  it('groups rows study, then consent group, then file type', () => {
    const order = [...new Set(rows.map(row => row.recordType))]
    expect(order).toEqual(['study', 'consentGroup', 'fileType'])
  })

  // The escape guard is applied to every cell, but nothing the manifest currently emits triggers it.
  // If this fails, a newly offered field starts with =, +, - or @ and the generated file would carry
  // a leading apostrophe the producer did not ask for.
  it('needs no formula escaping for any cell it currently emits', () => {
    expect(csv).not.toContain('\'')
  })

  it('offers no field Consent excludes from v1', () => {
    const fields = new Set(rows.map(row => row.field))
    for (const excluded of ['assets', 'data', 'consentGroups', 'fileTypes', 'datasetId', 'alternativeDataSharingPlanFileName']) {
      expect(fields.has(excluded)).toBe(false)
    }
  })
})
