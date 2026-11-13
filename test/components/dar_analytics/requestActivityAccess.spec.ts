import { describe, expect, it } from 'vitest'
import { chairOrMemberDacIds, requestActivityAccess } from 'src/components/dar_analytics/requestActivityAccess'
import { DuosUser, UserRole } from 'src/types/model'

const role = (name: UserRole['name'], dacId?: number): UserRole => ({ name, dacId, roleId: 0, userId: 42 })
const userWith = (...roles: UserRole[]): Partial<DuosUser> => ({ isAdmin: false, roles })

describe('chairOrMemberDacIds', () => {
  it('lists each DAC the user chairs or sits on once, and no role without a DAC', () => {
    const user = userWith(
      role('Chairperson', 4),
      role('Member', 6),
      role('Member', 4),
      role('Researcher'),
      role('SigningOfficial'),
      role('Chairperson'),
    )

    expect(chairOrMemberDacIds(user)).toEqual([4, 6])
  })

  it('reads a role on DAC 0 as a role on a DAC', () => {
    expect(chairOrMemberDacIds(userWith(role('Member', 0)))).toEqual([0])
  })

  it('leaves out a role stored with a null DAC', () => {
    const stored = { ...role('Member'), dacId: null } as unknown as UserRole

    expect(chairOrMemberDacIds(userWith(stored, role('Chairperson', 4)))).toEqual([4])
  })

  it.each([undefined, null, {}, { roles: undefined }] as const)('has none for %j', (user) => {
    expect(chairOrMemberDacIds(user as Partial<DuosUser> | null | undefined)).toEqual([])
  })
})

/** The reports that count denied and pending requests are for admins and the DAC in charge. */
describe('requestActivityAccess', () => {
  it('offers an admin all of them, whatever DAC is in charge, or none', () => {
    const admin: Partial<DuosUser> = { isAdmin: true, roles: [role('Admin')] }

    expect(requestActivityAccess(admin, [7])).toBe('all')
    expect(requestActivityAccess(admin, [])).toBe('all')
    expect(requestActivityAccess(admin, [undefined])).toBe('all')
  })

  it('offers a chair or member of a DAC in charge those for their own DACs\' datasets', () => {
    expect(requestActivityAccess(userWith(role('Chairperson', 4)), [4])).toBe('own-dacs')
    expect(requestActivityAccess(userWith(role('Member', 6)), [4, undefined, 6])).toBe('own-dacs')
    expect(requestActivityAccess(userWith(role('Member', 0)), [0])).toBe('own-dacs')
  })

  /** An admin who also chairs a DAC is offered all of them, not just that DAC's. */
  it('offers an admin who chairs a DAC all of them', () => {
    const adminAndChair: Partial<DuosUser> = { isAdmin: true, roles: [role('Admin'), role('Chairperson', 4)] }

    expect(requestActivityAccess(adminAndChair, [4, 6])).toBe('all')
  })

  it('withholds them from a chair or member of another DAC', () => {
    expect(requestActivityAccess(userWith(role('Chairperson', 5)), [4, 6])).toBe('none')
  })

  it('withholds them where no DAC is in charge', () => {
    const chair = userWith(role('Chairperson', 4))

    expect(requestActivityAccess(chair, [])).toBe('none')
    expect(requestActivityAccess(chair, [undefined, null])).toBe('none')
  })

  /** Reading the study is not enough: a researcher, a study's custodian or a signing official sees none. */
  it('withholds them from everyone else', () => {
    expect(requestActivityAccess(userWith(role('Researcher'), role('SigningOfficial'), role('DataSubmitter')), [4])).toBe('none')
    expect(requestActivityAccess({}, [4])).toBe('none')
    expect(requestActivityAccess(undefined, [4])).toBe('none')
    expect(requestActivityAccess(null, [4])).toBe('none')
  })

  it('does not take a truthy value that is not true for an admin', () => {
    expect(requestActivityAccess({ isAdmin: 'false' as unknown as boolean }, [4])).toBe('none')
  })
})
