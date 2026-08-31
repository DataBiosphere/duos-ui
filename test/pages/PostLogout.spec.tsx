import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act, render } from '@testing-library/react'
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

  const renderPage = async () => {
    await act(async () => {
      render(<PostLogout />)
    })
  }

  it('replaces the current entry with the stored target', async () => {
    storePostLogoutTarget('/home?redirectTo=/datalibrary')

    await renderPage()

    expect(replaceSpy).toHaveBeenCalledWith('/home?redirectTo=/datalibrary')
  })

  it('deletes the target, so a later visit cannot reuse it', async () => {
    storePostLogoutTarget('/datalibrary')

    await renderPage()
    expect(sessionStorage.length).toBe(0)

    replaceSpy.mockClear()
    await renderPage()

    expect(replaceSpy).toHaveBeenCalledWith('/')
  })

  it('falls back to / when no target was stored', async () => {
    await renderPage()

    expect(replaceSpy).toHaveBeenCalledWith('/')
  })

  it('never navigates off-site, even from a tampered stored value', async () => {
    storePostLogoutTarget('/home')
    sessionStorage.setItem(Object.keys(sessionStorage)[0], 'https://evil.example.com/steal')

    await renderPage()

    expect(replaceSpy).toHaveBeenCalledWith('/')
  })

  it('makes no request of its own — a state-changing GET here would reintroduce CSRF', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    storePostLogoutTarget('/datalibrary')

    await renderPage()

    expect(fetchMock).not.toHaveBeenCalled()
    vi.unstubAllGlobals()
  })
})
