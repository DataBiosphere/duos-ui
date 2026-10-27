import { describe, expect, it } from 'vitest'
import { LookupRequestSchema, SafeUrlSchema, ShowcaseConfigSchema } from 'src/showcases/schema'
import { LOOKUP_LIMITS } from 'src/types/showcase'

const id = (alias: number) => `DUOS-${String(alias).padStart(6, '0')}`
const ids = (count: number) => Array.from({ length: count }, (_, i) => id(i + 1))
const values = (count: number) => Array.from({ length: count }, (_, i) => `DAC ${i}`)

const sections = ShowcaseConfigSchema.shape.sections.shape
const passes = (schema: { safeParse: (value: unknown) => { success: boolean } }, value: unknown) => schema.safeParse(value).success

describe('config schema lookup limits (S2.2)', () => {
  const editorial = (items: string[]) => passes(sections['open-access-datasets'], { enabled: true, items })
  const ranking = (fields: object) => passes(sections['latest-data-releases'], { enabled: true, ranking: 'newest', ...fields })

  it.each([
    ['identifiers', (n: number) => editorial(ids(n)), LOOKUP_LIMITS.identifiers],
    ['identifiers, counted before deduplication', (n: number) => editorial(Array.from({ length: n }, () => id(1))), LOOKUP_LIMITS.identifiers],
    ['pin', (n: number) => ranking({ pin: ids(n) }), LOOKUP_LIMITS.pin],
    ['exclude', (n: number) => ranking({ exclude: ids(n) }), LOOKUP_LIMITS.exclude],
    ['scope values', (n: number) => ranking({ scope: { dac: values(n) } }), LOOKUP_LIMITS.scopeValues],
    ['ranking limit', (n: number) => ranking({ limit: n }), LOOKUP_LIMITS.rankingLimit],
  ])('passes the maximum and fails one more: %s', (_, check, max) => {
    expect(check(max)).toBe(true)
    expect(check(max + 1)).toBe(false)
  })

  it('passes an identifier at the maximum length and fails a longer one', () => {
    const atMax = `DUOS-1${'0'.repeat(LOOKUP_LIMITS.identifierLength - 6)}`
    expect(atMax).toHaveLength(LOOKUP_LIMITS.identifierLength)
    expect(editorial([atMax])).toBe(true)
    expect(editorial([`${atMax}0`])).toBe(false)
  })

  it.each([0, -1, 1.5])('fails the ranking limit %s', (limit) => {
    expect(ranking({ limit })).toBe(false)
  })
})

describe('lookup request schema limits (S2.2)', () => {
  it.each([
    ['identifiers', (n: number) => ({ mode: 'identifiers', section: 'open-access-datasets', identifiers: ids(n) }), LOOKUP_LIMITS.identifiers],
    ['pin', (n: number) => ({ mode: 'ranking', section: 'latest-data-releases', ranking: 'newest', pin: ids(n) }), LOOKUP_LIMITS.pin],
    ['exclude', (n: number) => ({ mode: 'ranking', section: 'latest-data-releases', ranking: 'newest', exclude: ids(n) }), LOOKUP_LIMITS.exclude],
    ['ranking limit', (n: number) => ({ mode: 'ranking', section: 'latest-data-releases', ranking: 'newest', limit: n }), LOOKUP_LIMITS.rankingLimit],
    ['scope values', (n: number) => ({ mode: 'stats', scope: { dac: values(n) } }), LOOKUP_LIMITS.scopeValues],
    ['page size', (n: number) => ({ mode: 'all', pageSize: n }), LOOKUP_LIMITS.pageSize],
    ['cursor length', (n: number) => ({ mode: 'all', cursor: 'c'.repeat(n) }), LOOKUP_LIMITS.cursorLength],
  ])('passes the maximum and fails one more: %s', (_, request, max) => {
    expect(passes(LookupRequestSchema, request(max))).toBe(true)
    expect(passes(LookupRequestSchema, request(max + 1))).toBe(false)
  })
})

describe('SafeUrlSchema same-page links', () => {
  it('accepts a section that renders an anchor', () => {
    expect(passes(SafeUrlSchema, '#featured-workspaces')).toBe(true)
  })

  it.each(['#masthead', '#hero', '#'])('rejects %s, which has no anchor', (url) => {
    expect(passes(SafeUrlSchema, url)).toBe(false)
  })
})
