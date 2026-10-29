/**
 * Showcase theme presets and the contrast rule for branding overrides (DT-4276, S1.3).
 *
 * PLACEHOLDER PALETTES. Design sets the preset colours (consent
 * `docs/plans/data-showcase-contracts.md`); until then they reuse DUOS palette colours that pass
 * the contrast rule. Change the values here, not the keys: configs name presets by key.
 *
 * Showcases render on a light background only, so the rule checks each colour against the preset's
 * background. Both colours need the WCAG 2 AA text minimum (4.5:1): the primary colour carries text,
 * and the accent backs buttons whose labels use the background colour, so a label on the accent has
 * the same contrast as the accent on the background.
 */
import { HEX_COLOR_PATTERN, type HexColor, type ThemePresetKey } from 'src/types/showcase'

export interface ThemeColors { primary: HexColor, accent: HexColor, background: HexColor }

export const THEME_PRESETS: Readonly<Record<ThemePresetKey, ThemeColors>> = {
  default: { primary: '#1f3b50', accent: '#00796f', background: '#ffffff' },
  blue: { primary: '#216fb4', accent: '#a65c00', background: '#ffffff' },
  teal: { primary: '#00706a', accent: '#00609f', background: '#ffffff' },
}

export const MIN_CONTRAST = { primary: 4.5, accent: 4.5 } as const

const channel = (value: number) => {
  const c = value / 255
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
}

/** WCAG 2 relative luminance of a `#rrggbb` colour. The `HexColor` type also admits forms such as
 * `#fff`, which would read as the wrong colour, so anything else throws instead of mismeasuring. */
const luminance = (hex: HexColor) => {
  if (!HEX_COLOR_PATTERN.test(hex)) {
    throw new Error(`Not a #rrggbb colour: "${hex}"`)
  }
  const n = parseInt(hex.slice(1), 16)
  return 0.2126 * channel(n >> 16) + 0.7152 * channel((n >> 8) & 0xff) + 0.0722 * channel(n & 0xff)
}

/** WCAG 2 contrast ratio, from 1 (same colour) to 21 (black on white). */
export const contrastRatio = (a: HexColor, b: HexColor): number => {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (light + 0.05) / (dark + 0.05)
}

/** The preset's colours with the config's overrides applied. */
export const themeColors = (branding: { theme: ThemePresetKey, primary?: HexColor, accent?: HexColor }): ThemeColors => ({
  ...THEME_PRESETS[branding.theme],
  ...(branding.primary && { primary: branding.primary }),
  ...(branding.accent && { accent: branding.accent }),
})

/** Truncates, so a failing ratio such as 4.497 never prints as the 4.50 minimum. */
const formatRatio = (ratio: number) => (Math.floor(ratio * 100) / 100).toFixed(2)

/** One message per colour below its minimum contrast against the background. */
export const contrastProblems = (colors: ThemeColors): { field: keyof typeof MIN_CONTRAST, message: string }[] =>
  (Object.keys(MIN_CONTRAST) as (keyof typeof MIN_CONTRAST)[]).flatMap((field) => {
    const ratio = contrastRatio(colors[field], colors.background)
    return ratio < MIN_CONTRAST[field]
      ? [{ field, message: `${colors[field]} on ${colors.background} has contrast ${formatRatio(ratio)}:1; the minimum is ${MIN_CONTRAST[field]}:1` }]
      : []
  })
