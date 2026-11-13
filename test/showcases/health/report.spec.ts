import { describe, expect, it } from 'vitest'
import type { IdentifierReport } from 'src/showcases/health/checkIdentifiers'
import type { LinkReport } from 'src/showcases/health/checkLinks'
import { collectFindings, nextHistory, parseHistory, renderSummary, runFails, uncheckedPrefixes } from 'src/showcases/health/report'

const IDENTIFIERS: IdentifierReport = {
  unavailable: [{ showcase: 'partner', status: 'hidden', section: 'open-access-datasets', field: 'items', identifier: 'DUOS-000999' }],
  emptyShelves: [{ showcase: 'partner', status: 'live', section: 'latest-data-releases', ranking: 'newest' }],
  lookupFailures: [],
  lookupDisabled: false,
  lookupUnreachable: false,
}

const LINKS: LinkReport = {
  checked: 3,
  broken: [{ url: 'https://gone.example.org/a|b', httpStatus: 404, reason: 'answered 404', locations: [{ showcase: 'partner', status: 'live', path: 'sections.hero.cta.url' }] }],
  unverified: [{ url: 'https://guarded.example.org/', httpStatus: 403, reason: 'answered 403', locations: [{ showcase: 'partner', status: 'live', path: 'sections.notebooks.items.0.url' }] }],
}

const NONE: IdentifierReport = { unavailable: [], emptyShelves: [], lookupFailures: [], lookupDisabled: false, lookupUnreachable: false }
const NO_LINKS: LinkReport = { checked: 0, broken: [], unverified: [] }

const findings = collectFindings(IDENTIFIERS, LINKS)

describe('collectFindings', () => {
  it('lists failing problems first, each with a stable id', () => {
    expect(findings.map(({ id, failing }) => [id, failing])).toEqual([
      ['unavailable:partner:open-access-datasets:items:DUOS-000999', true],
      ['link:https://gone.example.org/a|b', true],
      ['empty-shelf:partner:latest-data-releases', false],
      ['link:https://guarded.example.org/', false],
    ])
  })

  it('fails the run only for failing problems', () => {
    expect(runFails(findings)).toBe(true)
    expect(runFails(collectFindings({ ...IDENTIFIERS, unavailable: [] }, { ...LINKS, broken: [] }))).toBe(false)
  })

  it('fails the run for a lookup that failed after its retries', () => {
    const failed = collectFindings({ ...NONE, lookupFailures: [{ showcase: 'partner', status: 'live', section: 'latest-data-releases', mode: 'ranking', reason: 'the lookup answered 503, after 4 attempts' }] }, NO_LINKS)

    expect(failed.map(({ id, failing }) => [id, failing])).toEqual([['lookup-failed:partner:latest-data-releases:ranking', true]])
  })
})

