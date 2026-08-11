import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router'
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
  const { container, unmount } = render(
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
  return { container, unmount, onSubtabChange }
}

describe('NavigationTabsComponent', () => {
  it('renders component when logged in', () => {
    renderComponent()
    expect(screen.getByText(mockUser.displayName)).toBeVisible()
  })

  it('displays logo when horizontal orientation and logged in', () => {
    renderComponent()
    expect(screen.getByAltText('DUOS Logo')).toBeVisible()
  })

  it('renders main tabs when logged in', () => {
    renderComponent()
    expect(screen.getByRole('tab', { name: 'Tab 1' })).toBeVisible()
    expect(screen.getByRole('tab', { name: 'Tab 2' })).toBeVisible()
  })

  it('renders subtabs for selected main tab', () => {
    renderComponent()
    expect(screen.getByRole('tab', { name: 'SubTab 1' })).toBeVisible()
    expect(screen.getByRole('tab', { name: 'SubTab 2' })).toBeVisible()
  })

  it('hides the subtab bar only when the selected subtab requests it', () => {
    const dashboardTabs = [{
      ...mockTabs[0],
      children: [
        { label: 'Dashboard', link: '/tab1/dashboard', hideSubTabBar: true },
        { label: 'Section', link: '/tab1/section' },
      ],
    }]

    const { container } = renderComponent({
      tabs: dashboardTabs,
      initialTab: 0,
      initialSubTab: 0,
    })

    expect(container.querySelector('.navbar-sub')).not.toBeInTheDocument()
  })

  it('resolves hideSubTabBar against the rendered subtabs, not the raw children', () => {
    // selectedSubTab is an index into the *visible* subtabs, so with the first child hidden,
    // index 0 is 'Section' - which does not hide the bar - and index 1 is 'Dashboard', which does.
    const tabsWithHiddenChild = [{
      ...mockTabs[0],
      children: [
        { label: 'Hidden', link: '/tab1/hidden', isRenderedForUser: () => false },
        { label: 'Section', link: '/tab1/section' },
        { label: 'Dashboard', link: '/tab1/dashboard', hideSubTabBar: true },
      ],
    }]

    const visible = renderComponent({ tabs: tabsWithHiddenChild, initialTab: 0, initialSubTab: 0 })
    expect(visible.container.querySelector('.navbar-sub')).toBeInTheDocument()
    expect(screen.queryByRole('tab', { name: 'Hidden' })).not.toBeInTheDocument()
    visible.unmount()

    const hidden = renderComponent({ tabs: tabsWithHiddenChild, initialTab: 0, initialSubTab: 1 })
    expect(hidden.container.querySelector('.navbar-sub')).not.toBeInTheDocument()
  })

  it('displays sign-in button when not logged in and horizontal', () => {
    renderComponent({ isLogged: false })
    expect(screen.getByText('Sign In')).toBeVisible()
  })

  it('displays public navigation links when not logged in', () => {
    renderComponent({ isLogged: false })
    expect(screen.getByText('About')).toBeVisible()
    expect(screen.getByText('FAQs')).toBeVisible()
    expect(screen.getByText('Blog')).toBeVisible()
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
    expect(screen.getByText('Sign In')).toBeVisible()
  })

  it('does not render sign-in button in right-side wrapper when vertical', () => {
    const { container } = renderComponent({ isLogged: false, orientation: 'vertical' })
    // The horizontal-only right-side wrapper (minWidth: 185px) must not exist
    expect(container.querySelector('[style*="min-width"]')).not.toBeInTheDocument()
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
    expect(screen.getByRole('tab', { name: 'Visible SubTab' })).toBeVisible()
    expect(screen.queryByRole('tab', { name: 'Hidden SubTab' })).not.toBeInTheDocument()
  })
})
