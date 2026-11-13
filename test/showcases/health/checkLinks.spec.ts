import { describe, expect, it, vi } from 'vitest'
import { checkLink, checkLinks, collectLinks, type LinkShowcase, USER_AGENT } from 'src/showcases/health/checkLinks'

const showcase = (key: string, sections: Record<string, unknown>, status: 'live' | 'hidden' = 'live'): LinkShowcase =>
  ({ entry: { key, status }, config: { sections } as never })

const PARTNER = showcase('partner', {
  'hero': { enabled: true, cta: { label: 'Explore', url: 'https://partner.example.org/' } },
  'featured-tools': {
    enabled: true,
    items: [
      { id: 'tool-1', launchUrl: 'https://tools.example.org/launch', docsUrl: '/help' },
      { id: 'tool-2', launchUrl: 'https://partner.example.org/', url: '#latest-data-releases' },
    ],
  },
  'notebooks': { enabled: false, items: [{ id: 'nb', url: 'https://off.example.org/' }] },
})

const FLAGSHIP = showcase('flagship-key', { hero: { enabled: true, cta: { label: 'Go', url: 'https://partner.example.org/' } } }, 'hidden')

const answer = (status: number, headers: Record<string, string> = {}) => new Response(status === 204 || status === 304 ? null : 'body', { status, headers })

const setup = (respond: (url: string, init: RequestInit) => Response | Promise<Response>) => {
  const fetchMock = vi.fn<typeof fetch>(async (url, init) => respond(String(url), init ?? {}))
  const sleep = vi.fn<(ms: number) => Promise<void>>().mockResolvedValue(undefined)
  return { fetchMock, sleep, options: { fetch: fetchMock, retry: { attempts: 3, baseDelayMs: 10, maxDelayMs: 1_000, sleep } } }
}

const methods = (fetchMock: ReturnType<typeof vi.fn>) => fetchMock.mock.calls.map(([, init]) => (init as RequestInit).method)

describe('collectLinks', () => {
  it('collects each external link once, with every place it appears', () => {
    const links = collectLinks([PARTNER, FLAGSHIP])

    expect([...links.keys()]).toEqual(['https://partner.example.org/', 'https://tools.example.org/launch'])
    expect(links.get('https://partner.example.org/')).toEqual([
      { showcase: 'partner', status: 'live', path: 'sections.hero.cta.url' },
      { showcase: 'partner', status: 'live', path: 'sections.featured-tools.items.1.launchUrl' },
      { showcase: 'flagship-key', status: 'hidden', path: 'sections.hero.cta.url' },
    ])
  })

  it('skips announcements outside their date window, as the page does', () => {
    const hero = showcase('partner', {
      hero: {
        enabled: true,
        announcements: [
          { id: 'past', text: 'Past', url: 'https://past.example.org/', startDate: '2026-01-01', endDate: '2026-01-31' },
          { id: 'now', text: 'Now', url: 'https://now.example.org/', startDate: '2026-11-01', endDate: '2026-11-30' },
          { id: 'later', text: 'Later', url: 'https://later.example.org/', startDate: '2026-12-01', endDate: '2026-12-31' },
        ],
      },
    })

    expect([...collectLinks([hero], () => new Date('2026-11-13T12:00:00Z')).keys()]).toEqual(['https://now.example.org/'])
  })

  it('skips same-origin paths, anchors and disabled sections', () => {
    const urls = [...collectLinks([PARTNER]).keys()]

    expect(urls).not.toContain('/help')
    expect(urls).not.toContain('#latest-data-releases')
    expect(urls).not.toContain('https://off.example.org/')
  })
})

