import React, { useState, useEffect } from 'react'
import { AddUserModal } from 'src/components/modals/AddUserModal'
import { User } from 'src/libs/ajax/User'
import { DAA } from 'src/libs/ajax/DAA'
import { Notifications, USER_ROLES } from 'src/libs/utils'
import { ManageUsersTable } from 'src/components/manage_users_table/ManageUsersTable'
import { Styles } from 'src/libs/theme'
import SearchBar from 'src/components/SearchBar'
import { usePageTitle } from 'src/hooks/usePageTitle'
import TableHeaderSection from 'src/components/TableHeaderSection'
import AddObjectButton from 'src/components/AddObjectButton'
import AddCircleOutlineOutlinedIcon from '@mui/icons-material/AddCircleOutlineOutlined'
import { DuosUser } from 'src/types/model'
import { daaLabel } from 'src/libs/daaHelpers'

const getUserList = (): Promise<DuosUser[]> => User.list(USER_ROLES.admin)

// A DAA outage shouldn't block user management, so a failed fetch just leaves labels falling back to `DAA-<id>`.
const getDaaLabelsById = (): Promise<Map<number, string>> => DAA.getDaas()
  .then(daas => new Map(daas.map(daa => [daa.daaId, daaLabel(daa)])))
  .catch(() => new Map<number, string>())

export const AdminManageUsers = function AdminManageUsers() {
  usePageTitle('Manage Users')
  const [searchText, setSearchText] = useState('')
  const [userList, setUserList] = useState<DuosUser[]>([])
  const [daaLabelsById, setDaaLabelsById] = useState<Map<number, string>>(new Map())
  const [showAddUserModal, setShowAddUserModal] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    Promise.all([getUserList(), getDaaLabelsById()])
      .then(([users, labelsById]) => {
        setUserList(users)
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

  return (
    <div style={Styles.PAGE}>
      <div>
        <TableHeaderSection
          title="Manage Users"
          description="Select and manage users and their roles"
        />
      </div>
      <div style={{ ...Styles.SEARCH_ACTION_HEADER_SECTION }}>
        <SearchBar
          handleSearchChange={handleSearchUser}
        />
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
        isLoading={isLoading}
        searchText={searchText}
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
