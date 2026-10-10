import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Config } from 'src/libs/config'
import { fetchGet, fetchPost } from 'src/libs/ajax/fetchAdapter'
import { Email, EMAIL_LOG_LIMIT, EMAIL_LOG_PAGE_SIZE, MailSend } from 'src/libs/ajax/Email'
import { extractConsentError, extractError } from 'src/utils/ErrorUtils'

vi.mock('src/libs/config', () => ({
  Config: {
    getApiUrl: vi.fn(),
    authOpts: vi.fn(),
  },
}))

vi.mock('src/libs/ajax/fetchAdapter', () => ({
  fetchGet: vi.fn(),
  fetchPost: vi.fn(),
}))

const headers = {
  headers: {
    'Authorization': 'Bearer token',
    'Accept': 'application/json',
    'X-App-ID': 'DUOS',
  },
}

describe('Email', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(Config.getApiUrl).mockResolvedValue('https://duos.example.org')
    vi.mocked(Config.authOpts).mockReturnValue(headers)
    vi.mocked(fetchPost).mockResolvedValue({ data: undefined })
  })

  describe('sendReminderEmail', () => {
    it('posts to the reminder endpoint with auth options', async () => {
      await Email.sendReminderEmail(42)

      expect(Config.getApiUrl).toHaveBeenCalledOnce()
      expect(Config.authOpts).toHaveBeenCalledOnce()
      expect(fetchPost).toHaveBeenCalledWith(
        'https://duos.example.org/api/emailNotifier/reminderMessage/42',
        undefined,
        headers,
      )
    })

    it('propagates fetch failures from the API call', async () => {
      vi.mocked(fetchPost).mockRejectedValueOnce(new Error('network failure'))

      await expect(Email.sendReminderEmail(7)).rejects.toThrow('network failure')
    })

    it('propagates ConsentError rejections so callers can extract a useful error', async () => {
      const consentError = { message: 'Vote 7 is not eligible for a reminder', code: 400 }
      vi.mocked(fetchPost).mockRejectedValueOnce(consentError)

      const error = await Email.sendReminderEmail(7).then(
        () => {
          throw new Error('expected sendReminderEmail to reject')
        },
        e => e,
      )

      expect(extractConsentError(error)).toEqual(consentError)
      expect(extractError(error)).toBe('Vote 7 is not eligible for a reminder')
    })
  })

  describe('getSendsByDateRange', () => {
    const send = (sendId: number, createDate: Date, lastCreateDate = createDate): MailSend => ({
      sendId,
      emailType: 4,
      createDate: createDate.getTime(),
      lastCreateDate: lastCreateDate.getTime(),
      recipientCount: 1,
      recipients: [],
      darCode: 'DAR-1',
      datasetIdentifiers: [],
    })
    const page = (firstId: number, count: number) =>
      ({ data: Array.from({ length: count }, (_, index) => send(firstId + index, new Date(2026, 9, 1, 12))) })
    const offsets = () => vi.mocked(fetchGet).mock.calls.map(([, config]) => config?.params?.offset)

    it('asks Consent for a day either side of the range, in the format it parses', async () => {
      vi.mocked(fetchGet).mockResolvedValueOnce({ data: [] })

      await Email.getSendsByDateRange('2026-09-30', '2026-10-31')

      expect(fetchGet).toHaveBeenCalledWith('https://duos.example.org/api/mail/sends', {
        ...headers,
        params: { start: '09/29/2026', end: '11/02/2026', limit: EMAIL_LOG_PAGE_SIZE, offset: 0 },
      })
    })

    it('passes a search and the types it matches to consent', async () => {
      vi.mocked(fetchGet).mockResolvedValueOnce({ data: [] })

      const { signal } = new AbortController()
      await Email.getSendsByDateRange('2026-09-30', '2026-10-31', ' Ada ', [34], signal)

      expect(fetchGet).toHaveBeenCalledWith('https://duos.example.org/api/mail/sends', {
        ...headers,
        signal,
        params: { start: '09/29/2026', end: '11/02/2026', search: 'Ada', searchTypes: [34], limit: EMAIL_LOG_PAGE_SIZE, offset: 0 },
      })
    })

    it('keeps only the sends logged within the local days chosen', async () => {
      vi.mocked(fetchGet).mockResolvedValueOnce({
        data: [
          send(1, new Date(2026, 9, 3, 0, 0, 0)),
          send(2, new Date(2026, 9, 2, 23, 59, 59)),
          send(3, new Date(2026, 9, 1, 0, 0, 0)),
          send(4, new Date(2026, 8, 30, 23, 59, 59)),
        ],
      })

      const log = await Email.getSendsByDateRange('2026-10-01', '2026-10-02')

      expect(log).toEqual({ sends: [expect.objectContaining({ sendId: 2 }), expect.objectContaining({ sendId: 3 })], truncated: false })
    })

    it('reads page after page until one comes back short, dropping a send repeated across them', async () => {
      vi.mocked(fetchGet)
        .mockResolvedValueOnce(page(1, EMAIL_LOG_PAGE_SIZE))
        .mockResolvedValueOnce(page(EMAIL_LOG_PAGE_SIZE, 3))

      const log = await Email.getSendsByDateRange('2026-10-01', '2026-10-01')

      expect(offsets()).toEqual([0, EMAIL_LOG_PAGE_SIZE])
      expect(log).toEqual({ sends: expect.any(Array), truncated: false })
      expect(log.sends).toHaveLength(EMAIL_LOG_PAGE_SIZE + 2)
    })

    it('keeps a send that began before the range but ended inside it', async () => {
      vi.mocked(fetchGet).mockResolvedValueOnce({
        data: [
          send(1, new Date(2026, 8, 30, 23, 58), new Date(2026, 9, 1, 0, 5)),
          send(2, new Date(2026, 8, 30, 12), new Date(2026, 8, 30, 12, 5)),
        ],
      })

      const log = await Email.getSendsByDateRange('2026-10-01', '2026-10-01')

      expect(log.sends.map(({ sendId }) => sendId)).toEqual([1])
    })

    it('counts only sends in the range toward the cap, and flags one past it', async () => {
      const afterRange = send(0, new Date(2026, 9, 2, 1))
      vi.mocked(fetchGet).mockImplementation(async (_, config) => {
        const offset = Number(config?.params?.offset)
        const rows = page(offset + 1, EMAIL_LOG_PAGE_SIZE).data
        return { data: offset === 0 ? [afterRange, ...rows.slice(1)] : rows }
      })

      const log = await Email.getSendsByDateRange('2026-10-01', '2026-10-01')

      expect(log.sends).toHaveLength(EMAIL_LOG_LIMIT)
      expect(log.sends).not.toContainEqual(afterRange)
      expect(log.truncated).toBe(true)
    })

    it('lists a range holding exactly the cap without flagging it', async () => {
      vi.mocked(fetchGet).mockImplementation(async (_, config) => {
        const offset = Number(config?.params?.offset)
        return offset < EMAIL_LOG_LIMIT ? page(offset + 1, EMAIL_LOG_PAGE_SIZE) : { data: [] }
      })

      const log = await Email.getSendsByDateRange('2026-10-01', '2026-10-01')

      expect(log.sends).toHaveLength(EMAIL_LOG_LIMIT)
      expect(log.truncated).toBe(false)
    })
  })
})
