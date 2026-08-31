import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import PostLogout from 'src/pages/PostLogout'
import { Redirect } from 'src/libs/auth/auth'
import { storePostLogoutTarget } from 'src/libs/auth/postLogout'

/*
  Story 5-E: /post-logout is the ONE fixed post_logout_redirect_uri registered
  with B2C. It reads the stored local target, deletes it, validates it again,
  and replaces the history entry with it.
*/

describe('PostLogout', () => {
  let replaceSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    sessionStorage.clear()
    replaceSpy = vi.spyOn(Redirect, 'replace').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
    sessionStorage.clear()
  })

  const renderPage = () => {
    render(<PostLogout />)
  }

  it('replaces the current entry with the stored target', () => {
    storePostLogoutTarget('/home?redirectTo=/datalibrary')

    renderPage()

    expect(replaceSpy).toHaveBeenCalledWith('/home?redirectTo=/datalibrary')
  })

  it('deletes the target, so a later visit cannot reuse it', () => {
    storePostLogoutTarget('/datalibrary')

    renderPage()
    expect(sessionStorage).toHaveLength(0)

    replaceSpy.mockClear()
    renderPage()

    expect(replaceSpy).toHaveBeenCalledWith('/')
  })

  it('falls back to / when no target was stored', () => {
    renderPage()

    expect(replaceSpy).toHaveBeenCalledWith('/')
  })

  it('never navigates off-site, even from a tampered stored value', () => {
    storePostLogoutTarget('/home')
    sessionStorage.setItem(Object.keys(sessionStorage)[0], 'https://evil.example.com/steal')

    renderPage()

    expect(replaceSpy).toHaveBeenCalledWith('/')
  })

  it('makes no request of its own — a state-changing GET here would reintroduce CSRF', () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    storePostLogoutTarget('/datalibrary')

    renderPage()

    expect(fetchMock).not.toHaveBeenCalled()
    vi.unstubAllGlobals()
  })
})
