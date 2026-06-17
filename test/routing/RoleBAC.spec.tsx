import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import RoleBAC from 'src/routing/RoleBAC'
import { Storage } from 'src/libs/storage'
import { USER_ROLES } from 'src/libs/utils'
import { DuosUser } from 'src/types/model'

vi.mock('src/libs/storage', () => ({
  Storage: {
    getCurrentUser: vi.fn(),
  },
}))

const TestProtectedComponent = () => <div data-cy="protected-content">Protected Content</div>

const researcherUser = {
  roles: [{ name: USER_ROLES.researcher }],
} as DuosUser

const adminUser = {
  roles: [{ name: USER_ROLES.admin }],
} as DuosUser

const noRolesUser = {
  roles: [],
} as unknown as DuosUser

describe('RoleBAC', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render the protected component if the user has the required role', () => {
    vi.mocked(Storage.getCurrentUser).mockReturnValue(researcherUser)

    const { container } = render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route path="/protected" element={<RoleBAC rolesAllowed={[USER_ROLES.researcher]} />}>
            <Route index element={<TestProtectedComponent />} />
          </Route>
        </Routes>
      </MemoryRouter>,
    )

    expect(container.querySelector('[data-cy="protected-content"]')).not.toBeNull()
    expect(container.querySelector('[data-cy="not-found"]')).toBeNull()
  })

  it('should redirect to the not found page if the user does not have the required role', () => {
    vi.mocked(Storage.getCurrentUser).mockReturnValue(adminUser)

    const { container } = render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route path="/protected" element={<RoleBAC rolesAllowed={[USER_ROLES.researcher]} />}>
            <Route index element={<TestProtectedComponent />} />
          </Route>
        </Routes>
      </MemoryRouter>,
    )

    expect(container.querySelector('[data-cy="not-found"]')).not.toBeNull()
    expect(container.querySelector('[data-cy="protected-content"]')).toBeNull()
  })

  it('should redirect to the not found page if the user has no roles', () => {
    vi.mocked(Storage.getCurrentUser).mockReturnValue(noRolesUser)

    const { container } = render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route path="/protected" element={<RoleBAC rolesAllowed={[USER_ROLES.researcher]} />}>
            <Route index element={<TestProtectedComponent />} />
          </Route>
        </Routes>
      </MemoryRouter>,
    )

    expect(container.querySelector('[data-cy="not-found"]')).not.toBeNull()
    expect(container.querySelector('[data-cy="protected-content"]')).toBeNull()
  })

  it('should render the protected component if "all" roles are allowed', () => {
    vi.mocked(Storage.getCurrentUser).mockReturnValue(noRolesUser)

    const { container } = render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route path="/protected" element={<RoleBAC rolesAllowed={[USER_ROLES.all]} />}>
            <Route index element={<TestProtectedComponent />} />
          </Route>
        </Routes>
      </MemoryRouter>,
    )

    expect(container.querySelector('[data-cy="protected-content"]')).not.toBeNull()
    expect(container.querySelector('[data-cy="not-found"]')).toBeNull()
  })
})
