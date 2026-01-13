import React from 'react'
import { Institution } from 'src/libs/ajax/Institution'
import AffiliationAndRole from 'src/pages/user_profile/AffiliationAndRoles'
import { DuosUser } from 'src/types/model'

const user: DuosUser = {
  createDate: new Date(),
  displayName: 'Test User',
  email: 'email',
  emailPreference: false,
  userId: 1,
  institutionId: 1,
  isAdmin: false,
  isAlumni: false,
  isChairPerson: false,
  isDataSubmitter: false,
  isMember: false,
  isResearcher: true,
  isSigningOfficial: true,
  roles: [
    {
      roleId: 1,
      userId: 1,
      userRoleId: 1,
      name: 'Researcher',
    },
    {
      roleId: 2,
      userId: 1,
      userRoleId: 2,
      name: 'SigningOfficial',
    },
  ],
}

const institution = {
  id: 1,
  name: 'Test Institution',
  signingOfficials: [],
}

describe('Affiliation And Role', () => {
  beforeEach(() => {
    cy.viewport(600, 600)
    cy.initApplicationConfig()
  })

  it('Displays institution name when institution is present', () => {
    cy.stub(Institution, 'getById').returns(institution)
    cy.mount(<AffiliationAndRole user={user} />)
    cy.get('[ data-cy="institutional-affiliation"]').contains(institution.name)
  })

  it('Displays contact us text when no institution present', () => {
    cy.stub(Institution, 'getById').returns(institution)
    const { institutionId, ...userWithoutInstitution } = user
    cy.mount(<AffiliationAndRole user={userWithoutInstitution} />)
    cy.get('[ data-cy="institutional-affiliation"]').contains('Your institutional affiliation is automatically derived from your email domain.'
      + ' Please use your institutional email to be affiliated with your institution. If you are using your institutional email and have not been assigned an institution'
      + ' please use the Contact Us form and provide your email and institution.')
  })

  it('Displays all role names for user', () => {
    cy.stub(Institution, 'getById').returns(institution)
    cy.mount(<AffiliationAndRole user={user} />)
    user.roles.forEach((role) => {
      cy.get('[ data-cy="user-roles"]').contains(role.name)
    })
  })

  it('Displays error when error is thrown loading user information', () => {
    const error = new Error('Error: Unable to retrieve user information')
    cy.stub(Institution, 'getById').throws(error)
    cy.mount(<AffiliationAndRole user={user} />)
    cy.get('[ data-cy="notification-alert"]').contains(error.message)
  })

  it('Handles non-TS compliant user argument', () => {
    // cy.stub(Institution, 'getById').returns(institution);
    [{}, undefined, null].forEach((value) => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      cy.mount(<AffiliationAndRole user={value} />)
      cy.get('[ data-cy="notification-alert"]').should('not.exist')
    })
  })
})
