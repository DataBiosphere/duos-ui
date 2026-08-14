import React, { useState } from 'react'
import '@testing-library/jest-dom/vitest'
import { fireEvent, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ManageUsersTable, ManageUsersTableProps } from 'src/components/manage_users_table/ManageUsersTable'
import { renderWithRouter } from '../../test-utils'
import { DuosUser, InstitutionInterface, LibraryCard } from 'src/types/model'

const institution = (name: string): InstitutionInterface => ({ id: 1, name } as unknown as InstitutionInterface)

const libraryCard = (userId: number): LibraryCard => ({
  id: userId + 100,
  userId,
  userName: 'Card Holder',
  userEmail: 'card@test.com',
  createUserId: 1,
  createDate: new Date('2022-01-01T00:00:00.000Z'),
})

const makeUser = (overrides: Partial<DuosUser> & { userId: number, displayName: string, email: string }): DuosUser => ({
  createDate: new Date('2022-01-01T00:00:00.000Z'),
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

const alice = makeUser({
  userId: 1,
  displayName: 'Alice Smith',
  email: 'alice@test.com',
  institution: institution('Broad Institute'),
  roles: [{ roleId: 4, name: 'Admin', userId: 1, userRoleId: 1 }],
})

const bob = makeUser({
  userId: 2,
  displayName: 'Bob Jones',
  email: 'bob@test.com',
  institution: institution('Aardvark University'),
  roles: [{ roleId: 7, name: 'SigningOfficial', userId: 2, userRoleId: 2 }],
})

const carol = makeUser({
  userId: 3,
  displayName: 'Carol White',
  email: 'carol@test.com',
  libraryCard: libraryCard(3),
})

const testUsers = [carol, alice, bob]

const renderTable = (props: Partial<ManageUsersTableProps> = {}) => renderWithRouter(
  <ManageUsersTable isLoading={false} userList={testUsers} searchText="" {...props} />,
)

const SearchHarness = ({ users }: { users: DuosUser[] }) => {
  const [searchText, setSearchText] = useState('')
  return (
    <>
      <button type="button" onClick={() => setSearchText('user0@')}>Apply search</button>
      <ManageUsersTable isLoading={false} userList={users} searchText={searchText} />
    </>
  )
}

// Sorting changes row order, so assertions read the user names in rendered order.
const userOrder = (): string[] =>
  screen.getAllByRole('row')
    .map(row => within(row).queryAllByRole('gridcell')[0]?.textContent ?? '')
    .filter(name => name !== '')

// A sorted header's accessible name gains the sort button, so match the label prefix.
const columnHeader = (label: string): HTMLElement =>
  screen.getByRole('columnheader', { name: new RegExp(`^${label}`) })

const sortBy = (label: string): void => {
  fireEvent.click(columnHeader(label))
}

const rowFor = async (name: string): Promise<HTMLElement> => {
  const cell = await screen.findByText(name)
  const row = cell.closest('[role="row"]')
  expect(row).not.toBeNull()
  return row as HTMLElement
}

describe('ManageUsersTable', () => {
  it('renders a column for every user attribute', () => {
    renderTable()

    for (const label of ['User Name', 'Email', 'Institution', 'Roles']) {
      expect(columnHeader(label)).toBeInTheDocument()
    }
  })

  it('renders each user with their email, institution and roles', async () => {
    renderTable()

    const row = await rowFor(alice.displayName)
    expect(within(row).getByText(alice.email)).toBeInTheDocument()
    expect(within(row).getByText('Broad Institute')).toBeInTheDocument()
    expect(within(row).getByText('Admin')).toBeInTheDocument()
  })

  it('links each user name to their edit page', async () => {
    renderTable()

    const row = await rowFor(bob.displayName)
    expect(within(row).getByRole('link', { name: bob.displayName }))
      .toHaveAttribute('href', `/admin_edit_user/${bob.userId}`)
  })

  it('keeps the user links out of the page tab order', () => {
    renderTable()

    // The grid is one tab stop, so links take the cell's tabIndex instead of adding one per row.
    const links = screen.getAllByRole('link')
    expect(links).toHaveLength(testUsers.length)
    links.forEach(link => expect(link).toHaveAttribute('tabindex', '-1'))
  })

  it('reads N/A and Library Card for a user with no institution and a card', async () => {
    renderTable()

    const row = await rowFor(carol.displayName)
    expect(within(row).getByText('N/A')).toBeInTheDocument()
    expect(within(row).getByText('Library Card')).toBeInTheDocument()
  })

  it('lists users alphabetically before any column is sorted', async () => {
    renderTable()

    await rowFor(alice.displayName)
    expect(userOrder()).toEqual([alice.displayName, bob.displayName, carol.displayName])
  })

  it('reverses the order when the User Name column is sorted descending', async () => {
    renderTable()

    await rowFor(alice.displayName)
    // The grid starts ascending on this column, so one click flips it.
    sortBy('User Name')

    expect(userOrder()).toEqual([carol.displayName, bob.displayName, alice.displayName])
  })

  it('sorts on institution, which differs from the name order', async () => {
    renderTable()

    await rowFor(alice.displayName)
    sortBy('Institution')

    // Aardvark, Broad, then N/A.
    expect(userOrder()).toEqual([bob.displayName, alice.displayName, carol.displayName])
  })

  it('allows sorting on every column', async () => {
    renderTable()

    await rowFor(alice.displayName)
    // User Name goes last: it starts ascending, so a click would flip it.
    for (const label of ['Email', 'Institution', 'Roles', 'User Name']) {
      sortBy(label)
      expect(columnHeader(label)).toHaveAttribute('aria-sort', 'ascending')
    }
  })

  it('shows only the users matching the search text', async () => {
    renderTable({ searchText: 'aardvark' })

    await rowFor(bob.displayName)
    expect(userOrder()).toEqual([bob.displayName])
  })

  it('narrows to a page that still holds rows when the search shrinks the list', async () => {
    const manyUsers = Array.from({ length: 12 }, (_, index) => makeUser({
      userId: index + 10,
      displayName: `User ${String(index).padStart(2, '0')}`,
      email: `user${index}@test.com`,
    }))
    renderWithRouter(<SearchHarness users={manyUsers} />)

    fireEvent.click(await screen.findByRole('button', { name: /go to next page/i }))
    expect(userOrder()).toEqual(['User 10', 'User 11'])

    // Only user0@test.com matches, so the second page no longer exists.
    fireEvent.click(screen.getByRole('button', { name: 'Apply search' }))

    expect(userOrder()).toEqual(['User 00'])
    expect(screen.getByText('1–1 of 1')).toBeInTheDocument()
  })

  it('shows a loading indicator while users are being fetched', () => {
    renderTable({ isLoading: true, userList: [] })

    // jsdom gives the grid no size, so its overlay is CSS-hidden.
    expect(screen.getByRole('progressbar', { hidden: true })).toBeInTheDocument()
  })

  it('renders no rows when there are no users', () => {
    renderTable({ userList: [] })

    expect(userOrder()).toEqual([])
    expect(columnHeader('User Name')).toBeInTheDocument()
  })

  // jsdom cannot resolve :focus-visible, so the emitted rules are read instead.
  it('keeps a visible focus ring for keyboard users', () => {
    renderTable()

    const rules = Array.from(document.querySelectorAll('style'))
      .map(style => style.textContent ?? '')
      .join('')
      .split('}')

    for (const selector of ['.MuiDataGrid-cell:focus-visible', '.MuiDataGrid-columnHeader:focus-visible']) {
      // Last rule wins, so the keyboard ring must outrank the suppressed :focus outline.
      const matching = rules.filter(rule => rule.includes(selector))
      expect(matching.length).toBeGreaterThan(0)
      expect(matching.at(-1)).toContain('outline:2px solid #216fb4')
    }
  })
})
