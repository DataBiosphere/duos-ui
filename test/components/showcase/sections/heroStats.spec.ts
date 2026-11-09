import { describe, expect, it } from 'vitest'
import { countToolItems, heroStatLabel, heroStats } from 'src/components/showcase/sections/heroContent'
import type { LookupState } from 'src/components/showcase/useShowcaseLookups'
import { ShowcaseLookupError } from 'src/libs/ajax/ShowcaseCatalog'
import { resolveShowcase } from 'src/showcases/defaults'
import { ShowcaseConfigSchema } from 'src/showcases/schema'
import type { ShowcasePartialInput, StatsResponse } from 'src/types/showcase'

const retry = () => {}
const ready = (studyCount: number, datasetCount: number): LookupState<StatsResponse> => ({ status: 'ready', data: { studyCount, datasetCount }, retry })
const LOADING: LookupState<StatsResponse> = { status: 'loading', retry }
const FAILED: LookupState<StatsResponse> = { status: 'error', error: new ShowcaseLookupError('network', 'down'), retry }

const tool = (id: string) => ({ id, name: id, description: 'A tool', tags: [], launchUrl: 'https://example.org/tool' as const })

const sectionsWith = (sections: ShowcasePartialInput['sections']) =>
  ShowcaseConfigSchema.parse(resolveShowcase({ sections })).sections

describe('countToolItems', () => {
  it('counts the items in the enabled tool sections', () => {
    const sections = sectionsWith({
      'featured-tools': { enabled: true, items: [tool('a'), tool('b')] },
      'notebooks': { enabled: true, items: [tool('c')] },
    })
    expect(countToolItems(sections)).toBe(3)
  })

  it('leaves out disabled tool sections and workspaces, which are not tools', () => {
    const sections = sectionsWith({
      'featured-tools': { enabled: false, items: [tool('a')] },
      'featured-workspaces': { enabled: true, items: [tool('w')] },
      'ai-models': { enabled: true, items: [tool('m')] },
    })
    expect(countToolItems(sections)).toBe(1)
  })

  it('is 0 with no tool sections', () => {
    expect(countToolItems(sectionsWith({}))).toBe(0)
  })
})

describe('heroStats', () => {
  it('gives the stats in config order, with their values', () => {
    expect(heroStats(['tools', 'datasets', 'studies'], ready(12, 34), 5)).toEqual([
      { key: 'tools', value: 5 },
      { key: 'datasets', value: 34 },
      { key: 'studies', value: 12 },
    ])
  })

  it('hides a stat that is 0', () => {
    expect(heroStats(['studies', 'datasets', 'tools'], ready(0, 34), 0)).toEqual([{ key: 'datasets', value: 34 }])
  })

  it('shows a stat once, however often the config lists it', () => {
    expect(heroStats(['datasets', 'datasets'], ready(1, 2), 0)).toEqual([{ key: 'datasets', value: 2 }])
  })

  it.each([
    ['every stat is 0', ['studies', 'datasets', 'tools'] as const, ready(0, 0), 0],
    ['the config lists no stats', [] as const, ready(1, 2), 3],
  ])('is undefined when %s', (_, stats, lookup, tools) => {
    expect(heroStats(stats, lookup, tools)).toBeUndefined()
  })

  // D14: the whole strip goes, including the tools count from config, with no zeros or dashes.
  it.each([
    ['loading', LOADING],
    ['failed', FAILED],
    ['missing', undefined],
  ])('is undefined while the stats lookup is %s', (_, lookup) => {
    expect(heroStats(['studies', 'tools'], lookup, 5)).toBeUndefined()
  })

  it('shows the tools count without a lookup when the hero asks for no catalog counts', () => {
    expect(heroStats(['tools'], undefined, 4)).toEqual([{ key: 'tools', value: 4 }])
  })
})

describe('heroStatLabel', () => {
  it.each([
    ['studies', 1, 'Study'],
    ['studies', 2, 'Studies'],
    ['datasets', 1, 'Dataset'],
    ['datasets', 1234, 'Datasets'],
    ['tools', 1, 'Tool'],
    ['tools', 3, 'Tools'],
  ] as const)('labels %s with a count of %i as "%s"', (key, value, label) => {
    expect(heroStatLabel(key, value)).toBe(label)
  })
})
