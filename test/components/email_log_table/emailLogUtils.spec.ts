import { describe, expect, it } from 'vitest'
import { compareDarCodes, emailTypeLabel, emailTypeOptions, sendSearchText } from 'src/components/email_log_table/emailLogUtils'
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

describe('sendSearchText', () => {
  it('holds the type, DAR code, DUOS-IDs and recipients, lowercased', () => {
    const text = sendSearchText(send(1, 4, {
      darCode: 'DAR-123',
      datasetIdentifiers: ['DUOS-000045'],
      recipients: [{ userId: 7, displayName: 'Ada Researcher', delivered: true }],
    }))

    for (const term of ['new dar', 'dar-123', 'duos-000045', 'ada researcher']) {
      expect(text).toContain(term)
    }
  })
})

describe('compareDarCodes', () => {
  it('orders DAR codes by number', () => {
    expect(['DAR-1000', 'DAR-99', 'DAR-200'].sort(compareDarCodes)).toEqual(['DAR-99', 'DAR-200', 'DAR-1000'])
  })
})
