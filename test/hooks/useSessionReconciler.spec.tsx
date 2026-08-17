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
vi.mock('src/libs/auth/auth', () => ({ Redirect: { to: vi.fn(), reload: vi.fn() } }))

const queryClient = { clear: vi.fn() } as unknown as QueryClient
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <MemoryRouter>{children}</MemoryRouter>
)

const storedUser = { userId: 7, displayName: 'Stored User', roles: [] } as unknown as DuosUser

const renderReconciler = () => renderHook(() => useSessionReconciler(queryClient), { wrapper })

describe('useSessionReconciler', () => {
  beforeEach(() => {
    vi.mocked(completeSignIn).mockResolvedValue('completed')
    vi.mocked(queryClient.clear).mockClear()
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
    // The legacy probe carries a user (the storage mirror), so it never
    // reports "no profile" — the bootstrap's getMe must run as usual.
    expect(vi.mocked(completeSignIn).mock.calls[0][0].sessionReportsNoProfile).toBe(false)
  })

  it('tells the bootstrap the probe reported no profile, so it skips the session-destroying getMe', async () => {
    // Only the BFF probe answers authenticated-without-user (an unregistered
    // session). completeSignIn must go straight to registration: its usual
    // getMe would repeat the upstream 401 the probe just saw, and the
    // /duos-api proxy answers that by destroying the session registerUser
    // is about to need.
    vi.mocked(useSessionInfo).mockReturnValue({ authenticated: true })

    renderReconciler()

    await waitFor(() => expect(vi.mocked(completeSignIn)).toHaveBeenCalledOnce())
    expect(vi.mocked(completeSignIn).mock.calls[0][0].sessionReportsNoProfile).toBe(true)
  })

  it('clears the per-tab query cache when storage changed under us (cross-tab account switch)', async () => {
    // This tab mounted (and filled its QueryClient) as user 7. Another tab
    // then switched the shared cookie AND shared storage to user 9. This
    // tab's next probe names 9 and MATCHES storage — an ordinary-looking
    // hydrate — but the per-tab cache still holds 7's role-scoped results.
    const user9 = { userId: 9, displayName: 'Nine', roles: [] } as unknown as DuosUser
    const getCurrentUser = vi.spyOn(Storage, 'getCurrentUser')
    vi.spyOn(Storage, 'setCurrentUser').mockImplementation(() => {})
    // Mount-time cache identity: user 7.
    getCurrentUser.mockReturnValue(storedUser as never)
    vi.mocked(useSessionInfo).mockReturnValue({ authenticated: true, user: { ...storedUser } as never })

    const { rerender } = renderReconciler()
    expect(queryClient.clear).not.toHaveBeenCalled()

    // The other tab's switch: storage now names 9, and so does the probe.
    getCurrentUser.mockReturnValue(user9 as never)
    vi.mocked(useSessionInfo).mockReturnValue({ authenticated: true, user: user9 as never })
    rerender()

    await waitFor(() => expect(queryClient.clear).toHaveBeenCalled())
    expect(vi.mocked(completeSignIn)).not.toHaveBeenCalled()
  })

  it('does not clear the query cache on a routine same-user hydrate', async () => {
    vi.spyOn(Storage, 'getCurrentUser').mockReturnValue(storedUser as never)
    vi.spyOn(Storage, 'setCurrentUser').mockImplementation(() => {})
    vi.mocked(useSessionInfo).mockReturnValue({ authenticated: true, user: { ...storedUser } as never })

    renderReconciler()

    await waitFor(() => expect(vi.mocked(useSessionInfo)).toHaveBeenCalled())
    expect(queryClient.clear).not.toHaveBeenCalled()
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

    await waitFor(() => expect(vi.mocked(Redirect.reload)).toHaveBeenCalled())
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
    vi.mocked(completeSignIn).mockReturnValue(new Promise((resolve) => {
      resolveBootstrap = () => resolve('completed')
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

    await waitFor(() => expect(vi.mocked(Redirect.reload)).toHaveBeenCalled())
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

  it('retires a cancelled run — the next authenticated probe starts fresh instead of joining it', async () => {
    // /auth/me reports { authenticated: false } for transient failures too,
    // so a network blip mid-bootstrap must not leave a dead token that the
    // recovered probe would join (hanging the spinner or unlocking empty).
    vi.mocked(completeSignIn).mockReturnValue(new Promise(() => {}))
    vi.mocked(useSessionInfo).mockReturnValue({ authenticated: true })

    const { result, rerender } = renderReconciler()
    await waitFor(() => expect(vi.mocked(completeSignIn)).toHaveBeenCalledOnce())

    // Transient blip: probe flips unauthenticated…
    vi.mocked(useSessionInfo).mockReturnValue({ authenticated: false })
    rerender()
    expect(result.current.reconciling).toBe(false)

    // …then recovers with a fresh unauthenticated-session probe (same shape,
    // NEW object). It must start a second bootstrap, not join the dead one.
    vi.mocked(useSessionInfo).mockReturnValue({ authenticated: true })
    rerender()

    await waitFor(() => expect(vi.mocked(completeSignIn)).toHaveBeenCalledTimes(2))
    expect(result.current.reconciling).toBe(true)
  })

  it('applies the freshest joined profile when the run completes', async () => {
    // A named-user bootstrap has an older getMe in flight when focus
    // revalidation returns the SAME user with newer roles. The join must not
    // swallow that profile — it is applied at run completion, after the
    // run's own (older) write.
    let resolveBootstrap!: () => void
    vi.mocked(completeSignIn).mockReturnValue(new Promise((resolve) => {
      resolveBootstrap = () => resolve('completed')
    }))
    const setCurrentUser = vi.spyOn(Storage, 'setCurrentUser').mockImplementation(() => {})
    const user9 = { userId: 9, displayName: 'Nine', roles: [] } as unknown as DuosUser
    vi.mocked(useSessionInfo).mockReturnValue({ authenticated: true, user: user9 as never })

    const { result, rerender } = renderReconciler()
    await waitFor(() => expect(vi.mocked(completeSignIn)).toHaveBeenCalledOnce())

    // Same user, newer authorization state, mid-run.
    const user9Promoted = { ...user9, roles: [{ name: 'Admin' }] }
    vi.mocked(useSessionInfo).mockReturnValue({ authenticated: true, user: user9Promoted as never })
    rerender()
    expect(vi.mocked(completeSignIn)).toHaveBeenCalledOnce() // joined, not restarted

    await act(async () => {
      resolveBootstrap()
    })

    expect(setCurrentUser).toHaveBeenCalledWith(user9Promoted)
    expect(result.current.reconciling).toBe(false)
  })

  it('discards pending hydration when the run ends signed-out', async () => {
    // The run failed and completeSignIn signed the session out, clearing
    // storage. Applying the joined profile afterwards would resurrect a
    // stale identity that survives the sign-out reload.
    let resolveBootstrap!: (outcome: 'signed-out') => void
    vi.mocked(completeSignIn).mockReturnValue(new Promise((resolve) => {
      resolveBootstrap = resolve
    }))
    const setCurrentUser = vi.spyOn(Storage, 'setCurrentUser').mockImplementation(() => {})
    const user9 = { userId: 9, displayName: 'Nine', roles: [] } as unknown as DuosUser
    vi.mocked(useSessionInfo).mockReturnValue({ authenticated: true, user: user9 as never })

    const { rerender } = renderReconciler()
    await waitFor(() => expect(vi.mocked(completeSignIn)).toHaveBeenCalledOnce())

    // A same-user probe joins mid-run, supplying pending hydration.
    vi.mocked(useSessionInfo).mockReturnValue({ authenticated: true, user: { ...user9 } as never })
    rerender()

    await act(async () => {
      resolveBootstrap('signed-out')
    })

    expect(setCurrentUser).not.toHaveBeenCalled()
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
