import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import type { QueryClient } from '@tanstack/react-query'
import { useSessionReconciler } from 'src/hooks/useSessionReconciler'
import { useSessionInfo } from 'src/hooks/useSession'
import { completeSignIn } from 'src/libs/auth/postSignIn'
import { Storage } from 'src/libs/storage'
import type { SessionInfo } from 'src/libs/auth/session'
import type { DuosUser } from 'src/types/model'

vi.mock('src/hooks/useSession', () => ({ useSessionInfo: vi.fn() }))
vi.mock('src/libs/auth/postSignIn', () => ({ completeSignIn: vi.fn() }))

const queryClient = { clear: vi.fn() } as unknown as QueryClient
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <MemoryRouter>{children}</MemoryRouter>
)

const storedUser = { userId: 7, displayName: 'Stored User', roles: [] } as unknown as DuosUser

const renderReconciler = () => renderHook(() => useSessionReconciler(queryClient), { wrapper })

describe('useSessionReconciler', () => {
  beforeEach(() => {
    vi.mocked(completeSignIn).mockResolvedValue(undefined)
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.mocked(useSessionInfo).mockReset()
    vi.mocked(completeSignIn).mockReset()
    localStorage.clear()
  })

  it('hides the routes from the first render when a fresh probe could change the identity', () => {
    // Cross-tab switch shape: stored user 7, fresh probe reports an
    // unregistered session. The stale identity must never be committed.
    vi.spyOn(Storage, 'getCurrentUser').mockReturnValue(storedUser as never)
    vi.mocked(useSessionInfo).mockReturnValue({ authenticated: true })

    const { result } = renderReconciler()

    expect(result.current.reconciling).toBe(true)
  })

  it('hydrates without hiding the routes, recording classification in state', async () => {
    vi.spyOn(Storage, 'getCurrentUser').mockReturnValue(storedUser as never)
    const setCurrentUser = vi.spyOn(Storage, 'setCurrentUser').mockImplementation(() => {})
    const freshProfile = { ...storedUser, roles: [{ name: 'Admin' }] }
    vi.mocked(useSessionInfo).mockReturnValue({ authenticated: true, user: freshProfile as never })

    const { result } = renderReconciler()

    // Same identity — no blanking of the screen on a routine revalidation…
    expect(result.current.reconciling).toBe(false)
    // …but the refreshed profile lands in storage and the classification is
    // recorded in state (which re-renders consumers off the new profile).
    await waitFor(() => expect(setCurrentUser).toHaveBeenCalledWith(freshProfile))
    expect(vi.mocked(completeSignIn)).not.toHaveBeenCalled()
  })

  it('joins an in-flight bootstrap instead of starting a concurrent one for the same identity', async () => {
    // completeSignIn hangs, as a slow registration would.
    let resolveBootstrap!: () => void
    vi.mocked(completeSignIn).mockReturnValue(new Promise<void>((resolve) => {
      resolveBootstrap = () => resolve()
    }))
    const probe1: SessionInfo = { authenticated: true }
    vi.mocked(useSessionInfo).mockReturnValue(probe1)

    const { result, rerender } = renderReconciler()
    await waitFor(() => expect(vi.mocked(completeSignIn)).toHaveBeenCalledOnce())

    // A focus revalidation publishes a NEW no-user result mid-registration.
    const probe2: SessionInfo = { authenticated: true }
    vi.mocked(useSessionInfo).mockReturnValue(probe2)
    rerender()

    // Same target identity → joins the in-flight run; no duplicate
    // registration, metrics, or routing.
    expect(vi.mocked(completeSignIn)).toHaveBeenCalledOnce()
    expect(result.current.reconciling).toBe(true)

    await act(async () => {
      resolveBootstrap()
    })
    expect(result.current.reconciling).toBe(false)
  })

  it('supersedes an in-flight bootstrap for a different identity — the older completion cannot unlock the routes', async () => {
    const resolvers: Array<() => void> = []
    vi.mocked(completeSignIn).mockImplementation(() => new Promise<void>((resolve) => {
      resolvers.push(() => resolve())
    }))
    // First probe: unregistered session (target 0).
    vi.mocked(useSessionInfo).mockReturnValue({ authenticated: true })

    const { result, rerender } = renderReconciler()
    await waitFor(() => expect(vi.mocked(completeSignIn)).toHaveBeenCalledOnce())

    // A fresh probe now names a different registered user (cross-tab switch
    // landed mid-bootstrap) → a new bootstrap supersedes the first.
    const otherUser = { userId: 9, displayName: 'Other', roles: [] } as unknown as DuosUser
    vi.mocked(useSessionInfo).mockReturnValue({ authenticated: true, user: otherUser as never })
    rerender()
    await waitFor(() => expect(vi.mocked(completeSignIn)).toHaveBeenCalledTimes(2))

    // The SUPERSEDED run finishing must not reveal the routes…
    await act(async () => {
      resolvers[0]()
    })
    expect(result.current.reconciling).toBe(true)

    // …only the active generation's completion may.
    await act(async () => {
      resolvers[1]()
    })
    expect(result.current.reconciling).toBe(false)
  })

  it('does nothing while signed out', async () => {
    vi.mocked(useSessionInfo).mockReturnValue({ authenticated: false })

    const { result } = renderReconciler()

    expect(result.current.reconciling).toBe(false)
    expect(result.current.isLoggedIn).toBe(false)
    expect(vi.mocked(completeSignIn)).not.toHaveBeenCalled()
  })
})
