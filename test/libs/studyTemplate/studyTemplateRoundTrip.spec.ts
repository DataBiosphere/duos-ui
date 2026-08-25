import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, it, expect } from 'vitest'
import { buildBlankStudyTemplateV1 } from 'src/libs/studyTemplate/studyTemplateV1Csv'
import { SCAFFOLD_RECORD_ID } from 'src/libs/studyTemplate/studyTemplateV1Manifest'
import { TemplateRow, parseTemplateCsv } from './csvTestParser'

/**
 * Asserts the structural claim behind the round-trip acceptance criterion: a producer can fill in the
 * downloaded template and reach a file Consent accepts, without adding or rearranging structural
 * columns. The Java validator cannot run here, so the canonical fixtures stand in as the expected
 * shape — see `test/fixtures/study-template/v1/README.md` for their provenance.
 */

// Resolved from the project root rather than import.meta.url: under vitest's vmThreads pool the
// module URL is rooted at the project, so a relative URL escapes the repository.
const readFixture = (name: string): string =>
  readFileSync(resolve(process.cwd(), 'test/fixtures/study-template/v1/valid', name), 'utf8')

const minimalValid = parseTemplateCsv(readFixture('minimal-valid.csv'))
const multiConsentGroupValid = parseTemplateCsv(readFixture('multi-consent-group-valid.csv'))

const generated = buildBlankStudyTemplateV1()
const scaffold = parseTemplateCsv(generated)

const fieldKey = (row: TemplateRow): string => `${row.recordType}|${row.field}`
const identity = (row: TemplateRow): string => `${row.recordType}|${row.field}|${row.value}`

describe('blank template round trip', () => {
  it('reads both canonical fixtures', () => {
    expect(minimalValid.rows.length).toBeGreaterThan(0)
    expect(multiConsentGroupValid.rows.length).toBeGreaterThan(0)
  })

  it.each([
    ['minimal-valid.csv', minimalValid],
    ['multi-consent-group-valid.csv', multiConsentGroupValid],
  ])('shares its header with %s', (_name, fixture) => {
    expect(scaffold.header).toEqual(fixture.header)
  })

  // If this fails, a producer filling in the download would have to hand-author a row — exactly the
  // failure the download exists to prevent.
  it.each([
    ['minimal-valid.csv', minimalValid],
    ['multi-consent-group-valid.csv', multiConsentGroupValid],
  ])('offers every field %s uses', (_name, fixture) => {
    const offered = new Set(scaffold.rows.map(fieldKey))
    const missing = [...new Set(fixture.rows.map(fieldKey))].filter(key => !offered.has(key))
    expect(missing).toEqual([])
  })

  describe('filling the scaffold from minimal-valid.csv', () => {
    // The scaffold and the fixture each hold exactly one consent group, so mapping the scaffold's
    // template-only recordId onto the fixture's is unambiguous. recordId never reaches the wire.
    const recordIds = (rows: TemplateRow[], recordType: string): string[] =>
      [...new Set(rows.filter(row => row.recordType === recordType).map(row => row.recordId))]

    it('has one consent group on each side, so record ids map positionally', () => {
      expect(recordIds(scaffold.rows, 'consentGroup')).toEqual([SCAFFOLD_RECORD_ID.consentGroup])
      expect(recordIds(minimalValid.rows, 'consentGroup')).toEqual(['dataset-open'])
    })

    it('reproduces the fixture exactly once the value cells are filled in', () => {
      const fixtureValues = new Map(minimalValid.rows.map(row => [fieldKey(row), row.value]))

      const filled = scaffold.rows
        .filter(row => fixtureValues.has(fieldKey(row)))
        .map(row => ({ ...row, value: fixtureValues.get(fieldKey(row))! }))

      expect(filled.map(identity).sort()).toEqual(minimalValid.rows.map(identity).sort())
    })

    it('keeps the structural columns untouched while filling values', () => {
      const fixtureFields = new Set(minimalValid.rows.map(fieldKey))
      const filled = scaffold.rows.filter(row => fixtureFields.has(fieldKey(row)))

      expect(filled.every(row => row.templateVersion === '1')).toBe(true)
      expect(filled.filter(row => row.recordType === 'study').every(row => row.parentRecordId === '')).toBe(true)
      expect(filled.filter(row => row.recordType === 'consentGroup')
        .every(row => row.parentRecordId === SCAFFOLD_RECORD_ID.study)).toBe(true)
    })

    it('leaves the unused optional rows for the producer to delete', () => {
      const fixtureFields = new Set(minimalValid.rows.map(fieldKey))
      const unused = scaffold.rows.filter(row => !fixtureFields.has(fieldKey(row)))

      expect(unused).toHaveLength(scaffold.rows.length - minimalValid.rows.length)
      expect(unused.every(row => row.value === '')).toBe(true)
    })
  })

  /**
   * multi-consent-group-valid.csv repeats rows for multi-item `dataTypes`/`dataCustodianEmail` and
   * adds a second consent group. Both are row additions, which the contract documents as the expected
   * producer edit, so this fixture backs the field-coverage assertion above rather than a strict
   * row-for-row round trip. Asserting equality here would be asserting the scaffold pre-empts choices
   * only the producer can make.
   */
  it('needs added rows, not new fields, for repeated values and extra datasets', () => {
    const repeated = multiConsentGroupValid.rows.filter((row, _index, rows) =>
      rows.filter(other => fieldKey(other) === fieldKey(row) && other.recordId === row.recordId).length > 1)
    expect(repeated.length).toBeGreaterThan(0)

    const consentGroupIds = new Set(multiConsentGroupValid.rows
      .filter(row => row.recordType === 'consentGroup')
      .map(row => row.recordId))
    expect(consentGroupIds.size).toBeGreaterThan(1)

    const offered = new Set(scaffold.rows.map(fieldKey))
    expect([...new Set(multiConsentGroupValid.rows.map(fieldKey))].every(key => offered.has(key))).toBe(true)
  })
})
