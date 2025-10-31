import React from 'react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { mount } from 'cypress/react'
import RoleBAC from 'src/routing/RoleBAC'
import { Storage } from 'src/libs/storage'
import { USER_ROLES } from 'src/libs/utils'

const TestProtectedComponent = () => <div data-cy="protected-content">Protected Content</div>
const HomeComponent = () => <div data-cy="home-content">Home Page</div>

const researcherUser = {
  roles: [{ name: USER_ROLES.researcher }],
}

const adminUser = {
  roles: [{ name: USER_ROLES.admin }],
}

const noRolesUser = {
  roles: [],
}

describe('RoleBAC', () => {
  it('should render the protected component if the user has the required role', () => {
    cy.stub(Storage, 'getCurrentUser').returns(researcherUser)

    mount(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route path="/protected" element={<RoleBAC rolesAllowed={[USER_ROLES.researcher]} />}>
            <Route index element={<TestProtectedComponent />} />
          </Route>
          <Route path="/" element={<HomeComponent />} />
        </Routes>
      </MemoryRouter>,
    )

    cy.get('[data-cy="protected-content"]').should('be.visible')
    cy.get('[data-cy="home-content"]').should('not.exist')
  })

  it('should redirect to the home page if the user does not have the required role', () => {
    cy.stub(Storage, 'getCurrentUser').returns(adminUser)

    mount(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route path="/protected" element={<RoleBAC rolesAllowed={[USER_ROLES.researcher]} />}>
            <Route index element={<TestProtectedComponent />} />
          </Route>
          <Route path="/" element={<HomeComponent />} />
        </Routes>
      </MemoryRouter>,
    )

    cy.get('[data-cy="home-content"]').should('be.visible')
    cy.get('[data-cy="protected-content"]').should('not.exist')
  })

  it('should redirect to the home page if the user has no roles', () => {
    cy.stub(Storage, 'getCurrentUser').returns(noRolesUser)

    mount(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route path="/protected" element={<RoleBAC rolesAllowed={[USER_ROLES.researcher]} />}>
            <Route index element={<TestProtectedComponent />} />
          </Route>
          <Route path="/" element={<HomeComponent />} />
        </Routes>
      </MemoryRouter>,
    )

    cy.get('[data-cy="home-content"]').should('be.visible')
    cy.get('[data-cy="protected-content"]').should('not.exist')
  })

  it('should render the protected component if "all" roles are allowed', () => {
    cy.stub(Storage, 'getCurrentUser').returns(noRolesUser)

    mount(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route path="/protected" element={<RoleBAC rolesAllowed={[USER_ROLES.all]} />}>
            <Route index element={<TestProtectedComponent />} />
          </Route>
          <Route path="/" element={<HomeComponent />} />
        </Routes>
      </MemoryRouter>,
    )

    cy.get('[data-cy="protected-content"]').should('be.visible')
    cy.get('[data-cy="home-content"]').should('not.exist')
  })
})
