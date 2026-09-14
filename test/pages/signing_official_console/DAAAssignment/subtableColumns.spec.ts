import { describe, it, expect } from 'vitest'
import {
  ACTION_COLUMN,
  normalizedWidths,
  withoutActionColumn,
} from 'src/pages/signing_official_console/DAAAssignment/subtableColumns'

const HEADERS = [
  'Researcher',
  'Email',
  'Institution',
  'Pre-Auth Status',
  'Pre-authorized By',
  ACTION_COLUMN,
] as const

type Header = (typeof HEADERS)[number]

const WIDTHS: Record<Header, string> = {
  'Researcher': '23%',
  'Email': '25%',
  'Institution': '20%',
  'Pre-Auth Status': '17%',
  'Pre-authorized By': '20%',
  'Action': '15%',
}

// What the SO console renders: everything except Institution.
const MANAGED_COLUMNS = HEADERS.filter(header => header !== 'Institution')
// What the admin console renders: no Action, plus Institution.
const READ_ONLY_COLUMNS = HEADERS.filter(header => header !== ACTION_COLUMN)

const sumOf = (widths: Record<string, string>): number =>
  Object.values(widths).reduce((sum, width) => sum + Number.parseFloat(width), 0)

describe('withoutActionColumn', () => {
  it('drops the Action column, keeping the others in order', () => {
    expect(withoutActionColumn(HEADERS)).toEqual(READ_ONLY_COLUMNS)
  })

  it('is a no-op for a header list with no Action column', () => {
    const headers = ['DAA', 'DAC'] as const
    expect(withoutActionColumn(headers)).toEqual(headers)
  })
})

describe('normalizedWidths', () => {
  it('covers only the given columns', () => {
    expect(Object.keys(normalizedWidths(READ_ONLY_COLUMNS, WIDTHS))).toEqual([...READ_ONLY_COLUMNS])
  })

  // The point of the normalization: no unclaimed width for the browser to
  // apportion however it likes, whichever columns a view renders.
  it('totals 100% for every column combination the two consoles render', () => {
    expect(sumOf(normalizedWidths(MANAGED_COLUMNS, WIDTHS))).toBeCloseTo(100, 3)
    expect(sumOf(normalizedWidths(READ_ONLY_COLUMNS, WIDTHS))).toBeCloseTo(100, 3)
    expect(sumOf(normalizedWidths(HEADERS, WIDTHS))).toBeCloseTo(100, 3)
  })

  it('preserves the relative proportions of the given columns', () => {
    const widths = normalizedWidths(READ_ONLY_COLUMNS, WIDTHS)
    const ratio = (a: string, b: string) => Number.parseFloat(a) / Number.parseFloat(b)

    expect(ratio(widths.Email, widths.Researcher))
      .toBeCloseTo(ratio(WIDTHS.Email, WIDTHS.Researcher), 5)
    expect(ratio(widths['Pre-authorized By'], widths['Pre-Auth Status']))
      .toBeCloseTo(ratio(WIDTHS['Pre-authorized By'], WIDTHS['Pre-Auth Status']), 5)
  })

  it('falls back to auto widths rather than dividing by zero', () => {
    expect(normalizedWidths(['Researcher'], { Researcher: '0%' }))
      .toEqual({ Researcher: 'auto' })
  })
})
