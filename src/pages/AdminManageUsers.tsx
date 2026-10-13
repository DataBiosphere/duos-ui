import React, { useEffect, useMemo, useState } from 'react'
import { Box, MenuItem, TextField } from '@mui/material'
import { AddUserModal } from 'src/components/modals/AddUserModal'
import { User } from 'src/libs/ajax/User'
import { DAC } from 'src/libs/ajax/DAC'
import { DAA } from 'src/libs/ajax/DAA'
import { Notifications, USER_ROLES } from 'src/libs/utils'
import { ManageUsersTable } from 'src/components/manage_users_table/ManageUsersTable'
import { roleLabel, roleOptions } from 'src/components/manage_users_table/manageUsersTableUtils'
import { Styles } from 'src/libs/theme'
import SearchBar from 'src/components/SearchBar'
import { usePageTitle } from 'src/hooks/usePageTitle'
import TableHeaderSection from 'src/components/TableHeaderSection'
import AddObjectButton from 'src/components/AddObjectButton'
import AddCircleOutlineOutlinedIcon from '@mui/icons-material/AddCircleOutlineOutlined'
import { DacObject, DuosUser, UserRoleName } from 'src/types/model'
import { daaLabel } from 'src/libs/daaHelpers'

const getUserList = (): Promise<DuosUser[]> => User.list(USER_ROLES.admin)
const getDacList = (): Promise<DacObject[]> => DAC.list(false)

// A DAA outage shouldn't block user management; labels fall back to `DAA-<id>`.
const getDaaLabelsById = (): Promise<Map<number, string>> => DAA.getDaas()
  .then(daas => new Map(daas.map(daa => [daa.daaId, daaLabel(daa)])))
  .catch(() => new Map<number, string>())

const ALL_ROLES = 'all'

export const AdminManageUsers = function AdminManageUsers() {
  usePageTitle('Manage Users')
  const [searchText, setSearchText] = useState('')
  const [role, setRole] = useState<UserRoleName | undefined>()
  const [userList, setUserList] = useState<DuosUser[]>([])
  const [dacList, setDacList] = useState<DacObject[]>([])
  const [daaLabelsById, setDaaLabelsById] = useState<Map<number, string>>(new Map())
  const [showAddUserModal, setShowAddUserModal] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    Promise.all([getUserList(), getDacList(), getDaaLabelsById()])
      .then(([users, dacs, labelsById]) => {
        setUserList(users)
        setDacList(dacs)
        setDaaLabelsById(labelsById)
        setIsLoading(false)
      })
      .catch(() => {
        setIsLoading(false)
        Notifications.showError({ text: 'Error: Unable to retrieve user data from server' })
      })
  }, [])

  const addUser = () => {
    setShowAddUserModal(true)
  }

  const okModal = async () => {
    setShowAddUserModal(false)
    setIsLoading(true)
    const users = await getUserList()
    setUserList(users)
    setIsLoading(false)
  }

  const closeModal = () => {
    setShowAddUserModal(false)
  }

  const afterModalOpen = () => {
    setShowAddUserModal(false)
  }

  const handleSearchUser = (query: string) => {
    setSearchText(query)
  }

  const roles = useMemo(() => roleOptions(userList), [userList])
  // A refreshed list may no longer hold the chosen role, so the filter falls back to every role.
  const activeRole = role && roles.includes(role) ? role : undefined

  return (
    <div style={Styles.PAGE}>
      <div>
        <TableHeaderSection
          title="Manage Users"
          description="Select and manage users and their roles"
        />
      </div>
      <div style={{ ...Styles.SEARCH_ACTION_HEADER_SECTION }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {/* Its default 25% width is of this row, too narrow for its fixed-width input. */}
          <SearchBar
            handleSearchChange={handleSearchUser}
            style={{ width: 'auto' }}
          />
          <TextField
            select
            label="Role"
            size="small"
            value={activeRole ?? ALL_ROLES}
            onChange={event => setRole(event.target.value === ALL_ROLES ? undefined : event.target.value as UserRoleName)}
            sx={{ minWidth: '18rem' }}
          >
            <MenuItem value={ALL_ROLES}>All roles</MenuItem>
            {roles.map(name => (
              <MenuItem key={name} value={name}>{roleLabel(name)}</MenuItem>
            ))}
          </TextField>
        </Box>
        <AddObjectButton
          id="btn_addUser"
          label="ADD USER"
          onClick={addUser}
          icon={<AddCircleOutlineOutlinedIcon />}
          className="button button-blue"
        />
      </div>
      <ManageUsersTable
        userList={userList}
        dacList={dacList}
        isLoading={isLoading}
        searchText={searchText}
        role={activeRole}
        daaLabelsById={daaLabelsById}
      />
      <AddUserModal
        showModal={showAddUserModal}
        onOKRequest={okModal}
        onCloseRequest={closeModal}
        onAfterOpen={afterModalOpen}
      />
    </div>
  )
}

export default AdminManageUsers
