import React from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import SigningOfficialRequest, { SO_REQUESTED_SETTING } from 'src/pages/user_profile/SigningOfficialRequest'
import { Support } from 'src/libs/ajax/Support'
import { User } from 'src/libs/ajax/User'
import { Storage } from 'src/libs/storage'
import { Notifications } from 'src/libs/utils'
import { DuosUser } from 'src/types/model'

vi.mock('src/libs/ajax/Support')
vi.mock('src/libs/ajax/User')
vi.mock('src/libs/utils', async (importOriginal) => {
  const original = await importOriginal<typeof import('src/libs/utils')>()
  return {
    ...original,
    Notifications: {
      ...original.Notifications,
      showError: vi.fn(),
      showSuccess: vi.fn(),
    },
  }
})

const user: DuosUser = {
  createDate: new Date('2026-04-30T12:00:00.000Z'),
  displayName: 'Test User',
  email: 'test@example.com',
  emailPreference: true,
  userId: 1,
  isAdmin: false,
  isAlumni: false,
  isChairPerson: false,
  isDataSubmitter: false,
  isMember: false,
  isResearcher: true,
  isSigningOfficial: false,
  roles: [],
}

const twoProfiles = {
  userData: { externalProfiles: { linkedIn: 'test-user', ORCID: '0000-0000-0000-0001' } },
} as never

const openAndAttest = (props: Partial<React.ComponentProps<typeof SigningOfficialRequest>> = {}) => {
  render(<SigningOfficialRequest user={user} {...props} />)
  fireEvent.click(screen.getByRole('button', { name: /Request Signing Official status/ }))
  fireEvent.click(screen.getByRole('checkbox', { name: /I legally attest/ }))
}

const submitButton = () => screen.getByRole('button', { name: 'Request Signing Official Status' })

beforeEach(() => {
  vi.clearAllMocks()
  localStorage.clear()
  vi.mocked(Support.createTicket).mockReturnValue({} as never)
  vi.mocked(Support.createSupportRequest).mockResolvedValue(undefined)
})

describe('SigningOfficialRequest', () => {
  it('starts collapsed behind a link', () => {
    render(<SigningOfficialRequest user={user} />)

    expect(screen.getByRole('button', { name: /Are you your institution's Signing Official/ })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Request Signing Official Status' })).not.toBeInTheDocument()
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument()
  })

  it('expands to the attestation and keeps the request disabled until attested', () => {
    render(<SigningOfficialRequest user={user} />)
    fireEvent.click(screen.getByRole('button', { name: /Request Signing Official status/ }))

    expect(screen.getByRole('heading', { name: 'Request Signing Official Status' })).toBeInTheDocument()
    expect(screen.getByText(/required to provide two External Profiles/)).toBeInTheDocument()
    expect(submitButton()).toBeDisabled()

    fireEvent.click(screen.getByRole('checkbox', { name: /I legally attest/ }))
    expect(submitButton()).toBeEnabled()
  })

  it('collapses on Cancel and clears the attestation', () => {
    openAndAttest()

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    fireEvent.click(screen.getByRole('button', { name: /Request Signing Official status/ }))

    expect(screen.getByRole('checkbox', { name: /I legally attest/ })).not.toBeChecked()
    expect(submitButton()).toBeDisabled()
  })

  it('warns in an info alert that the requestor cannot also be the Signing Official', () => {
    openAndAttest()

    const alert = screen.getByRole('alert')
    expect(alert).toHaveTextContent('cannot be both the requestor and the Signing Official')
    expect(alert).toHaveTextContent('Contracts Office')
  })

  it('points to the existing Signing Officials when the institution has some', () => {
    openAndAttest({ institutionHasSigningOfficials: true })

    expect(screen.getByText(/already has Signing Officials/)).toBeInTheDocument()
  })

  it('omits the existing Signing Officials note when the institution has none', () => {
    openAndAttest()

    expect(screen.queryByText(/already has Signing Officials/)).not.toBeInTheDocument()
  })

  it('does not show the request for an existing Signing Official', () => {
    render(<SigningOfficialRequest user={{ ...user, isSigningOfficial: true }} />)

    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('requires two External Profiles', async () => {
    vi.mocked(User.getMe).mockResolvedValue({
      userData: { externalProfiles: { linkedIn: 'test-user' } },
    } as never)
    openAndAttest()

    fireEvent.click(submitButton())

    await waitFor(() => {
      expect(Notifications.showError).toHaveBeenCalledWith(
        expect.objectContaining({ text: expect.stringContaining('at least two External Profiles') }),
      )
    })
    expect(Support.createSupportRequest).not.toHaveBeenCalled()
    expect(submitButton()).toBeEnabled()
  })

  it('submits an attestation ticket with all External Profile URLs', async () => {
    vi.mocked(User.getMe).mockResolvedValue({
      userData: {
        externalProfiles: {
          linkedIn: 'test-user',
          ORCID: '0000-0000-0000-0001',
          institutionalWebsite: 'https://example.edu/profile',
        },
      },
    } as never)
    openAndAttest()

    fireEvent.click(submitButton())

    await waitFor(() => expect(Support.createSupportRequest).toHaveBeenCalledOnce())
    const description = vi.mocked(Support.createTicket).mock.calls[0][4]
    expect(description).toContain('https://www.linkedin.com/in/test-user')
    expect(description).toContain('https://orcid.org/0000-0000-0000-0001')
    expect(description).toContain('https://example.edu/profile')
    expect(Notifications.showSuccess).toHaveBeenCalledWith(
      expect.objectContaining({ text: 'Signing Official status request submitted successfully.' }),
    )
  })

  it('replaces the request with a submitted note so it cannot be sent twice', async () => {
    vi.mocked(User.getMe).mockResolvedValue(twoProfiles)
    openAndAttest()

    fireEvent.click(submitButton())

    expect(await screen.findByRole('heading', { name: 'Signing Official Status Requested' })).toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
    expect(Storage.getCurrentUserSettings(SO_REQUESTED_SETTING)).toEqual(expect.any(String))
  })

  it('shows the submitted note after a reload when a request was already sent', () => {
    Storage.setCurrentUserSettings(SO_REQUESTED_SETTING, '2026-10-01T12:00:00.000Z')
    render(<SigningOfficialRequest user={user} />)

    expect(screen.getByRole('heading', { name: 'Signing Official Status Requested' })).toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('does not record a request that failed', async () => {
    vi.mocked(User.getMe).mockResolvedValue(twoProfiles)
    vi.mocked(Support.createSupportRequest).mockRejectedValue({ response: { status: 500 } })
    openAndAttest()

    fireEvent.click(submitButton())

    await waitFor(() => {
      expect(Notifications.showError).toHaveBeenCalledWith({
        text: 'ERROR 500: Unable to request Signing Official status',
      })
    })
    expect(Storage.getCurrentUserSettings(SO_REQUESTED_SETTING)).toBeUndefined()
    expect(submitButton()).toBeEnabled()
  })

  it('omits an undefined status from network error notifications', async () => {
    vi.mocked(User.getMe).mockRejectedValue(new Error('Network error'))
    openAndAttest()

    fireEvent.click(submitButton())

    await waitFor(() => {
      expect(Notifications.showError).toHaveBeenCalledWith({
        text: 'Unable to request Signing Official status',
      })
    })
  })
})
