import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  POST_LOGOUT_PATH,
  clearPostLogoutTarget,
  safeLocalPath,
  storePostLogoutTarget,
  takePostLogoutTarget,
} from 'src/libs/auth/postLogout'

/*
  Story 5-E: the /post-logout hand-off. B2C requires an exact-match
  post_logout_redirect_uri, so the local destination rides in sessionStorage
  instead — validated on write AND on read, and deleted on read.
*/

describe('safeLocalPath', () => {
  it('keeps a same-origin path with its query and fragment', () => {
    expect(safeLocalPath('/home?redirectTo=/datalibrary#top'))
      .toBe('/home?redirectTo=/datalibrary#top')
  })

  it.each([
    ['an absolute URL', 'https://evil.example.com/steal'],
    ['a protocol-relative URL', '//evil.example.com/steal'],
    ['a backslash-prefixed authority', '/\\evil.example.com/steal'],
    ['a javascript: URL', 'javascript:alert(1)'],
    ['a relative path without a leading slash', 'datalibrary'],
    ['an empty string', ''],
  ])('rejects %s', (_label, value) => {
    expect(safeLocalPath(value)).toBe('/')
  })

  it.each([undefined, null, 42, {}])('rejects the non-string %s', (value) => {
    expect(safeLocalPath(value)).toBe('/')
  })

  it('re-serializes traversal segments', () => {
    expect(safeLocalPath('/home/../datalibrary')).toBe('/datalibrary')
  })
})

describe('the stored post-logout target', () => {
  beforeEach(() => {
    sessionStorage.clear()
  })

  afterEach(() => {
    sessionStorage.clear()
    vi.restoreAllMocks()
  })

  it('round-trips a valid target', () => {
    storePostLogoutTarget('/home?redirectTo=/profile')

    expect(takePostLogoutTarget()).toBe('/home?redirectTo=/profile')
  })

  it('validates on write', () => {
    storePostLogoutTarget('https://evil.example.com/steal')

    expect(takePostLogoutTarget()).toBe('/')
  })

  it('validates again on read, so a tampered value cannot navigate off-site', () => {
    storePostLogoutTarget('/home')
    // Simulate a value written by something other than storePostLogoutTarget.
    const key = Object.keys(sessionStorage)[0]
    sessionStorage.setItem(key, '//evil.example.com/steal')

    expect(takePostLogoutTarget()).toBe('/')
  })

  it('deletes the target on read, so a later visit cannot reuse it', () => {
    storePostLogoutTarget('/datalibrary')

    expect(takePostLogoutTarget()).toBe('/datalibrary')
    expect(takePostLogoutTarget()).toBe('/')
    expect(sessionStorage.length).toBe(0)
  })

  it('defaults to / when nothing was stored', () => {
    expect(takePostLogoutTarget()).toBe('/')
  })

  it('clears a target that no navigation will consume', () => {
    storePostLogoutTarget('/datalibrary')

    clearPostLogoutTarget()

    expect(sessionStorage.length).toBe(0)
  })

  it('survives storage being unavailable', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('site data blocked')
    })
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('site data blocked')
    })

    expect(() => storePostLogoutTarget('/datalibrary')).not.toThrow()
    expect(takePostLogoutTarget()).toBe('/')
  })

  it('names the route B2C is configured to return to', () => {
    expect(POST_LOGOUT_PATH).toBe('/post-logout')
  })
})
