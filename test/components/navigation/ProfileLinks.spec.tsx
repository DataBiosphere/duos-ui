import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router'
import { ProfileLinks } from 'src/components/navigation/ProfileLinks'
import { DuosUser } from 'src/types/model'

const mockUser: DuosUser = {
  createDate: new Date(),
  displayName: 'Test User',
  email: 'test@example.com',
  emailPreference: false,
  isAdmin: false,
  isAlumni: false,
  isChairPerson: false,
  isDataSubmitter: false,
  isMember: false,
  isResearcher: false,
  isSigningOfficial: false,
  roles: [],
  userId: 1,
}

describe('ProfileLinks', () => {
  const renderComponent = (propsOverride: Record<string, unknown> = {}) => {
    const onSubtabChange = vi.fn()
    const signOut = vi.fn()
    render(
      <BrowserRouter>
        <ProfileLinks
          currentUser={mockUser}
          onSubtabChange={onSubtabChange}
          signOut={signOut}
          orientation="horizontal"
          {...propsOverride}
        />
      </BrowserRouter>,
    )
    return { onSubtabChange, signOut }
  }

  it('renders user name and email', () => {
    renderComponent()
    expect(screen.getByText(mockUser.displayName)).toBeInTheDocument()
    expect(screen.getByText(mockUser.email)).toBeInTheDocument()
  })

  it('opens menu on click', async () => {
    const user = userEvent.setup()
    renderComponent()
    await user.click(screen.getByText(mockUser.displayName))
    expect(screen.getByText('Your Profile')).toBeVisible()
    expect(screen.getByText('Sign out')).toBeVisible()
  })

  it('calls onSubtabChange when clicking Your Profile', async () => {
    const user = userEvent.setup()
    const { onSubtabChange } = renderComponent()
    await user.click(screen.getByText(mockUser.displayName))
    await user.click(screen.getByText('Your Profile'))
    expect(onSubtabChange).toHaveBeenCalled()
  })

  it('calls signOut when clicking Sign out', async () => {
    const user = userEvent.setup()
    const { signOut } = renderComponent()
    await user.click(screen.getByText(mockUser.displayName))
    await user.click(screen.getByText('Sign out'))
    expect(signOut).toHaveBeenCalled()
  })

  it('renders correctly with vertical orientation', async () => {
    const user = userEvent.setup()
    renderComponent({ orientation: 'vertical' })
    expect(screen.getByText(mockUser.displayName)).toBeInTheDocument()
    await user.click(screen.getByText(mockUser.displayName))
    expect(screen.getByText('Your Profile')).toBeVisible()
    expect(screen.getByText('Sign out')).toBeVisible()
  })
})
