import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CreateDacUserModal } from 'src/components/modals/CreateDacUserModal'
import { User } from 'src/libs/ajax/User'
import type { DuosUser } from 'src/types/model'

vi.mock('src/components/collaborator_list/ModalWrapper', () => ({
  default: ({ children, isOpen }: { children: React.ReactNode, isOpen: boolean }) =>
    isOpen ? <>{children}</> : null,
}))

vi.mock('src/libs/ajax/User', () => ({
  User: {
    create: vi.fn(),
  },
}))

const mockCreatedUser: DuosUser = {
  userId: 42,
  displayName: 'New User',
  email: 'newuser@example.org',
  emailPreference: true,
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
  targetRole: 'chair' as const,
  allowedDomains: ['example.org'],
  onUserCreated: vi.fn(),
  onCloseRequest: vi.fn(),
}

describe('CreateDacUserModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ── Rendering ────────────────────────────────────────────────────────────

  it('renders the modal title', () => {
    render(<CreateDacUserModal {...defaultProps} />)
    expect(screen.getByText('Create New User')).toBeTruthy()
  })

  it('does not render when showModal is false', () => {
    render(<CreateDacUserModal {...defaultProps} showModal={false} />)
    expect(screen.queryByText('Create New User')).toBeNull()
  })

  it('shows Chairperson in the description for chair role', () => {
    render(<CreateDacUserModal {...defaultProps} targetRole="chair" />)
    expect(screen.getByText(/Chairperson/)).toBeTruthy()
  })

  it('shows Member in the description for member role', () => {
    render(<CreateDacUserModal {...defaultProps} targetRole="member" />)
    expect(screen.getByText(/Member/)).toBeTruthy()
  })

  it('uses the first allowed domain in the email placeholder', () => {
    render(<CreateDacUserModal {...defaultProps} allowedDomains={['example.org', 'other.org']} />)
    expect(screen.getByPlaceholderText('e.g. username@example.org')).toBeTruthy()
  })

  it('falls back to generic placeholder when allowedDomains is null', () => {
    render(<CreateDacUserModal {...defaultProps} allowedDomains={null} />)
    expect(screen.getByPlaceholderText('e.g. username@broadinstitute.org')).toBeTruthy()
  })

  it('falls back to generic placeholder when allowedDomains is empty', () => {
    render(<CreateDacUserModal {...defaultProps} allowedDomains={[]} />)
    expect(screen.getByPlaceholderText('e.g. username@broadinstitute.org')).toBeTruthy()
  })

  // ── Close / cancel ───────────────────────────────────────────────────────

  it('calls onCloseRequest when Cancel is clicked', async () => {
    const user = userEvent.setup()
    const onCloseRequest = vi.fn()
    render(<CreateDacUserModal {...defaultProps} onCloseRequest={onCloseRequest} />)

    await user.click(screen.getByRole('button', { name: /cancel/i }))
    expect(onCloseRequest).toHaveBeenCalledOnce()
  })

  it('calls onCloseRequest when the close icon is clicked', async () => {
    const user = userEvent.setup()
    const onCloseRequest = vi.fn()
    const { container } = render(
      <CreateDacUserModal {...defaultProps} onCloseRequest={onCloseRequest} />,
    )
    const closeBtn = container.querySelector('.modal-close-btn')
    if (!closeBtn) throw new Error('Expected .modal-close-btn to be present')
    await user.click(closeBtn)
    expect(onCloseRequest).toHaveBeenCalledOnce()
  })

  // ── Validation ───────────────────────────────────────────────────────────

  it('shows email format error when email is malformed', async () => {
    const user = userEvent.setup()
    render(<CreateDacUserModal {...defaultProps} />)

    await user.type(screen.getByPlaceholderText('User name'), 'Test User')
    await user.type(screen.getByPlaceholderText('e.g. username@example.org'), 'notanemail')
    await user.click(screen.getByRole('button', { name: /create/i }))

    expect(screen.getByText('Please enter a valid email address (e.g., person@example.com)')).toBeTruthy()
    expect(User.create).not.toHaveBeenCalled()
  })

  it('shows domain error when email domain does not match allowedDomains', async () => {
    const user = userEvent.setup()
    render(<CreateDacUserModal {...defaultProps} allowedDomains={['example.org']} />)

    await user.type(screen.getByPlaceholderText('User name'), 'Test User')
    await user.type(screen.getByPlaceholderText('e.g. username@example.org'), 'user@other.example')
    await user.click(screen.getByRole('button', { name: /create/i }))

    expect(screen.getByText('Invalid email domain')).toBeTruthy()
    expect(screen.getByText(/example\.org/)).toBeTruthy()
    expect(User.create).not.toHaveBeenCalled()
  })

  it('domain error message lists all allowed domains', async () => {
    const user = userEvent.setup()
    render(<CreateDacUserModal {...defaultProps} allowedDomains={['example.org', 'example.edu']} />)

    await user.type(screen.getByPlaceholderText('User name'), 'Test User')
    await user.type(screen.getByPlaceholderText('e.g. username@example.org'), 'user@other.example')
    await user.click(screen.getByRole('button', { name: /create/i }))

    expect(screen.getByText(/example\.org.*example\.edu|example\.edu.*example\.org/)).toBeTruthy()
  })

  it('clears domain error when email field is changed', async () => {
    const user = userEvent.setup()
    render(<CreateDacUserModal {...defaultProps} allowedDomains={['example.org']} />)

    await user.type(screen.getByPlaceholderText('User name'), 'Test User')
    await user.type(screen.getByPlaceholderText('e.g. username@example.org'), 'user@other.example')
    await user.click(screen.getByRole('button', { name: /create/i }))
    expect(screen.getByText('Invalid email domain')).toBeTruthy()

    await user.clear(screen.getByPlaceholderText('e.g. username@example.org'))
    await user.type(screen.getByPlaceholderText('e.g. username@example.org'), 'n')
    expect(screen.queryByText('Invalid email domain')).toBeNull()
  })

  // ── Domain bypass for admins ──────────────────────────────────────────────

  it('bypasses domain check when allowedDomains is null (Admin)', async () => {
    const user = userEvent.setup()
    vi.mocked(User.create).mockResolvedValue(mockCreatedUser)
    render(<CreateDacUserModal {...defaultProps} allowedDomains={null} />)

    await user.type(screen.getByPlaceholderText('User name'), 'Test User')
    await user.type(screen.getByPlaceholderText('e.g. username@broadinstitute.org'), 'test@anydomain.example')
    await user.click(screen.getByRole('button', { name: /create/i }))

    await waitFor(() => expect(User.create).toHaveBeenCalledOnce())
    expect(screen.queryByText('Invalid email domain')).toBeNull()
  })

  // ── Successful creation ───────────────────────────────────────────────────

  it('calls User.create with the correct payload', async () => {
    const user = userEvent.setup()
    vi.mocked(User.create).mockResolvedValue(mockCreatedUser)
    render(<CreateDacUserModal {...defaultProps} allowedDomains={['example.org']} />)

    await user.type(screen.getByPlaceholderText('User name'), 'New User')
    await user.type(screen.getByPlaceholderText('e.g. username@example.org'), 'newuser@example.org')
    await user.click(screen.getByRole('button', { name: /create/i }))

    await waitFor(() => {
      expect(User.create).toHaveBeenCalledWith({
        displayName: 'New User',
        email: 'newuser@example.org',
        emailPreference: true,
        roles: [{ roleId: 5, name: 'Researcher' }],
      })
    })
  })

  it('calls onUserCreated with the new user and chair role on success', async () => {
    const user = userEvent.setup()
    const onUserCreated = vi.fn()
    vi.mocked(User.create).mockResolvedValue(mockCreatedUser)
    render(<CreateDacUserModal {...defaultProps} targetRole="chair" onUserCreated={onUserCreated} allowedDomains={['example.org']} />)

    await user.type(screen.getByPlaceholderText('User name'), 'New User')
    await user.type(screen.getByPlaceholderText('e.g. username@example.org'), 'newuser@example.org')
    await user.click(screen.getByRole('button', { name: /create/i }))

    await waitFor(() => expect(onUserCreated).toHaveBeenCalledWith(mockCreatedUser, 'chair'))
  })

  it('calls onUserCreated with the new user and member role on success', async () => {
    const user = userEvent.setup()
    const onUserCreated = vi.fn()
    vi.mocked(User.create).mockResolvedValue(mockCreatedUser)
    render(<CreateDacUserModal {...defaultProps} targetRole="member" onUserCreated={onUserCreated} allowedDomains={['example.org']} />)

    await user.type(screen.getByPlaceholderText('User name'), 'New User')
    await user.type(screen.getByPlaceholderText('e.g. username@example.org'), 'newuser@example.org')
    await user.click(screen.getByRole('button', { name: /create/i }))

    await waitFor(() => expect(onUserCreated).toHaveBeenCalledWith(mockCreatedUser, 'member'))
  })

  // ── Server errors ─────────────────────────────────────────────────────────

  it('shows a server error alert when User.create throws', async () => {
    const user = userEvent.setup()
    vi.mocked(User.create).mockRejectedValue(new Error('User exists with this email address: newuser@example.org'))
    render(<CreateDacUserModal {...defaultProps} allowedDomains={['example.org']} />)

    await user.type(screen.getByPlaceholderText('User name'), 'New User')
    await user.type(screen.getByPlaceholderText('e.g. username@example.org'), 'newuser@example.org')
    await user.click(screen.getByRole('button', { name: /create/i }))

    await waitFor(() => expect(screen.getByText('Error creating user')).toBeTruthy())
    expect(screen.getByText('User exists with this email address: newuser@example.org')).toBeTruthy()
    expect(defaultProps.onUserCreated).not.toHaveBeenCalled()
  })

  it('clears the server error when email is changed after a failure', async () => {
    const user = userEvent.setup()
    vi.mocked(User.create).mockRejectedValue(new Error('User exists with this email address: newuser@example.org'))
    render(<CreateDacUserModal {...defaultProps} allowedDomains={['example.org']} />)

    await user.type(screen.getByPlaceholderText('User name'), 'New User')
    await user.type(screen.getByPlaceholderText('e.g. username@example.org'), 'newuser@example.org')
    await user.click(screen.getByRole('button', { name: /create/i }))
    await waitFor(() => expect(screen.getByText('Error creating user')).toBeTruthy())

    await user.clear(screen.getByPlaceholderText('e.g. username@example.org'))
    await user.type(screen.getByPlaceholderText('e.g. username@example.org'), 'o')
    expect(screen.queryByText('Error creating user')).toBeNull()
  })
})
