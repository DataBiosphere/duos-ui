import { describe, expect, it } from 'vitest'
import { contrastProblems, contrastRatio, MIN_CONTRAST, THEME_PRESETS, themeColors } from 'src/showcases/themes'
import { THEME_PRESET_KEYS } from 'src/types/showcase'

describe('contrastRatio', () => {
  it.each([
    ['#000000', '#ffffff', 21],
    ['#ffffff', '#000000', 21],
    ['#777777', '#777777', 1],
    // Reference values from the WCAG contrast formula.
    ['#767676', '#ffffff', 4.54],
    ['#2fa4e7', '#ffffff', 2.77],
  ] as const)('%s on %s is %s:1', (a, b, expected) => {
    expect(contrastRatio(a, b)).toBeCloseTo(expected, 2)
  })

  it('reads upper-case hex', () => {
    expect(contrastRatio('#FFFFFF', '#000000')).toBe(21)
  })

  it.each(['#fff', '#ffffff80', '#gggggg', 'ffffff'] as const)('throws on %s instead of mismeasuring it', (colour) => {
    expect(() => contrastRatio(colour as `#${string}`, '#000000')).toThrow(`Not a #rrggbb colour: "${colour}"`)
  })
})

describe('THEME_PRESETS', () => {
  it('has a palette for every preset key', () => {
    expect(Object.keys(THEME_PRESETS)).toEqual([...THEME_PRESET_KEYS])
  })

  it.each(THEME_PRESET_KEYS)('preset %s passes the contrast rule', (theme) => {
    expect(contrastProblems(THEME_PRESETS[theme])).toEqual([])
  })
})

describe('themeColors', () => {
  it('returns the preset when nothing is overridden', () => {
    expect(themeColors({ theme: 'blue' })).toEqual(THEME_PRESETS.blue)
  })

  it('applies primary and accent overrides over the preset', () => {
    expect(themeColors({ theme: 'blue', primary: '#123456', accent: '#654321' }))
      .toEqual({ ...THEME_PRESETS.blue, primary: '#123456', accent: '#654321' })
  })
})

describe('contrastProblems', () => {
  const base = THEME_PRESETS.default

  it('fails a primary colour below 4.5:1', () => {
    // #777777 is 4.478:1 on white, just under the text minimum.
    expect(contrastProblems({ ...base, primary: '#777777' })).toEqual([
      { field: 'primary', message: `#777777 on #ffffff has contrast 4.47:1; the minimum is ${MIN_CONTRAST.primary}:1` },
    ])
  })

  it('never prints a failing ratio as the minimum', () => {
    // #0081a3 is 4.4978:1 on white, which rounds to 4.50.
    expect(contrastProblems({ ...base, primary: '#0081a3' })).toEqual([
      { field: 'primary', message: `#0081a3 on #ffffff has contrast 4.49:1; the minimum is ${MIN_CONTRAST.primary}:1` },
    ])
  })

  it('passes a primary colour at 4.5:1 or above', () => {
    expect(contrastProblems({ ...base, primary: '#767676' })).toEqual([])
  })

  it('holds the accent to the 4.5:1 text minimum, since button labels sit on it', () => {
    // #00928a is 3.83:1: enough for non-text UI, not for a label on an accent button.
    expect(contrastProblems({ ...base, accent: '#00928a' })).toEqual([expect.objectContaining({ field: 'accent' })])
    expect(contrastProblems({ ...base, accent: '#a65c00' })).toEqual([])
  })
})
