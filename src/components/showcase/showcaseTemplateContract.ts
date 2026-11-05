/**
 * What `ShowcaseTemplate` shares with section renderers (DT-4353, S3.1), kept out of the component
 * file so fast refresh keeps working.
 */
import { createContext } from 'react'
import type { ShowcaseLookups } from 'src/components/showcase/useShowcaseLookups'
import { contrastProblems, THEME_PRESETS, type ThemeColors, themeColors } from 'src/showcases/themes'
import type { ShowcaseConfig } from 'src/types/showcase'

/** The id of the page's `h1` and the skip link's target. The hero renderer puts it, with
 * `tabIndex={-1}`, on its heading; without a hero the template renders its own `h1`. */
export const SHOWCASE_MAIN_HEADING_ID = 'showcase-main-heading'

/** Provisional (design review D16): the neutrals, from the artifact's light theme (the same values
 * the primitives use as fallbacks). */
export const SHOWCASE_NEUTRALS = {
  '--showcase-surface': '#ffffff',
  '--showcase-border': 'rgba(33, 43, 54, 0.12)',
  '--showcase-border-strong': 'rgba(33, 43, 54, 0.24)',
  '--showcase-muted-text': '#637381',
  '--showcase-accent-tint': '#ecedf8',
} as const

/**
 * The lookup state of every section, for renderers to read. `SectionRendererProps` (#4077) has no
 * lookup field, so the template provides it here rather than through props.
 */
export const ShowcaseLookupsContext = createContext<ShowcaseLookups>({ datasets: {} })

/** The config's colors, with any override that fails its contrast check replaced by the preset's
 * own color, so a failing color is never rendered. */
export const accessibleThemeColors = (branding: ShowcaseConfig['branding']): ThemeColors => {
  const colors = themeColors(branding)
  const preset = THEME_PRESETS[branding.theme]
  return contrastProblems(colors).reduce((safe, { field }) => ({ ...safe, [field]: preset[field] }), colors)
}
