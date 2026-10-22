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
import { urlProblem } from 'src/showcases/urlPolicy'
import { DATE_PATTERN, IMPLEMENTED_SECTION_KEYS, SECTION_KEYS, type SectionKey } from 'src/types/showcase'
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

/** Logos need alt text. Other images may use empty alt when they are decorative. */
const checkLogoAlt = (config: unknown): string[] => {
  const logos = (sectionsOf(config).masthead as { logos?: unknown } | undefined)?.logos
  return (Array.isArray(logos) ? logos : [])
    .map((logo: { alt?: unknown }, i) => (typeof logo?.alt === 'string' && logo.alt.trim() ? undefined : `sections.masthead.logos.${i}.alt: a logo needs alt text`))
    .filter(error => error !== undefined)
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
    ...checkDateRanges(config),
    ...checkItemIds(config),
  ]
  return [...ruleErrors, ...schemaErrors(config, ruleErrors), ...checkAssetBudget(config, readSize)]
}
