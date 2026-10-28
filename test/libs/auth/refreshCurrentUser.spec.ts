import { describe, it, expect, vi, beforeEach } from 'vitest'
import { refreshCurrentUserIfAffected } from 'src/libs/auth/refreshCurrentUser'
import { User } from 'src/libs/ajax/User'
import { Storage } from 'src/libs/storage'
import { announceSessionChange } from 'src/libs/auth/session'
import { DuosUser } from 'src/types/model'

vi.mock('src/libs/ajax/User')
vi.mock('src/libs/auth/session', () => ({ announceSessionChange: vi.fn() }))

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
    vi.resetAllMocks()
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

  it('announces the change after it stores the fresh roles, so mounted consumers re-render', async () => {
    vi.mocked(announceSessionChange).mockImplementation(() => {
      expect(Storage.getCurrentUser().isChairPerson).toBe(true)
    })

    await refreshCurrentUserIfAffected([42])

    expect(announceSessionChange).toHaveBeenCalledOnce()
  })

  it('does nothing when the current user is not affected', async () => {
    await refreshCurrentUserIfAffected([7, 8])

    expect(User.getMe).not.toHaveBeenCalled()
    expect(announceSessionChange).not.toHaveBeenCalled()
    expect(Storage.getCurrentUser()).toEqual(storedUser)
  })

  it('keeps the stored user when the profile fetch fails', async () => {
    vi.mocked(User.getMe).mockRejectedValue(new Error('network'))

    await expect(refreshCurrentUserIfAffected([42])).resolves.toBeUndefined()

    expect(Storage.getCurrentUser()).toEqual(storedUser)
    // Under the BFF a fresh probe still carries the new roles from Consent.
    expect(announceSessionChange).toHaveBeenCalledOnce()
  })
})
