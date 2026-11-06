import { describe, expect, it, vi } from 'vitest'
import type { FastifyReply, FastifyRequest } from 'fastify'
import { handleCsrfToken } from '../src/auth/csrf.js'

function makeReply() {
  const reply = {
    generateCsrf: vi.fn(() => 'csrf-token'),
    clearCookie: vi.fn(),
    status: vi.fn(),
    send: vi.fn(),
  }
  reply.clearCookie.mockReturnValue(reply)
  reply.status.mockReturnValue(reply)
  return reply
}

/** `stored` is what the store re-read finds after a failed save: the row, or null once it's gone. */
const makeRequest = (save: () => Promise<void>, stored: object | null = null) =>
  ({
    session: { accessToken: 'token', sessionStoreId: 'row-1', save: vi.fn(save) },
    sessionStore: { get: vi.fn((_sid: string, callback: (err: unknown, value: object | null) => void) => callback(null, stored)) },
  }) as unknown as FastifyRequest

describe('handleCsrfToken', () => {
  it('saves the session before sending the token', async () => {
    const reply = makeReply()

    await handleCsrfToken(makeRequest(async () => {}), reply as unknown as FastifyReply)

    expect(reply.send).toHaveBeenCalledWith({ token: 'csrf-token' })
  })

  it('answers 401 and clears the cookie when a logout ended the session first', async () => {
    // Since @fastify/session 11.1.6 the store refuses to write a destroyed session back.
    const reply = makeReply()
    const ended = Object.assign(new Error('The session does not exist or has changed'), { code: 'ENOENT' })

    const failingSave = async () => {
      throw ended
    }
    await handleCsrfToken(makeRequest(failingSave), reply as unknown as FastifyReply)

    expect(reply.clearCookie).toHaveBeenCalledWith('sessionId')
    expect(reply.status).toHaveBeenCalledWith(401)
    expect(reply.send).toHaveBeenCalledWith({ error: 'unauthenticated' })
    expect(reply.send).not.toHaveBeenCalledWith({ token: 'csrf-token' })
  })

  it('answers 502 and keeps the cookie when a later sign-in took the row', async () => {
    const reply = makeReply()
    const ended = Object.assign(new Error('The session does not exist or has changed'), { code: 'ENOENT' })
    const failingSave = async () => {
      throw ended
    }
    const request = makeRequest(failingSave, { __fastifySessionMetadata: { generation: 'later' } })

    await handleCsrfToken(request, reply as unknown as FastifyReply)

    expect(reply.clearCookie).not.toHaveBeenCalled()
    expect(reply.status).toHaveBeenCalledWith(502)
    // Dropped, so the plugin's onSend doesn't retry the save and answer twice.
    expect(request.session).toBeNull()
  })

  it('lets any other save failure reach the error handler', async () => {
    const reply = makeReply()

    await expect(
      handleCsrfToken(makeRequest(async () => Promise.reject(new Error('connection terminated'))), reply as unknown as FastifyReply),
    ).rejects.toThrow('connection terminated')
    expect(reply.send).not.toHaveBeenCalled()
  })
})
