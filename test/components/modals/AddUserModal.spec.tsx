import React from 'react'
import '@testing-library/jest-dom/vitest'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AddUserModal } from 'src/components/modals/AddUserModal'
import { User } from 'src/libs/ajax/User'
import type { DuosUser } from 'src/types/model'

vi.mock('src/components/BaseModal', () => ({
  BaseModal: ({ children, showModal, action, onRequestClose }: {
    children: React.ReactNode
    showModal: boolean
    action: { label: string, handler: () => void }
    onRequestClose: () => void
  }) =>
    showModal
      ? (
          <div>
            {children}
            <button type="button" onClick={action.handler}>{action.label}</button>
            <button type="button" onClick={onRequestClose}>Cancel</button>
          </div>
        )
      : null,
}))

vi.mock('src/libs/ajax/User', () => ({
  User: {
    create: vi.fn(),
  },
}))

const mockCreatedUser: DuosUser = {
  userId: 1,
  displayName: 'Test User',
  email: 'test@broadinstitute.org',
  emailPreference: false,
  isAdmin: false,
  isAlumni: false,
  isChairPerson: false,
  isDataSubmitter: false,
  isMember: false,
  isResearcher: true,
  isSigningOfficial: false,
  roles: [],
  createDate: new Date(),
}

const defaultProps = {
  showModal: true,
  onOKRequest: vi.fn(),
  onCloseRequest: vi.fn(),
  onAfterOpen: vi.fn(),
}

const fillAndSubmitForm = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.type(screen.getByPlaceholderText('User name'), 'Test User')
  await user.type(screen.getByPlaceholderText('e.g. username@broadinstitute.org'), 'test@broadinstitute.org')
  await user.click(screen.getByRole('button', { name: /add/i }))
}

describe('AddUserModal - Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders form fields when showModal is true', () => {
    render(<AddUserModal {...defaultProps} />)
    expect(screen.getByPlaceholderText('User name')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('e.g. username@broadinstitute.org')).toBeInTheDocument()
  })

  it('does not render when showModal is false', () => {
    render(<AddUserModal {...defaultProps} showModal={false} />)
    expect(screen.queryByPlaceholderText('User name')).not.toBeInTheDocument()
  })

  it('shows the Add action button', () => {
    render(<AddUserModal {...defaultProps} />)
    expect(screen.getByRole('button', { name: /add/i })).toBeInTheDocument()
  })

  it('shows the Admin checkbox unchecked by default', () => {
    render(<AddUserModal {...defaultProps} />)
    expect(screen.getByLabelText('Admin')).not.toBeChecked()
  })

  it('shows email preference checkbox when Admin is checked', async () => {
    const user = userEvent.setup()
    render(<AddUserModal {...defaultProps} />)
    await user.click(screen.getByLabelText('Admin'))
    expect(screen.getByLabelText('Disable Admin email notifications')).toBeInTheDocument()
  })

  it('hides email preference checkbox when Admin is unchecked', async () => {
    const user = userEvent.setup()
    render(<AddUserModal {...defaultProps} />)
    await user.click(screen.getByLabelText('Admin'))
    await user.click(screen.getByLabelText('Admin'))
    expect(screen.queryByLabelText('Disable Admin email notifications')).not.toBeInTheDocument()
  })

  it('calls onCloseRequest when Cancel is clicked', async () => {
    const user = userEvent.setup()
    render(<AddUserModal {...defaultProps} />)
    await user.click(screen.getByRole('button', { name: /cancel/i }))
    expect(defaultProps.onCloseRequest).toHaveBeenCalledWith('addUser')
  })

  it('does not call User.create when form is invalid (empty fields)', async () => {
    const user = userEvent.setup()
    render(<AddUserModal {...defaultProps} />)
    await user.click(screen.getByRole('button', { name: /add/i }))
    expect(User.create).not.toHaveBeenCalled()
  })

  it('calls User.create with correct payload on valid submission', async () => {
    const user = userEvent.setup()
    vi.mocked(User.create).mockResolvedValue(mockCreatedUser)
    render(<AddUserModal {...defaultProps} />)
    await fillAndSubmitForm(user)
    await waitFor(() => {
      expect(User.create).toHaveBeenCalledWith(expect.objectContaining({
        displayName: 'Test User',
        email: 'test@broadinstitute.org',
        emailPreference: false,
        roles: expect.arrayContaining([expect.objectContaining({ name: 'Researcher' })]),
      }))
    })
  })

  it('calls onOKRequest when User.create succeeds', async () => {
    const user = userEvent.setup()
    vi.mocked(User.create).mockResolvedValue(mockCreatedUser)
    render(<AddUserModal {...defaultProps} />)
    await fillAndSubmitForm(user)
    await waitFor(() => {
      expect(defaultProps.onOKRequest).toHaveBeenCalledWith('addUser')
    })
  })

  it('shows email conflict alert when User.create returns false', async () => {
    const user = userEvent.setup()
    vi.mocked(User.create).mockResolvedValue(false)
    render(<AddUserModal {...defaultProps} />)
    await fillAndSubmitForm(user)
    await waitFor(() => {
      expect(screen.getByText('There is a user already registered with this google account.')).toBeInTheDocument()
    })
    expect(defaultProps.onOKRequest).not.toHaveBeenCalled()
  })

  it('includes Admin role when Admin checkbox is checked before submitting', async () => {
    const user = userEvent.setup()
    vi.mocked(User.create).mockResolvedValue(mockCreatedUser)
    render(<AddUserModal {...defaultProps} />)
    await user.click(screen.getByLabelText('Admin'))
    await fillAndSubmitForm(user)
    await waitFor(() => {
      expect(User.create).toHaveBeenCalledWith(expect.objectContaining({
        roles: expect.arrayContaining([
          expect.objectContaining({ name: 'Admin' }),
          expect.objectContaining({ name: 'Researcher' }),
        ]),
      }))
    })
  })
})