describe('checkLink', () => {
  it('accepts a successful HEAD with one request, named generically', async () => {
    const { fetchMock, options } = setup(() => answer(200))

    expect(await checkLink('https://ok.example.org/', options)).toEqual({ kind: 'ok' })
    expect(methods(fetchMock)).toEqual(['HEAD'])
    expect(fetchMock.mock.calls[0][1]?.headers).toEqual({ 'User-Agent': USER_AGENT })
  })

  it('tries GET when a site rejects HEAD', async () => {
    const { fetchMock, options } = setup((_, init) => answer(init.method === 'HEAD' ? 405 : 200))

    expect(await checkLink('https://ok.example.org/', options)).toEqual({ kind: 'ok' })
    expect(methods(fetchMock)).toEqual(['HEAD', 'GET'])
  })

  it('tries GET when HEAD gets no answer at all', async () => {
    const { fetchMock, options } = setup((_, init) => {
      if (init.method === 'HEAD') throw new TypeError('fetch failed', { cause: new Error('socket hang up') })
      return answer(200)
    })

    expect(await checkLink('https://ok.example.org/', options)).toEqual({ kind: 'ok' })
    expect(methods(fetchMock)).toEqual(['HEAD', 'GET'])
  })

  it('waits for the Retry-After of a HEAD 429 before any GET', async () => {
    let calls = 0
    const { fetchMock, sleep, options } = setup(() => ++calls === 1 ? answer(429, { 'retry-after': '30' }) : answer(200))

    expect(await checkLink('https://busy.example.org/', options)).toEqual({ kind: 'ok' })
    expect(methods(fetchMock)).toEqual(['HEAD', 'HEAD'])
    expect(sleep).toHaveBeenCalledWith(1_000)
  })

  it('retries a 408 like a 5xx', async () => {
    let calls = 0
    const { options } = setup(() => answer(++calls <= 2 ? 408 : 200))

    expect(await checkLink('https://slow.example.org/', options)).toEqual({ kind: 'ok' })
  })

  it.each([404, 410])('reports %i as broken without retrying', async (status) => {
    const { fetchMock, options } = setup(() => answer(status))

    expect(await checkLink('https://gone.example.org/', options)).toEqual({ kind: 'broken', httpStatus: status, reason: `answered ${status}` })
    expect(methods(fetchMock)).toEqual(['HEAD', 'GET'])
  })

  it.each([401, 403, 400, 405, 451])('reports %i as unverified, since sites answer bots that way', async (status) => {
    const { options } = setup(() => answer(status))

    expect(await checkLink('https://guarded.example.org/', options)).toEqual({ kind: 'unverified', httpStatus: status, reason: `answered ${status}` })
  })

  it('retries a 5xx and accepts the answer that follows', async () => {
    let calls = 0
    const { sleep, options } = setup(() => answer(++calls <= 2 ? 503 : 200))

    expect(await checkLink('https://flaky.example.org/', options)).toEqual({ kind: 'ok' })
    expect(sleep).toHaveBeenCalledTimes(1)
  })

  it('reports a 5xx that outlasts the retries as broken', async () => {
    const { fetchMock, options } = setup(() => answer(502))

    expect(await checkLink('https://down.example.org/', options)).toEqual({ kind: 'broken', httpStatus: 502, reason: 'answered 502, after 3 attempts' })
    expect(fetchMock).toHaveBeenCalledTimes(6)
  })

  it('reports a link that never answers as broken, after retrying', async () => {
    const { fetchMock, options } = setup(() => {
      throw new TypeError('fetch failed', { cause: new Error('getaddrinfo ENOTFOUND nowhere.example.org') })
    })

    expect(await checkLink('https://nowhere.example.org/', options)).toEqual({
      kind: 'broken',
      reason: 'no answer (fetch failed: getaddrinfo ENOTFOUND nowhere.example.org), after 3 attempts',
    })
    // HEAD, then GET, on each attempt.
    expect(fetchMock).toHaveBeenCalledTimes(6)
  })

  it('honors Retry-After and reports a 429 that never clears as unverified', async () => {
    const { sleep, options } = setup(() => answer(429, { 'retry-after': '0' }))

    expect(await checkLink('https://busy.example.org/', options)).toEqual({ kind: 'unverified', httpStatus: 429, reason: 'answered 429, after 3 attempts' })
    expect(sleep.mock.calls.map(([ms]) => ms)).toEqual([0, 0])
  })
})

describe('checkLinks', () => {
  it('reports broken and unverified links separately, each with its locations', async () => {
    const { fetchMock, options } = setup(url => answer(url.startsWith('https://tools.') ? 404 : 403))

    const report = await checkLinks([PARTNER, FLAGSHIP], options)

    expect(report.checked).toBe(2)
    expect(report.broken).toEqual([{
      url: 'https://tools.example.org/launch',
      httpStatus: 404,
      reason: 'answered 404',
      locations: [{ showcase: 'partner', status: 'live', path: 'sections.featured-tools.items.0.launchUrl' }],
    }])
    expect(report.unverified.map(finding => [finding.url, finding.locations.length])).toEqual([['https://partner.example.org/', 3]])
    // One HEAD and one GET per link, however often it appears.
    expect(fetchMock).toHaveBeenCalledTimes(4)
  })

  it('requests nothing when there are no links', async () => {
    const { fetchMock, options } = setup(() => answer(200))

    expect(await checkLinks([], options)).toEqual({ checked: 0, broken: [], unverified: [] })
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
