import '@testing-library/jest-dom/vitest'
import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router'
import { Storage } from 'src/libs/storage'
import { Support } from 'src/libs/ajax/Support'
import { useUserIsLogged } from 'src/hooks/useSession'
import { SupportRequestModal } from 'src/components/modals/SupportRequestModal'

vi.mock('src/libs/storage')
vi.mock('src/libs/ajax/Support')
vi.mock('src/hooks/useSession', () => ({
  useUserIsLogged: vi.fn(),
}))
vi.mock('src/libs/utils', async (importOriginal) => {
  const actual = await importOriginal<typeof import('src/libs/utils')>()
  return { ...actual, Notifications: { showError: vi.fn(), showSuccess: vi.fn() } }
})
vi.mock('src/libs/signInUtils', () => ({ handleSignIn: vi.fn() }))

const mockUser = { displayName: 'Display Name', email: 'email@test.com' }
// getCurrentUser never returns undefined — signed-out storage holds the
// default (empty) user, and the form prefill falls back to empty strings.
const signedOutUser = { displayName: '', email: '' }
const handler = vi.fn()

const mountModal = () =>
  render(
    <BrowserRouter>
      <SupportRequestModal onCloseRequest={handler} url="url" showModal={true} />
    </BrowserRouter>,
  )

const setupLoggedIn = () => {
  vi.mocked(useUserIsLogged).mockReturnValue(true)
  vi.mocked(Storage.getCurrentUser).mockReturnValue(mockUser as never)
}

const setupLoggedOut = () => {
  vi.mocked(useUserIsLogged).mockReturnValue(false)
  vi.mocked(Storage.getCurrentUser).mockReturnValue(signedOutUser as never)
}

const selectType = async (user: ReturnType<typeof userEvent.setup>, name: string) => {
  await user.click(document.querySelector('[data-cy="supportFormType"] .MuiSelect-select')!)
  await user.click(await screen.findByRole('option', { name }))
}

const attachFile = () => {
  const attachment = new File(['{}'], 'example.json', { type: 'application/json' })
  const input = document.querySelector('[data-cy="supportFormAttachment"]') as HTMLInputElement
  fireEvent.change(input, { target: { files: [attachment] } })
}

const expectSubmitSuccess = async () => {
  await waitFor(() => expect(vi.mocked(Support.createSupportRequest)).toHaveBeenCalled())
  await waitFor(() => expect(vi.mocked(Support.uploadAttachment)).toHaveBeenCalled())
}

