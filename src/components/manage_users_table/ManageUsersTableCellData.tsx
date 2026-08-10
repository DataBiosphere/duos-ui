import React from 'react'
import { isNil, sortedUniq } from 'src/utils/NodashUtil'
import { styles } from './manageUsersTableUtils'
import { Link } from 'react-router'
import { Tooltip as ReactTooltip } from 'react-tooltip'
import { UserRole, LibraryCard, InstitutionInterface } from 'src/types/model'

export interface CellData {
  data: React.ReactNode
  value?: string
  id: number
  style?: React.CSSProperties
  label: string
  isComponent?: boolean
}

interface UsernameCellDataParams {
  displayName: string
  userId: number
  label?: string
}

interface EmailCellDataParams {
  userId: number
  email: string
  label?: string
}

interface RolesCellDataParams {
  userId: number
  roles: UserRole[]
  libraryCard?: LibraryCard
  label?: string
}

interface InstitutionCellDataParams {
  userId: number
  institution?: InstitutionInterface
  label?: string
}

export function usernameCellData({ displayName, userId, label = 'user-name' }: UsernameCellDataParams): CellData {
  return {
    data: (
      <div>
        <Link
          to={`/admin_edit_user/${userId}`}
          data-for={`tip_${userId}_edit`}
          data-tip={`Edit ${displayName}`}
        >
          {displayName}
        </Link>
        <ReactTooltip
          id={`tip_${userId}_edit`}
          place="right"
          className="tooltip-wrapper"
        />
      </div>
    ),
    value: displayName,
    id: userId,
    style: {
      color: '#354052',
      fontSize: styles.fontSize.username,
      paddingRight: '2%',
    },
    label,
  }
}

export function emailCellData({ userId, email, label = 'email' }: EmailCellDataParams): CellData {
  return {
    data: email,
    value: email,
    id: userId,
    style: {
      color: styles.color.email,
      fontSize: styles.fontSize.email,
      fontWeight: '500',
    },
    label,
  }
}

export function rolesCellData({ userId, roles, libraryCard, label = 'roles' }: RolesCellDataParams): CellData {
  const hasLibraryCard = !isNil(libraryCard)
  const roleNames = (roles ?? []).map((role): string => role.name).filter(name => name !== 'Researcher')
  const perms = hasLibraryCard ? roleNames.concat('LibraryCard') : roleNames

  // need to split, e.g., SigningOfficial -> Signing Official
  const formattedPerms = perms.map(perm => perm.replace(/([A-Z])/g, ' $1').trim())

  return {
    isComponent: true,
    data: sortedUniq(formattedPerms).join('   ') || 'None',
    label,
    id: userId,
  }
}

export function institutionCellData({ userId, institution, label = 'insitution' }: InstitutionCellDataParams): CellData {
  return {
    isComponent: true,
    data: institution?.name ?? 'N/A',
    label,
    id: userId,
  }
}

const manageUsersTableCellData = {
  usernameCellData,
  emailCellData,
  rolesCellData,
  institutionCellData,
}

export default manageUsersTableCellData
