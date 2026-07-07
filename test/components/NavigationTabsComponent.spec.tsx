import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import { NavigationTabsComponent } from 'src/components/NavigationTabsComponent'
import { DuosUser } from 'src/types/model'

vi.mock('src/components/SignInButton.js', () => ({
  default: () => <button>Sign In</button>,
}))

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

const mockTabs = [
  {
    label: 'Tab 1',
    link: '/tab1',
    isRendered: () => true,
    children: [
      { label: 'SubTab 1', link: '/tab1/sub1', isRendered: () => true },
      { label: 'SubTab 2', link: '/tab1/sub2', isRendered: () => true },
    ],
  },
  {
    label: 'Tab 2',
    link: '/tab2',
    isRendered: () => true,
  },
]

const renderComponent = (propsOverride: Record<string, unknown> = {}) => {
  const onSubtabChange = vi.fn()
  const { container } = render(
    <BrowserRouter>
      <NavigationTabsComponent
        orientation="horizontal"
        makeNotifications={() => null}
        navbarDuosIcon={{}}
        duosLogoImage={{}}
        DuosLogo="logo.png"
        navbarDuosText={{}}
        currentUser={mockUser}
        signOut={vi.fn()}
        isLogged={true}
        contactUsButton={<button>Contact</button>}
        showRequestModal={vi.fn()}
        supportrequestModal={<div>Support Modal</div>}
        tabs={mockTabs}
        initialTab={0}
        initialSubTab={0}
        onSubtabChange={onSubtabChange}
        {...propsOverride}
      />
    </BrowserRouter>,
  )
  return { container, onSubtabChange }
}

describe('NavigationTabsComponent', () => {
  it('renders component when logged in', () => {
    renderComponent()
    expect(screen.getByText(mockUser.displayName)).toBeInTheDocument()
  })

  it('displays logo when horizontal orientation and logged in', () => {
    renderComponent()
    expect(screen.getByAltText('DUOS Logo')).toBeInTheDocument()
  })

  it('renders main tabs when logged in', () => {
    renderComponent()
    expect(screen.getByRole('tab', { name: 'Tab 1' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Tab 2' })).toBeInTheDocument()
  })

  it('renders subtabs for selected main tab', () => {
    renderComponent()
    expect(screen.getByRole('tab', { name: 'SubTab 1' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'SubTab 2' })).toBeInTheDocument()
  })

  it('displays sign-in button when not logged in and horizontal', () => {
    renderComponent({ isLogged: false })
    expect(screen.getByText('Sign In')).toBeInTheDocument()
  })

  it('displays public navigation links when not logged in', () => {
    renderComponent({ isLogged: false })
    expect(screen.getByText('About')).toBeInTheDocument()
    expect(screen.getByText('FAQs')).toBeInTheDocument()
    expect(screen.getByText('Blog')).toBeInTheDocument()
  })

  it('hides main tabs when not logged in', () => {
    const { container } = renderComponent({ isLogged: false })
    expect(container.querySelector('.duos-navigation-box:not(.navbar-sub)')).not.toBeInTheDocument()
  })

  it('handles vertical orientation', () => {
    const { container } = renderComponent({ orientation: 'vertical' })
    expect(container.querySelector('.navbar-vertical')).toBeInTheDocument()
  })

  it('renders sign-in button in vertical menu when not logged in', () => {
    renderComponent({ isLogged: false, orientation: 'vertical' })
    expect(screen.getByText('Sign In')).toBeInTheDocument()
  })

  it('does not render sign-in button in right-side wrapper when vertical', () => {
    renderComponent({ isLogged: false, orientation: 'vertical' })
    expect(screen.getByText('Sign In').closest('.navbar-public')).toBeInTheDocument()
  })

  it('calls onSubtabChange when subtab is clicked', async () => {
    const user = userEvent.setup()
    const { onSubtabChange } = renderComponent({ initialTab: 0, initialSubTab: 0 })
    await user.click(screen.getByRole('tab', { name: 'SubTab 2' }))
    expect(onSubtabChange).toHaveBeenCalled()
  })

  it('renders filtered subtabs based on isRendered function', () => {
    const filteredTabs = [
      {
        label: 'Tab 1',
        link: '/tab1',
        isRendered: () => true,
        children: [
          { label: 'Visible SubTab', link: '/tab1/sub1', isRendered: () => true },
          { label: 'Hidden SubTab', link: '/tab1/sub2', isRendered: () => false },
        ],
      },
    ]
    renderComponent({ tabs: filteredTabs, initialTab: 0, initialSubTab: 0 })
    expect(screen.getByRole('tab', { name: 'Visible SubTab' })).toBeInTheDocument()
    expect(screen.queryByRole('tab', { name: 'Hidden SubTab' })).not.toBeInTheDocument()
  })
})
