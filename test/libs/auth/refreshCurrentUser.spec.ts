import { describe, it, expect, vi, beforeEach } from 'vitest'
import { refreshCurrentUserIfAffected } from 'src/libs/auth/refreshCurrentUser'
import { User } from 'src/libs/ajax/User'
import { Storage } from 'src/libs/storage'
import { resetSessionCache } from 'src/libs/auth/session'
import { DuosUser } from 'src/types/model'

vi.mock('src/libs/ajax/User')
vi.mock('src/libs/auth/session', () => ({ resetSessionCache: vi.fn() }))

const storedUser = {
  userId: 42,
  displayName: 'Chair To Be',
  email: 'chair@example.org',
  isChairPerson: false,
  roles: [{ roleId: 5, name: 'Researcher' }],
} as DuosUser

const freshUser = {
  ...storedUser,
  roles: [
    { roleId: 5, name: 'Researcher' },
    { roleId: 2, name: 'Chairperson', dacId: 9 },
  ],
} as DuosUser

describe('refreshCurrentUserIfAffected', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    Storage.setCurrentUser(storedUser)
    vi.mocked(User.getMe).mockResolvedValue(structuredClone(freshUser))
  })

  it('stores the fresh roles when the current user is affected', async () => {
    await refreshCurrentUserIfAffected([7, 42])

    const current = Storage.getCurrentUser()
    expect(current.isChairPerson).toBe(true)
    expect(current.roles).toContainEqual({ roleId: 2, name: 'Chairperson', dacId: 9 })
  })

  it('drops the cached session probe so the next probe carries the fresh roles', async () => {
    await refreshCurrentUserIfAffected([42])

    expect(resetSessionCache).toHaveBeenCalledOnce()
  })

  it('does nothing when the current user is not affected', async () => {
    await refreshCurrentUserIfAffected([7, 8])

    expect(User.getMe).not.toHaveBeenCalled()
    expect(resetSessionCache).not.toHaveBeenCalled()
    expect(Storage.getCurrentUser()).toEqual(storedUser)
  })

  it('keeps the stored user when the profile fetch fails', async () => {
    vi.mocked(User.getMe).mockRejectedValue(new Error('network'))

    await expect(refreshCurrentUserIfAffected([42])).resolves.toBeUndefined()

    expect(Storage.getCurrentUser()).toEqual(storedUser)
  })
})
