import React from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import SigningOfficialRequest from 'src/pages/user_profile/SigningOfficialRequest'
import { Support } from 'src/libs/ajax/Support'
import { User } from 'src/libs/ajax/User'
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
  createDate: new Date(),
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

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(Support.createTicket).mockReturnValue({} as never)
  vi.mocked(Support.createSupportRequest).mockResolvedValue(undefined)
})

describe('SigningOfficialRequest', () => {
  it('renders the design copy and Attest & Request button', () => {
    render(<SigningOfficialRequest user={user} />)

    expect(screen.getByRole('heading', { name: 'Request Signing Official Status' })).toBeInTheDocument()
    expect(screen.getByText(/I legally attest that I am a Signing Official/)).toBeInTheDocument()
    expect(screen.getByText(/required to provide two External Profiles/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Attest & Request' })).toBeEnabled()
  })

  it('does not show the request for an existing Signing Official', () => {
    render(<SigningOfficialRequest user={{ ...user, isSigningOfficial: true }} />)

    expect(screen.queryByRole('heading', { name: 'Request Signing Official Status' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Attest & Request' })).not.toBeInTheDocument()
  })

  it('requires two External Profiles', async () => {
    vi.mocked(User.getMe).mockResolvedValue({
      userData: { externalProfiles: { linkedIn: 'test-user' } },
    } as never)
    render(<SigningOfficialRequest user={user} />)

    fireEvent.click(screen.getByRole('button', { name: 'Attest & Request' }))

    await waitFor(() => {
      expect(Notifications.showError).toHaveBeenCalledWith(
        expect.objectContaining({ text: expect.stringContaining('at least two External Profiles') }),
      )
    })
    expect(Support.createSupportRequest).not.toHaveBeenCalled()
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
    render(<SigningOfficialRequest user={user} />)

    fireEvent.click(screen.getByRole('button', { name: 'Attest & Request' }))

    await waitFor(() => expect(Support.createSupportRequest).toHaveBeenCalledOnce())
    const description = vi.mocked(Support.createTicket).mock.calls[0][4]
    expect(description).toContain('https://www.linkedin.com/in/test-user')
    expect(description).toContain('https://orcid.org/0000-0000-0000-0001')
    expect(description).toContain('https://example.edu/profile')
    expect(Notifications.showSuccess).toHaveBeenCalledWith(
      expect.objectContaining({ text: 'Signing Official status request submitted successfully.' }),
    )
  })

  it('omits an undefined status from network error notifications', async () => {
    vi.mocked(User.getMe).mockRejectedValue(new Error('Network error'))
    render(<SigningOfficialRequest user={user} />)

    fireEvent.click(screen.getByRole('button', { name: 'Attest & Request' }))

    await waitFor(() => {
      expect(Notifications.showError).toHaveBeenCalledWith({
        text: 'Unable to request Signing Official status',
        layout: 'topRight',
      })
    })
  })
})
