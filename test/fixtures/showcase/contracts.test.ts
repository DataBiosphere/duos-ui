import { describe, expect, it } from 'vitest'
import { flagshipConfig, MVP_SECTION_KEYS, partnerConfig, SECTION_KEYS } from './contracts'

describe('Data Showcase contract fixtures', () => {
  it('lists 23 unique registry keys', () => {
    expect(SECTION_KEYS).toHaveLength(23)
    expect(new Set(SECTION_KEYS).size).toBe(23)
  })

  it.each([['flagship', flagshipConfig], ['partner', partnerConfig]])('%s config has every key in fixed order', (_, config) => {
    expect(Object.keys(config.sections)).toEqual([...SECTION_KEYS])
  })

  it.each([['flagship', flagshipConfig], ['partner', partnerConfig]])('%s config enables only MVP sections', (_, config) => {
    const enabled = SECTION_KEYS.filter(key => config.sections[key].enabled)
    expect(enabled.every(key => MVP_SECTION_KEYS.includes(key))).toBe(true)
  })
})
