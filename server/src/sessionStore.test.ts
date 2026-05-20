import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// ---------------------------------------------------------------------------
// Stable mock Redis instance — created before vi.mock() factory runs via
// vi.hoisted so the reference is available inside the factory closure.
// ---------------------------------------------------------------------------

const mockRedis = vi.hoisted(() => ({
  hset: vi.fn().mockResolvedValue(1),
  expireat: vi.fn().mockResolvedValue(1),
  hgetall: vi.fn().mockResolvedValue({}),
  del: vi.fn().mockResolvedValue(1),
  on: vi.fn(),
}))

vi.mock('ioredis', () => ({
  // Must be a regular function (not arrow) to support `new Redis(...)`.
  Redis: vi.fn(function () { return mockRedis }),
}))

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeJwt(exp: number): string {
  const header = Buffer.from('{"alg":"HS256","typ":"JWT"}').toString('base64url')
  const payload = Buffer.from(JSON.stringify({ sub: 'test-user', exp })).toString('base64url')
  return `${header}.${payload}.fakesignature`
}

// ---------------------------------------------------------------------------
// parseExpiry — tested directly (pure function, no Redis dependency)
// ---------------------------------------------------------------------------

describe('parseExpiry', () => {
  let parseExpiry: (token: string) => number

  beforeEach(async () => {
    delete process.env.REDIS_URL
    vi.resetModules()
    ;({ parseExpiry } = await import('./sessionStore.js'))
  })

  it('extracts exp claim from a valid JWT', () => {
    const exp = Math.floor(Date.now() / 1000) + 3600
    expect(parseExpiry(makeJwt(exp))).toBe(exp * 1000)
  })

  it('falls back to now + 1 hr for a JWT with no exp', () => {
    const header = Buffer.from('{"alg":"HS256"}').toString('base64url')
    const payload = Buffer.from('{"sub":"test"}').toString('base64url')
    const token = `${header}.${payload}.sig`
    const before = Date.now()
    const result = parseExpiry(token)
    const after = Date.now()
    expect(result).toBeGreaterThanOrEqual(before + 3600 * 1000)
    expect(result).toBeLessThanOrEqual(after + 3600 * 1000)
  })

  it('falls back to now + 1 hr for a malformed token', () => {
    const before = Date.now()
    const result = parseExpiry('not.a.jwt')
    expect(result).toBeGreaterThanOrEqual(before + 3600 * 1000)
  })

  it('falls back to now + 1 hr for a completely invalid string', () => {
    const before = Date.now()
    const result = parseExpiry('garbage')
    expect(result).toBeGreaterThanOrEqual(before + 3600 * 1000)
  })
})

// ---------------------------------------------------------------------------
// In-memory path — REDIS_URL unset
// ---------------------------------------------------------------------------

describe('in-memory path (no REDIS_URL)', () => {
  type SessionStore = typeof import('./sessionStore.js')
  let store: SessionStore

  beforeEach(async () => {
    delete process.env.REDIS_URL
    vi.resetModules()
    vi.clearAllMocks()
    store = await import('./sessionStore.js')
  })

  it('createSession returns a UUID string', async () => {
    const exp = Math.floor(Date.now() / 1000) + 3600
    const id = await store.createSession(makeJwt(exp))
    expect(id).toMatch(/^[0-9a-f-]{36}$/)
  })

  it('createSession returns a unique ID each call', async () => {
    const exp = Math.floor(Date.now() / 1000) + 3600
    const jwt = makeJwt(exp)
    const id1 = await store.createSession(jwt)
    const id2 = await store.createSession(jwt)
    expect(id1).not.toBe(id2)
  })

  it('getSession returns the stored session', async () => {
    const exp = Math.floor(Date.now() / 1000) + 3600
    const token = makeJwt(exp)
    const id = await store.createSession(token)
    const session = await store.getSession(id)
    expect(session).not.toBeNull()
    expect(session?.token).toBe(token)
    expect(session?.expiresAt).toBe(exp * 1000)
  })

  it('getSession returns null for an unknown session ID', async () => {
    const session = await store.getSession('00000000-0000-0000-0000-000000000000')
    expect(session).toBeNull()
  })

  it('getSession returns null and purges an expired session', async () => {
    const exp = Math.floor(Date.now() / 1000) - 1 // already expired
    const id = await store.createSession(makeJwt(exp))
    const session = await store.getSession(id)
    expect(session).toBeNull()
    // Confirm it was deleted — a second lookup also returns null
    expect(await store.getSession(id)).toBeNull()
  })

  it('deleteSession removes the session', async () => {
    const exp = Math.floor(Date.now() / 1000) + 3600
    const id = await store.createSession(makeJwt(exp))
    await store.deleteSession(id)
    expect(await store.getSession(id)).toBeNull()
  })

  it('deleteSession on a non-existent ID is a no-op', async () => {
    await expect(
      store.deleteSession('00000000-0000-0000-0000-000000000000'),
    ).resolves.toBeUndefined()
  })

  it('does not call Redis', async () => {
    const exp = Math.floor(Date.now() / 1000) + 3600
    const id = await store.createSession(makeJwt(exp))
    await store.getSession(id)
    await store.deleteSession(id)
    expect(mockRedis.hset).not.toHaveBeenCalled()
    expect(mockRedis.hgetall).not.toHaveBeenCalled()
    expect(mockRedis.del).not.toHaveBeenCalled()
  })
})

