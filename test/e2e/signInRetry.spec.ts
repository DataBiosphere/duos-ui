import { test, expect } from '@playwright/test'
import { signInWithRetry } from './support/auth'

/*
 * The retry behind `signInAs`, without a browser. Dev Consent keeps the claims of the first
 * request that carries a token, so a retry that reuses a refused token cannot recover.
 */

const NO_WAIT = { backoffMs: 0 }

/** Mints "token-1", "token-2" and so on, and records how many it minted. */
const tokenSource = () => {
  const minted: string[] = []
  const mintToken = async () => {
    minted.push(`token-${minted.length + 1}`)
    return minted.at(-1)!
  }
  return { minted, mintToken }
}

test('uses one attempt and one token when the first sign-in works', async () => {
  const { minted, mintToken } = tokenSource()

  const attempts = await signInWithRetry(async () => {}, mintToken, NO_WAIT)

  expect(attempts).toBe(1)
  expect(minted).toEqual(['token-1'])
})

test('submits a new token on each retry', async () => {
  const { mintToken } = tokenSource()
  const submitted: string[] = []

  const attempts = await signInWithRetry(async (token) => {
    submitted.push(token)
    if (submitted.length < 3) throw new Error('still on the sign-in page')
  }, mintToken, NO_WAIT)

  expect(attempts).toBe(3)
  expect(submitted).toEqual(['token-1', 'token-2', 'token-3'])
})

test('retries when a token cannot be minted', async () => {
  let calls = 0
  const mintToken = async () => {
    if (++calls === 1) throw new Error('token endpoint unavailable')
    return 'token-2'
  }
  const submitted: string[] = []

  const attempts = await signInWithRetry(async token => void submitted.push(token), mintToken, NO_WAIT)

  expect(attempts).toBe(2)
  expect(submitted).toEqual(['token-2'])
})

test('gives up after the attempt limit and reports every failure', async () => {
  const { minted, mintToken } = tokenSource()
  let submissions = 0

  const outcome = signInWithRetry(async () => {
    submissions++
    throw new Error(`refused ${submissions}`)
  }, mintToken, { attempts: 3, backoffMs: 0 })

  await expect(outcome).rejects.toThrow('Sign-in failed after 3 attempts')
  await expect(outcome).rejects.toThrow(/attempt 1: refused 1\nattempt 2: refused 2\nattempt 3: refused 3/)
  expect(minted).toHaveLength(3)
})

test('reports only the first line of a multi-line failure', async () => {
  const { mintToken } = tokenSource()

  const outcome = signInWithRetry(async () => {
    throw new Error('still on the sign-in page: token invalid\nCall log:\n  - waiting')
  }, mintToken, { attempts: 1, backoffMs: 0 })

  await expect(outcome).rejects.toThrow('attempt 1: still on the sign-in page: token invalid')
  await expect(outcome).rejects.not.toThrow('Call log')
})

test('waits longer before each later attempt', async () => {
  const { mintToken } = tokenSource()
  const stamps: number[] = []

  await signInWithRetry(async () => {
    stamps.push(Date.now())
    if (stamps.length < 3) throw new Error('refused')
  }, mintToken, { backoffMs: 50 })

  const [first, second] = [stamps[1] - stamps[0], stamps[2] - stamps[1]]
  expect(first).toBeGreaterThanOrEqual(45)
  expect(second).toBeGreaterThanOrEqual(95)
})
