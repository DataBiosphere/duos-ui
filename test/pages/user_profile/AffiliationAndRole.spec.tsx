import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import AffiliationAndRole from 'src/pages/user_profile/AffiliationAndRoles'
import { DuosUser, InstitutionInterface, SigningOfficialUserWithData } from 'src/types/model'
import { renderWithRouter as render } from '../../test-utils'

vi.mock('src/libs/ajax/Institution', () => ({
  Institution: {
    getById: vi.fn(),
  },
}))

vi.mock('src/libs/ajax/User', () => ({
  User: {
    getSOsForInstitution: vi.fn(),
    getSOsForCurrentUser: vi.fn(),
  },
}))

vi.mock('src/libs/utils', () => ({
  Notifications: {
    showError: vi.fn(),
  },
}))

vi.mock('src/pages/user_profile/SigningOfficialRequest', () => ({
  default: () => <div data-testid="signing-official-request" />,
}))

import { Institution } from 'src/libs/ajax/Institution'
import { User } from 'src/libs/ajax/User'
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

const soWithData: SigningOfficialUserWithData = {
  userId: 99,
  displayName: 'Jane SO',
  email: 'jane.so@broad.mit.edu',
  institutionName: 'Broad Institute',
  userData: { externalProfiles: {} },
}

describe('AffiliationAndRole', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(Institution.getById).mockResolvedValue(institution)
    vi.mocked(User.getSOsForInstitution).mockResolvedValue([])
    vi.mocked(User.getSOsForCurrentUser).mockResolvedValue([])
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

  it('calls getSOsForCurrentUser when user has an institutionId', async () => {
    render(<AffiliationAndRole user={user} />)
    await waitFor(() => {
      expect(User.getSOsForCurrentUser).toHaveBeenCalled()
      expect(User.getSOsForInstitution).not.toHaveBeenCalled()
    })
  })

  it('calls getSOsForCurrentUser when user has no institutionId', async () => {
    render(<AffiliationAndRole user={{ ...user, institutionId: undefined }} />)
    await waitFor(() => {
      expect(User.getSOsForCurrentUser).toHaveBeenCalled()
      expect(User.getSOsForInstitution).not.toHaveBeenCalled()
    })
  })

  it('renders name and email in table rows for each signing official', async () => {
    vi.mocked(User.getSOsForCurrentUser).mockResolvedValue([soWithData])
    render(<AffiliationAndRole user={user} />)
    await waitFor(() => {
      expect(screen.getByRole('cell', { name: 'Jane SO' })).toBeInTheDocument()
      expect(screen.getByRole('cell', { name: 'jane.so@broad.mit.edu' })).toBeInTheDocument()
    })
  })

  it('renders the Name and Email column headers', async () => {
    vi.mocked(User.getSOsForCurrentUser).mockResolvedValue([soWithData])
    render(<AffiliationAndRole user={user} />)
    await waitFor(() => {
      expect(screen.getByRole('columnheader', { name: 'Name' })).toBeInTheDocument()
      expect(screen.getByRole('columnheader', { name: 'Email' })).toBeInTheDocument()
    })
  })

  it('shows "No Signing Official found" when the API returns an empty array', async () => {
    render(<AffiliationAndRole user={user} />)
    await waitFor(() => {
      expect(screen.getByText(/No Signing Official found/)).toBeInTheDocument()
    })
  })

  it('renders the heading as "My Institution\'s Signing Official(s)"', async () => {
    render(<AffiliationAndRole user={user} />)
    await waitFor(() => {
      expect(screen.getByText(/My Institution's Signing Official/)).toBeInTheDocument()
    })
  })

  it('renders the Signing Official request inside the Affiliation & Role section', () => {
    render(<AffiliationAndRole user={user} />)

    expect(screen.getByTestId('signing-official-request')).toBeInTheDocument()
  })
})
