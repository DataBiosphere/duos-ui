import React from 'react'
import { USER_ROLES } from 'src/libs/utils'
import { Storage } from 'src/libs/storage'
import { UserRole } from 'src/types/model'
import { Navigate, Outlet } from 'react-router-dom'
import NotFound from 'src/pages/NotFound'

interface RoleBACProps {
  readonly rolesAllowed: string[]
}

const RoleBAC = ({ rolesAllowed }: RoleBACProps) => {
  const checkRoles = (allowedRoles: Array<string>) => {
    const user = Storage.getCurrentUser()
    const userRoles: Array<UserRole> = user.roles ? user.roles : []
    const currentUserRoleNames = new Set(userRoles.map(role => role.name as string))
    return allowedRoles.some(
      allowedRole => (currentUserRoleNames.has(allowedRole) || allowedRole === USER_ROLES.all),
    )
  }

  return checkRoles(rolesAllowed)
    ? <Outlet />
    : <NotFound />
}

export default RoleBAC
