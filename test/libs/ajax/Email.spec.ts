import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Config } from 'src/libs/config'
import { fetchPost } from 'src/libs/ajax/fetchAdapter'
import { Email } from 'src/libs/ajax/Email'

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
    vi.mocked(fetchPost).mockResolvedValue({} as never)
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
  })
})
