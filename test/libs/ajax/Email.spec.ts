import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Config } from 'src/libs/config'
import { fetchPost } from 'src/libs/ajax/fetchAdapter'
import { Email } from 'src/libs/ajax/Email'
import { extractConsentError, extractError } from 'src/utils/ErrorUtils'

vi.mock('src/libs/config', () => ({
  Config: {
    getApiUrl: vi.fn(),
    authOpts: vi.fn(),
  },
}))

vi.mock('src/libs/ajax/fetchAdapter', () => ({
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
        () => { throw new Error('expected sendReminderEmail to reject') },
        e => e,
      )

      expect(extractConsentError(error)).toEqual(consentError)
      expect(extractError(error)).toBe('Vote 7 is not eligible for a reminder')
    })
  })
})
