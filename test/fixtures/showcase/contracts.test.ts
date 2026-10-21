import { describe, expect, it } from 'vitest'
import {
  AllResponseSchema,
  IdentifiersResponseSchema,
  LookupRequestSchema,
  RankingResponseSchema,
  ShowcaseConfigSchema,
  StatsResponseSchema,
} from 'src/showcases/schema'
import { MVP_SECTION_KEYS, SECTION_KEYS, type SectionKey } from 'src/types/showcase'
import { flagshipConfig, type LookupExample, lookupExamples, partnerConfig } from './contracts'

const configs = [['flagship', flagshipConfig], ['partner', partnerConfig]] as const

const RESPONSE_SCHEMAS = {
  identifiers: IdentifiersResponseSchema,
  ranking: RankingResponseSchema,
  all: AllResponseSchema,
  stats: StatsResponseSchema,
}

const accepted = lookupExamples.filter((example): example is Extract<LookupExample, { status: 200 }> => example.status === 200)
const rejected = lookupExamples.filter(example => example.status !== 200)

describe('Data Showcase contract fixtures', () => {
  it('lists 23 unique registry keys', () => {
    expect(SECTION_KEYS).toHaveLength(23)
    expect(new Set(SECTION_KEYS).size).toBe(23)
  })

  it.each(configs)('%s config has every key in fixed order', (_, config) => {
    expect(Object.keys(config.sections)).toEqual([...SECTION_KEYS])
  })

  it.each(configs)('%s config enables only MVP sections', (_, config) => {
    const mvpKeys: readonly SectionKey[] = MVP_SECTION_KEYS
    const enabled = SECTION_KEYS.filter(key => config.sections[key].enabled)
    expect(enabled.every(key => mvpKeys.includes(key))).toBe(true)
  })

  // The schemas check every identifier and date field, so a non-canonical value fails here.
  it.each(configs)('%s config parses with the config schema', (_, config) => {
    expect(ShowcaseConfigSchema.safeParse(config).error).toBeUndefined()
  })

  it.each(accepted.map(example => [example.name, example] as const))('accepted example parses: %s', (_, example) => {
    expect(LookupRequestSchema.safeParse(example.request).error).toBeUndefined()
    expect(RESPONSE_SCHEMAS[example.request.mode].safeParse(example.response).error).toBeUndefined()
  })

  it.each(rejected.map(example => [example.name, example] as const))('rejected example fails the request schema: %s', (_, example) => {
    expect(LookupRequestSchema.safeParse(example.request).success).toBe(false)
  })
})
