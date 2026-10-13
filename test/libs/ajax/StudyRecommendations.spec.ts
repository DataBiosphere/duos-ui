import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Config } from 'src/libs/config'
import { fetchGet } from 'src/libs/ajax/fetchAdapter'
import { StudyRecommendations } from 'src/libs/ajax/StudyRecommendations'

vi.mock('src/libs/config', () => ({
  Config: {
    getApiUrl: vi.fn(),
    authOpts: vi.fn(),
  },
}))

vi.mock('src/libs/ajax/fetchAdapter', () => ({
  fetchGet: vi.fn(),
}))

const headers = {
  headers: {
    'Authorization': 'Bearer token',
    'Accept': 'application/json',
    'X-App-ID': 'DUOS',
  },
}

describe('StudyRecommendations', () => {
  beforeEach(() => {
    vi.mocked(Config.getApiUrl).mockResolvedValue('https://duos.example.org')
    vi.mocked(Config.authOpts).mockReturnValue(headers as never)
    vi.mocked(fetchGet).mockResolvedValue({ data: [] })
  })

  it('requests the similar-studies endpoint with auth options', async () => {
    await StudyRecommendations.getSimilar(42)

    expect(fetchGet).toHaveBeenCalledWith(
      'https://duos.example.org/api/metrics/study-recommendations/42/similar',
      headers,
    )
  })

  it('requests the frequently-requested-with endpoint', async () => {
    await StudyRecommendations.getFrequentlyRequestedWith(42)

    expect(fetchGet).toHaveBeenCalledWith(
      'https://duos.example.org/api/metrics/study-recommendations/42/frequently-requested-with',
      headers,
    )
  })

  /**
   * useParams hands back a decoded id, so a crafted study id arrives as path segments of its own
   * and the browser would normalize the request onto a different authenticated endpoint.
   */
  it('encodes the study id rather than interpolating it into the path', async () => {
    await StudyRecommendations.getSimilar('1/../dar-summaries/5')

    const [url] = vi.mocked(fetchGet).mock.calls[0]
    expect(url).toBe(
      'https://duos.example.org/api/metrics/study-recommendations/1%2F..%2Fdar-summaries%2F5/similar',
    )
    expect(url).not.toContain('/../')
  })

  it('returns the recommendations the endpoint sends', async () => {
    const recommendations = [{ studyId: 7, studyName: 'Study 7' }]
    vi.mocked(fetchGet).mockResolvedValueOnce({ data: recommendations } as never)

    expect(await StudyRecommendations.getSimilar(42)).toEqual(recommendations)
  })

  it('propagates a failure rather than returning an empty list', async () => {
    vi.mocked(fetchGet).mockRejectedValueOnce(new Error('boom'))

    await expect(StudyRecommendations.getSimilar(42)).rejects.toThrow('boom')
  })
})
