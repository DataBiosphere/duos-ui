/**
 * CI guard rules for one showcase config (DT-4273, S1.2; delivery plan section 3).
 *
 * The rules read the raw config, so each reports its own specific message even when the schema also
 * fails. zod reports a failed section union only as "Invalid input" at the section, so that one
 * issue is dropped when a rule already reports an error inside the section. Every other schema
 * issue is kept. A section with a rule error and a shape error therefore shows the rule error
 * first; fix it and run the guard again to see the shape error.
 */
import type * as z from 'zod'
import { ShowcaseConfigSchema } from 'src/showcases/schema'
import { contrastProblems, themeColors } from 'src/showcases/themes'
import { urlProblem } from 'src/showcases/urlPolicy'
import { DATE_PATTERN, HEX_COLOR_PATTERN, type HexColor, IMPLEMENTED_SECTION_KEYS, SECTION_KEYS, type SectionKey, THEME_PRESET_KEYS, type ThemePresetKey } from 'src/types/showcase'
import { checkAssetBudget, type ReadSize } from './assetBudget'
import { walkObjects } from './walk'

export interface GuardOptions {
  /** Section types that may be enabled. Defaults to `IMPLEMENTED_SECTION_KEYS`. */
  implemented?: readonly SectionKey[]
  readSize?: ReadSize
}

type Sections = Record<string, { enabled?: unknown } | undefined>

const sectionsOf = (config: unknown): Sections =>
  ((config as { sections?: unknown } | null)?.sections ?? {}) as Sections

/** All 23 keys are in fixed order. A missing or unknown key is a schema error. */
const checkKeyOrder = (config: unknown): string[] => {
  const keys = Object.keys(sectionsOf(config))
  const sameKeys = keys.length === SECTION_KEYS.length && SECTION_KEYS.every(key => keys.includes(key))
  return sameKeys && keys.some((key, i) => key !== SECTION_KEYS[i]) ? ['sections: keys are not in the registry order'] : []
}

const checkImplemented = (config: unknown, implemented: readonly SectionKey[]): string[] =>
  Object.entries(sectionsOf(config))
    .filter(([key, section]) => section?.enabled === true && !(implemented as readonly string[]).includes(key))
    .map(([key]) => `sections.${key}: ${key} is not implemented`)

const isUrlField = (key: string) => key === 'url' || key.endsWith('Url')

const checkUrls = (config: unknown): string[] => {
  const errors: string[] = []
  walkObjects(config, (node, path) => Object.entries(node).forEach(([key, value]) => {
    const problem = isUrlField(key) && typeof value === 'string' ? urlProblem(value) : undefined
    if (problem) {
      errors.push(`${path}.${key}: "${value}" ${problem}`)
    }
  }))
  return errors
}

/** The showcase's own logo and up to three partners (contracts record, D10). */
export const MAX_MASTHEAD_LOGOS = 4

const mastheadLogos = (config: unknown): unknown[] => {
  const logos = (sectionsOf(config).masthead as { logos?: unknown } | undefined)?.logos
  return Array.isArray(logos) ? logos : []
}

/** Partner logos need alt text. The showcase's own logo (`logos[0]`) may leave it empty, and the
 * template then uses the registry title (D10). Other images may use empty alt when decorative. */
const checkLogoAlt = (config: unknown): string[] =>
  mastheadLogos(config)
    .map((logo, i) => {
      const alt = (logo as { alt?: unknown } | null)?.alt
      return i === 0 || (typeof alt === 'string' && alt.trim()) ? undefined : `sections.masthead.logos.${i}.alt: a partner logo needs alt text`
    })
    .filter(error => error !== undefined)

const checkLogoCount = (config: unknown): string[] => {
  const count = mastheadLogos(config).length
  return count > MAX_MASTHEAD_LOGOS
    ? [`sections.masthead.logos: ${count} logos; the masthead shows the showcase's own logo and at most ${MAX_MASTHEAD_LOGOS - 1} partners`]
    : []
}

/** Analysis Apps show one full-width featured card above the app grid (original Story 14). */
export const MAX_FEATURED_TOOLS = 1

/** Counted in disabled sections too, so turning the section on can't break the guard. */
const checkFeaturedTools = (config: unknown): string[] => {
  const items = (sectionsOf(config)['featured-tools'] as { items?: unknown } | undefined)?.items
  const count = Array.isArray(items) ? items.filter(item => (item as { featured?: unknown } | null)?.featured === true).length : 0
  return count > MAX_FEATURED_TOOLS
    ? [`sections.featured-tools.items: ${count} featured apps; Analysis Apps show at most ${MAX_FEATURED_TOOLS} featured card`]
    : []
}

