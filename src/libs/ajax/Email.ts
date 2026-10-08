import dayjs from 'dayjs'
import { Config } from '../config'
import { fetchGet, fetchPost } from 'src/libs/ajax/fetchAdapter'

/** A sent email as Consent logs it; dates are epoch milliseconds. */
export interface MailMessage {
  emailId: number
  emailType: number
  createDate: number
}

export interface EmailLog {
  emails: MailMessage[]
  /** The range held more than `EMAIL_LOG_LIMIT` emails, so only the newest are listed. */
  truncated: boolean
}

/** The most emails one range lists, so a years-wide range can't fetch the whole log. */
export const EMAIL_LOG_LIMIT = 10000

/** Consent's largest summary page. */
export const EMAIL_LOG_PAGE_SIZE = 1000

const CONSENT_DATE = 'MM/DD/YYYY'

export const Email = {
  /**
   * Send a reminder email for a specific vote.
   * @param voteId The ID of the vote to send a reminder for
   * @returns Promise that resolves when the email is sent
   */
  sendReminderEmail: async (voteId: number): Promise<void> => {
    const url = `${await Config.getApiUrl()}/api/emailNotifier/reminderMessage/${voteId}`
    await fetchPost<void>(url, undefined, Config.authOpts())
  },

  /**
   * The emails logged from the start of `from` through the end of `to`, in local time, newest first.
   * @param from First day, `YYYY-MM-DD`
   * @param to Last day, `YYYY-MM-DD`
   */
  getEmailsByDateRange: async (from: string, to: string): Promise<EmailLog> => {
    const url = `${await Config.getApiUrl()}/api/mail/summary`
    const start = dayjs(from).startOf('day')
    const end = dayjs(to).add(1, 'day').startOf('day')
    // Consent reads these days in its own timezone, so a day either side covers any offset.
    const range = { start: start.subtract(1, 'day').format(CONSENT_DATE), end: end.add(1, 'day').format(CONSENT_DATE) }
    // An email sent mid-read shifts later pages down a row, so keyed by id to drop the repeat.
    const emails = new Map<number, MailMessage>()
    let truncated = false
    let more = true
    for (let offset = 0; more; offset += EMAIL_LOG_PAGE_SIZE) {
      const { data } = await fetchGet<MailMessage[]>(url, {
        ...Config.authOpts(),
        params: { ...range, limit: EMAIL_LOG_PAGE_SIZE, offset },
      })
      more = data.length === EMAIL_LOG_PAGE_SIZE
      for (const email of data) {
        if (email.createDate >= end.valueOf() || emails.has(email.emailId)) continue
        // Newest first, so every email from here on is older than the range too.
        if (email.createDate < start.valueOf()) {
          more = false
          break
        }
        if (emails.size === EMAIL_LOG_LIMIT) {
          truncated = true
          more = false
          break
        }
        emails.set(email.emailId, email)
      }
    }
    return { emails: [...emails.values()], truncated }
  },
}
