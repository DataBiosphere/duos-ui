import React from 'react'
import '@testing-library/jest-dom/vitest'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { refreshCurrentUserIfAffected } from 'src/libs/auth/refreshCurrentUser'
import { resetSessionProbeState } from 'src/libs/auth/session'
import { useUserIsLogged } from 'src/hooks/useSession'
import { User } from 'src/libs/ajax/User'
import { Config } from 'src/libs/config'
import { Storage } from 'src/libs/storage'
import { setUserRoleStatuses } from 'src/libs/utils'
import { DuosUser } from 'src/types/model'

// DT-505: a save that does not navigate (DacProfile's inline EditDac) must
// still re-render mounted consumers, such as the header's DAC Console tab,
// off the refreshed roles.

vi.mock('src/libs/ajax/User')
vi.mock('src/libs/auth/legacyOidcKeys', () => ({ reportLegacyOidcKeys: vi.fn() }))
vi.mock('src/libs/config', async importOriginal => ({
  ...(await importOriginal<typeof import('src/libs/config')>()),
  Config: { isBffEnabled: vi.fn() },
}))

const researcherRole = { roleId: 5, name: 'Researcher' }
const chairRole = { roleId: 2, name: 'Chairperson', dacId: 9 }
const withRoles = (roles: object[]): DuosUser => ({ userId: 42, displayName: 'Self Editor', roles } as DuosUser)

const ChairBadge = () => {
  const isLogged = useUserIsLogged()
  return <span>{isLogged && Storage.getCurrentUser().isChairPerson ? 'chair' : 'not chair'}</span>
}

const renderBadge = async () => {
  render(<MemoryRouter><ChairBadge /></MemoryRouter>)
  await act(async () => {})
}

const refreshTo = async (fresh: DuosUser) => {
  vi.mocked(User.getMe).mockResolvedValue(structuredClone(fresh))
  await act(async () => {
    await refreshCurrentUserIfAffected([42])
  })
}

describe('refreshCurrentUserIfAffected re-renders mounted consumers', () => {
  beforeEach(() => {
    localStorage.clear()
    resetSessionProbeState()
  })

  afterEach(() => {
    resetSessionProbeState()
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  describe('legacy mode', () => {
    beforeEach(() => {
      vi.mocked(Config.isBffEnabled).mockResolvedValue(false)
      vi.spyOn(Storage, 'userIsLogged').mockReturnValue(true)
    })

    it('shows the chair role after the user adds themselves', async () => {
      setUserRoleStatuses(withRoles([researcherRole]), Storage)
      await renderBadge()
      expect(screen.getByText('not chair')).toBeInTheDocument()

      await refreshTo(withRoles([researcherRole, chairRole]))

      expect(await screen.findByText('chair')).toBeInTheDocument()
    })

    it('drops the chair role after the user removes themselves', async () => {
      setUserRoleStatuses(withRoles([researcherRole, chairRole]), Storage)
      await renderBadge()
      expect(screen.getByText('chair')).toBeInTheDocument()

      await refreshTo(withRoles([researcherRole]))

      expect(await screen.findByText('not chair')).toBeInTheDocument()
    })
  })

  describe('BFF mode', () => {
    it('shows the chair role after the user adds themselves', async () => {
      vi.mocked(Config.isBffEnabled).mockResolvedValue(true)
      const fetchMock = vi.fn()
      vi.stubGlobal('fetch', fetchMock)
      const probeAnswer = (user: DuosUser) => fetchMock.mockImplementation(async () =>
        new Response(JSON.stringify({ authenticated: true, idp: 'google', user }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }))

      const before = withRoles([researcherRole])
      setUserRoleStatuses(before, Storage)
      probeAnswer(before)
      await renderBadge()
      expect(screen.getByText('not chair')).toBeInTheDocument()

      const after = withRoles([researcherRole, chairRole])
      probeAnswer(after)
      await refreshTo(after)

      expect(await screen.findByText('chair')).toBeInTheDocument()
    })
  })
})
