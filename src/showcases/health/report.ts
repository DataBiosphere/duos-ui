/**
 * The showcase health check's report (DT-4359, S4.3): one list of findings from the identifier and
 * link checks, how long each has been open, the Markdown job summary and whether the run fails.
 *
 * - Failing: an unavailable identifier, a lookup that failed after its retries, a broken link.
 * - Listed only: an empty computed shelf, a link that could not be verified, and a disabled lookup
 *   (Consent answered 405), which skips the identifier checks.
 *
 * Every run lists every open problem and fails while one is open. The summary puts problems first
 * seen today above those still open. On the weekly digest day it also shows how long each one has
 * been open. `firstSeen` dates carry over from the previous run's history file.
 */
import type { IdentifierReport } from './checkIdentifiers'
import type { LinkFinding, LinkReport } from './checkLinks'

export interface Finding {
  /** Stable across runs, so a problem keeps its first-seen date. */
  id: string
  failing: boolean
  kind: 'Unavailable identifier' | 'Lookup failed' | 'Broken link' | 'Empty shelf' | 'Could not verify link'
  /** Which showcases and where, already formatted. */
  where: string
  detail: string
}

/** Carried from run to run: the date each open problem was first seen. */
export interface History {
  version: 1
  firstSeen: Record<string, string>
}

const hiddenNote = (status: string) => status === 'hidden' ? ' (hidden)' : ''

const linkFinding = (failing: boolean, kind: Finding['kind'], link: LinkFinding): Finding => ({
  // One id however the link answers, so a broken link that answers 403 for a day keeps its date.
  id: `link:${link.url}`,
  failing,
  kind,
  where: link.locations.map(({ showcase, status, path }) => `${showcase}${hiddenNote(status)} \`${path}\``).join('; '),
  detail: `${link.url}: ${link.reason}`,
})

export function collectFindings(identifiers: IdentifierReport, links: LinkReport): Finding[] {
  const shelf = ({ showcase, status, section }: { showcase: string, status: string, section: string }) =>
    `${showcase}${hiddenNote(status)} \`${section}\``
  return [
    ...identifiers.unavailable.map(finding => ({
      id: `unavailable:${finding.showcase}:${finding.section}:${finding.field}:${finding.identifier}`,
      failing: true,
      kind: 'Unavailable identifier' as const,
      where: shelf(finding),
      detail: `${finding.identifier} in \`${finding.field}\``,
    })),
    ...identifiers.lookupFailures.map(finding => ({
      id: `lookup-failed:${finding.showcase}:${finding.section}:${finding.mode}`,
      failing: true,
      kind: 'Lookup failed' as const,
      where: shelf(finding),
      detail: `${finding.mode} lookup: ${finding.reason}`,
    })),
    ...links.broken.map(link => linkFinding(true, 'Broken link', link)),
    ...identifiers.emptyShelves.map(finding => ({
      id: `empty-shelf:${finding.showcase}:${finding.section}`,
      failing: false,
      kind: 'Empty shelf' as const,
      where: shelf(finding),
      detail: `the \`${finding.ranking}\` ranking returned no datasets`,
    })),
    ...links.unverified.map(link => linkFinding(false, 'Could not verify link', link)),
  ]
}

const DATE = /^\d{4}-\d{2}-\d{2}$/

/** A previous history file, or an empty one when it is missing or unreadable: then everything is new. */
export function parseHistory(text: string | undefined): History {
  try {
    const parsed = JSON.parse(text ?? '') as Partial<History>
    const firstSeen = Object.fromEntries(Object.entries(parsed.firstSeen ?? {})
      .filter((entry): entry is [string, string] => typeof entry[1] === 'string' && DATE.test(entry[1])))
    return { version: 1, firstSeen: parsed.version === 1 ? firstSeen : {} }
  }
  catch {
    return { version: 1, firstSeen: {} }
  }
}

/**
 * The id prefixes of findings this run could not check: every dataset finding when the lookup is
 * off, otherwise those of each shelf whose lookup failed. Their history carries over unchanged.
 */
