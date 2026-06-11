import { describe, it, expect, vi, afterEach } from 'vitest'
import { Storage } from 'src/libs/storage'
import { checkEnv, envGroups, isDevEnv } from 'src/utils/EnvironmentUtils'

describe('EnvironmentUtils', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('exposes expected environment groups', () => {
    expect(envGroups.PROD_STAGING).toEqual(['prod', 'staging'])
    expect(envGroups.NON_PROD).toEqual(['local', 'dev', 'staging'])
    expect(envGroups.NON_STAGING).toEqual(['local', 'dev'])
    expect(envGroups.DEV).toEqual(['local', 'dev'])
  })

  it('checkEnv returns true when current env is in the group', () => {
    vi.spyOn(Storage, 'getEnv').mockReturnValue('dev')
    expect(checkEnv(envGroups.NON_STAGING)).toBe(true)
  })

  it('checkEnv returns false when current env is not in the group', () => {
    vi.spyOn(Storage, 'getEnv').mockReturnValue('prod')
    expect(checkEnv(envGroups.NON_STAGING)).toBe(false)
  })

  it('checkEnv returns false when current env is null', () => {
    vi.spyOn(Storage, 'getEnv').mockReturnValue(null)
    expect(checkEnv(envGroups.NON_PROD)).toBe(false)
  })

  it('isDevEnv returns true for local/dev and false for prod', () => {
    const getEnvSpy = vi.spyOn(Storage, 'getEnv').mockReturnValue('local')
    expect(isDevEnv()).toBe(true)

    getEnvSpy.mockReturnValue('prod')
    expect(isDevEnv()).toBe(false)
  })
})
