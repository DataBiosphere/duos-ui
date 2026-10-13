import { describe, expect, it } from 'vitest'
import { emailTypeLabel, emailTypeOptions } from 'src/components/email_log_table/emailLogUtils'
import { MailMessage } from 'src/libs/ajax/Email'

const email = (emailId: number, emailType: number): MailMessage => ({ emailId, emailType, createDate: 0 })

describe('emailTypeLabel', () => {
  it('falls back to the type number for a type it does not know', () => {
    expect(emailTypeLabel(99)).toBe('Email Type 99')
  })
})

describe('emailTypeOptions', () => {
  it('lists each type present once, alphabetical by label', () => {
    const emails = [email(1, 4), email(2, 19), email(3, 4), email(4, 3)]

    expect(emailTypeOptions(emails)).toEqual([19, 4, 3])
  })
})
