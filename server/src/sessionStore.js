'use strict'

const { randomUUID } = require('crypto')

/**
 * In-process session store mapping a short-lived session ID to the user's
 * OIDC access token.  The session TTL is derived from the token's own `exp`
 * claim so the server never holds a token longer than it is valid.
 *
 * For single-replica deployments an in-process Map is sufficient.
 * If DUOS scales to multiple replicas, swap this module for a Redis-backed
 * implementation — the public API (createSession / getSession / deleteSession)
 * is identical either way.
 */

/** @type {Map<string, { token: string, expiresAt: number }>} */
const store = new Map()

// Evict stale entries every 5 minutes so the Map doesn't grow unbounded.
setInterval(() => {
  const now = Date.now()
  for (const [id, session] of store) {
    if (session.expiresAt <= now) store.delete(id)
  }
}, 5 * 60 * 1000).unref() // .unref() so this timer doesn't keep the process alive

/**
 * Decode a JWT payload without verifying the signature.
 * We only need the `exp` claim for TTL purposes; the downstream APIs perform
 * full verification.
 *
 * @param {string} token
 * @returns {number} Expiry timestamp in milliseconds (defaults to +1 h)
 */
function parseExpiry(token) {
  try {
    const payload = token.split('.')[1]
    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'))
    if (decoded.exp) return decoded.exp * 1000
  } catch { /* fall through */ }
  return Date.now() + 60 * 60 * 1000
}

/**
 * Store an OIDC token and return a new session ID.
 *
 * @param {string} token - The OIDC access token from the browser
 * @returns {string}     - UUID session ID
 */
function createSession(token) {
  const sessionId = randomUUID()
  store.set(sessionId, { token, expiresAt: parseExpiry(token) })
  return sessionId
}

/**
 * Retrieve a session.  Returns null if the ID is unknown or the token has
 * expired (and cleans up the entry in that case).
 *
 * @param {string} sessionId
 * @returns {{ token: string, expiresAt: number } | null}
 */
function getSession(sessionId) {
  const session = store.get(sessionId)
  if (!session) return null
  if (session.expiresAt <= Date.now()) {
    store.delete(sessionId)
    return null
  }
  return session
}

/**
 * Explicitly remove a session (e.g. on user sign-out).
 *
 * @param {string} sessionId
 */
function deleteSession(sessionId) {
  store.delete(sessionId)
}

module.exports = { createSession, getSession, deleteSession }
