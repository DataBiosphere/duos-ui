import { describe, expect, it, vi } from 'vitest'

describe('zod configuration', () => {
  it('is jitless once the showcase schemas load, so building them runs no eval probe', async () => {
    vi.resetModules()
    const { globalConfig } = await import('zod/v4/core')
    const evalProbe = vi.spyOn(globalThis, 'Function')
    await import('src/showcases/schema')
    expect(globalConfig.jitless).toBe(true)
    expect(evalProbe).not.toHaveBeenCalled()
    evalProbe.mockRestore()
  })
})