/** A resource card's launch link opens the resource, so it can't be a `#section` link on this page.
 * A link that fails the URL policy is already reported by `checkUrls`. */
const checkLaunchUrls = (config: unknown): string[] => {
  const errors: string[] = []
  walkObjects(config, ({ launchUrl }, path) => {
    if (typeof launchUrl === 'string' && launchUrl.startsWith('#') && urlProblem(launchUrl) === undefined) {
      errors.push(`${path}.launchUrl: "${launchUrl}" is a link to a section of this page; a launch link opens the resource`)
    }
  })
  return errors
}

const isDate = (value: unknown): value is string => typeof value === 'string' && DATE_PATTERN.test(value)

/** Date ranges include both ends, so a one-day range has equal dates. */
const checkDateRanges = (config: unknown): string[] => {
  const errors: string[] = []
  walkObjects(config, ({ startDate, endDate }, path) => {
    if (isDate(startDate) && isDate(endDate) && startDate > endDate) {
      errors.push(`${path}: endDate ${endDate} is before startDate ${startDate}`)
    }
  })
  return errors
}

/** Item IDs are analytics keys, so they are unique across the whole showcase. */
const checkItemIds = (config: unknown): string[] => {
  const errors: string[] = []
  const seen = new Set<string>()
  walkObjects(config, ({ id }, path) => {
    if (typeof id !== 'string') {
      return
    }
    if (seen.has(id)) {
      errors.push(`${path}: duplicate item ID "${id}"`)
    }
    seen.add(id)
  })
  return errors
}

const isPreset = (value: unknown): value is ThemePresetKey => THEME_PRESET_KEYS.includes(value as ThemePresetKey)
const isHexOrAbsent = (value: unknown): value is HexColor | undefined =>
  value === undefined || (typeof value === 'string' && HEX_COLOR_PATTERN.test(value))

/** Low-contrast branding fails CI. An unknown preset or a malformed colour is a schema error, so
 * the rule checks only a branding block the schema would accept. */
const checkContrast = (config: unknown): string[] => {
  const branding = (config as { branding?: Record<string, unknown> } | null)?.branding
  if (!branding || !isPreset(branding.theme) || !isHexOrAbsent(branding.primary) || !isHexOrAbsent(branding.accent)) {
    return []
  }
  const { theme, primary, accent } = branding
  const overridden = { primary: primary !== undefined, accent: accent !== undefined }
  return contrastProblems(themeColors({ theme, primary, accent }))
    .map(({ field, message }) => `branding.${overridden[field] ? field : 'theme'}: ${message}`)
}

const pathOf = (error: string) => {
  const end = error.indexOf(': ')
  return end === -1 ? '' : error.slice(0, end)
}

/** Schema issues, less the vague union failures that a rule error inside them explains. */
const schemaErrors = (config: unknown, ruleErrors: string[]): string[] => {
  const rulePaths = ruleErrors.map(pathOf)
  const explained = (issue: z.core.$ZodIssue) => {
    const path = issue.path.join('.')
    return issue.code === 'invalid_union' && rulePaths.some(rulePath => rulePath === path || rulePath.startsWith(`${path}.`))
  }
  return (ShowcaseConfigSchema.safeParse(config).error?.issues ?? [])
    .filter(issue => !explained(issue))
    .map(issue => `${issue.path.join('.') || '(config)'}: ${issue.message}`)
}

/** Returns one message for each broken rule; an empty list means the config passes the guard. */
export const checkShowcase = (config: unknown, options: GuardOptions = {}): string[] => {
  const { implemented = IMPLEMENTED_SECTION_KEYS, readSize } = options
  const ruleErrors = [
    ...checkKeyOrder(config),
    ...checkImplemented(config, implemented),
    ...checkUrls(config),
    ...checkLogoAlt(config),
    ...checkLogoCount(config),
    ...checkFeaturedTools(config),
    ...checkLaunchUrls(config),
    ...checkDateRanges(config),
    ...checkItemIds(config),
    ...checkContrast(config),
  ]
  return [...ruleErrors, ...schemaErrors(config, ruleErrors), ...checkAssetBudget(config, readSize)]
}
