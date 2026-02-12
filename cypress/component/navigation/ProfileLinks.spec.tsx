import React from 'react'
import { ProfileLinks } from 'src/components/navigation/ProfileLinks'
import { BrowserRouter } from 'react-router-dom'
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
  const mountComponent = (propsOverride = {}) => {
    const onSubtabChange = cy.stub()
    const signOut = cy.stub()

    const props = {
      currentUser: mockUser,
      onSubtabChange,
      signOut,
      orientation: 'horizontal' as const,
      ...propsOverride,
    }

    cy.mount(
      <BrowserRouter>
        <ProfileLinks {...props} />
      </BrowserRouter>,
    )
    return { props, onSubtabChange, signOut }
  }

  it('renders user name and email', () => {
    mountComponent()
    cy.contains(mockUser.displayName).should('be.visible')
    cy.contains(mockUser.email).should('be.visible')
  })

  it('opens menu on click', () => {
    mountComponent()
    cy.contains(mockUser.displayName).click()
    cy.contains('Your Profile').should('be.visible')
    cy.contains('Sign out').should('be.visible')
  })

  it('calls onSubtabChange when clicking Profile', () => {
    const { onSubtabChange } = mountComponent()
    cy.contains(mockUser.displayName).click()
    cy.contains('Your Profile').click()
    cy.wrap(onSubtabChange).should('have.been.called')
  })

  it('calls signOut when clicking Sign out', () => {
    const { signOut } = mountComponent()
    cy.contains(mockUser.displayName).click()
    cy.contains('Sign out').click()
    cy.wrap(signOut).should('have.been.called')
  })

  it('renders correctly with vertical orientation', () => {
    mountComponent({ orientation: 'vertical' })
    cy.contains(mockUser.displayName).should('be.visible')
    cy.contains(mockUser.displayName).click()
    cy.contains('Your Profile').should('be.visible')
    cy.contains('Sign out').should('be.visible')
  })
})