describe('Support Request Modal Tests', () => {
  beforeEach(() => {
    vi.mocked(Support.createSupportRequest).mockResolvedValue(undefined)
    vi.mocked(Support.uploadAttachment).mockResolvedValue({ data: { token: 'token_string' } } as never)
    vi.mocked(Support.createTicket).mockReturnValue({} as never)
  })

  afterEach(() => {
    vi.restoreAllMocks()
    handler.mockReset()
  })

  it.each([
    { label: 'logged in', isLogged: true, currentUser: mockUser as never, showEmailName: false },
    { label: 'not logged in', isLogged: false, currentUser: signedOutUser as never, showEmailName: true },
    { label: 'logged in with undefined user values', isLogged: true, currentUser: { displayName: undefined, email: undefined } as never, showEmailName: false },
  ])('Renders form correctly when $label', ({ isLogged, currentUser, showEmailName }) => {
    vi.mocked(useUserIsLogged).mockReturnValue(isLogged)
    vi.mocked(Storage.getCurrentUser).mockReturnValue(currentUser)
    mountModal()
    expect(document.querySelector('[data-cy="closeButton"]')).toBeInTheDocument()
    expect(document.querySelector('[data-cy="supportRequestModal"]')).toBeInTheDocument()
    if (showEmailName) {
      expect(document.querySelector('[data-cy="supportFormEmail"]')).toBeInTheDocument()
      expect(document.querySelector('[data-cy="supportFormName"]')).toBeInTheDocument()
    }
    else {
      expect(document.querySelector('[data-cy="supportFormEmail"]')).not.toBeInTheDocument()
      expect(document.querySelector('[data-cy="supportFormName"]')).not.toBeInTheDocument()
    }
    expect(document.querySelector('[data-cy="supportFormType"]')).toBeInTheDocument()
    expect(document.querySelector('[data-cy="supportFormSubject"]')).toBeInTheDocument()
    expect(document.querySelector('[data-cy="supportFormDescription"]')).toBeInTheDocument()
    expect(document.querySelector('[data-cy="supportFormAttachment"]')).toBeInTheDocument()
    expect(document.querySelector('[data-cy="supportFormSubmit"]')).toBeDisabled()
    expect(document.querySelector('[data-cy="supportFormCancel"]')).not.toBeDisabled()
  })

  describe('When a user is logged in:', () => {
    beforeEach(setupLoggedIn)

    it('Submits properly', async () => {
      const user = userEvent.setup()
      mountModal()
      await selectType(user, 'Bug')
      expect(document.querySelector('[data-cy="supportFormSubmit"]')).toBeDisabled()
      await user.type(document.querySelector('[data-cy="supportFormSubject"] input')!, 'Subject')
      expect(document.querySelector('[data-cy="supportFormSubmit"]')).toBeDisabled()
      await user.type(document.querySelector('[data-cy="supportFormDescription"] textarea')!, 'Description')
      expect(document.querySelector('[data-cy="supportFormSubmit"]')).not.toBeDisabled()
      expect(document.querySelector('[data-cy="supportFormCancel"]')).not.toBeDisabled()
      attachFile()
      await user.click(document.querySelector('[data-cy="supportFormSubmit"]')!)
      await expectSubmitSuccess()
    })
  })

  describe('When a user is NOT logged in:', () => {
    beforeEach(setupLoggedOut)

    it('Submits properly', async () => {
      const user = userEvent.setup()
      mountModal()
      await user.type(document.querySelector('[data-cy="supportFormName"] input')!, 'Name')
      expect(document.querySelector('[data-cy="supportFormSubmit"]')).toBeDisabled()
      await selectType(user, 'Bug')
      expect(document.querySelector('[data-cy="supportFormSubmit"]')).toBeDisabled()
      await user.type(document.querySelector('[data-cy="supportFormSubject"] input')!, 'Subject')
      expect(document.querySelector('[data-cy="supportFormSubmit"]')).toBeDisabled()
      await user.type(document.querySelector('[data-cy="supportFormDescription"] textarea')!, 'Description')
      expect(document.querySelector('[data-cy="supportFormSubmit"]')).toBeDisabled()
      await user.type(document.querySelector('[data-cy="supportFormEmail"] input')!, mockUser.email)
      expect(document.querySelector('[data-cy="supportFormSubmit"]')).not.toBeDisabled()
      expect(document.querySelector('[data-cy="supportFormCancel"]')).not.toBeDisabled()
      attachFile()
      await user.click(document.querySelector('[data-cy="supportFormSubmit"]')!)
      await expectSubmitSuccess()
    })
  })

  describe('File Attachments', () => {
    beforeEach(setupLoggedOut)

    it('Single attachment displayed', async () => {
      mountModal()
      const attachment = new File(['{}'], 'example.json', { type: 'application/json' })
      const input = document.querySelector('[data-cy="supportFormAttachment"]') as HTMLInputElement
      fireEvent.change(input, { target: { files: [attachment] } })
      await waitFor(() =>
        expect(document.querySelector('[data-cy="supportFormAttachmentContainer"]')).toHaveTextContent('example.json'),
      )
    })

    it('Multiple attachments displayed', async () => {
      mountModal()
      const files = [
        new File(['{}'], 'example.json', { type: 'application/json' }),
        new File(['{}'], 'dataset-registration-schema_v1.json', { type: 'application/json' }),
      ]
      const input = document.querySelector('[data-cy="supportFormAttachment"]') as HTMLInputElement
      fireEvent.change(input, { target: { files } })
      await waitFor(() => {
        const container = document.querySelector('[data-cy="supportFormAttachmentContainer"]')!
        expect(container).toHaveTextContent('example.json')
        expect(container).toHaveTextContent('dataset-registration-schema_v1.json')
      })
    })
  })

  describe('When a user is logged in but current user values are undefined:', () => {
    beforeEach(() => {
      vi.mocked(useUserIsLogged).mockReturnValue(true)
      vi.mocked(Storage.getCurrentUser).mockReturnValue({
        displayName: undefined,
        email: undefined,
      } as never)
    })

    it('Submit button remains disabled due to empty name and email', async () => {
      const user = userEvent.setup()
      mountModal()
      await selectType(user, 'Bug')
      expect(document.querySelector('[data-cy="supportFormSubmit"]')).toBeDisabled()
      await user.type(document.querySelector('[data-cy="supportFormSubject"] input')!, 'Subject')
      expect(document.querySelector('[data-cy="supportFormSubmit"]')).toBeDisabled()
      await user.type(document.querySelector('[data-cy="supportFormDescription"] textarea')!, 'Description')
      expect(document.querySelector('[data-cy="supportFormSubmit"]')).toBeDisabled()
      expect(document.querySelector('[data-cy="supportFormCancel"]')).not.toBeDisabled()
    })
  })

  describe('"Using DUOS for my DAC" support type option', () => {
    beforeEach(setupLoggedIn)

    it('Renders "Using DUOS for my DAC" as an option in the type dropdown', async () => {
      const user = userEvent.setup()
      mountModal()
      await user.click(document.querySelector('[data-cy="supportFormType"] .MuiSelect-select')!)
      expect(await screen.findByRole('option', { name: 'Using DUOS for my DAC' })).toBeInTheDocument()
    })

    it('Allows selecting "Using DUOS for my DAC" from the type dropdown', async () => {
      const user = userEvent.setup()
      mountModal()
      await selectType(user, 'Using DUOS for my DAC')
      expect(document.querySelector('[data-cy="supportFormType"]')).toHaveTextContent('Using DUOS for my DAC')
    })

    it('Enables submit button when "Using DUOS for my DAC" is selected and required fields are filled', async () => {
      const user = userEvent.setup()
      mountModal()
      await selectType(user, 'Using DUOS for my DAC')
      expect(document.querySelector('[data-cy="supportFormSubmit"]')).toBeDisabled()
      await user.type(document.querySelector('[data-cy="supportFormSubject"] input')!, 'DAC Setup Question')
      expect(document.querySelector('[data-cy="supportFormSubmit"]')).toBeDisabled()
      await user.type(document.querySelector('[data-cy="supportFormDescription"] textarea')!, 'I need help setting up my DAC in DUOS.')
      expect(document.querySelector('[data-cy="supportFormSubmit"]')).not.toBeDisabled()
    })

    it('Submits with dac_usage type and correct payload', async () => {
      const { Support: ActualSupport } = await vi.importActual<typeof import('src/libs/ajax/Support')>('src/libs/ajax/Support')
      vi.mocked(Support.createTicket).mockImplementation(ActualSupport.createTicket)
      const user = userEvent.setup()
      mountModal()
      await selectType(user, 'Using DUOS for my DAC')
      await user.type(document.querySelector('[data-cy="supportFormSubject"] input')!, 'DAC Setup Question')
      await user.type(document.querySelector('[data-cy="supportFormDescription"] textarea')!, 'I need help setting up my DAC in DUOS.')
      await user.click(document.querySelector('[data-cy="supportFormSubmit"]')!)
      await waitFor(() => expect(vi.mocked(Support.createSupportRequest)).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'DAC_USAGE' }),
      ))
    })
  })

  describe('RedirectLink functionality', () => {
    it.each([
      { label: 'logged in', setup: setupLoggedIn },
      { label: 'not logged in', setup: setupLoggedOut },
    ])('Displays "DUOS Data Library" link text when $label', ({ setup }) => {
      setup()
      mountModal()
      expect(screen.getAllByText('DUOS Data Library')).toHaveLength(2)
    })

    it('Links to /datalibrary when logged in', () => {
      setupLoggedIn()
      mountModal()
      const links = Array.from(document.querySelectorAll('a')).filter(
        a => a.textContent?.includes('DUOS Data Library'),
      )
      expect(links).toHaveLength(2)
      expect(links[0]).toHaveAttribute('href', '/datalibrary')
      expect(links[1]).toHaveAttribute('href', '/datalibrary')
    })

    it('Closes modal when link is clicked (not logged in)', async () => {
      setupLoggedOut()
      mountModal()
      const link = Array.from(document.querySelectorAll('a')).find(
        a => a.textContent?.includes('DUOS Data Library'),
      )!
      await userEvent.click(link)
      expect(handler).toHaveBeenCalledWith('support')
    })
  })
})
