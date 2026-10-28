import { describe, expect, it } from 'vitest'
import { LOOKUP_LIMITS, MVP_SECTION_KEYS, SECTION_KEYS, type ShowcaseConfigInput } from 'src/types/showcase'
import { flagshipConfig, partnerConfig } from '../../fixtures/showcase/contracts'
import { checkShowcase } from './checkShowcase'

/** Treats the six MVP sections as implemented, so the S1.1 fixtures are valid configs. */
const guard = (config: unknown) => checkShowcase(config, { implemented: MVP_SECTION_KEYS, readSize: () => 1 })

/** A copy of the flagship fixture with `edit` applied. */
const broken = (edit: (config: ShowcaseConfigInput) => void): ShowcaseConfigInput => {
  const config = structuredClone(flagshipConfig)
  edit(config)
  return config
}

const id = (alias: number) => `DUOS-${String(alias).padStart(6, '0')}` as const
const ids = (count: number) => Array.from({ length: count }, (_, i) => id(i + 1))

/** Expects exactly the errors that mention each of `fragments`, in any order. */
const expectErrors = (errors: string[], ...fragments: string[]) => {
  expect(errors).toHaveLength(fragments.length)
  fragments.forEach(fragment => expect(errors).toContainEqual(expect.stringContaining(fragment)))
}

