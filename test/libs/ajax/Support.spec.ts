import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Config } from 'src/libs/config'
import { fetchPost } from 'src/libs/ajax/fetchAdapter'
import { Support } from 'src/libs/ajax/Support'
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

describe('Support', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(Config.getApiUrl).mockResolvedValue('https://duos.example.org')
    vi.mocked(Config.authOpts).mockReturnValue(headers)
    vi.mocked(fetchPost).mockResolvedValue({ data: undefined })
  })

  describe('createTicket', () => {
    it('returns a properly shaped ticket with type uppercased', () => {
      const ticket = Support.createTicket(
        'Jane Doe',
        'question',
        'jane@example.org',
        'Help needed',
        'I need help with this',
        ['token-1'],
        'https://duos.example.org/page',
      )

      expect(ticket).toEqual({
        name: 'Jane Doe',
        type: 'QUESTION',
        email: 'jane@example.org',
        subject: 'Help needed',
        description: 'I need help with this',
        url: 'https://duos.example.org/page',
        uploads: ['token-1'],
      })
    })

    it('maps attachmentToken array to the uploads field', () => {
      const ticket = Support.createTicket('name', 'bug', 'a@b.com', 'sub', 'desc', ['tok-a', 'tok-b'], undefined)
      expect(ticket.uploads).toEqual(['tok-a', 'tok-b'])
    })

    it('accepts undefined url', () => {
      const ticket = Support.createTicket('name', 'bug', 'a@b.com', 'sub', 'desc', [], undefined)
      expect(ticket.url).toBeUndefined()
    })
  })

  describe('createSupportRequest', () => {
    const ticket = {
      name: 'Jane Doe',
      type: 'QUESTION',
      email: 'jane@example.org',
      subject: 'Help needed',
      description: 'I need help with this',
      url: 'https://duos.example.org/page',
      uploads: [],
    }

    it('posts the ticket to the support request endpoint', async () => {
      await Support.createSupportRequest(ticket)

      expect(Config.getApiUrl).toHaveBeenCalledOnce()
      expect(fetchPost).toHaveBeenCalledWith(
        'https://duos.example.org/support/request',
        ticket,
      )
    })

    it('propagates fetch failures from the API call', async () => {
      vi.mocked(fetchPost).mockRejectedValueOnce(new Error('network failure'))

      await expect(Support.createSupportRequest(ticket)).rejects.toThrow('network failure')
    })

    it('propagates ConsentError rejections so callers can extract a useful error', async () => {
      const consentError = { message: 'Support request submission failed', code: 400 }
      vi.mocked(fetchPost).mockRejectedValueOnce(consentError)

      const error = await Support.createSupportRequest(ticket).then(
        () => {
          throw new Error('expected createSupportRequest to reject')
        },
        e => e,
      )

      expect(extractConsentError(error)).toEqual(consentError)
      expect(extractError(error)).toBe('Support request submission failed')
    })
  })

  describe('uploadAttachment', () => {
    const file = new File(['attachment content'], 'screenshot.png', { type: 'image/png' })

    it('posts the file to the upload endpoint with binary multipart headers', async () => {
      vi.mocked(fetchPost).mockResolvedValue({ data: { token: 'upload-token-abc' } })

      const result = await Support.uploadAttachment(file)

      expect(Config.getApiUrl).toHaveBeenCalledOnce()
      expect(fetchPost).toHaveBeenCalledWith(
        'https://duos.example.org/support/upload',
        file,
        { headers: { 'Content-Type': 'application/binary' }, isMultipart: true },
      )
      expect(result.data.token).toBe('upload-token-abc')
    })

    it('propagates fetch failures from the API call', async () => {
      vi.mocked(fetchPost).mockRejectedValueOnce(new Error('network failure'))

      await expect(Support.uploadAttachment(file)).rejects.toThrow('network failure')
    })

    it('propagates ConsentError rejections so callers can extract a useful error', async () => {
      const consentError = { message: 'Attachment too large', code: 413 }
      vi.mocked(fetchPost).mockRejectedValueOnce(consentError)

      const error = await Support.uploadAttachment(file).then(
        () => {
          throw new Error('expected uploadAttachment to reject')
        },
        e => e,
      )

      expect(extractConsentError(error)).toEqual(consentError)
      expect(extractError(error)).toBe('Attachment too large')
    })
  })
})
