import React, { useEffect, useState } from 'react'
import * as Utils from 'src/libs/utils'
import { Notifications } from 'src/libs/utils'
import { Storage } from 'src/libs/storage'
import { UserRole } from 'src/types/model'
import { Navigate, Outlet } from 'react-router-dom'

interface RoleBACProps {
  readonly rolesAllowed: string[]
}

const RoleBAC = ({ rolesAllowed }: RoleBACProps) => {
  const [roleAllowed, setRoleAllowed] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const checkRoles = (allowedRoles: Array<string>) => {
    const user = Storage.getCurrentUser()
    const userRoles: Array<UserRole> = user.roles ? user.roles : []
    const currentUserRoleNames = new Set(userRoles.map(role => role.name as string))
    return allowedRoles.some(
      allowedRole => (currentUserRoleNames.has(allowedRole) || allowedRole === Utils.USER_ROLES.all),
    )
  }

  useEffect(() => {
    const init = async () => {
      try {
        setIsLoading(true)
        // Check if SO has accepted the required DAA acknowledgments
        const accepted = checkRoles(rolesAllowed)
        setRoleAllowed(accepted)
        setIsLoading(false)
      }
      catch (error) {
        console.error('Error checking authentication:', error)
        Notifications.showError({
          text: 'Error: Unable to verify authentication',
        })
        setRoleAllowed(false)
        setIsLoading(false)
      }
    }
    init()
  }, [rolesAllowed])

  if (isLoading) {
    return <div>Loading...</div>
  }

  return roleAllowed
    ? <Outlet />
    : <Navigate to="/" state={{ from: location }} replace />
}

export default RoleBAC