// ---------------------------------------------------------------------------
// Redis path — REDIS_URL set
// ---------------------------------------------------------------------------

describe('Redis path (REDIS_URL set)', () => {
  type SessionStore = typeof import('./sessionStore.js')
  let store: SessionStore

  beforeEach(async () => {
    process.env.REDIS_URL = 'redis://localhost:6379'
    vi.resetModules()
    vi.clearAllMocks()
    // Reset default mock return values after clearAllMocks
    mockRedis.hset.mockResolvedValue(1)
    mockRedis.expireat.mockResolvedValue(1)
    mockRedis.hgetall.mockResolvedValue({})
    mockRedis.del.mockResolvedValue(1)
    store = await import('./sessionStore.js')
  })

  afterEach(() => {
    delete process.env.REDIS_URL
  })

  it('createSession stores a hash and sets TTL via expireat', async () => {
    const exp = Math.floor(Date.now() / 1000) + 3600
    const token = makeJwt(exp)
    const id = await store.createSession(token)

    expect(mockRedis.hset).toHaveBeenCalledOnce()
    const [key, fields] = mockRedis.hset.mock.calls[0]
    expect(key).toBe(`session:${id}`)
    expect(fields).toMatchObject({ token, expiresAt: String(exp * 1000) })

    expect(mockRedis.expireat).toHaveBeenCalledOnce()
    const [expKey, expTime] = mockRedis.expireat.mock.calls[0]
    expect(expKey).toBe(`session:${id}`)
    expect(expTime).toBeCloseTo(exp, -1) // within ~10 seconds of JWT exp
  })

  it('createSession returns a UUID string', async () => {
    const exp = Math.floor(Date.now() / 1000) + 3600
    const id = await store.createSession(makeJwt(exp))
    expect(id).toMatch(/^[0-9a-f-]{36}$/)
  })

  it('getSession returns session data when Redis has a valid entry', async () => {
    const exp = Math.floor(Date.now() / 1000) + 3600
    const token = makeJwt(exp)
    const id = 'test-session-id'
    mockRedis.hgetall.mockResolvedValueOnce({ token, expiresAt: String(exp * 1000) })

    const session = await store.getSession(id)
    expect(session).toEqual({ token, expiresAt: exp * 1000 })
    expect(mockRedis.hgetall).toHaveBeenCalledWith(`session:${id}`)
  })

  it('getSession returns null when key does not exist in Redis', async () => {
    mockRedis.hgetall.mockResolvedValueOnce({})
    const session = await store.getSession('nonexistent')
    expect(session).toBeNull()
    expect(mockRedis.del).not.toHaveBeenCalled()
  })

  it('getSession returns null and deletes the key when session is expired', async () => {
    const exp = Math.floor(Date.now() / 1000) - 1 // expired
    const token = makeJwt(exp)
    const id = 'expired-session-id'
    mockRedis.hgetall.mockResolvedValueOnce({ token, expiresAt: String(exp * 1000) })

    const session = await store.getSession(id)
    expect(session).toBeNull()
    expect(mockRedis.del).toHaveBeenCalledWith(`session:${id}`)
  })

  it('deleteSession calls del with the correct key', async () => {
    const id = 'session-to-delete'
    await store.deleteSession(id)
    expect(mockRedis.del).toHaveBeenCalledOnce()
    expect(mockRedis.del).toHaveBeenCalledWith(`session:${id}`)
  })

  it('registers an error handler on the Redis client', async () => {
    expect(mockRedis.on).toHaveBeenCalledWith('error', expect.any(Function))
  })
})
