import '@testing-library/jest-dom/vitest'
import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import LibraryCardFormModal, { LibraryCardFormModalProps } from 'src/components/modals/LibraryCardFormModal'
import { Storage } from 'src/libs/storage'
import { Institution } from 'src/libs/ajax/Institution'

vi.mock('src/components/collaborator_list/ModalWrapper', () => ({
  default: ({ children, isOpen }: { children: React.ReactNode, isOpen: boolean }) =>
    isOpen ? <>{children}</> : null,
}))

const createDefaultProps = (): LibraryCardFormModalProps => ({
  showModal: true,
  createOnClick: vi.fn().mockResolvedValue(undefined),
  closeModal: vi.fn(),
  users: [],
})

describe('Library Card Form Modal Select User Tests', () => {
  let props: LibraryCardFormModalProps
  const user = userEvent.setup()

  beforeEach(() => {
    props = createDefaultProps()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('Should render the Library Card Form Modal', async () => {
    const { container } = render(<LibraryCardFormModal {...props} />)
    const modal = container.querySelector('[data-cy="library-card-form-modal"]')!
    expect(modal).toBeInTheDocument()
    expect(modal).toHaveTextContent('Add Library Cards')
    // Add button is disabled (no users selected) — click does nothing
    await user.click(document.querySelector('#Add-button')!)
    expect(document.querySelector('#Cancel-button')).toBeInTheDocument()
    ;['Broad Library Card Agreement', 'NIH Library Card Agreement', 'NIH Data Use Certification Agreement']
      .forEach(text => expect(modal).toHaveTextContent(text))
    await user.click(document.querySelector('#Cancel-button')!)
    expect(props.closeModal).toHaveBeenCalled()
  })

  it('Existing users should be visible in the user selection list', async () => {
    const userOptions = [
      { userId: 1, displayName: 'Test User 1', email: 'user@test.com', libraryCard: undefined },
    ]
    const { container } = render(<LibraryCardFormModal {...props} users={userOptions} />)
    const selectInput = container.querySelector('.select-autocomplete input') as HTMLInputElement
    await user.click(selectInput)
    await user.type(selectInput, userOptions[0].displayName)
    await waitFor(() => {
      expect(container.querySelector('[data-cy="library-card-form-modal"]')).toHaveTextContent(userOptions[0].email)
    })
    await user.keyboard('{Enter}')
    await user.click(document.querySelector('#Add-button')!)
    await waitFor(() => expect(props.createOnClick).toHaveBeenCalled())
  })

  it('Multiple users should be selectable in the user selection list', async () => {
    const userOptions = [
      { userId: 1, displayName: 'Test User 1', email: 'user1@test.com', libraryCard: undefined },
      { userId: 2, displayName: 'Test User 2', email: 'user2@test.com', libraryCard: undefined },
      { userId: 3, displayName: 'Test User 3', email: 'user3@test.com', libraryCard: undefined },
    ]
    const { container } = render(<LibraryCardFormModal {...props} users={userOptions} />)
    const getInput = () => container.querySelector('.select-autocomplete input') as HTMLInputElement

    await user.click(getInput())
    await user.type(getInput(), 'Test User 1')
    await waitFor(() => expect(screen.getByText('Test User 1 (user1@test.com)')).toBeInTheDocument())
    await user.keyboard('{Enter}')

    await user.click(getInput())
    await user.type(getInput(), 'Test User 2')
    await waitFor(() => expect(screen.getByText('Test User 2 (user2@test.com)')).toBeInTheDocument())
    await user.keyboard('{Enter}')

    await user.click(getInput())
    await user.type(getInput(), 'Test User 3')
    await waitFor(() => expect(screen.getByText('Test User 3 (user3@test.com)')).toBeInTheDocument())
    await user.keyboard('{Enter}')

    await user.click(document.querySelector('#Add-button')!)
    await waitFor(() => expect(props.createOnClick).toHaveBeenCalledWith(
      [
        { userId: 1, userEmail: 'user1@test.com', userName: 'Test User 1' },
        { userId: 2, userEmail: 'user2@test.com', userName: 'Test User 2' },
        { userId: 3, userEmail: 'user3@test.com', userName: 'Test User 3' },
      ],
      undefined,
    ))
  })

  it('Non-existing users should NOT be visible in the user selection list', async () => {
    const userOptions = [
      { userId: 1, displayName: 'Test User 1', email: 'user@test.com', libraryCard: undefined },
    ]
    const { container } = render(<LibraryCardFormModal {...props} users={userOptions} />)
    const selectInput = container.querySelector('.select-autocomplete input') as HTMLInputElement
    await user.click(selectInput)
    await user.type(selectInput, 'Random Name')
    await waitFor(() => {
      expect(container.querySelector('[data-cy="library-card-form-modal"]')).not.toHaveTextContent('user@test.com')
    })
  })
})

describe('Library Card Form Modal Add User Tests', () => {
  let props: LibraryCardFormModalProps
  const user = userEvent.setup()

  beforeEach(() => {
    props = createDefaultProps()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  const switchToNewUserForm = async () => {
    await user.click(screen.getByText('Add User'))
  }

  it('Should toggle between existing user selection and new user creation', async () => {
    const { container } = render(<LibraryCardFormModal {...props} />)
    const modal = container.querySelector('[data-cy="library-card-form-modal"]')!
    expect(modal).toHaveTextContent('Select Existing Users OR')
    expect(modal).toHaveTextContent('Select a DUOS User...')
    await switchToNewUserForm()
    expect(modal).toHaveTextContent('Add User OR')
    expect(screen.getByPlaceholderText('User Name')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('User Email')).toBeInTheDocument()
    await user.click(screen.getByText('Select Existing Users'))
    expect(modal).toHaveTextContent('Select Existing Users OR')
  })

  it('Should validate new user name field is required', async () => {
    render(<LibraryCardFormModal {...props} />)
    await switchToNewUserForm()
    await user.type(screen.getByPlaceholderText('User Email'), 'test@example.org')
    await waitFor(() => expect(document.querySelector('#Add-button')).toHaveStyle({ opacity: '0.5' }))
  })

  it('Should validate new user email field is required', async () => {
    render(<LibraryCardFormModal {...props} />)
    await switchToNewUserForm()
    await user.type(screen.getByPlaceholderText('User Name'), 'Test User')
    await waitFor(() => expect(document.querySelector('#Add-button')).toHaveStyle({ opacity: '0.5' }))
  })

  it('Should validate new user email format', async () => {
    render(<LibraryCardFormModal {...props} />)
    await switchToNewUserForm()
    await user.type(screen.getByPlaceholderText('User Name'), 'Test User')
    await user.type(screen.getByPlaceholderText('User Email'), 'invalid-email')
    await waitFor(() => expect(document.querySelector('#Add-button')).toHaveStyle({ opacity: '0.5' }))
  })

  it('Should validate new user email domain', async () => {
    vi.spyOn(Storage, 'getCurrentUser').mockReturnValue({ institutionId: 1, isSigningOfficial: false } as never)
    vi.spyOn(Institution, 'getById').mockResolvedValue(
      { id: 1, name: 'Test Institution', signingOfficials: [], domains: ['example.org'] } as never,
    )
    render(<LibraryCardFormModal {...props} />)
    await switchToNewUserForm()
    await user.type(screen.getByPlaceholderText('User Name'), 'Test User')
    await user.type(screen.getByPlaceholderText('User Email'), 'test@sample.org')
    await waitFor(() => expect(document.querySelector('#Add-button')).toHaveStyle({ opacity: '0.5' }))
  })

  it('Should enable Add button when new user form is valid', async () => {
    vi.spyOn(Storage, 'getCurrentUser').mockReturnValue({ institutionId: 1, isSigningOfficial: false } as never)
    vi.spyOn(Institution, 'getById').mockResolvedValue(
      { id: 1, name: 'Test Institution', signingOfficials: [], domains: ['example.org'] } as never,
    )
    render(<LibraryCardFormModal {...props} />)
    await switchToNewUserForm()
    await user.type(screen.getByPlaceholderText('User Name'), 'Test User')
    await user.type(screen.getByPlaceholderText('User Email'), 'test@example.org')
    await waitFor(() => expect(document.querySelector('#Add-button')).not.toHaveStyle({ opacity: '0.5' }))
  })

  it('Should disable Add button when no users selected', async () => {
    render(<LibraryCardFormModal {...props} />)
    await waitFor(() => expect(document.querySelector('#Add-button')).toHaveStyle({ opacity: '0.5' }))
    await switchToNewUserForm()
    await waitFor(() => expect(document.querySelector('#Add-button')).toHaveStyle({ opacity: '0.5' }))
  })

  it('Should clear new user form when toggling to existing user selection', async () => {
    render(<LibraryCardFormModal {...props} />)
    await switchToNewUserForm()
    await user.type(screen.getByPlaceholderText('User Name'), 'Test User')
    await user.type(screen.getByPlaceholderText('User Email'), 'test@example.org')
    await user.click(screen.getByText('Select Existing Users'))
    await switchToNewUserForm()
    expect(screen.getByPlaceholderText('User Name')).toHaveValue('')
    expect(screen.getByPlaceholderText('User Email')).toHaveValue('')
  })

  it('Should clear form after successful submission', async () => {
    const userOptions = [
      { userId: 1, displayName: 'Test User 1', email: 'user@test.com', libraryCard: undefined },
    ]
    const { container } = render(<LibraryCardFormModal {...props} users={userOptions} />)
    const selectInput = container.querySelector('.select-autocomplete input') as HTMLInputElement
    await user.click(selectInput)
    await user.type(selectInput, 'Test User')
    await waitFor(() => expect(screen.getByText('Test User 1 (user@test.com)')).toBeInTheDocument())
    await user.keyboard('{Enter}')
    await user.click(document.querySelector('#Add-button')!)
    await waitFor(() => expect(props.createOnClick).toHaveBeenCalled())
    await waitFor(() => {
      expect(container.querySelector('.select-autocomplete')).not.toHaveTextContent('Test User 1')
    })
  })
})
