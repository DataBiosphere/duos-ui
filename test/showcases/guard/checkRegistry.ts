/**
 * CI guard rules for the showcase index (DT-4273, S1.2; delivery plan section 3). The historical
 * comparison with the target branch is a separate check.
 */
import { ShowcaseRegistrySchema } from 'src/showcases/schema'
import type { ShowcaseRegistry } from 'src/types/showcase'

const duplicates = (values: string[]) => values.filter((value, i) => values.indexOf(value) !== i)

const checkKeys = ({ entries, retiredKeys }: ShowcaseRegistry): string[] => {
  const keys = entries.map(entry => entry.key)
  return [
    ...duplicates(keys).map(key => `entries: duplicate key "${key}"`),
    ...keys.filter(key => retiredKeys.includes(key)).map(key => `entries: retired key "${key}" can't be reused`),
  ]
}

/** Exactly one entry is the flagship, served at `/data`. The registry is empty until E3. */
const checkFlagship = ({ entries }: ShowcaseRegistry): string[] => {
  const flagships = entries.filter(entry => entry.flagship).length
  return entries.length > 0 && flagships !== 1 ? [`entries: exactly one flagship is required; found ${flagships}`] : []
}

const checkConfigs = ({ entries }: ShowcaseRegistry, configKeys: string[]): string[] => {
  const keys = entries.map(entry => entry.key)
  return [
    ...keys.filter(key => !configKeys.includes(key)).map(key => `entries: "${key}" has no config`),
    ...configKeys.filter(key => !keys.includes(key)).map(key => `configs: "${key}" has no index entry`),
  ]
}

/** Returns one message for each broken rule; an empty list means the index passes the guard. */
export const checkRegistry = (registry: unknown, configs: Readonly<Record<string, unknown>>): string[] => {
  const result = ShowcaseRegistrySchema.safeParse(registry)
  if (!result.success) {
    return result.error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`)
  }
  return [...checkKeys(result.data), ...checkFlagship(result.data), ...checkConfigs(result.data, Object.keys(configs))]
}
