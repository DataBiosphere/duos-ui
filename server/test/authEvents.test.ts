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

  it('emits no event, and rethrows, when the destroy fails', async () => {
    const request = makeRequest(() => Promise.reject(new Error('store unavailable')))

    await expect(endSession(request, 'logout')).rejects.toThrow('store unavailable')

    expect(request.log.info).not.toHaveBeenCalled()
  })
})
