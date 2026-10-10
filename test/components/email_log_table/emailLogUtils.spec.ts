import { describe, expect, it } from 'vitest'
import { darCodeComparator, emailTypeLabel, emailTypeOptions, emailTypesMatching } from 'src/components/email_log_table/emailLogUtils'
import { MailSend } from 'src/libs/ajax/Email'

const send = (sendId: number, emailType: number, overrides: Partial<MailSend> = {}): MailSend => ({
  sendId,
  emailType,
  createDate: 0,
  lastCreateDate: 0,
  recipientCount: 0,
  recipients: [],
  darCode: null,
  datasetIdentifiers: [],
  ...overrides,
})

describe('emailTypeLabel', () => {
  it('falls back to the type number for a type it does not know', () => {
    expect(emailTypeLabel(99)).toBe('Email Type 99')
  })
})

describe('emailTypeOptions', () => {
  it('lists each type present once, alphabetical by label', () => {
    const sends = [send(1, 4), send(2, 19), send(3, 4), send(4, 3)]

    expect(emailTypeOptions(sends)).toEqual([19, 4, 3])
  })
})

describe('emailTypesMatching', () => {
  it('lists the types whose label contains the text, ignoring case', () => {
    expect(emailTypesMatching(' digest ')).toEqual([34, 36])
  })

  it('matches no types for blank text', () => {
    expect(emailTypesMatching('  ')).toEqual([])
  })
})

describe('darCodeComparator', () => {
  const codes = ['DAR-1000', '', 'DAR-99', 'DAR-200']

  it('orders DAR codes by number, blanks last', () => {
    expect([...codes].sort(darCodeComparator('asc'))).toEqual(['DAR-99', 'DAR-200', 'DAR-1000', ''])
  })

  it('keeps blanks last when descending', () => {
    expect([...codes].sort(darCodeComparator('desc'))).toEqual(['DAR-1000', 'DAR-200', 'DAR-99', ''])
  })
})
