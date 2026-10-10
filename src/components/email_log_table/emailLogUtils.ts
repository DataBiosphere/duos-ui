import dayjs from 'dayjs'
import { MailSend } from 'src/libs/ajax/Email'

/** Consent's EmailType enum, keyed by the number it stores. */
const EMAIL_TYPE_LABELS: Record<number, string> = {
  1: 'Collect',
  2: 'New Case',
  3: 'Vote Reminder',
  4: 'New DAR',
  5: 'Disabled Dataset',
  6: 'Closed Dataset Election',
  7: 'Data Custodian Approval',
  8: 'Researcher DAR Approved',
  9: 'Admin Flagged DAR Approved',
  10: 'DAR Canceled',
  11: 'Delegate Responsibilities',
  12: 'New Researcher',
  13: 'Researcher Approved',
  14: 'New Dataset',
  15: 'New DAA Request',
  16: 'New DAA Upload (Researcher)',
  17: 'New DAA Upload (Signing Official)',
  18: 'Dataset Denied',
  19: 'Dataset Approved',
  20: 'DAR Expired',
  21: 'DAR Expiration Reminder',
  22: 'New Progress Report Request',
  23: 'New Progress Report Case',
  24: 'Researcher Progress Report Approved',
  25: 'Researcher Closeout Completed',
  26: 'Submitted Closeout',
  27: 'New Library Card Issued',
  28: 'Signing Official DAR Submitted',
  29: 'Signing Official DAR Approved',
  30: 'Signing Official Progress Report Submitted',
  31: 'Signing Official Progress Report Approved',
  32: 'DAC RADAR Approved',
  33: 'New DAR Needs Signing Official Approval',
  34: 'DAC Vote Reminder Digest',
  35: 'New Study Registration Confirmation',
  36: 'New Study Digest',
}

/** A type Consent adds before this list catches up still gets a stable, filterable label. */
export const emailTypeLabel = (emailType: number): string =>
  EMAIL_TYPE_LABELS[emailType] ?? `Email Type ${emailType}`

/** The types present in `sends`, alphabetical by label. */
export const emailTypeOptions = (sends: MailSend[]): number[] =>
  [...new Set(sends.map(send => send.emailType))]
    .sort((a, b) => emailTypeLabel(a).localeCompare(emailTypeLabel(b)))

export const formatTimestamp = (date: number): string => dayjs(date).format('YYYY-MM-DD HH:mm:ss')

export const recipientName = (recipient: MailSend['recipients'][number]): string =>
  recipient.displayName ?? `User ${recipient.userId}`

/** The lowercased text search looks through: type, DAR code, DUOS-IDs and listed recipients. */
export const sendSearchText = (send: MailSend): string =>
  [
    emailTypeLabel(send.emailType),
    send.darCode ?? '',
    ...send.datasetIdentifiers,
    ...send.recipients.map(recipientName),
  ].join('\n').toLowerCase()

/** Orders DAR codes by number, so DAR-99 sorts before DAR-200, with blanks after every code. */
export const compareDarCodes = (a: string, b: string): number => {
  if (a === '' || b === '') return Number(a === '') - Number(b === '')
  return a.localeCompare(b, undefined, { numeric: true })
}
