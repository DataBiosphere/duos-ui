import { describe, it, expect, vi } from 'vitest'
import type { FastifyRequest } from 'fastify'
import { endSession } from '../src/auth/authEvents.js'

function makeRequest(destroy: () => Promise<void>) {
  return { session: { idp: 'google', destroy }, log: { info: vi.fn(), warn: vi.fn() } } as unknown as FastifyRequest
}

describe('endSession', () => {
  it('logs auth.session.destroyed with the reason and the idp read before the destroy', async () => {
    const request = makeRequest(async () => {
      ;(request as { session: unknown }).session = null
    })

    await endSession(request, 'logout')

    expect(request.log.info).toHaveBeenCalledWith(
      { event: 'auth.session.destroyed', reason: 'logout', idp: 'google' },
      'auth.session.destroyed',
    )
  })

  describe('with a store that checks the generation', () => {
    function withStore(outcome: 'destroyed' | 'gone' | 'superseded') {
      const destroy = vi.fn(async () => {})
      const destroyGeneration = vi.fn((_sid: string, _generation: string, callback: (err: unknown, outcome: string) => void) => callback(null, outcome))
      const request = {
        session: { idp: 'google', sessionStoreId: 'row-1', sessionId: 'generation-1', destroy },
        sessionStore: { destroyGeneration },
        log: { info: vi.fn(), warn: vi.fn() },
      } as unknown as FastifyRequest
      return { request, destroy, destroyGeneration }
    }

    it.each(['destroyed', 'gone'] as const)('ends the session when the row was %s, with no second delete', async (outcome) => {
      const { request, destroy, destroyGeneration } = withStore(outcome)

      expect(await endSession(request, 'upstream_401')).toBe('ended')

      expect(destroyGeneration).toHaveBeenCalledWith('row-1', 'generation-1', expect.any(Function))
      expect(destroy).not.toHaveBeenCalled()
      expect(request.session).toBeNull()
      expect(request.log.info).toHaveBeenCalledWith(
        { event: 'auth.session.destroyed', reason: 'upstream_401', idp: 'google' },
        'auth.session.destroyed',
      )
    })

    it('leaves a later sign-in alone and drops only this request\'s session', async () => {
      const { request, destroy } = withStore('superseded')

      expect(await endSession(request, 'upstream_401')).toBe('superseded')

      expect(destroy).not.toHaveBeenCalled()
      expect(request.session).toBeNull()
      expect(request.log.info).toHaveBeenCalledWith(
        { event: 'auth.session.superseded', reason: 'upstream_401', idp: 'google' },
        'auth.session.superseded',
      )
    })

    it('drops the session and rethrows, with no event, when the delete fails', async () => {
      // Left attached, a session saved earlier in the request would have its cookie re-sent.
      const { request } = withStore('destroyed')
      const failing = vi.fn((_sid: string, _generation: string, callback: (err: unknown) => void) => callback(new Error('connection terminated')))
      Object.assign(request.sessionStore, { destroyGeneration: failing })

      await expect(endSession(request, 'upstream_401')).rejects.toThrow('connection terminated')

      expect(request.session).toBeNull()
      expect(request.log.info).not.toHaveBeenCalled()
    })

    it('rejects with an Error, keeping a non-Error store failure as its cause', async () => {
      const { request } = withStore('destroyed')
      const failure = { code: 'ECONNRESET' }
      Object.assign(request.sessionStore, {
        destroyGeneration: (_sid: string, _generation: string, callback: (err: unknown) => void) => callback(failure),
      })

      const err = await endSession(request, 'upstream_401').catch((e: unknown) => e)

      expect(err).toBeInstanceOf(Error)
      expect((err as Error).cause).toBe(failure)
    })

    it('destroys unconditionally on logout, which signs this browser out', async () => {
      const { request, destroy, destroyGeneration } = withStore('superseded')

      expect(await endSession(request, 'logout')).toBe('ended')

      expect(destroyGeneration).not.toHaveBeenCalled()
      expect(destroy).toHaveBeenCalledOnce()
    })
  })

  it('emits no event, and rethrows, when the destroy fails', async () => {
    const request = makeRequest(() => Promise.reject(new Error('store unavailable')))

    await expect(endSession(request, 'logout')).rejects.toThrow('store unavailable')

    expect(request.log.info).not.toHaveBeenCalled()
  })
})
