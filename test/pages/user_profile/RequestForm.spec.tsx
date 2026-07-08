import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { BrowserRouter, MemoryRouter, Route, Routes } from 'react-router-dom'
import RequestForm from 'src/pages/user_profile/RequestForm'
import { Support } from 'src/libs/ajax/Support'
import { Storage } from 'src/libs/storage'
import { User } from 'src/libs/ajax/User'
import { Notifications } from 'src/libs/utils'

vi.mock('src/libs/ajax/Support')
vi.mock('src/libs/storage')
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
vi.mock('src/pages/user_profile/ExternalProfile', () => ({
  default: () => (
    <div>
      <input id="linkedIn" />
      <input id="ORCID" />
      <input id="throughBio" />
      <input id="institutionalWebsite" />
    </div>
  ),
}))

const mockUser = {
  displayName: 'name',
  email: 'user@test.com',
  emailPreference: true,
  userId: 1,
  isSigningOfficial: false,
  roles: [],
}

const emptyProfiles = {
  userData: {
    externalProfiles: {
      linkedIn: '',
      ORCID: '',
      throughBio: '',
      institutionalWebsite: '',
      otherUrls: [],
    },
  },
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(Storage.getCurrentUser).mockReturnValue(mockUser as never)
  vi.mocked(User.getMe).mockResolvedValue(emptyProfiles as never)
  vi.mocked(Support.createTicket).mockReturnValue({} as never)
  vi.mocked(Support.createSupportRequest).mockResolvedValue(undefined)
})

const mount = () => render(<BrowserRouter><RequestForm /></BrowserRouter>)

