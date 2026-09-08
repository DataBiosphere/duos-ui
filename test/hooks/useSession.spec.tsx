import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { useSessionInfo, useUserIsLogged } from 'src/hooks/useSession'
import { getSessionInfo, revalidateSessionInfo } from 'src/libs/auth/session'
import type { SessionInfo } from 'src/libs/auth/session'

vi.mock('src/libs/auth/session', () => ({
  getSessionInfo: vi.fn(),
  revalidateSessionInfo: vi.fn(),
}))

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <MemoryRouter>{children}</MemoryRouter>
)

describe('useSession hooks', () => {
  beforeEach(() => {
    vi.mocked(getSessionInfo).mockResolvedValue({ authenticated: false })
    vi.mocked(revalidateSessionInfo).mockResolvedValue({ authenticated: false })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('useUserIsLogged is undefined while the probe is in flight, then the answer', async () => {
    vi.mocked(getSessionInfo).mockResolvedValue({ authenticated: true })

    const { result } = renderHook(() => useUserIsLogged(), { wrapper })

    expect(result.current).toBeUndefined()
    await waitFor(() => expect(result.current).toBe(true))
  })

  it('revalidates on window focus — another tab may have signed in or out', async () => {
    vi.mocked(revalidateSessionInfo).mockResolvedValue({ authenticated: true, idp: 'google' })

    const { result } = renderHook(() => useSessionInfo(), { wrapper })
    await waitFor(() => expect(result.current).toEqual({ authenticated: false }))

    act(() => {
      globalThis.dispatchEvent(new Event('focus'))
    })

    await waitFor(() => expect(result.current).toEqual({ authenticated: true, idp: 'google' }))
    expect(vi.mocked(revalidateSessionInfo)).toHaveBeenCalled()
  })

  it('does not revalidate while the tab is hidden', async () => {
    const { result } = renderHook(() => useSessionInfo(), { wrapper })
    await waitFor(() => expect(result.current).toEqual({ authenticated: false }))

    const visibilitySpy = vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden')
    try {
      act(() => {
        document.dispatchEvent(new Event('visibilitychange'))
      })
      expect(vi.mocked(revalidateSessionInfo)).not.toHaveBeenCalled()
    }
    finally {
      visibilitySpy.mockRestore()
    }
  })

  it('ignores a stale probe that resolves after a newer revalidation (latest request wins)', async () => {
    let resolveInitialProbe!: (info: SessionInfo) => void
    vi.mocked(getSessionInfo).mockReturnValue(new Promise((resolve) => {
      resolveInitialProbe = resolve
    }))
    vi.mocked(revalidateSessionInfo).mockResolvedValue({ authenticated: true, idp: 'google' })

    const { result } = renderHook(() => useSessionInfo(), { wrapper })

    // The focus revalidation starts later but finishes first.
    act(() => {
      globalThis.dispatchEvent(new Event('focus'))
    })
    await waitFor(() => expect(result.current).toEqual({ authenticated: true, idp: 'google' }))

    // The slow initial probe finally resolves signed-out — it must not
    // overwrite the newer answer.
    await act(async () => {
      resolveInitialProbe({ authenticated: false })
    })
    expect(result.current).toEqual({ authenticated: true, idp: 'google' })
  })

  it('stops listening after unmount', async () => {
    const { result, unmount } = renderHook(() => useSessionInfo(), { wrapper })
    await waitFor(() => expect(result.current).toEqual({ authenticated: false }))

    unmount()
    globalThis.dispatchEvent(new Event('focus'))

    expect(vi.mocked(revalidateSessionInfo)).not.toHaveBeenCalled()
  })
})
