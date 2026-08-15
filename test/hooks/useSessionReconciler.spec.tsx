import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import type { QueryClient } from '@tanstack/react-query'
import { useSessionReconciler } from 'src/hooks/useSessionReconciler'
import { useSessionInfo } from 'src/hooks/useSession'
import { completeSignIn } from 'src/libs/auth/postSignIn'
import { Redirect } from 'src/libs/auth/auth'
import { Storage } from 'src/libs/storage'
import type { SessionInfo } from 'src/libs/auth/session'
import type { DuosUser } from 'src/types/model'

vi.mock('src/hooks/useSession', () => ({ useSessionInfo: vi.fn() }))
vi.mock('src/libs/auth/postSignIn', () => ({ completeSignIn: vi.fn() }))
// The hard-reload seam: identity conflicts under an in-flight bootstrap
// reload the page instead of reconciling in place (see the scope policy).
vi.mock('src/libs/auth/auth', () => ({ Redirect: { to: vi.fn() } }))

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

  it('hydrates without hiding the routes when auth-relevant fields match', async () => {
    vi.spyOn(Storage, 'getCurrentUser').mockReturnValue(storedUser as never)
    const setCurrentUser = vi.spyOn(Storage, 'setCurrentUser').mockImplementation(() => {})
    // Cosmetic change only — same identity, same roles, same ToS state.
    const freshProfile = { ...storedUser, displayName: 'Renamed User' }
    vi.mocked(useSessionInfo).mockReturnValue({ authenticated: true, user: freshProfile as never })

    const { result } = renderReconciler()

    // No blanking of the screen on a routine revalidation…
    expect(result.current.reconciling).toBe(false)
    // …but the refreshed profile lands in storage and the classification is
    // recorded in state (which re-renders consumers off the new profile).
    await waitFor(() => expect(setCurrentUser).toHaveBeenCalledWith(freshProfile))
    expect(vi.mocked(completeSignIn)).not.toHaveBeenCalled()
  })

  it('hides identity-bearing UI when the same user returns with changed roles or ToS state', async () => {
    vi.spyOn(Storage, 'getCurrentUser').mockReturnValue(storedUser as never)
    const setCurrentUser = vi.spyOn(Storage, 'setCurrentUser').mockImplementation(() => {})
    // Same identity, but the server revoked/added roles — committing the
    // mounted UI off stale storage would render the old permissions.
    const freshProfile = { ...storedUser, roles: [{ name: 'Admin' }] }
    vi.mocked(useSessionInfo).mockReturnValue({ authenticated: true, user: freshProfile as never })

    // Capture every render's value: classification happens in an effect right
    // after the first commit, so result.current alone can't see that commit.
    const reconcilingPerRender: boolean[] = []
    const { result } = renderHook(() => {
      const reconciliation = useSessionReconciler(queryClient)
      reconcilingPerRender.push(reconciliation.reconciling)
      return reconciliation
    }, { wrapper })

    // The commit that received the fresh probe hid the identity-bearing UI…
    expect(reconcilingPerRender[0]).toBe(true)
    // …then hydration classified it and re-rendered off the fresh profile.
    await waitFor(() => expect(setCurrentUser).toHaveBeenCalledWith(freshProfile))
    expect(result.current.reconciling).toBe(false)
    expect(vi.mocked(completeSignIn)).not.toHaveBeenCalled()
  })

  it('bootstraps (not hydrates) a legacy probe whose user is the empty default', async () => {
    // The legacy popup flow reloads with CurrentUser still the default
    // (userId 0) and the legacy probe mirrors storage — that is "no local
    // identity", not a match: completeSignIn must run to finish sign-in.
    vi.mocked(useSessionInfo).mockReturnValue({
      authenticated: true,
      user: { userId: 0, displayName: '', roles: [] } as never,
    })

    renderReconciler()

    await waitFor(() => expect(vi.mocked(completeSignIn)).toHaveBeenCalledOnce())
  })

  it('reloads on identity reversal — a probe naming the pre-run stored user does not join', async () => {
    // Storage holds user 7. A bootstrap for user 9 is in flight. The session
    // switches BACK to user 7: the probe matches storage, but 9's run did not
    // produce that state — joining would let 9's fetch overwrite storage.
    // Only an unsupported cross-tab switch produces this: cancel and reload.
    vi.spyOn(Storage, 'getCurrentUser').mockReturnValue(storedUser as never)
    vi.mocked(completeSignIn).mockReturnValue(new Promise(() => {}))
    const otherUser = { userId: 9, displayName: 'Other', roles: [] } as unknown as DuosUser
    vi.mocked(useSessionInfo).mockReturnValue({ authenticated: true, user: otherUser as never })

    const { rerender } = renderReconciler()
    await waitFor(() => expect(vi.mocked(completeSignIn)).toHaveBeenCalledOnce())
    const firstRunOptions = vi.mocked(completeSignIn).mock.calls[0][0]
    expect(firstRunOptions.isCancelled?.()).toBe(false)

    vi.mocked(useSessionInfo).mockReturnValue({ authenticated: true, user: storedUser as never })
    rerender()

    await waitFor(() => expect(vi.mocked(Redirect.to)).toHaveBeenCalledWith(globalThis.location.href))
    expect(firstRunOptions.isCancelled?.()).toBe(true)
    expect(vi.mocked(completeSignIn)).toHaveBeenCalledOnce()
  })

  it('hides identity-bearing UI when the same user returns with a changed DAC assignment', () => {
    // Same role names, different DAC scope — DACDatasets/ManageDac authorize
    // by dacId, so this must not commit off stale storage.
    const chairOfDac1 = { ...storedUser, roles: [{ name: 'Chairperson', dacId: 1 }] }
    const chairOfDac2 = { ...storedUser, roles: [{ name: 'Chairperson', dacId: 2 }] }
    vi.spyOn(Storage, 'getCurrentUser').mockReturnValue(chairOfDac1 as never)
    vi.spyOn(Storage, 'setCurrentUser').mockImplementation(() => {})
    vi.mocked(useSessionInfo).mockReturnValue({ authenticated: true, user: chairOfDac2 as never })

    const reconcilingPerRender: boolean[] = []
    renderHook(() => {
      const reconciliation = useSessionReconciler(queryClient)
      reconcilingPerRender.push(reconciliation.reconciling)
      return reconciliation
    }, { wrapper })

    expect(reconcilingPerRender[0]).toBe(true)
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

  it('cancels and hard-reloads when a different identity appears under an in-flight bootstrap', async () => {
    // Cross-tab account switching is unsupported (scope policy): the stale
    // tab reloads instead of reconciling in place, and the obsolete run is
    // cancelled so it cannot act before the page unloads.
    vi.mocked(completeSignIn).mockReturnValue(new Promise(() => {}))
    // First probe: unregistered session (target 0).
    vi.mocked(useSessionInfo).mockReturnValue({ authenticated: true })

    const { rerender } = renderReconciler()
    await waitFor(() => expect(vi.mocked(completeSignIn)).toHaveBeenCalledOnce())
    const firstRunOptions = vi.mocked(completeSignIn).mock.calls[0][0]
    expect(firstRunOptions.isCancelled?.()).toBe(false)

    const otherUser = { userId: 9, displayName: 'Other', roles: [] } as unknown as DuosUser
    vi.mocked(useSessionInfo).mockReturnValue({ authenticated: true, user: otherUser as never })
    rerender()

    await waitFor(() => expect(vi.mocked(Redirect.to)).toHaveBeenCalledWith(globalThis.location.href))
    expect(firstRunOptions.isCancelled?.()).toBe(true)
    // No second in-place bootstrap — the reload owns reconciliation now.
    expect(vi.mocked(completeSignIn)).toHaveBeenCalledOnce()
  })

  it('cancels the in-flight bootstrap when the session disappears', async () => {
    vi.mocked(completeSignIn).mockReturnValue(new Promise(() => {}))
    vi.mocked(useSessionInfo).mockReturnValue({ authenticated: true })

    const { result, rerender } = renderReconciler()
    await waitFor(() => expect(vi.mocked(completeSignIn)).toHaveBeenCalledOnce())
    const runOptions = vi.mocked(completeSignIn).mock.calls[0][0]

    // Sign-out in another tab (or expiry): the probe flips unauthenticated.
    vi.mocked(useSessionInfo).mockReturnValue({ authenticated: false })
    rerender()

    expect(runOptions.isCancelled?.()).toBe(true)
    // Signed out → nothing to reconcile; the UI renders the signed-out state.
    expect(result.current.reconciling).toBe(false)
  })

  it('cancels the in-flight bootstrap on unmount', async () => {
    vi.mocked(completeSignIn).mockReturnValue(new Promise(() => {}))
    vi.mocked(useSessionInfo).mockReturnValue({ authenticated: true })

    const { unmount } = renderReconciler()
    await waitFor(() => expect(vi.mocked(completeSignIn)).toHaveBeenCalledOnce())
    const runOptions = vi.mocked(completeSignIn).mock.calls[0][0]

    unmount()

    expect(runOptions.isCancelled?.()).toBe(true)
  })

  it('does nothing while signed out', async () => {
    vi.mocked(useSessionInfo).mockReturnValue({ authenticated: false })

    const { result } = renderReconciler()

    expect(result.current.reconciling).toBe(false)
    expect(result.current.isLoggedIn).toBe(false)
    expect(vi.mocked(completeSignIn)).not.toHaveBeenCalled()
  })
})
