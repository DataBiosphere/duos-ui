import { describe, expect, it } from 'vitest'
import { formatUserRoles, institutionName } from 'src/components/manage_users_table/manageUsersTableUtils'
import { InstitutionInterface, LibraryCard, UserRole } from 'src/types/model'

const role = (name: UserRole['name'], userId = 1): UserRole => ({
  roleId: 1,
  name,
  userId,
  userRoleId: 1,
})

const libraryCard = (): LibraryCard => ({
  id: 1,
  userId: 1,
  userName: 'Alice',
  userEmail: 'alice@test.com',
  createUserId: 1,
  createDate: new Date('2022-01-01T00:00:00.000Z'),
})

describe('formatUserRoles', () => {
  it('reads None when there are no roles and no library card', () => {
    expect(formatUserRoles([], undefined)).toBe('None')
  })

  it('leaves out the Researcher role, which every user has', () => {
    expect(formatUserRoles([role('Researcher'), role('Admin')], undefined)).toBe('Admin')
  })

  it('reads None when Researcher is the only role', () => {
    expect(formatUserRoles([role('Researcher')], undefined)).toBe('None')
  })

  it('splits camel cased role names', () => {
    expect(formatUserRoles([role('SigningOfficial')], undefined)).toBe('Signing Official')
  })

  it('adds Library Card when the user holds one', () => {
    expect(formatUserRoles([], libraryCard())).toBe('Library Card')
  })

  it('lists several roles separated by commas', () => {
    expect(formatUserRoles([role('Admin'), role('Chairperson')], libraryCard()))
      .toBe('Admin, Chairperson, Library Card')
  })

  it('lists a repeated role once', () => {
    expect(formatUserRoles([role('Admin'), role('Member'), role('Admin')], undefined)).toBe('Admin, Member')
  })

  it('treats missing roles as none', () => {
    expect(formatUserRoles(undefined, undefined)).toBe('None')
  })
})

describe('institutionName', () => {
  it('reads the institution name', () => {
    expect(institutionName({ id: 1, name: 'Test University' } as unknown as InstitutionInterface)).toBe('Test University')
  })

  it('reads N/A when the user has no institution', () => {
    expect(institutionName(undefined)).toBe('N/A')
  })
})