describe('RequestForm', () => {
  it('renders all form elements', () => {
    mount()

    expect(document.querySelector('[data-cy="supportRequestForm"]')).toBeInTheDocument()
    expect(document.getElementById('checkRegisterDataset')).toBeInTheDocument()
    expect(document.getElementById('checkSOPermissions')).toBeInTheDocument()
    expect(document.getElementById('checkJoinDac')).toBeInTheDocument()
    expect(document.getElementById('extraRequest')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /back/i })).toBeEnabled()
    expect(screen.getByRole('button', { name: /submit/i })).toBeDisabled()
  })

  it('enables submit button when a checkbox is checked and disables when unchecked', () => {
    mount()
    const submit = screen.getByRole('button', { name: /submit/i })

    fireEvent.click(document.getElementById('checkRegisterDataset')!)
    expect(submit).toBeEnabled()

    fireEvent.click(document.getElementById('checkRegisterDataset')!)
    expect(submit).toBeDisabled()

    fireEvent.click(document.getElementById('checkSOPermissions')!)
    expect(submit).toBeEnabled()

    fireEvent.click(document.getElementById('checkSOPermissions')!)
    expect(submit).toBeDisabled()

    fireEvent.click(document.getElementById('checkJoinDac')!)
    expect(submit).toBeEnabled()

    fireEvent.click(document.getElementById('checkJoinDac')!)
    expect(submit).toBeDisabled()
  })

  it('does not allow submission with only extra request text', () => {
    mount()
    fireEvent.change(document.getElementById('extraRequest')!, { target: { value: 'Extra only' } })
    expect(screen.getByRole('button', { name: /submit/i })).toBeDisabled()
  })

  it('calls createSupportRequest on successful form submission', async () => {
    mount()

    fireEvent.click(document.getElementById('checkRegisterDataset')!)
    fireEvent.click(screen.getByRole('button', { name: /submit/i }))

    await waitFor(() => {
      expect(vi.mocked(Support.createSupportRequest)).toHaveBeenCalledOnce()
    })
  })

  it('shows error notification on failed submission', async () => {
    vi.mocked(Support.createSupportRequest).mockRejectedValue({ response: { status: 500 } })
    mount()

    fireEvent.click(document.getElementById('checkRegisterDataset')!)
    fireEvent.click(screen.getByRole('button', { name: /submit/i }))

    await waitFor(() => {
      expect(vi.mocked(Notifications.showError)).toHaveBeenCalledWith(
        expect.objectContaining({ text: 'ERROR 500 : Unable To Send Requests' }),
      )
    })
  })

  it('allows multiple checkbox selection and submits correct description', async () => {
    mount()
    const submit = screen.getByRole('button', { name: /submit/i })

    fireEvent.click(document.getElementById('checkRegisterDataset')!)
    fireEvent.click(document.getElementById('checkJoinDac')!)
    expect(submit).toBeEnabled()

    fireEvent.click(submit)

    await waitFor(() => {
      expect(vi.mocked(Support.createTicket)).toHaveBeenCalled()
      const description = vi.mocked(Support.createTicket).mock.calls[0][4]
      expect(description).toContain('Register a dataset')
      expect(description).toContain('join a DAC')
    })
  })

  it('includes extra request text in submission', async () => {
    mount()

    fireEvent.click(document.getElementById('checkJoinDac')!)
    fireEvent.change(document.getElementById('extraRequest')!, { target: { value: 'Extra details here' } })
    fireEvent.click(screen.getByRole('button', { name: /submit/i }))

    await waitFor(() => {
      expect(vi.mocked(Support.createTicket)).toHaveBeenCalled()
      const callArgs = vi.mocked(Support.createTicket).mock.calls[0]
      expect(callArgs[4]).toContain('Extra details here')
    })
  })

  it('disables submit button while submission is in progress', async () => {
    let resolveRequest!: () => void
    const pendingRequest = new Promise<void>((resolve) => {
      resolveRequest = resolve
    })
    vi.mocked(Support.createSupportRequest).mockReturnValue(pendingRequest)

    mount()
    fireEvent.click(document.getElementById('checkJoinDac')!)
    fireEvent.click(screen.getByRole('button', { name: /submit/i }))

    expect(screen.getByRole('button', { name: /submit/i })).toBeDisabled()

    resolveRequest()
    await waitFor(() => expect(vi.mocked(Support.createSupportRequest)).toHaveBeenCalledOnce())
  })

  it('navigates away when Back button is clicked', () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/profile/request']}>
        <Routes>
          <Route path="/profile/request" element={<RequestForm />} />
          <Route path="/profile" element={<div data-testid="profile-page">Profile</div>} />
        </Routes>
      </MemoryRouter>,
    )

    fireEvent.click(container.querySelector('[data-cy="backButton"]')!)

    expect(screen.getByTestId('profile-page')).toBeInTheDocument()
  })

  it('shows external profile URL fields when SO Permissions is checked', () => {
    mount()
    fireEvent.click(document.getElementById('checkSOPermissions')!)

    expect(document.getElementById('linkedIn')).toBeInTheDocument()
    expect(document.getElementById('ORCID')).toBeInTheDocument()
    expect(document.getElementById('throughBio')).toBeInTheDocument()
    expect(document.getElementById('institutionalWebsite')).toBeInTheDocument()
  })

  it('prevents submission if no external profile URL is filled', async () => {
    mount()
    fireEvent.click(document.getElementById('checkSOPermissions')!)
    fireEvent.click(screen.getByRole('button', { name: /submit/i }))

    await waitFor(() => {
      expect(vi.mocked(Notifications.showError)).toHaveBeenCalledWith(
        expect.objectContaining({ text: expect.stringContaining('Please provide at least one external profile URL') }),
      )
    })
  })

  it('prevents submission when non-URL text is entered in an external profile field', async () => {
    mount()
    fireEvent.click(document.getElementById('checkSOPermissions')!)
    fireEvent.change(document.getElementById('linkedIn')!, { target: { value: 'non-url text' } })
    fireEvent.click(screen.getByRole('button', { name: /submit/i }))

    await waitFor(() => {
      expect(vi.mocked(Notifications.showError)).toHaveBeenCalledWith(
        expect.objectContaining({ text: expect.stringContaining('Please provide at least one external profile URL') }),
      )
    })
  })

  it('allows submission if at least one external profile URL is filled', async () => {
    vi.mocked(User.getMe).mockResolvedValue({
      userData: {
        externalProfiles: {
          linkedIn: 'test-linkedin-user',
          ORCID: '',
          throughBio: '',
          institutionalWebsite: '',
          otherUrls: [],
        },
      },
    } as never)

    mount()
    fireEvent.click(document.getElementById('checkSOPermissions')!)
    fireEvent.click(screen.getByRole('button', { name: /submit/i }))

    await waitFor(() => {
      expect(vi.mocked(Support.createSupportRequest)).toHaveBeenCalledOnce()
    })
  })
})
