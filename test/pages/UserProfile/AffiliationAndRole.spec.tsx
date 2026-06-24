import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import AffiliationAndRole from 'src/pages/user_profile/AffiliationAndRoles'
import { DuosUser, InstitutionInterface } from 'src/types/model'

vi.mock('src/libs/ajax/Institution', () => ({
  Institution: {
    getById: vi.fn(),
  },
}))

vi.mock('src/libs/utils', () => ({
  Notifications: {
    showError: vi.fn(),
  },
}))

import { Institution } from 'src/libs/ajax/Institution'
import { Notifications } from 'src/libs/utils'

const institution: InstitutionInterface = { id: 1, name: 'Test Institution' } as InstitutionInterface

const user: DuosUser = {
  createDate: new Date(),
  displayName: 'Test User',
  email: 'email',
  emailPreference: false,
  userId: 1,
  institutionId: 1,
  isAdmin: false,
  isAlumni: false,
  isChairPerson: false,
  isDataSubmitter: false,
  isMember: false,
  isResearcher: true,
  isSigningOfficial: true,
  roles: [
    { roleId: 1, userId: 1, userRoleId: 1, name: 'Researcher' },
    { roleId: 2, userId: 1, userRoleId: 2, name: 'SigningOfficial' },
  ],
}

describe('AffiliationAndRole', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(Institution.getById).mockResolvedValue(institution)
  })

  it('displays institution name when Institution.getById resolves with an institution', async () => {
    const { container } = render(<AffiliationAndRole user={user} />)
    await waitFor(() => {
      expect(container.querySelector('[data-cy="institutional-affiliation"]')?.textContent).toContain('Test Institution')
    })
  })

  it('displays the "contact us" fallback text when user has no institutionId', async () => {
    const userWithoutInstitution = { ...user, institutionId: undefined }
    const { container } = render(<AffiliationAndRole user={userWithoutInstitution} />)
    await waitFor(() => {
      expect(container.querySelector('[data-cy="institutional-affiliation"]')?.textContent).toContain(
        'Your institutional affiliation is automatically derived from your email domain.',
      )
    })
  })

  it('displays all role names joined with ", " for the user', async () => {
    const { container } = render(<AffiliationAndRole user={user} />)
    await waitFor(() => {
      expect(container.querySelector('[data-cy="user-roles"]')?.textContent).toBe('Researcher, SigningOfficial')
    })
  })

  it('shows error notification when Institution.getById rejects', async () => {
    vi.mocked(Institution.getById).mockRejectedValue(new Error('API error'))
    render(<AffiliationAndRole user={user} />)
    await waitFor(() => {
      expect(Notifications.showError).toHaveBeenCalledWith({
        text: 'Error: Unable to retrieve user information',
      })
    })
  })

  it('handles undefined user without crashing and without showing an error notification', async () => {
    render(<AffiliationAndRole user={undefined as unknown as DuosUser} />)
    await waitFor(() => {
      expect(Notifications.showError).not.toHaveBeenCalled()
    })
  })

  it('handles null user without crashing and without showing an error notification', async () => {
    render(<AffiliationAndRole user={null as unknown as DuosUser} />)
    await waitFor(() => {
      expect(Notifications.showError).not.toHaveBeenCalled()
    })
  })
})
