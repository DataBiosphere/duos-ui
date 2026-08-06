import { readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'
import { parse } from 'csv-parse/sync'
import { describe, expect, it } from 'vitest'

const fixtureRoot = path.resolve(process.cwd(), 'test/fixtures/study-template/v1')
const headers = [
  'templateVersion',
  'recordType',
  'recordId',
  'parentRecordId',
  'field',
  'value',
]
const maxBytes = 5 * 1024 * 1024

type CsvRow = string[]
type ExpectedError = {
  row?: number
  column?: string
  message: string
}

const csvFiles = (kind: 'valid' | 'invalid') => readdirSync(path.join(fixtureRoot, kind))
  .filter(name => name.endsWith('.csv'))
  .sort()

const fixturePath = (kind: 'valid' | 'invalid', name: string) => path.join(fixtureRoot, kind, name)

const decodeUtf8 = (file: string) => {
  const bytes = readFileSync(file)
  expect(bytes.byteLength, file).toBeLessThanOrEqual(maxBytes)
  return new TextDecoder('utf-8', { fatal: true }).decode(bytes)
}

const parseFixture = (file: string): CsvRow[] => parse(decodeUtf8(file), {
  bom: true,
  relax_column_count: true,
  skip_empty_lines: true,
}) as CsvRow[]

const fieldKey = (row: CsvRow) => [row[1], row[2], row[4]].join('\u0000')

const expectNoDuplicateFields = (rows: CsvRow[], file: string) => {
  const keys = new Set<string>()
  rows.slice(1).forEach((row) => {
    const key = fieldKey(row)
    expect(keys.has(key), `${file} duplicates ${key}`).toBe(false)
    keys.add(key)
  })
}

const expectedErrors = (csvName: string): ExpectedError[] => {
  const manifest = fixturePath('invalid', csvName.replace(/\.csv$/, '.errors.json'))
  return JSON.parse(decodeUtf8(manifest)) as ExpectedError[]
}

describe('study-template v1 canonical fixtures', () => {
  it('keeps the required valid fixture set parseable and versioned', () => {
    const fixtures = csvFiles('valid')
    expect(fixtures).toEqual(['minimal-valid.csv', 'multi-consent-group-valid.csv'])

    fixtures.forEach((name) => {
      const file = fixturePath('valid', name)
      const rows = parseFixture(file)
      expect(rows[0], file).toEqual(headers)
      expect(new Set(rows[0]).size, file).toBe(headers.length)
      expect(rows.length, file).toBeGreaterThan(1)
      expect(rows.slice(1).every(row => row[0] === '1'), file).toBe(true)
      expect(rows.slice(1).every(row => row.length === headers.length), file).toBe(true)
      expectNoDuplicateFields(rows, file)

      rows.slice(1).forEach((row) => {
        const value = row[5]
        if (value.startsWith('[') || value.startsWith('{')) {
          expect(() => JSON.parse(value), `${file} row ${row.join(',')}`).not.toThrow()
        }
      })
    })
  })

  it('records structured expected errors for every invalid fixture', () => {
    const fixtures = csvFiles('invalid')
    expect(fixtures).toEqual([
      'duplicate-field.csv',
      'duplicate-header.csv',
      'empty-file.csv',
      'field-values.csv',
      'unknown-field.csv',
      'unsupported-version.csv',
    ])

    fixtures.forEach((name) => {
      const rows = name === 'empty-file.csv'
        ? []
        : parseFixture(fixturePath('invalid', name))
      if (name !== 'empty-file.csv') expect(rows.length, name).toBeGreaterThan(1)

      const errors = expectedErrors(name)
      expect(errors.length, name).toBeGreaterThan(0)
      errors.forEach((error) => {
        expect(error.message, name).toEqual(expect.any(String))
        expect(error.message.length, name).toBeGreaterThan(0)
        if (error.row !== undefined) {
          expect(error.row, name).toBeGreaterThan(0)
          expect(error.row, name).toBeLessThanOrEqual(rows.length)
        }
        if (error.column !== undefined) expect(headers, name).toContain(error.column)
      })
    })
  })

  it('preserves each intentional structural invalidity', () => {
    const duplicateHeader = parseFixture(fixturePath('invalid', 'duplicate-header.csv'))[0]
    expect(new Set(duplicateHeader).size).toBeLessThan(duplicateHeader.length)

    const duplicateField = parseFixture(fixturePath('invalid', 'duplicate-field.csv'))
    const fieldKeys = duplicateField.slice(1).map(fieldKey)
    expect(new Set(fieldKeys).size).toBeLessThan(fieldKeys.length)

    const unsupportedVersion = parseFixture(fixturePath('invalid', 'unsupported-version.csv'))
    expect(unsupportedVersion.slice(1).every(row => row[0] !== '1')).toBe(true)

    expect(decodeUtf8(fixturePath('invalid', 'empty-file.csv'))).toBe('')
  })
})
