import { describe, expect, it } from 'vitest'
import {
  dacNameMap,
  formatPreAuth,
  formatRegistrationDate,
  formatUserDacs,
  formatUserRoles,
  institutionName,
  userDacs,
  yesNo,
} from 'src/components/manage_users_table/manageUsersTableUtils'
import { DacObject, InstitutionInterface, LibraryCard, UserRole } from 'src/types/model'

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

  it('leaves out the DataSubmitter role, which has its own status column', () => {
    expect(formatUserRoles([role('DataSubmitter'), role('Admin')], undefined)).toBe('Admin')
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

describe('dacNameMap', () => {
  it('maps dacId to name', () => {
    const dacs: DacObject[] = [{ dacId: 1, name: 'DAC One' }, { dacId: 2, name: 'DAC Two' }]
    expect(dacNameMap(dacs)).toEqual(new Map([[1, 'DAC One'], [2, 'DAC Two']]))
  })

  it('falls back to dacName when name is absent', () => {
    expect(dacNameMap([{ dacId: 1, dacName: 'Legacy Name' }])).toEqual(new Map([[1, 'Legacy Name']]))
  })

  it('skips DACs with no id', () => {
    expect(dacNameMap([{ name: 'No Id' }])).toEqual(new Map())
  })
})

describe('userDacs', () => {
  const dacNameById = dacNameMap([{ dacId: 1, name: 'DAC One' }, { dacId: 2, name: 'DAC Two' }])

  it('reads no DACs when there are no chair or member roles', () => {
    expect(userDacs([role('Admin')], dacNameById)).toEqual([])
  })

  it('reads DACs from chairperson and member roles, sorted by name', () => {
    expect(userDacs(
      [{ ...role('Member'), dacId: 2 }, { ...role('Chairperson'), dacId: 1 }],
      dacNameById,
    )).toEqual([{ dacId: 1, name: 'DAC One' }, { dacId: 2, name: 'DAC Two' }])
  })

  it('dedupes a DAC the user holds more than one role in', () => {
    expect(userDacs(
      [{ ...role('Chairperson'), dacId: 1 }, { ...role('Member'), dacId: 1 }],
      dacNameById,
    )).toEqual([{ dacId: 1, name: 'DAC One' }])
  })

  it('reads Unknown for a dacId missing from the DAC list', () => {
    expect(userDacs([{ ...role('Member'), dacId: 99 }], dacNameById)).toEqual([{ dacId: 99, name: 'Unknown' }])
  })

  it('treats missing roles as no DACs', () => {
    expect(userDacs(undefined, dacNameById)).toEqual([])
  })
})

describe('formatUserDacs', () => {
  it('reads None when the list is empty', () => {
    expect(formatUserDacs([])).toBe('None')
  })

  it('joins DAC names with commas', () => {
    expect(formatUserDacs([{ dacId: 1, name: 'DAC One' }, { dacId: 2, name: 'DAC Two' }])).toBe('DAC One, DAC Two')
  })
})

describe('yesNo', () => {
  it('reads Yes for true', () => {
    expect(yesNo(true)).toBe('Yes')
  })

  it('reads No for false', () => {
    expect(yesNo(false)).toBe('No')
  })
})

describe('formatPreAuth', () => {
  const cardWithDaas = (daaIds: number[]): LibraryCard => ({
    ...libraryCard(),
    daaDetails: daaIds.map(daaId => ({ daaId })),
  })

  it('reads None when the user has no library card', () => {
    expect(formatPreAuth(undefined, new Map())).toBe('None')
  })

  it('reads None when the library card has no daaDetails', () => {
    expect(formatPreAuth(libraryCard(), new Map())).toBe('None')
  })

  it('labels a pre-authorized DAA from the lookup map', () => {
    expect(formatPreAuth(cardWithDaas([1]), new Map([[1, 'Broad DAA v2.pdf']]))).toBe('Broad DAA v2.pdf')
  })

  it('falls back to a stable token for a DAA missing from the lookup map', () => {
    expect(formatPreAuth(cardWithDaas([7]), new Map())).toBe('DAA-7')
  })

  it('lists several pre-authorized DAAs separated by commas', () => {
    const daaLabelsById = new Map([[1, 'Alpha DAA'], [2, 'Beta DAA']])
    expect(formatPreAuth(cardWithDaas([1, 2]), daaLabelsById)).toBe('Alpha DAA, Beta DAA')
  })

  it('lists a repeated DAA once', () => {
    expect(formatPreAuth(cardWithDaas([1, 1]), new Map([[1, 'Alpha DAA']]))).toBe('Alpha DAA')
  })
})

describe('formatRegistrationDate', () => {
  it('formats a create date as YYYY-MM-DD', () => {
    expect(formatRegistrationDate(new Date('2022-01-01T00:00:00.000Z'))).toBe('2022-01-01')
  })

  it('formats a create date received as an ISO string', () => {
    expect(formatRegistrationDate('2022-01-01T00:00:00.000Z')).toBe('2022-01-01')
  })

  it('reads the UTC calendar date rather than the viewer local one', () => {
    expect(formatRegistrationDate('2022-01-01T00:30:00.000Z')).toBe('2022-01-01')
  })

  it('reads - - when there is no create date', () => {
    expect(formatRegistrationDate(undefined)).toBe('- -')
  })

  it('reads - - for an unparseable create date', () => {
    expect(formatRegistrationDate('not a date')).toBe('- -')
  })
})
