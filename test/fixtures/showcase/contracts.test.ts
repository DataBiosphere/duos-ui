import { describe, expect, it } from 'vitest'
import { DUOS_IDENTIFIER_PATTERN, flagshipConfig, lookupExamples, MVP_SECTION_KEYS, partnerConfig, SECTION_KEYS } from './contracts'

const configs = [['flagship', flagshipConfig], ['partner', partnerConfig]] as const

describe('Data Showcase contract fixtures', () => {
  it('lists 23 unique registry keys', () => {
    expect(SECTION_KEYS).toHaveLength(23)
    expect(new Set(SECTION_KEYS).size).toBe(23)
  })

  it.each(configs)('%s config has every key in fixed order', (_, config) => {
    expect(Object.keys(config.sections)).toEqual([...SECTION_KEYS])
  })

  it.each(configs)('%s config enables only MVP sections', (_, config) => {
    const enabled = SECTION_KEYS.filter(key => config.sections[key].enabled)
    expect(enabled.every(key => MVP_SECTION_KEYS.includes(key))).toBe(true)
  })

  it('uses only canonical identifiers outside rejection examples', () => {
    const accepted = lookupExamples.filter(example => example.status === 200)
    const identifiers = JSON.stringify([configs, accepted]).match(/DUOS-[^"]*/g) ?? []
    expect(identifiers.length).toBeGreaterThan(0)
    identifiers.forEach(id => expect(id).toMatch(DUOS_IDENTIFIER_PATTERN))
  })
})
