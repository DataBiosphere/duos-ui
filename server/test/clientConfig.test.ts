import { describe, it, expect, afterEach } from 'vitest'
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { clientConfigPath, readClientConfig } from '../src/clientConfig'

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

  afterEach(() => {
    delete process.env.DUOS_API_URL
    rmSync(dir, { recursive: true, force: true })
  })

  function writeFixture(config: Record<string, unknown>): string {
    dir = mkdtempSync(path.join(tmpdir(), 'duos-client-config-'))
    const file = path.join(dir, 'config.json')
    writeFileSync(file, JSON.stringify(config))
    return file
  }

  it('returns the static file unchanged when DUOS_API_URL is not set', async () => {
    const file = writeFixture({ apiUrl: 'https://consent.dsde-dev.broadinstitute.org', env: 'dev' })
    expect(await readClientConfig(file)).toEqual({ apiUrl: 'https://consent.dsde-dev.broadinstitute.org', env: 'dev' })
  })

  it('overrides apiUrl with DUOS_API_URL, leaving other fields untouched', async () => {
    const file = writeFixture({ apiUrl: 'https://consent.dsde-dev.broadinstitute.org', env: 'dev' })
    process.env.DUOS_API_URL = 'https://local.dsde-dev.broadinstitute.org:27443'
    expect(await readClientConfig(file)).toEqual({ apiUrl: 'https://local.dsde-dev.broadinstitute.org:27443', env: 'dev' })
  })
})
