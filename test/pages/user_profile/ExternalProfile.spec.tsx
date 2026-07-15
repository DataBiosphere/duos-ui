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
  it('renders update table with three columns', async () => {
    render(<ExternalProfile {...editProps} />)
    await waitFor(() => expect(screen.getByLabelText('LinkedIn')).toHaveValue('abcdef'))
    const headers = document.querySelectorAll('table thead tr th')
    expect(headers).toHaveLength(3)
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

  it('performs URL validation for ORCID iD', async () => {
    const user = userEvent.setup()
    render(<ExternalProfile {...editProps} />)
    await waitFor(() => expect(screen.getByLabelText('ORCID iD')).toHaveValue('12345'))
    await user.clear(screen.getByLabelText('ORCID iD'))
    await user.type(screen.getByLabelText('ORCID iD'), 'testing')
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
    await user.click(document.querySelector('.btn-secondary')!)
    const otherUrlInput = document.querySelector('input[name="Other URL 1"]') as HTMLInputElement
    await user.clear(otherUrlInput)
    await user.type(otherUrlInput, 'https://www.test.com')
    await waitFor(() =>
      expect(screen.getByRole('link', { name: 'https://www.test.com' })).toHaveAttribute('href', 'https://www.test.com'),
    )
  })

  it('disables save button when there are invalid URLs', async () => {
    const user = userEvent.setup()
    render(<ExternalProfile {...editProps} />)
    await waitFor(() => expect(screen.getByLabelText('LinkedIn')).toHaveValue('abcdef'))
    await user.click(document.querySelector('.btn-secondary')!)
    const otherUrlInput = document.querySelector('input[name="Other URL 1"]') as HTMLInputElement
    await user.clear(otherUrlInput)
    await user.type(otherUrlInput, 'not a url')
    await waitFor(() => expect(document.querySelector('.btn-primary')).toBeDisabled())
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
})
