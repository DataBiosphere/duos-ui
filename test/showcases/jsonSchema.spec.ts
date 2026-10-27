/**
 * `src/showcases/showcase.schema.json` is the JSON Schema export of `ShowcaseConfigSchema`, so the
 * guard and any future backend share one definition. Update it with `vitest -u`; CI fails if the
 * committed file and the zod schema differ.
 */
import { describe, expect, it } from 'vitest'
import * as z from 'zod'
import { ShowcaseConfigSchema } from 'src/showcases/schema'
import { LOOKUP_LIMITS, SECTION_KEYS } from 'src/types/showcase'

describe('showcase.schema.json', () => {
  const exported = z.toJSONSchema(ShowcaseConfigSchema)

  it('matches the JSON Schema that the zod schema exports', async () => {
    await expect(`${JSON.stringify(exported, null, 2)}\n`).toMatchFileSnapshot('../../src/showcases/showcase.schema.json')
  })

  it('lists the section keys in fixed order', () => {
    const sections = exported.properties?.sections as { properties: Record<string, unknown> }
    expect(Object.keys(sections.properties)).toEqual([...SECTION_KEYS])
  })

  it('carries the lookup limits for a backend to share', () => {
    const text = JSON.stringify(exported)
    expect(text).toContain(`"maxItems":${LOOKUP_LIMITS.identifiers}`)
    expect(text).toContain(`"maximum":${LOOKUP_LIMITS.rankingLimit}`)
  })
})
