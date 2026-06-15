import React from 'react'
import '@testing-library/jest-dom/vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import DataCustodianTable from 'src/pages/signing_official_console/DataCustodianTable'
import { UserRole, DuosUserWithInstitutionId } from 'src/types/model'

vi.mock('src/components/modals/ConfirmationModal', () => ({
  default: ({
    showConfirmation,
    title,
    message,
  }: {
    showConfirmation: boolean
    title: string
    message: React.ReactNode
  }) => {
    if (!showConfirmation) {
      return null
    }
    return (
      <div data-testid="confirmation-modal">
        <div>{title}</div>
        <div>{message}</div>
      </div>
    )
  },
}))

const dpaHeaderText = 'BROAD DATA USE OVERSIGHT SYSTEM (DUOS) - DATA PROVIDER AGREEMENT'

const role = (overrides: Partial<UserRole> = {}): UserRole => ({
  roleId: 2,
  name: 'Researcher',
  userId: 1,
  userRoleId: 1,
  ...overrides,
})

const user = (overrides: Partial<DuosUserWithInstitutionId> = {}): DuosUserWithInstitutionId => ({
  createDate: new Date('2022-01-01T00:00:00.000Z'),
  displayName: 'Researcher',
  email: 'researcher@example.com',
  emailPreference: true,
  institutionId: 1,
  isAdmin: false,
  isAlumni: false,
  isChairPerson: false,
  isDataSubmitter: false,
  isMember: false,
  isResearcher: true,
  isSigningOfficial: false,
  roles: [role()],
  userId: 1,
  ...overrides,
})

const signingOfficial = user({
  displayName: 'Signing Official',
  email: 'so@example.com',
  isResearcher: false,
  isSigningOfficial: true,
  userId: 10,
})

describe('DataCustodianTable', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      text: vi.fn().mockResolvedValue(`**${dpaHeaderText}**`),
    }))
  })

  it('renders the data submitters table heading and researcher rows', async () => {
    render(
      <DataCustodianTable
        isLoading={false}
        signingOfficial={signingOfficial}
        researchers={[
          user({ userId: 1, displayName: 'Researcher One', email: 'one@example.com' }),
          user({ userId: 2, displayName: 'Researcher Two', email: 'two@example.com' }),
        ]}
      />,
    )

    expect(screen.getByText('My Institution’s Data Submitters')).toBeInTheDocument()
    expect(screen.getByText('Issue or remove Data Submitter privileges.')).toBeInTheDocument()
    expect(await screen.findByText('Researcher One')).toBeInTheDocument()
    expect(screen.getByText('Researcher Two')).toBeInTheDocument()
  })

  it('renders Issue for researchers without the data submitter role and Remove for data submitters', async () => {
    render(
      <DataCustodianTable
        isLoading={false}
        signingOfficial={signingOfficial}
        researchers={[
          user({ userId: 1, displayName: 'Researcher One', email: 'one@example.com' }),
          user({
            userId: 2,
            displayName: 'Data Submitter',
            email: 'submitter@example.com',
            roles: [role(), role({ roleId: 8, name: 'DataSubmitter', userRoleId: 2 })],
          }),
        ]}
      />,
    )

    expect(await screen.findByRole('button', { name: 'Issue' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Remove' })).toBeInTheDocument()
  })

  it('displays the DPA text in the Issue modal', async () => {
    render(
      <DataCustodianTable
        isLoading={false}
        signingOfficial={signingOfficial}
        researchers={[
          user({
            email: 'email',
            userId: 1,
            displayName: 'researcher',
            roles: [role()],
          }),
        ]}
      />,
    )

    fireEvent.click(await screen.findByRole('button', { name: 'Issue' }))

    expect(screen.getByText('Issue Data Submitter')).toBeInTheDocument()
    expect(await screen.findByText(dpaHeaderText)).toBeInTheDocument()
  })
})
