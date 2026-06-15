import React from 'react'
import '@testing-library/jest-dom/vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import SigningOfficialDataSubmitters from 'src/pages/signing_official_console/SigningOfficialDataSubmitters'
import { User } from 'src/libs/ajax/User'
import { Notifications, USER_ROLES } from 'src/libs/utils'
import { DuosUser, DuosUserWithInstitutionId } from 'src/types/model'

type MockDataCustodianTableProps = {
  researchers: DuosUser[]
  signingOfficial: DuosUserWithInstitutionId
  isLoading: boolean
}

vi.mock('src/pages/signing_official_console/DataCustodianTable', () => ({
  default: ({ researchers, signingOfficial, isLoading }: MockDataCustodianTableProps) => (
    <div data-testid="data-custodian-table" data-loading={isLoading}>
      <span>{signingOfficial.displayName ?? 'No Signing Official'}</span>
      {researchers.map(researcher => (
        <span key={researcher.userId}>{researcher.displayName}</span>
      ))}
    </div>
  ),
}))

vi.mock('src/libs/ajax/User', () => ({
  User: {
    getMe: vi.fn(),
    list: vi.fn(),
  },
}))

const user = (overrides: Partial<DuosUser> = {}): DuosUser => {
  const baseUser: DuosUser = {
    createDate: new Date('2022-01-01T00:00:00.000Z'),
    displayName: 'Signing Official',
    email: 'so@example.com',
    emailPreference: true,
    institutionId: 1,
    isAdmin: false,
    isAlumni: false,
    isChairPerson: false,
    isDataSubmitter: false,
    isMember: false,
    isResearcher: false,
    isSigningOfficial: true,
    roles: [],
    userId: 1,
  }

  return { ...baseUser, ...overrides }
}

describe('SigningOfficialDataSubmitters', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches the current signing official and signing official users for the table', async () => {
    const signingOfficial = user()
    const signingOfficialUsers = [
      user({ userId: 2, displayName: 'Data Submitter One', email: 'one@example.com' }),
      user({ userId: 3, displayName: 'Data Submitter Two', email: 'two@example.com' }),
    ]

    vi.mocked(User.getMe).mockResolvedValue(signingOfficial)
    vi.mocked(User.list).mockResolvedValue(signingOfficialUsers)

    render(<SigningOfficialDataSubmitters />)

    await waitFor(() => {
      expect(User.getMe).toHaveBeenCalled()
      expect(User.list).toHaveBeenCalledWith(USER_ROLES.signingOfficial)
    })

    const table = await screen.findByTestId('data-custodian-table')
    expect(table).toHaveAttribute('data-loading', 'false')
    expect(screen.getByText('Signing Official')).toBeInTheDocument()
    expect(screen.getByText('Data Submitter One')).toBeInTheDocument()
    expect(screen.getByText('Data Submitter Two')).toBeInTheDocument()
  })

  it('shows an error notification when users cannot be loaded', async () => {
    const showErrorSpy = vi.spyOn(Notifications, 'showError').mockImplementation(() => undefined)

    vi.mocked(User.getMe).mockRejectedValue(new Error('network failed'))

    render(<SigningOfficialDataSubmitters />)

    await waitFor(() => {
      expect(showErrorSpy).toHaveBeenCalledWith({
        text: 'Error: Unable to retrieve current user from server: network failed',
      })
    })

    expect(screen.queryByTestId('data-custodian-table')).not.toBeInTheDocument()
  })
})
