import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Notifications } from 'src/libs/utils'

vi.mock('src/libs/ajax/User', () => ({
  User: { getMe: vi.fn(), getById: vi.fn(), updateSelf: vi.fn() },
}))

import { User } from 'src/libs/ajax/User'
import ExternalProfile from 'src/pages/user_profile/ExternalProfile'

const mockData = {
  id: 1,
  firstName: 'Test',
  lastName: 'User',
  email: 'test@example.com',
  userData: {
    externalProfiles: {
      ORCID: '12345',
      linkedIn: 'abcdef',
      otherUrls: ['https://www.aol.com'],
      throughBio: 'abc',
      institutionalWebsite: 'https://www.broadinstitute.org',
    },
  },
}

const editProps = { readonly: false as const }
const readOnlyProps = { userId: 1, readonly: true as const }

beforeEach(() => {
  vi.mocked(User.getMe).mockResolvedValue(mockData as never)
  vi.mocked(User.getById).mockResolvedValue(mockData as never)
  vi.mocked(User.updateSelf).mockResolvedValue(mockData as never)
})

afterEach(() => vi.clearAllMocks())

describe('ExternalProfile', () => {
  it('renders current values first and editable fields second', async () => {
    render(<ExternalProfile {...editProps} />)
    await waitFor(() => expect(screen.getByLabelText('LinkedIn')).toHaveValue('abcdef'))
    const linkedInRow = screen.getByLabelText('LinkedIn').closest('tr')
    expect(linkedInRow?.querySelectorAll('td')).toHaveLength(2)
    expect(linkedInRow).toHaveTextContent('https://www.linkedin.com/in/abcdef')
  })

  it('renders read-only table with two columns', async () => {
    render(<ExternalProfile {...readOnlyProps} />)
    await waitFor(() => expect(screen.getAllByRole('link')).toHaveLength(5))
    expect(document.querySelector('.btn-secondary')).not.toBeInTheDocument()
    expect(document.querySelector('.btn-primary')).not.toBeInTheDocument()
    expect(document.querySelector('input')).not.toBeInTheDocument()
  })

  it('allows updates in edit mode', async () => {
    render(<ExternalProfile {...editProps} />)
    await waitFor(() => expect(screen.getByLabelText('LinkedIn')).toHaveValue('abcdef'))
    expect(screen.getByLabelText('LinkedIn')).not.toBeDisabled()
  })

  it('renders labels instead of base URL links for empty identifier fields', async () => {
    vi.mocked(User.getMe).mockResolvedValue({
      ...mockData,
      userData: {
        externalProfiles: {
          linkedIn: '',
          ORCID: '',
          throughBio: '',
          institutionalWebsite: '',
          otherUrls: [],
        },
      },
    } as never)

    render(<ExternalProfile {...editProps} />)

    await waitFor(() => expect(screen.getByLabelText('LinkedIn')).toHaveValue(''))
    expect(screen.getByText('LinkedIn')).toBeInTheDocument()
    expect(screen.getByText('ORCID')).toBeInTheDocument()
    expect(screen.getByText('Through.bio')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'https://www.linkedin.com/in/' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'https://orcid.org/' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'https://through.bio/' })).not.toBeInTheDocument()
  })

  it('normalizes leading slashes in profile identifiers', async () => {
    vi.mocked(User.getMe).mockResolvedValue({
      ...mockData,
      userData: {
        externalProfiles: {
          linkedIn: '/linkedin-user',
          ORCID: '/0000-0000-0000-0001',
          throughBio: '/through-bio-user',
          otherUrls: [],
        },
      },
    } as never)

    render(<ExternalProfile {...editProps} />)

    expect(await screen.findByRole('link', { name: 'https://www.linkedin.com/in/linkedin-user' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'https://orcid.org/0000-0000-0000-0001' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'https://through.bio/through-bio-user' })).toBeInTheDocument()
  })

  it('normalizes whitespace around complete profile URLs', async () => {
    vi.mocked(User.getMe).mockResolvedValue({
      ...mockData,
      userData: {
        externalProfiles: {
          linkedIn: '  https://www.linkedin.com/in/linkedin-user  ',
          ORCID: '  https://orcid.org/0000-0000-0000-0001  ',
          throughBio: '  https://through.bio/through-bio-user  ',
          otherUrls: [],
        },
      },
    } as never)

    render(<ExternalProfile {...editProps} />)

    expect(await screen.findByRole('link', { name: 'https://www.linkedin.com/in/linkedin-user' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'https://orcid.org/0000-0000-0000-0001' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'https://through.bio/through-bio-user' })).toBeInTheDocument()
  })

  it('treats whitespace-only identifiers as empty and trims them when saving', async () => {
    const user = userEvent.setup()
    vi.mocked(User.getMe).mockResolvedValue({
      ...mockData,
      userData: {
        externalProfiles: {
          linkedIn: ' ',
          ORCID: '  ',
          throughBio: '\t',
          institutionalWebsite: ' ',
          otherUrls: ['  https://example.com/profile  '],
        },
      },
    } as never)

    render(<ExternalProfile {...editProps} />)

    await waitFor(() => expect(screen.getByLabelText('LinkedIn')).toHaveValue(' '))
    expect(screen.queryByRole('link', { name: 'https://www.linkedin.com/in/' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'https://orcid.org/' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'https://through.bio/' })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() => {
      expect(User.updateSelf).toHaveBeenCalledWith({
        userData: {
          externalProfiles: {
            linkedIn: '',
            ORCID: '',
            throughBio: '',
            institutionalWebsite: '',
            otherUrls: ['https://example.com/profile'],
          },
        },
      })
    })
  })

  it('performs URL validation for LinkedIn', async () => {
    const user = userEvent.setup()
    render(<ExternalProfile {...editProps} />)
    await waitFor(() => expect(screen.getByLabelText('LinkedIn')).toHaveValue('abcdef'))
    await user.clear(screen.getByLabelText('LinkedIn'))
    await user.type(screen.getByLabelText('LinkedIn'), 'testing')
    await waitFor(() =>
      expect(screen.getByRole('link', { name: 'https://www.linkedin.com/in/testing' })).toHaveAttribute('href', 'https://www.linkedin.com/in/testing'),
    )
  })

  it('performs URL validation for ORCID', async () => {
    const user = userEvent.setup()
    render(<ExternalProfile {...editProps} />)
    await waitFor(() => expect(screen.getByLabelText('ORCID')).toHaveValue('12345'))
    await user.clear(screen.getByLabelText('ORCID'))
    await user.type(screen.getByLabelText('ORCID'), 'testing')
    await waitFor(() =>
      expect(screen.getByRole('link', { name: 'https://orcid.org/testing' })).toHaveAttribute('href', 'https://orcid.org/testing'),
    )
  })

  it('performs URL validation for Through.bio', async () => {
    const user = userEvent.setup()
    render(<ExternalProfile {...editProps} />)
    await waitFor(() => expect(screen.getByLabelText('Through.bio')).toHaveValue('abc'))
    await user.clear(screen.getByLabelText('Through.bio'))
    await user.type(screen.getByLabelText('Through.bio'), 'testing')
    await waitFor(() =>
      expect(screen.getByRole('link', { name: 'https://through.bio/testing' })).toHaveAttribute('href', 'https://through.bio/testing'),
    )
  })

  it('performs URL validation for Institutional Website', async () => {
    const user = userEvent.setup()
    render(<ExternalProfile {...editProps} />)
    await waitFor(() => expect(screen.getByLabelText('Institutional Website')).toHaveValue('https://www.broadinstitute.org'))
    await user.clear(screen.getByLabelText('Institutional Website'))
    await user.type(screen.getByLabelText('Institutional Website'), 'https://www.institution.edu/~username')
    await waitFor(() =>
      expect(screen.getByRole('link', { name: 'https://www.institution.edu/~username' })).toHaveAttribute('href', 'https://www.institution.edu/~username'),
    )
  })

  it('performs URL validation for Other URLs', async () => {
    const user = userEvent.setup()
    render(<ExternalProfile {...editProps} />)
    await waitFor(() => expect(screen.getByLabelText('LinkedIn')).toHaveValue('abcdef'))
    await user.click(screen.getByRole('button', { name: '+ Add URL' }))
    const otherUrlInput = document.querySelector('input[name="Other URL 1"]') as HTMLInputElement
    await user.clear(otherUrlInput)
    await user.type(otherUrlInput, 'https://www.test.com')
    await waitFor(() =>
      expect(screen.getByRole('link', { name: 'https://www.test.com' })).toHaveAttribute('href', 'https://www.test.com'),
    )
  })

  it('labels a newly added Other URL row before a value is entered', async () => {
    const user = userEvent.setup()
    render(<ExternalProfile {...editProps} />)
    await waitFor(() => expect(screen.getByLabelText('LinkedIn')).toHaveValue('abcdef'))

    await user.click(screen.getByRole('button', { name: '+ Add URL' }))

    const newOtherUrlInput = screen.getByLabelText('Other URL 2')
    expect(newOtherUrlInput.closest('tr')).toHaveTextContent('Other URL 2')
  })

  it('disables save button when there are invalid URLs', async () => {
    const user = userEvent.setup()
    render(<ExternalProfile {...editProps} />)
    await waitFor(() => expect(screen.getByLabelText('LinkedIn')).toHaveValue('abcdef'))
    await user.click(screen.getByRole('button', { name: '+ Add URL' }))
    const otherUrlInput = document.querySelector('input[name="Other URL 1"]') as HTMLInputElement
    await user.clear(otherUrlInput)
    await user.type(otherUrlInput, 'not a url')
    await waitFor(() => expect(document.querySelector('.btn-primary')).toBeDisabled())
  })

  it('clears stale URL validation when profiles are reinitialized', async () => {
    const user = userEvent.setup()
    const { rerender } = render(<ExternalProfile {...editProps} userId={1} />)
    await waitFor(() => expect(screen.getByLabelText('LinkedIn')).toHaveValue('abcdef'))
    await user.click(screen.getByRole('button', { name: '+ Add URL' }))
    const newOtherUrlInput = screen.getByLabelText('Other URL 2')
    await user.type(newOtherUrlInput, 'not a url')
    await waitFor(() => expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled())

    rerender(<ExternalProfile {...editProps} userId={2} />)

    await waitFor(() => expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled())
  })

  it('shows error notification when update fails', async () => {
    vi.mocked(User.updateSelf).mockRejectedValue(new Error('500'))
    const showErrorSpy = vi.spyOn(Notifications, 'showError').mockImplementation(() => {})
    const user = userEvent.setup()
    render(<ExternalProfile {...editProps} />)
    await waitFor(() => expect(document.querySelector('.btn-primary')).not.toBeDisabled())
    await user.click(document.querySelector('.btn-primary')!)
    await waitFor(() => expect(showErrorSpy).toHaveBeenCalled())
  })

  it('removes an Other URL from the saved payload', async () => {
    const user = userEvent.setup()
    render(<ExternalProfile {...editProps} />)
    await waitFor(() => expect(screen.getByLabelText('Other URL 1')).toHaveValue('https://www.aol.com'))

    await user.click(screen.getByRole('button', { name: 'Remove Other URL 1' }))
    await user.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() => {
      expect(User.updateSelf).toHaveBeenCalledWith({
        userData: {
          externalProfiles: expect.objectContaining({ otherUrls: [] }),
        },
      })
    })
  })
})
