import '@testing-library/jest-dom/vitest'
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { ManageUsersTable } from 'src/components/manage_users_table/ManageUsersTable'
import { DacObject, DuosUser, UserRole } from 'src/types/model'

// The app sets `html { font-size: 10px }` globally (src/styles/bootstrap_replacement.css),
// which every `rem` value in the app is sized against. This isolated component test doesn't
// load that global stylesheet, so it must set the same root font-size itself.
beforeAll(() => {
  document.documentElement.style.fontSize = '10px'
})

afterAll(() => {
  document.documentElement.style.fontSize = ''
})

const dacNames = ['Cancer DAC', 'Heart DAC', 'Rare Disease DAC', 'Vision DAC']

const dacList: DacObject[] = dacNames.map((name, index) => ({ dacId: index + 1, name }))

const memberRoles = (count: number): UserRole[] =>
  Array.from({ length: count }, (_, index) => ({ roleId: 6, name: 'Member', userId: 1, userRoleId: index + 1, dacId: index + 1 }))

const userWithDacs = (userId: number, displayName: string, dacCount: number): DuosUser => ({
  userId,
  displayName,
  email: `${displayName.toLowerCase().replace(' ', '')}@test.com`,
  createDate: new Date('2022-01-01T00:00:00.000Z'),
  emailPreference: false,
  isAdmin: false,
  isAlumni: false,
  isChairPerson: false,
  isDataSubmitter: false,
  isMember: dacCount > 0,
  isResearcher: true,
  isSigningOfficial: false,
  roles: memberRoles(dacCount),
} as unknown as DuosUser)

const renderTable = (userList: DuosUser[]) => render(
  <MemoryRouter>
    <ManageUsersTable isLoading={false} userList={userList} dacList={dacList} searchText="" />
  </MemoryRouter>,
)

const rowFor = async (name: string): Promise<HTMLElement> => {
  const cell = await screen.findByText(name)
  return cell.closest('.MuiDataGrid-row') as HTMLElement
}

describe('ManageUsersTable DACs column layout', () => {
  it('stacks a user\'s DACs one per line, each fully visible', async () => {
    renderTable([userWithDacs(1, 'Many Dacs', 4)])

    const row = await rowFor('Many Dacs')
    const links = dacNames.map(name => screen.getByRole('link', { name }))
    const tops = links.map(link => link.getBoundingClientRect().top)

    // Each name sits below the one before it, rather than sharing a line.
    expect(tops).toEqual([...tops].sort((a, b) => a - b))
    expect(new Set(tops).size).toBe(dacNames.length)

    // Every link is drawn inside its row, so none of them is clipped away.
    const rowRect = row.getBoundingClientRect()
    links.forEach((link) => {
      const rect = link.getBoundingClientRect()
      expect(rect.height).toBeGreaterThan(0)
      expect(rect.top).toBeGreaterThanOrEqual(rowRect.top)
      expect(rect.bottom).toBeLessThanOrEqual(rowRect.bottom + 1)
    })
  })

  it('grows a row to fit its DACs, leaving rows with fewer DACs shorter', async () => {
    renderTable([userWithDacs(1, 'One Dac', 1), userWithDacs(2, 'Four Dacs', 4)])

    const shortRow = await rowFor('One Dac')
    const tallRow = await rowFor('Four Dacs')

    expect(tallRow.getBoundingClientRect().height).toBeGreaterThan(shortRow.getBoundingClientRect().height)
  })
})
