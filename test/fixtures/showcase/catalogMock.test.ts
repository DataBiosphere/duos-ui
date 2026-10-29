import { describe, expect, it } from 'vitest'
import { IdentifiersResponseSchema, RankingResponseSchema } from 'src/showcases/schema'
import { createShowcaseCatalogMock } from './catalogMock'
import { lookupExamples } from './contracts'

const lookup = createShowcaseCatalogMock()

const example = (mode: string) => {
  const found = lookupExamples.find(candidate => candidate.status === 200 && (candidate.request as { mode: string }).mode === mode)
  if (!found) throw new Error(`no ${mode} example`)
  return found
}

describe('showcase catalog mock', () => {
  it.each(['identifiers', 'ranking'])('reproduces the %s contract example', async (mode) => {
    const { request, response } = example(mode)

    expect(await lookup(request as never)).toEqual(response)
  })

  it('returns responses that parse with the contract schemas', async () => {
    const ids = await lookup({ mode: 'identifiers', section: 'open-access-datasets', identifiers: ['DUOS-000789', 'DUOS-000123'] })
    const ranked = await lookup({ mode: 'ranking', section: 'latest-data-releases', ranking: 'newest' })

    expect(IdentifiersResponseSchema.safeParse(ids).error).toBeUndefined()
    expect(RankingResponseSchema.safeParse(ranked).error).toBeUndefined()
  })

  it('marks a controlled dataset unavailable on the open-access shelf, and repeats each identifier once', async () => {
    const result = await lookup({ mode: 'identifiers', section: 'open-access-datasets', identifiers: ['DUOS-000789', 'DUOS-000789'] })

    expect(result.datasets).toEqual([{ identifier: 'DUOS-000789', status: 'unavailable' }])
  })

  it('ranks newest first, keeps the limit, and drops a pin that is out of scope', async () => {
    const result = await lookup({ mode: 'ranking', section: 'latest-data-releases', ranking: 'newest', scope: { dac: ['Example DAC'] }, pin: ['DUOS-000123'], limit: 2 })

    expect(result.datasets.map(dataset => dataset.identifier)).toEqual(['DUOS-000111', 'DUOS-000790'])
  })

  it('pages the whole catalog with a cursor', async () => {
    const first = await lookup({ mode: 'all', pageSize: 3 })
    const second = await lookup({ mode: 'all', pageSize: 3, cursor: first.nextCursor ?? undefined })

    expect(first.datasets).toHaveLength(3)
    expect(second.datasets).toHaveLength(1)
    expect(second.nextCursor).toBeNull()
  })

  it('counts datasets and studies in scope', async () => {
    expect(await lookup({ mode: 'stats' })).toEqual({ studyCount: 2, datasetCount: 4 })
    expect(await lookup({ mode: 'stats', scope: { dac: ['Example DAC'] } })).toEqual({ studyCount: 2, datasetCount: 3 })
  })

  it('returns a copy, so a test cannot change the shared rows', async () => {
    const first = await lookup({ mode: 'all' })
    first.datasets[0].title = 'changed'

    const second = await lookup({ mode: 'all' })

    expect(second.datasets[0].title).not.toBe('changed')
  })
})
