import dayjs from 'dayjs'
import { Config } from '../config'
import { fetchGet, fetchPost } from 'src/libs/ajax/fetchAdapter'

export interface MailSendRecipient {
  userId: number
  displayName: string | null
  /** False when SendGrid rejected the email, or the user or the environment has email turned off. */
  delivered: boolean
}

/** One email sent to one or more recipients, as Consent groups its log; dates are epoch milliseconds. */
export interface MailSend {
  sendId: number
  emailType: number
  /** Its first email; `lastCreateDate` is its last. A send spanning the range edge is still listed. */
  createDate: number
  lastCreateDate: number
  recipientCount: number
  /** The first 100 recipients by display name; `recipientCount` counts them all. */
  recipients: MailSendRecipient[]
  darCode: string | null
  datasetIdentifiers: string[]
}

export interface EmailLog {
  sends: MailSend[]
  /** The range held more than `EMAIL_LOG_LIMIT` sends, so only the newest are listed. */
  truncated: boolean
}

/** The most sends one range lists, so a years-wide range can't fetch the whole log. */
export const EMAIL_LOG_LIMIT = 10000

/** Consent rejects a longer search. */
export const EMAIL_LOG_SEARCH_MAX_LENGTH = 200

/** Consent's largest sends page. */
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
   * The sends logged from the start of `from` through the end of `to`, in local time, newest first.
   * @param from First day, `YYYY-MM-DD`
   * @param to Last day, `YYYY-MM-DD`
   * @param search Only sends whose DAR code, DUOS-IDs or any recipient's name contains this text,
   *   or whose type is in `searchTypes`
   * @param signal Cancels the remaining page reads, as a newer search does
   */
  getSendsByDateRange: async (
    from: string, to: string, search = '', searchTypes: number[] = [], signal?: AbortSignal,
  ): Promise<EmailLog> => {
    const url = `${await Config.getApiUrl()}/api/mail/sends`
    const start = dayjs(from).startOf('day')
    const end = dayjs(to).add(1, 'day').startOf('day')
    // Consent reads these days in its own timezone, so a day either side covers any offset.
    const range = { start: start.subtract(1, 'day').format(CONSENT_DATE), end: end.add(1, 'day').format(CONSENT_DATE) }
    // A send logged mid-read shifts later pages down a row, so keyed by id to drop the repeat.
    const sends = new Map<number, MailSend>()
    let truncated = false
    let more = true
    let offset = 0
    while (more) {
      const { data } = await fetchGet<MailSend[]>(url, {
        ...Config.authOpts(),
        signal,
        params: { ...range, ...(search.trim() === '' ? {} : { search: search.trim(), searchTypes }), limit: EMAIL_LOG_PAGE_SIZE, offset },
      })
      more = data.length === EMAIL_LOG_PAGE_SIZE
      for (const send of data) {
        // Kept if any of its emails falls in the range; Consent's day of padding bounds the read.
        if (send.createDate >= end.valueOf() || send.lastCreateDate < start.valueOf() || sends.has(send.sendId)) continue
        if (sends.size === EMAIL_LOG_LIMIT) {
          truncated = true
          more = false
          break
        }
        sends.set(send.sendId, send)
      }
      offset += EMAIL_LOG_PAGE_SIZE
    }
    return { sends: [...sends.values()], truncated }
  },
}
