import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Config } from 'src/libs/config'
import { fetchDelete, fetchGet, fetchPost } from 'src/libs/ajax/fetchAdapter'
import { COMMENTS_PAGE_SIZE, MAX_COMMENT_LENGTH, StudyComments } from 'src/libs/ajax/StudyComments'

vi.mock('src/libs/config', () => ({
  Config: {
    getApiUrl: vi.fn(),
    authOpts: vi.fn(),
  },
}))

vi.mock('src/libs/ajax/fetchAdapter', () => ({
  fetchGet: vi.fn(),
  fetchPost: vi.fn(),
  fetchDelete: vi.fn(),
}))

const headers = {
  headers: {
    'Authorization': 'Bearer token',
    'Accept': 'application/json',
    'X-App-ID': 'DUOS',
  },
}

const emptySummary = { comments: [], averageRating: undefined, total: 0, yourComment: undefined }

describe('StudyComments', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(Config.getApiUrl).mockResolvedValue('https://duos.example.org')
    vi.mocked(Config.authOpts).mockReturnValue(headers)
    vi.mocked(fetchGet).mockResolvedValue({ data: emptySummary })
    vi.mocked(fetchPost).mockResolvedValue({ data: {} })
    vi.mocked(fetchDelete).mockResolvedValue({ data: undefined })
  })

  describe('listComments', () => {
    /** The endpoint is paged; an omitted offset means the first page, not the whole list. */
    it('requests the first page by default, with the shared page size', async () => {
      await StudyComments.listComments(1)

      expect(fetchGet).toHaveBeenCalledWith(
        `https://duos.example.org/api/dataset/study/1/comments?limit=${COMMENTS_PAGE_SIZE}&offset=0`,
        headers,
      )
    })

    it('passes the requested offset and limit through', async () => {
      await StudyComments.listComments(7, 50, 10)

      expect(fetchGet).toHaveBeenCalledWith(
        'https://duos.example.org/api/dataset/study/7/comments?limit=10&offset=50',
        headers,
      )
    })

    it('returns the response body', async () => {
      const summary = { comments: [], averageRating: 4.5, total: 3, yourComment: undefined }
      vi.mocked(fetchGet).mockResolvedValue({ data: summary })

      expect(await StudyComments.listComments(1)).toEqual(summary)
    })

    it('propagates a failure rather than swallowing it', async () => {
      vi.mocked(fetchGet).mockRejectedValue(new Error('comments unavailable'))

      await expect(StudyComments.listComments(1)).rejects.toThrow('comments unavailable')
    })
  })

  /**
   * The id is route-derived free text. Unencoded, '1%2F..%2F..%2Fsomething' decodes in the path
   * and the request lands on a normalized, unintended endpoint with the caller's credentials.
   */
  it('encodes the study id rather than interpolating it into the path', async () => {
    vi.mocked(fetchGet).mockResolvedValueOnce({ data: { comments: [], total: 0 } })

    await StudyComments.listComments('1%2F..%2F..%2Fsomething')

    const [url] = vi.mocked(fetchGet).mock.calls[0]
    expect(url).toContain('/api/dataset/study/1%252F..%252F..%252Fsomething/comments')
    expect(url).not.toContain('/api/dataset/study/1%2F..%2F..%2Fsomething/comments')
  })

  describe('postComment', () => {
    it('posts the rating and text to the study comments url', async () => {
      await StudyComments.postComment(1, 4, 'Useful study')

      expect(fetchPost).toHaveBeenCalledWith(
        'https://duos.example.org/api/dataset/study/1/comments',
        { rating: 4, commentText: 'Useful study' },
        headers,
      )
    })

    it('propagates a rejected post', async () => {
      vi.mocked(fetchPost).mockRejectedValue(new Error('rating out of range'))

      await expect(StudyComments.postComment(1, 9, '')).rejects.toThrow('rating out of range')
    })
  })

  describe('deleteComment', () => {
    it('deletes by comment id under the study', async () => {
      await StudyComments.deleteComment(1, 7)

      expect(fetchDelete).toHaveBeenCalledWith(
        'https://duos.example.org/api/dataset/study/1/comments/7',
        headers,
      )
    })
  })

  /** Declared here so the composer and the backend cannot drift apart silently. */
  it('publishes the limits the composer enforces', () => {
    expect(COMMENTS_PAGE_SIZE).toBe(25)
    expect(MAX_COMMENT_LENGTH).toBe(2000)
  })
})
