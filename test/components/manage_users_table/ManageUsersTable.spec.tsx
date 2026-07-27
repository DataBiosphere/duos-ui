import React from 'react'
import '@testing-library/jest-dom/vitest'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { BrowserRouter } from 'react-router'
import { ManageUsersTable, ManageUsersTableProps } from 'src/components/manage_users_table/ManageUsersTable'
import { DuosUser } from 'src/types/model'

vi.mock('src/libs/utils', async (importActual) => {
  const actual = await importActual<typeof import('src/libs/utils')>()
  return {
    ...actual,
    recalculateVisibleTable: vi.fn(async ({ filteredList, setVisibleList, setPageCount }: {
      filteredList: unknown[]
      setVisibleList: (list: unknown[]) => void
      setPageCount: (count: number) => void
    }) => {
      setVisibleList(filteredList)
      setPageCount(1)
    }),
    searchOnFilteredList: vi.fn((_: string, list: unknown[], __: unknown, setFilteredList: (l: unknown[]) => void) => {
      setFilteredList(list ?? [])
    }),
    getSearchFilterFunctions: vi.fn(() => ({
      users: vi.fn((_: string, list: unknown[]) => list),
    })),
  }
})

const makeUser = (overrides: Partial<DuosUser> & { userId: number, displayName: string, email: string }): DuosUser => ({
  createDate: new Date(),
  emailPreference: false,
  isAdmin: false,
  isAlumni: false,
  isChairPerson: false,
  isDataSubmitter: false,
  isMember: false,
  isResearcher: true,
  isSigningOfficial: false,
  roles: [{ roleId: 1, name: 'Researcher', userId: overrides.userId, userRoleId: overrides.userId }],
  ...overrides,
})

const testUsers: DuosUser[] = [
  makeUser({ userId: 1, displayName: 'Alice Smith', email: 'alice@test.com' }),
  makeUser({ userId: 2, displayName: 'Bob Jones', email: 'bob@test.com' }),
]

const renderComponent = async (props: ManageUsersTableProps) => {
  await act(async () => {
    render(
      <BrowserRouter>
        <ManageUsersTable {...props} />
      </BrowserRouter>,
    )
  })
}

describe('ManageUsersTable - Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders four column headers', async () => {
    await renderComponent({ isLoading: false, userList: [], searchText: '' })
    expect(document.querySelectorAll('.column-header')).toHaveLength(4)
  })

  it('renders a loading placeholder when isLoading is true', async () => {
    await renderComponent({ isLoading: true, userList: [], searchText: '' })
    expect(document.querySelector('.table-loading-placeholder')).toBeInTheDocument()
  })

  it('renders user display names', async () => {
    await renderComponent({ isLoading: false, userList: testUsers, searchText: '' })
    testUsers.forEach((user) => {
      expect(screen.getByText(user.displayName)).toBeInTheDocument()
    })
  })

  it('renders user emails', async () => {
    await renderComponent({ isLoading: false, userList: testUsers, searchText: '' })
    testUsers.forEach((user) => {
      expect(screen.getByText(user.email)).toBeInTheDocument()
    })
  })

  it('renders without crashing when user list is empty', async () => {
    await renderComponent({ isLoading: false, userList: [], searchText: '' })
    expect(document.querySelectorAll('.column-header')).toHaveLength(4)
  })

  it('shows no data rows when user list is empty', async () => {
    await renderComponent({ isLoading: false, userList: [], searchText: '' })
    expect(document.querySelector('.row-data-0')).not.toBeInTheDocument()
  })
})
