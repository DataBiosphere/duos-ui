import React from 'react'
import '@testing-library/jest-dom/vitest'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router'
import InstitutionTable, { InstitutionTableProps } from 'src/components/institution_table/InstitutionTable'
import { DuosUser, InstitutionInterface } from 'src/types/model'

vi.mock('src/libs/storage', () => ({
  Storage: {
    getCurrentUserSettings: vi.fn().mockReturnValue(null),
    setCurrentUserSettings: vi.fn(),
  },
}))

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
  } as unknown as InstitutionInterface,
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
  } as unknown as InstitutionInterface,
]

const defaultProps = {
  filteredList: mockInstitutions,
  currentPage: 1,
  setCurrentPage: (page: number) => { console.log(`Set current page to ${page}`) },
  tableSize: 10,
  setTableSize: (size: number) => { console.log(`Set table size to ${size}`) },
} as InstitutionTableProps

describe('InstitutionTable', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders', () => {
    render(
      <BrowserRouter>
        <InstitutionTable
          filteredList={defaultProps.filteredList}
          currentPage={defaultProps.currentPage}
          setCurrentPage={defaultProps.setCurrentPage}
          tableSize={defaultProps.tableSize}
          setTableSize={defaultProps.setTableSize}
        />
      </BrowserRouter>,
    )
    expect(document.querySelector('[data-cy="institution-table"]')).not.toBeNull()
  })

  it('displays paginated institution rows', () => {
    // Set the page count to 1 so only the first institution is displayed
    render(
      <BrowserRouter>
        <InstitutionTable
          filteredList={defaultProps.filteredList}
          currentPage={defaultProps.currentPage}
          setCurrentPage={defaultProps.setCurrentPage}
          tableSize={1}
          setTableSize={defaultProps.setTableSize}
        />
      </BrowserRouter>,
    )
    expect(document.querySelector('[data-cy="institution-table"]')).not.toBeNull()
    expect(screen.getByText(mockInstitutions[0].name)).toBeInTheDocument()
    expect(screen.queryByText(mockInstitutions[1].name)).not.toBeInTheDocument()
  })

  it('links to the update institution page', () => {
    render(
      <BrowserRouter>
        <InstitutionTable
          filteredList={defaultProps.filteredList}
          currentPage={defaultProps.currentPage}
          setCurrentPage={defaultProps.setCurrentPage}
          tableSize={defaultProps.tableSize}
          setTableSize={defaultProps.setTableSize}
        />
      </BrowserRouter>,
    )
    const links = document.querySelectorAll('a')
    links.forEach((link) => {
      const href = link.getAttribute('href') ?? ''
      expect(href).toMatch(/\/admin_manage_institutions\/institutions\/([12])/)
    })
  })
})