describe('checkShowcase', () => {
  it.each([['flagship', flagshipConfig], ['partner', partnerConfig]])('passes the %s fixture', (_, config) => {
    expect(guard(config)).toEqual([])
  })

  describe('schema and key order', () => {
    it('fails a config with a missing section key', () => {
      const config = broken((c) => {
        delete (c.sections as Partial<ShowcaseConfigInput['sections']>)['notebooks']
      })
      expectErrors(guard(config), 'sections.notebooks')
    })

    it('fails a config with its section keys out of order', () => {
      const config = broken((c) => {
        const { masthead, ...rest } = c.sections
        c.sections = { ...rest, masthead } as ShowcaseConfigInput['sections']
      })
      expectErrors(guard(config), 'order')
    })

    it('fails a config at another schemaVersion', () => {
      expectErrors(guard({ ...flagshipConfig, schemaVersion: 2 }), 'schemaVersion')
    })

    it('fails a config with an unknown field', () => {
      expectErrors(guard(broken(c => Object.assign(c.branding, { font: 'Comic Sans' }))), 'branding')
    })
  })

  describe('implemented types', () => {
    it('fails an enabled section type that is not implemented', () => {
      const config = broken((c) => {
        c.sections.notebooks = { enabled: true, items: [] }
      })
      expectErrors(guard(config), 'sections.notebooks: notebooks is not implemented')
    })

    it('fails the S1.1 fixtures while no section type is implemented', () => {
      const errors = checkShowcase(flagshipConfig, { implemented: [], readSize: () => 1 })
      expect(errors).toHaveLength(MVP_SECTION_KEYS.length)
    })

    it('passes a disabled section type that is not implemented', () => {
      const config = broken((c) => {
        c.sections.notebooks = { enabled: false, items: [] }
      })
      expect(guard(config)).toEqual([])
    })
  })

  // Every URL rule has direct tests in test/showcases/urlPolicy.spec.ts. These prove that the guard
  // applies the policy to every URL field.
  describe('URLs', () => {
    const withCta = (url: string) => broken((c) => {
      const tools = c.sections['featured-tools']
      Object.assign(tools, { cta: { label: 'More', url } })
    })

    it.each(['https://example.org/tools', '/datalibrary?q=cancer', '#featured-workspaces'])('passes %s', (url) => {
      expect(guard(withCta(url))).toEqual([])
    })

    it.each([
      ['//evil.example', 'protocol-relative'],
      ['javascript:alert(1)', 'scheme'],
      ['#hero', 'no anchor'],
    ])('fails %s (%s)', (url, reason) => {
      const errors = guard(withCta(url))
      expect(errors).toContainEqual(expect.stringContaining('sections.featured-tools.cta.url'))
      expect(errors.join('\n')).toContain(reason)
    })

    it('checks every URL field, including in disabled sections', () => {
      const config = broken((c) => {
        c.sections['research-area'] = {
          enabled: false,
          items: [{ id: 'area-1', label: 'Example', description: 'Example', destinationUrl: '//evil.example' }],
        }
      })
      expectErrors(guard(config), 'sections.research-area.items.0.destinationUrl')
    })
  })

  describe('logo alt text', () => {
    it.each(['', '   '])('fails a masthead logo with alt text "%s"', (alt) => {
      const config = broken((c) => {
        c.sections.masthead = { enabled: true, logos: [{ src: 'showcase/flagship/logo.svg', alt }] }
      })
      expectErrors(guard(config), 'sections.masthead.logos.0.alt')
    })

    it('passes empty alt text on a decorative image that is not a logo', () => {
      const config = broken((c) => {
        const tools = c.sections['featured-tools']
        if (tools.enabled) {
          tools.items[0].thumbnail = { src: 'showcase/flagship/tool.png', alt: '' }
        }
      })
      expect(guard(config)).toEqual([])
    })
  })

  describe('date ranges', () => {
    it('fails an announcement that ends before it starts', () => {
      const config = broken((c) => {
        const hero = c.sections.hero
        if (hero.enabled) {
          hero.announcements[0] = { ...hero.announcements[0], startDate: '2026-11-30', endDate: '2026-11-01' }
        }
      })
      expectErrors(guard(config), 'sections.hero.announcements.0')
    })

    it('passes a one-day range, since both ends are included', () => {
      const config = broken((c) => {
        const hero = c.sections.hero
        if (hero.enabled) {
          hero.announcements[0] = { ...hero.announcements[0], startDate: '2026-11-01', endDate: '2026-11-01' }
        }
      })
      expect(guard(config)).toEqual([])
    })

    it('fails a conference that ends before it starts', () => {
      const config = broken((c) => {
        c.sections['community-conference'] = { enabled: false, startDate: '2027-05-02', endDate: '2027-05-01' }
      })
      expectErrors(guard(config), 'sections.community-conference')
    })
  })

  describe('identifiers', () => {
    it.each(['DUOS-123', 'DUOS-0001234', 'duos-000123', 'DUOS-1e3'])('fails the malformed identifier %s', (identifier) => {
      const config = broken((c) => {
        c.sections['open-access-datasets'] = { enabled: true, items: [identifier as `DUOS-${number}`] }
      })
      expectErrors(guard(config), 'sections.open-access-datasets')
    })
  })

  describe('item IDs', () => {
    it('fails two items with the same ID in one section', () => {
      const config = broken((c) => {
        const tools = c.sections['featured-tools']
        if (tools.enabled) {
          tools.items[1].id = tools.items[0].id
        }
      })
      expectErrors(guard(config), 'duplicate item ID "tool-1"')
    })

    it('fails two items with the same ID in different sections', () => {
      const config = broken((c) => {
        const workspaces = c.sections['featured-workspaces']
        if (workspaces.enabled) {
          workspaces.items[0].id = 'tool-1'
        }
      })
      expectErrors(guard(config), 'duplicate item ID "tool-1"')
    })
  })

  describe('dataset shelves', () => {
    it('fails an enabled shelf with both items and a ranking', () => {
      const config = broken((c) => {
        Object.assign(c.sections['open-access-datasets'], { items: [id(1)] })
      })
      expectErrors(guard(config), 'sections.open-access-datasets')
    })

    it('fails an enabled shelf with neither items nor a ranking', () => {
      const config = broken((c) => {
        c.sections['open-access-datasets'] = { enabled: true } as ShowcaseConfigInput['sections']['open-access-datasets']
      })
      expectErrors(guard(config), 'sections.open-access-datasets')
    })

    it('passes a disabled shelf with neither items nor a ranking', () => {
      const config = broken((c) => {
        c.sections['open-access-datasets'] = { enabled: false }
      })
      expect(guard(config)).toEqual([])
    })

    it('fails items on a computed-only shelf', () => {
      const config = broken((c) => {
        Object.assign(c.sections['latest-data-releases'], { ranking: undefined, items: [id(1)] })
      })
      expectErrors(guard(config), 'sections.latest-data-releases')
    })

    it('fails an unknown ranking', () => {
      const config = broken((c) => {
        Object.assign(c.sections['latest-data-releases'], { ranking: 'trending' })
      })
      expectErrors(guard(config), 'sections.latest-data-releases')
    })

    it('fails a ranking that its section does not allow', () => {
      const config = broken((c) => {
        Object.assign(c.sections['latest-data-releases'], { ranking: 'most-requested' })
      })
      expectErrors(guard(config), 'sections.latest-data-releases')
    })

    it('fails an unknown scope key', () => {
      const config = broken((c) => {
        Object.assign(c.sections['latest-data-releases'], { scope: { institution: ['Example'] } })
      })
      expectErrors(guard(config), 'sections.latest-data-releases')
    })
  })

  // Every limit has direct maximum and one-more tests in test/showcases/schemaLimits.spec.ts. This
  // proves that the guard reports a limit that the schema enforces.
  describe('lookup limits', () => {
    const editorial = (items: string[]) => broken((c) => {
      c.sections['open-access-datasets'] = { enabled: true, items: items as `DUOS-${number}`[] }
    })

    it('passes the maximum number of identifiers and fails one more', () => {
      expect(guard(editorial(ids(LOOKUP_LIMITS.identifiers)))).toEqual([])
      expectErrors(guard(editorial(ids(LOOKUP_LIMITS.identifiers + 1))), 'sections.open-access-datasets')
    })
  })

  it('reports every broken rule at once', () => {
    const config = broken((c) => {
      c.sections.masthead = { enabled: true, logos: [{ src: 'showcase/flagship/logo.svg', alt: '' }] }
      Object.assign(c.sections['featured-tools'], { cta: { label: 'More', url: '//evil.example' } })
    })
    expect(guard(config)).toHaveLength(2)
  })

  it('keeps a schema error that a rule error does not explain', () => {
    const config = broken((c) => {
      Object.assign(c.sections['featured-tools'], { cta: { label: 'More', url: '//evil.example' } })
      Object.assign(c.sections, { 'extra-section': { enabled: false } })
    })
    expectErrors(guard(config), 'sections.featured-tools.cta.url', 'extra-section')
  })

  it('lists every section key exactly once in the S1.1 fixture', () => {
    expect(Object.keys(flagshipConfig.sections)).toEqual([...SECTION_KEYS])
  })
})
