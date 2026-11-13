/**
 * Runs the showcase health check (DT-4359, S4.3) and exits 1 when it finds a failing problem.
 * `.github/workflows/showcase-health.yml` runs it; to run it locally:
 *
 *   pnpm exec tsx scripts/showcase-health.ts
 *
 * Settings, all optional, from the environment:
 * - SHOWCASE_HEALTH_LOOKUP_URL: the Consent origin to look identifiers up in; production by default.
 * - SHOWCASE_HEALTH_CHANGED_FILES: a file listing a PR's changed paths, one per line. Set, only the
 *   showcases they change are checked (src/showcases/health/scope.ts); unset, every registered one is.
 * - SHOWCASE_HEALTH_BASE_REGISTRY: the PR base branch's `registry.json`, to tell which entries changed.
 * - SHOWCASE_HEALTH_HISTORY_IN / SHOWCASE_HEALTH_HISTORY_OUT: the previous run's history file, and
 *   where to write this run's.
 * - SHOWCASE_HEALTH_DIGEST: `always`, `never`, or `auto` (the default: Mondays, UTC).
 * - GITHUB_STEP_SUMMARY: set by GitHub Actions; the report is appended to it as well as printed.
 */
import { appendFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs'
import { retiredShowcaseKeys, showcaseConfigs, showcaseEntries } from 'src/showcases'
import registry from 'src/showcases/registry.json'
import { resolveShowcase } from 'src/showcases/defaults'
import { checkIdentifiers, type CheckedShowcase } from 'src/showcases/health/checkIdentifiers'
import { checkLinks } from 'src/showcases/health/checkLinks'
import { createHealthLookup, lookupUrl } from 'src/showcases/health/lookup'
import { collectFindings, nextHistory, parseHistory, renderSummary, runFails, uncheckedPrefixes } from 'src/showcases/health/report'
import { changedRegistryKeys, selectShowcases } from 'src/showcases/health/scope'
import { ShowcaseConfigSchema } from 'src/showcases/schema'

const env = (name: string) => process.env[name]?.trim() || undefined
const readIfPresent = (path: string | undefined) => path && existsSync(path) ? readFileSync(path, 'utf8') : undefined

async function main(): Promise<number> {
  const now = new Date()
  const today = now.toISOString().slice(0, 10)
  const digestSetting = env('SHOWCASE_HEALTH_DIGEST') ?? 'auto'
  if (!['auto', 'always', 'never'].includes(digestSetting)) throw new Error(`SHOWCASE_HEALTH_DIGEST is "${digestSetting}"; use auto, always or never`)
  const digest = digestSetting === 'always' || (digestSetting === 'auto' && now.getUTCDay() === 1)

  const changedFilesPath = env('SHOWCASE_HEALTH_CHANGED_FILES')
  const baseRegistry = readIfPresent(env('SHOWCASE_HEALTH_BASE_REGISTRY'))
  const changed = changedFilesPath === undefined
    ? undefined
    : {
        files: readFileSync(changedFilesPath, 'utf8').split('\n').map(line => line.trim()).filter(Boolean),
        registryKeys: baseRegistry === undefined ? undefined : changedRegistryKeys(JSON.parse(baseRegistry) as typeof registry, registry),
      }

  const registered = showcaseEntries.filter(entry => !retiredShowcaseKeys.includes(entry.key) && Object.hasOwn(showcaseConfigs, entry.key))
  const selected = new Set(selectShowcases(registered.map(entry => entry.key), changed, retiredShowcaseKeys))
  // The CI guard rejects a config that fails the schema, so a parse failure here is a bug: let it throw.
  const showcases: CheckedShowcase[] = registered
    .filter(entry => selected.has(entry.key))
    .map(entry => ({ entry, config: ShowcaseConfigSchema.parse(resolveShowcase(showcaseConfigs[entry.key])) }))

  const url = lookupUrl(env('SHOWCASE_HEALTH_LOOKUP_URL'))
  const lookup = createHealthLookup({ url })
  const [identifiers, links] = await Promise.all([checkIdentifiers(showcases, lookup), checkLinks(showcases)])

  const findings = collectFindings(identifiers, links)
  const history = nextHistory(findings, parseHistory(readIfPresent(env('SHOWCASE_HEALTH_HISTORY_IN'))), today, uncheckedPrefixes(identifiers))
  const historyOut = env('SHOWCASE_HEALTH_HISTORY_OUT')
  if (historyOut) writeFileSync(historyOut, `${JSON.stringify(history, null, 2)}\n`)

  const summary = renderSummary({
    findings,
    history,
    today,
    lookupDisabled: identifiers.lookupDisabled,
    lookupUnreachable: identifiers.lookupUnreachable,
    lookupOrigin: new URL(url).origin,
    checkedShowcases: showcases.map(({ entry }) => entry.key),
    checkedLinks: links.checked,
    digest,
  })
  console.log(summary)
  const stepSummary = env('GITHUB_STEP_SUMMARY')
  if (stepSummary) appendFileSync(stepSummary, summary)
  return runFails(findings) ? 1 : 0
}

main().then(code => process.exit(code), (error: unknown) => {
  console.error('The showcase health check could not run:', error)
  process.exit(2)
})
