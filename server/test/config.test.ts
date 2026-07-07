import { describe, it, expect, vi, afterEach } from 'vitest'
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { clientConfigPath, readClientConfig, resetClientConfigCache } from '../src/clientConfig'

describe('clientConfigPath', () => {
  afterEach(() => {
    delete process.env.CONFIG_PATH
  })

  it('points at public/config.json in dev', () => {
    expect(clientConfigPath('/app', true)).toBe(path.join('/app', 'public', 'config.json'))
  })

  it('points at build/config.json outside dev', () => {
    expect(clientConfigPath('/app', false)).toBe(path.join('/app', 'build', 'config.json'))
  })

  it('is overridden by CONFIG_PATH regardless of isDev', () => {
    process.env.CONFIG_PATH = '/custom/config.json'
    expect(clientConfigPath('/app', true)).toBe('/custom/config.json')
  })
})

describe('readClientConfig', () => {
  let dir: string
  const log = { error: vi.fn() }

  afterEach(() => {
    delete process.env.DUOS_API_URL
    resetClientConfigCache()
    log.error.mockClear()
    // Guarded: rmSync(undefined) throws and would mask the real failure of a
    // test that died before mkdtempSync assigned dir.
    if (dir) rmSync(dir, { recursive: true, force: true })
  })

  function writeFixture(config: Record<string, unknown>): string {
    dir = mkdtempSync(path.join(tmpdir(), 'duos-client-config-'))
    const file = path.join(dir, 'config.json')
    writeFileSync(file, JSON.stringify(config))
    return file
  }

  it('returns the static file unchanged when DUOS_API_URL is not set', async () => {
    const file = writeFixture({ apiUrl: 'https://consent.dsde-dev.broadinstitute.org', env: 'dev' })
    expect(await readClientConfig(file, log)).toEqual({ apiUrl: 'https://consent.dsde-dev.broadinstitute.org', env: 'dev' })
  })

  it('overrides apiUrl with DUOS_API_URL, leaving other fields untouched', async () => {
    const file = writeFixture({ apiUrl: 'https://consent.dsde-dev.broadinstitute.org', env: 'dev' })
    process.env.DUOS_API_URL = 'https://local.dsde-dev.broadinstitute.org:27443'
    expect(await readClientConfig(file, log)).toEqual({ apiUrl: 'https://local.dsde-dev.broadinstitute.org:27443', env: 'dev' })
  })

  it('logs and rethrows on a missing file, without caching the failure', async () => {
    const file = writeFixture({ env: 'dev' })
    const missing = path.join(dir, 'nope.json')
    await expect(readClientConfig(missing, log)).rejects.toThrow()
    expect(log.error).toHaveBeenCalledTimes(1)

    // The failure must not poison the cache: a subsequent read of a good path succeeds.
    expect(await readClientConfig(file, log)).toEqual({ env: 'dev' })
  })
})
