import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import ResearcherStatus from 'src/pages/user_profile/ResearcherStatus'
import { DuosUser, SigningOfficialUserWithData } from 'src/types/model'

vi.mock('src/libs/ajax/User', () => ({
  User: {
    getSOsForInstitution: vi.fn(),
    getSOsForCurrentUser: vi.fn(),
  },
}))

vi.mock('src/libs/ajax/DAA', () => ({
  DAA: {
    getDaaById: vi.fn(),
  },
}))

vi.mock('src/components/era_commons/ERACommons', () => ({
  default: () => <div data-testid="era-commons-mock" />,
}))

vi.mock('src/pages/user_profile/DAAs', () => ({
  default: ({ issuedOn, issuedBy }: { issuedOn: string, issuedBy: string }) => (
    <div data-testid="daas-mock">
      <span>{issuedOn}</span>
      <span>{issuedBy}</span>
    </div>
  ),
}))

vi.mock('src/libs/utils', () => ({
  Notifications: {
    showError: vi.fn(),
  },
}))

vi.mock('src/components/era_commons/ERACommonsUtils', () => ({
  nihAccountLabel: () => 'NIH',
  nihAccountInstructions: () => 'https://era.nih.gov',
}))

import { User } from 'src/libs/ajax/User'

const baseUser: DuosUser = {
  userId: 1,
  displayName: 'Test Researcher',
  email: 'researcher@example.com',
  institutionId: 42,
  createDate: new Date(),
  emailPreference: false,
  isAdmin: false,
  isAlumni: false,
  isChairPerson: false,
  isDataSubmitter: false,
  isMember: false,
  isResearcher: true,
  isSigningOfficial: false,
  roles: [],
}

const soWithData: SigningOfficialUserWithData = {
  userId: 99,
  displayName: 'Jane SO',
  email: 'jane.so@broad.mit.edu',
  institutionName: 'Broad Institute',
  userData: {
    externalProfiles: {
      linkedIn: 'janeso',
    },
  },
}

describe('ResearcherStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(User.getSOsForInstitution).mockResolvedValue([])
    vi.mocked(User.getSOsForCurrentUser).mockResolvedValue([])
  })

  it('calls getSOsForInstitution when user has an institutionId', async () => {
    render(<ResearcherStatus user={baseUser} />)
    await waitFor(() => {
      expect(User.getSOsForInstitution).toHaveBeenCalledWith(42)
      expect(User.getSOsForCurrentUser).not.toHaveBeenCalled()
    })
  })

  it('calls getSOsForCurrentUser when user has no institutionId', async () => {
    const userWithoutInstitution = { ...baseUser, institutionId: undefined }
    render(<ResearcherStatus user={userWithoutInstitution} />)
    await waitFor(() => {
      expect(User.getSOsForCurrentUser).toHaveBeenCalled()
      expect(User.getSOsForInstitution).not.toHaveBeenCalled()
    })
  })

  it('labels the status field "Requestor Status"', async () => {
    render(<ResearcherStatus user={baseUser} />)
    await waitFor(() => {
      expect(screen.getByText('Requestor Status')).toBeInTheDocument()
    })
  })

  it('shows "Inactive" status when user has no libraryCard', async () => {
    render(<ResearcherStatus user={baseUser} />)
    await waitFor(() => {
      expect(screen.getByText('Inactive')).toBeInTheDocument()
    })
  })

  it('shows "Active" status when user has a libraryCard', async () => {
    const userWithCard: DuosUser = {
      ...baseUser,
      libraryCard: {
        id: 1,
        userId: 1,
        userName: 'Test Researcher',
        userEmail: 'researcher@example.com',
        createDate: new Date('2025-01-15'),
        createUserId: 99,
        daaIds: [],
      },
    }
    vi.mocked(User.getSOsForInstitution).mockResolvedValue([soWithData])
    render(<ResearcherStatus user={userWithCard} />)
    await waitFor(() => {
      expect(screen.getByText('Active')).toBeInTheDocument()
    })
  })

  it('renders the DAAs component when user has a libraryCard', async () => {
    const userWithCard: DuosUser = {
      ...baseUser,
      libraryCard: {
        id: 1,
        userId: 1,
        userName: 'Test Researcher',
        userEmail: 'researcher@example.com',
        createDate: new Date('2025-01-15'),
        createUserId: 99,
        daaIds: [],
      },
    }
    vi.mocked(User.getSOsForInstitution).mockResolvedValue([soWithData])
    render(<ResearcherStatus user={userWithCard} />)
    await waitFor(() => {
      expect(screen.getByTestId('daas-mock')).toBeInTheDocument()
    })
  })

  it('sets issuedBy to the matching SO display name when createUserId matches', async () => {
    const userWithCard: DuosUser = {
      ...baseUser,
      libraryCard: {
        id: 1,
        userId: 1,
        userName: 'Test Researcher',
        userEmail: 'researcher@example.com',
        createDate: new Date('2025-01-15'),
        createUserId: 99,
        daaIds: [],
      },
    }
    vi.mocked(User.getSOsForInstitution).mockResolvedValue([soWithData])
    render(<ResearcherStatus user={userWithCard} />)
    await waitFor(() => {
      const daasMock = screen.getByTestId('daas-mock')
      expect(daasMock).toHaveTextContent('Jane SO')
    })
  })
})
