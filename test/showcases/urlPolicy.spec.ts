import { describe, expect, it } from 'vitest'
import { urlProblem } from 'src/showcases/urlPolicy'
import { ANCHOR_SECTION_KEYS } from 'src/types/showcase'

describe('urlProblem', () => {
  it.each([
    'https://example.org/tools',
    'https://example.org/a%20b',
    'https://example.org:8443/path?q=1#part',
    '/datalibrary?q=cancer',
    '/',
    '#featured-workspaces',
  ])('passes %s', (url) => {
    expect(urlProblem(url)).toBeUndefined()
  })

  it('passes a same-page link to every section that renders an anchor', () => {
    ANCHOR_SECTION_KEYS.forEach(key => expect(urlProblem(`#${key}`)).toBeUndefined())
  })

  it.each([
    ['#', 'bare #'],
    ['#hero', 'no anchor'],
    ['#masthead', 'no anchor'],
    ['#not-a-section', 'unknown section'],
    ['javascript:alert(1)', 'scheme'],
    ['data:text/html,x', 'scheme'],
    ['http://example.org', 'scheme'],
    ['HTTPS://example.org', 'scheme'],
    ['example.org/path', 'scheme'],
    ['', 'scheme'],
    ['//evil.example', 'protocol-relative'],
    ['/\\evil.example', 'backslash'],
    ['https://example.org\\@evil.example', 'backslash'],
    ['https://user:secret@example.org', 'credentials'],
    ['https://user@example.org', 'credentials'],
    ['https://example.org/a b', 'whitespace'],
    ['/path\u0000', 'control'],
    ['/path\u0085', 'control'],
    ['https://example.org/%E0%A4%A', 'percent-encoding'],
    ['https:///path', 'host'],
    ['https://', 'host'],
    ['https://[::1/path', 'host'],
  ])('fails %s (%s)', (url, reason) => {
    expect(urlProblem(url)).toContain(reason)
  })
})
