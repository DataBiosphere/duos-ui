import React from 'react'
import { mount } from 'cypress/react'
import AdminManageInstitutions from 'src/pages/AdminManageInstitutions'
import { BrowserRouter } from 'react-router-dom'
import { Institution as InstitutionAPI } from 'src/libs/ajax/Institution'
import { DuosUser, Institution } from 'src/types/model'

const createUser: DuosUser = {
  createDate: new Date(),
  displayName: 'Create User',
  email: 'create@test.com',
  emailPreference: true,
  eraCommonsId: 'admin-user',
  isAdmin: true,
  isAlumni: false,
  isChairPerson: false,
  isDataSubmitter: false,
  isMember: false,
  isResearcher: true,
  isSigningOfficial: false,
  roles: [{
    roleId: 4,
    name: 'Admin',
    userId: 1,
    userRoleId: 1,
  }],
  userId: 1,
}

const updateUser: DuosUser = {
  createDate: new Date(),
  displayName: 'Update User',
  email: 'update@test.com',
  emailPreference: true,
  eraCommonsId: 'update-user',
  isAdmin: true,
  isAlumni: false,
  isChairPerson: false,
  isDataSubmitter: false,
  isMember: false,
  isResearcher: true,
  isSigningOfficial: false,
  roles: [{
    roleId: 4,
    name: 'Admin',
    userId: 2,
    userRoleId: 2,
  }],
  userId: 2,
}

const mockInstitutions = [
  {
    id: 1,
    name: 'Test Institution 1',
    domains: ['test1.edu'],
    signingOfficials: [{ userId: '1', displayName: 'User 1', email: 'email1' }],
    createDate: 'Feb 1, 2023',
    createUser: createUser,
    createUserId: createUser.userId,
  } as unknown as Institution,
  {
    id: 2,
    name: 'Test Institution 2',
    domains: ['test2.edu'],
    signingOfficials: [{ userId: '2', displayName: 'User 2', email: 'email2' }],
    createDate: 'Jul 1, 2025',
    createUser: createUser,
    createUserId: createUser.userId,
    updateDate: 'Jul 2, 2025',
    updateUser: updateUser,
    updateUserId: updateUser.userId,
  } as unknown as Institution,
]

describe('AdminManageInstitutions', () => {
  beforeEach(() => {
    cy.viewport(1400, 600)
    cy.initApplicationConfig()
  })

  it('renders', () => {
    cy.stub(InstitutionAPI, 'list').returns(Promise.resolve(mockInstitutions))
    mount(<BrowserRouter><AdminManageInstitutions /></BrowserRouter>)
    cy.get('[data-cy="admin-manage-institutions"]').should('exist')
    cy.get('[data-cy="search-bar"]').should('exist')
  })

  it('displays all institutions in list', () => {
    cy.stub(InstitutionAPI, 'list').returns(Promise.resolve(mockInstitutions))
    mount(<BrowserRouter><AdminManageInstitutions /></BrowserRouter>)
    mockInstitutions.forEach((institution) => {
      cy.contains(institution.name).should('exist')
      cy.contains(institution.id).should('exist')
      if (institution.updateDate) {
        cy.contains(institution.updateDate).should('exist')
      }
      else {
        cy.contains(institution.createDate).should('exist')
      }
      if (institution.updateUser) {
        cy.contains(institution.updateUser.displayName).should('exist')
      }
      else {
        cy.contains(institution.createUser.displayName).should('exist')
      }
      if (institution.domains) {
        institution.domains.forEach((domain) => {
          cy.contains(domain).should('exist')
        })
      }
    })
  })

  it('filters institutions on search', () => {
    cy.stub(InstitutionAPI, 'list').returns(Promise.resolve(mockInstitutions))
    mount(<BrowserRouter><AdminManageInstitutions /></BrowserRouter>)
    const institution1 = mockInstitutions[0]
    const institution2 = mockInstitutions[1]
    cy.get('[data-cy="search-bar"]').clear()
    cy.get('[data-cy="search-bar"]').click()
    cy.get('[data-cy="search-bar"]').type(institution1.name)
    cy.get('[data-cy="search-bar"]').blur()
    cy.get('[data-cy="admin-manage-institutions"]').should('not.contain', institution2.name)
    cy.get('[data-cy="search-bar"]').clear()
    cy.get('[data-cy="search-bar"]').click()
    cy.get('[data-cy="search-bar"]').type(institution2.name)
    cy.get('[data-cy="search-bar"]').blur()
    cy.get('[data-cy="admin-manage-institutions"]').should('not.contain', institution1.name)
    cy.get('[data-cy="search-bar"]').clear()
    cy.get('[data-cy="search-bar"]').click()
    cy.get('[data-cy="search-bar"]').type(' ')
    cy.get('[data-cy="search-bar"]').blur()
    cy.get('[data-cy="admin-manage-institutions"]').should('contain', institution1.name)
    cy.get('[data-cy="admin-manage-institutions"]').should('contain', institution2.name)
  })

  it('link Add Institution page', () => {
    cy.stub(InstitutionAPI, 'list').returns(Promise.resolve(mockInstitutions))
    mount(<BrowserRouter><AdminManageInstitutions /></BrowserRouter>)
    cy.get('[data-cy="admin-manage-institutions"]').should('contain', 'Add Institution')
    cy.get('[id="btn_addInstitution"]').should('exist')
  })

  it('handles loading state', () => {
    cy.intercept('GET', '/api/institutions', (req) => {
      req.reply({
        delay: 1000, // Simulate a delay to show loading state
        body: mockInstitutions,
      })
    })
    mount(<BrowserRouter><AdminManageInstitutions /></BrowserRouter>)
    cy.get('[data-cy="table-skeleton-loader"]').should('exist')
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(1500) // Wait for the loading state to finish
    cy.get('[data-cy="table-skeleton-loader"]').should('not.exist')
  })
})
