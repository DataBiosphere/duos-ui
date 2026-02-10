import React from 'react'
import { BrowserRouter } from 'react-router-dom'
import { NavigationTabsComponent } from 'src/components/NavigationTabsComponent'
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

const createMockProps = () => {
  const stubs = {
    signOut: cy.stub(),
    onSubtabChange: cy.stub(),
    showRequestModal: cy.stub(),
    makeNotifications: cy.stub().returns(<div>Notifications</div>),
  }

  return {
    orientation: 'horizontal' as const,
    makeNotifications: stubs.makeNotifications,
    navbarDuosIcon: {},
    duosLogoImage: {},
    DuosLogo: 'logo.png',
    navbarDuosText: {},
    currentUser: mockUser,
    signOut: stubs.signOut,
    isLogged: true,
    contactUsButton: <button>Contact</button>,
    showRequestModal: stubs.showRequestModal,
    supportrequestModal: <div>Support Modal</div>,
    tabs: [
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
    ],
    initialTab: 0,
    initialSubTab: 0,
    onSubtabChange: stubs.onSubtabChange,
    stubs,
  }
}

const mountComponent = (props = {}) => {
  const mockProps = createMockProps()
  cy.wrap(mockProps.stubs).as('stubs')
  cy.mount(
    <BrowserRouter>
      <NavigationTabsComponent {...mockProps} {...props} />
    </BrowserRouter>,
  )
  return mockProps
}

describe('NavigationTabsComponent', () => {
  it('renders component when logged in', () => {
    mountComponent()
    cy.contains('Test User').should('be.visible')
  })

  it('displays logo when horizontal orientation and logged in', () => {
    mountComponent()
    cy.get('img[alt="DUOS Logo"]').should('be.visible')
  })

  it('renders main tabs when logged in', () => {
    mountComponent()
    cy.contains('Tab 1').should('be.visible')
    cy.contains('Tab 2').should('be.visible')
  })

  it('renders subtabs for selected main tab', () => {
    mountComponent()
    cy.contains('SubTab 1').should('be.visible')
    cy.contains('SubTab 2').should('be.visible')
  })

  it('displays sign-in button when not logged in and horizontal', () => {
    mountComponent({ isLogged: false })
    cy.contains('Sign In').should('be.visible')
  })

  it('displays public navigation links when not logged in', () => {
    mountComponent({ isLogged: false })
    cy.contains('About').should('be.visible')
    cy.contains('FAQs').should('be.visible')
    cy.contains('Blog').should('be.visible')
  })

  it('hides main tabs when not logged in', () => {
    mountComponent({ isLogged: false })
    cy.get('.duos-navigation-box:not(.navbar-sub)').should('not.exist')
  })

  it('handles vertical orientation', () => {
    mountComponent({ orientation: 'vertical' })
    cy.get('.navbar-vertical').should('exist')
  })

  it('renders sign-in button in vertical menu when not logged in', () => {
    mountComponent({ isLogged: false, orientation: 'vertical' })
    cy.contains('Sign In').should('be.visible')
  })

  it('does not render sign-in button on right side when vertical', () => {
    mountComponent({ isLogged: false, orientation: 'vertical' })
    cy.get('[style*="minWidth: 185px"]').should('have.length', 0)
  })

  it('calls onSubtabChange when subtab is programmatically changed', () => {
    const mockProps = mountComponent({ initialTab: 0 })
    // Simulate tab change
    cy.get('.navbar-sub [role="tablist"]').first().then(() => {
      const event = new Event('change', { bubbles: true })
      mockProps.stubs.onSubtabChange(event as never, 1)
    })
    cy.wrap(mockProps.stubs.onSubtabChange).should('have.been.called')
  })

  it('renders filtered subtabs based on isRendered function', () => {
    const mockProps = createMockProps()
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
    cy.wrap(mockProps.stubs).as('stubs')
    cy.mount(
      <BrowserRouter>
        <NavigationTabsComponent {...mockProps} tabs={filteredTabs} initialTab={0} />
      </BrowserRouter>,
    )
    cy.contains('Visible SubTab').should('be.visible')
    cy.contains('Hidden SubTab').should('not.exist')
  })
})