export function uncheckedPrefixes(identifiers: IdentifierReport): string[] {
  if (identifiers.lookupDisabled || identifiers.lookupUnreachable) return ['unavailable:', 'empty-shelf:', 'lookup-failed:']
  return identifiers.lookupFailures.flatMap(({ showcase, section }) => [`unavailable:${showcase}:${section}:`, `empty-shelf:${showcase}:${section}`])
}

/**
 * This run's history: the open problems, plus any the run could not check. A problem that was
 * checked and is gone is dropped, so if it comes back it counts as new.
 */
export function nextHistory(findings: readonly Finding[], previous: History, today: string, unchecked: readonly string[] = []): History {
  const carried = Object.entries(previous.firstSeen).filter(([id]) => unchecked.some(prefix => id.startsWith(prefix)))
  return {
    version: 1,
    firstSeen: { ...Object.fromEntries(carried), ...Object.fromEntries(findings.map(({ id }) => [id, previous.firstSeen[id] ?? today])) },
  }
}

const daysBetween = (from: string, to: string) => Math.round((Date.parse(to) - Date.parse(from)) / 86_400_000)

/** Markdown table cells: no pipes or line breaks from config or server text. */
const cell = (text: string) => text.replace(/\|/g, '\\|').replace(/[\r\n]+/g, ' ')

export interface SummaryInput {
  findings: readonly Finding[]
  history: History
  today: string
  lookupDisabled: boolean
  /** A lookup failed every retry, so the remaining dataset checks were skipped. */
  lookupUnreachable: boolean
  /** The Consent origin the identifiers were looked up in. */
  lookupOrigin: string
  checkedShowcases: readonly string[]
  checkedLinks: number
  /** The weekly digest adds how long each problem has been open. */
  digest: boolean
}

export const runFails = (findings: readonly Finding[]) => findings.some(finding => finding.failing)

export function renderSummary(input: SummaryInput): string {
  const { findings, history, today, lookupDisabled, lookupUnreachable, lookupOrigin, checkedShowcases, checkedLinks, digest } = input
  const failing = runFails(findings)
  const lines = [
    `## Showcase health check${digest ? ': weekly digest' : ''}`,
    '',
    `${failing ? '**Failing.**' : '**Passing.**'} Checked ${checkedShowcases.length} showcase(s)${checkedShowcases.length ? ` (${checkedShowcases.join(', ')})` : ''} and ${checkedLinks} link(s) on ${today}.`,
  ]
  if (lookupDisabled) {
    lines.push('', `> The lookup at ${lookupOrigin} answered 405: it is turned off, so dataset identifiers and shelves were not checked.`)
  }
  if (lookupUnreachable) {
    lines.push('', `> The lookup at ${lookupOrigin} stopped answering, so the remaining dataset identifiers and shelves were not checked.`)
  }
  if (findings.length === 0) {
    lines.push('', 'No problems found.')
    return `${lines.join('\n')}\n`
  }
  lines.push(
    '',
    'An unavailable identifier is private, removed or never existed; the public lookup does not say which. Check it in the DUOS catalog with an authorized account.',
  )
  if (findings.some(finding => finding.kind === 'Could not verify link')) {
    lines.push('', 'Open each link that could not be verified in a browser: the site refused the check, which does not show whether visitors can reach it.')
  }

  const table = (title: string, rows: readonly Finding[]) => {
    if (rows.length === 0) return
    lines.push('', `### ${title}`, '', `| Problem | Fails the run | Where | Detail |${digest ? ' Open for |' : ''}`, `| --- | --- | --- | --- |${digest ? ' --- |' : ''}`)
    for (const finding of rows) {
      const opened = history.firstSeen[finding.id] ?? today
      const age = digest ? ` ${daysBetween(opened, today)} day(s), since ${opened} |` : ''
      lines.push(`| ${finding.kind} | ${finding.failing ? 'Yes' : 'No'} | ${cell(finding.where)} | ${cell(finding.detail)} |${age}`)
    }
  }
  const isNew = (finding: Finding) => (history.firstSeen[finding.id] ?? today) === today
  table('New today', findings.filter(isNew))
  table('Still open', findings.filter(finding => !isNew(finding)))
  return `${lines.join('\n')}\n`
}