describe('history', () => {
  it('keeps the first-seen date of a problem still open and drops a fixed one', () => {
    const previous = { version: 1 as const, firstSeen: { 'empty-shelf:partner:latest-data-releases': '2026-11-02', 'link:https://fixed.example.org/': '2026-11-01' } }

    expect(nextHistory(findings, previous, '2026-11-09').firstSeen).toEqual({
      'unavailable:partner:open-access-datasets:items:DUOS-000999': '2026-11-09',
      'link:https://gone.example.org/a|b': '2026-11-09',
      'empty-shelf:partner:latest-data-releases': '2026-11-02',
      'link:https://guarded.example.org/': '2026-11-09',
    })
  })

  it('carries over the dates of problems a failed lookup could not check', () => {
    const previous = { version: 1 as const, firstSeen: {
      'unavailable:partner:latest-data-releases:pin:DUOS-000888': '2026-11-01',
      'empty-shelf:partner:latest-data-releases': '2026-11-02',
      'unavailable:partner:open-access-datasets:items:DUOS-000777': '2026-11-03',
    } }
    const failed: IdentifierReport = { ...NONE, lookupFailures: [{ showcase: 'partner', status: 'live', section: 'latest-data-releases', mode: 'ranking', reason: 'down' }] }

    expect(nextHistory(collectFindings(failed, NO_LINKS), previous, '2026-11-09', uncheckedPrefixes(failed)).firstSeen).toEqual({
      'unavailable:partner:latest-data-releases:pin:DUOS-000888': '2026-11-01',
      'empty-shelf:partner:latest-data-releases': '2026-11-02',
      'lookup-failed:partner:latest-data-releases:ranking': '2026-11-09',
    })
  })

  it('carries over every dataset problem while the lookup is off, but not link problems', () => {
    const previous = { version: 1 as const, firstSeen: { 'unavailable:partner:open-access-datasets:items:DUOS-000777': '2026-11-03', 'link:https://fixed.example.org/': '2026-11-01' } }
    const disabled = { ...NONE, lookupDisabled: true }

    expect(nextHistory([], previous, '2026-11-09', uncheckedPrefixes(disabled)).firstSeen).toEqual({ 'unavailable:partner:open-access-datasets:items:DUOS-000777': '2026-11-03' })
  })

  it('keeps a link\'s date when it flips between broken and could not verify', () => {
    const previous = { version: 1 as const, firstSeen: { 'link:https://guarded.example.org/': '2026-11-01' } }

    expect(nextHistory(findings, previous, '2026-11-09').firstSeen['link:https://guarded.example.org/']).toBe('2026-11-01')
  })

  it('carries over every dataset problem when the lookup stops answering', () => {
    const unreachable = { ...NONE, lookupUnreachable: true }

    expect(uncheckedPrefixes(unreachable)).toEqual(['unavailable:', 'empty-shelf:', 'lookup-failed:'])
  })

  it.each([undefined, '', 'not json', '{"version":2,"firstSeen":{"x":"2026-11-01"}}'])('starts empty from %j', (text) => {
    expect(parseHistory(text)).toEqual({ version: 1, firstSeen: {} })
  })

  it('drops entries that are not dates', () => {
    expect(parseHistory('{"version":1,"firstSeen":{"a":"2026-11-01","b":"soon","c":3}}').firstSeen).toEqual({ a: '2026-11-01' })
  })
})

describe('renderSummary', () => {
  const history = nextHistory(findings, { version: 1, firstSeen: { 'empty-shelf:partner:latest-data-releases': '2026-11-02' } }, '2026-11-09')
  const input = { findings, history, today: '2026-11-09', lookupDisabled: false, lookupUnreachable: false, lookupOrigin: 'https://consent.example.org', checkedShowcases: ['partner'], checkedLinks: 3, digest: false }

  it('splits new problems from those still open, and escapes table cells', () => {
    const summary = renderSummary(input)

    expect(summary).toContain('**Failing.** Checked 1 showcase(s) (partner) and 3 link(s) on 2026-11-09.')
    const [, newToday, stillOpen] = summary.split(/### (?:New today|Still open)/)
    expect(newToday).toContain('| Unavailable identifier | Yes | partner (hidden) `open-access-datasets` | DUOS-000999 in `items` |')
    expect(newToday).toContain('https://gone.example.org/a\\|b: answered 404')
    expect(newToday).toContain('| Could not verify link | No |')
    expect(stillOpen).toContain('| Empty shelf | No | partner `latest-data-releases` |')
    expect(summary).toContain('Open each link that could not be verified in a browser')
    expect(summary).not.toContain('Open for')
  })

  it('adds how long each problem has been open on the digest', () => {
    const summary = renderSummary({ ...input, digest: true })

    expect(summary).toContain('## Showcase health check: weekly digest')
    expect(summary).toContain('| 7 day(s), since 2026-11-02 |')
    expect(summary).toContain('| 0 day(s), since 2026-11-09 |')
  })

  it('says when the lookup is turned off, and passes with nothing else open', () => {
    const summary = renderSummary({ ...input, findings: [], lookupDisabled: true, checkedLinks: 0 })

    expect(summary).toContain('**Passing.**')
    expect(summary).toContain('The lookup at https://consent.example.org answered 405: it is turned off')
    expect(summary).toContain('No problems found.')
    expect(summary).not.toContain('Open each link')
    expect(summary).not.toContain('stopped answering')
  })

  it('says when the lookup stopped answering', () => {
    expect(renderSummary({ ...input, lookupUnreachable: true })).toContain('The lookup at https://consent.example.org stopped answering')
  })
})
