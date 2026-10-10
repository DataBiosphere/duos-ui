import { describe, expect, it } from 'vitest'
import { emailTypeLabel, emailTypeOptions, sendMatches } from 'src/components/email_log_table/emailLogUtils'
import { MailSend } from 'src/libs/ajax/Email'

const send = (sendId: number, emailType: number, overrides: Partial<MailSend> = {}): MailSend => ({
  sendId,
  emailType,
  entityReferenceId: null,
  createDate: 0,
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

describe('sendMatches', () => {
  const matching = send(1, 4, {
    darCode: 'DAR-123',
    datasetIdentifiers: ['DUOS-000045'],
    recipients: [{ userId: 7, displayName: 'Ada Researcher', delivered: true }],
  })

  it.each(['new dar', 'dar-123', 'duos-000045', 'ADA'])('matches %s, ignoring case', (term) => {
    expect(sendMatches(matching, term)).toBe(true)
  })

  it('matches every send for blank text, and none for text it does not hold', () => {
    expect(sendMatches(matching, '  ')).toBe(true)
    expect(sendMatches(matching, 'Grace')).toBe(false)
  })
})
