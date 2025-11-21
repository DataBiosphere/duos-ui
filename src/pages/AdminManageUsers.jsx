import React from 'react'
import { useState, useRef, useEffect } from 'react'
import { AddUserModal } from 'src/components/modals/AddUserModal'
import { User } from 'src/libs/ajax/User'
import manageUsersIcon from 'src/images/icon_manage_users.png'
import { USER_ROLES } from 'src/libs/utils'
import { isNil } from 'lodash/fp'
import { ManageUsersTable } from 'src/components/manage_users_table/ManageUsersTable'
import { Styles } from 'src/libs/theme'
import SearchBar from 'src/components/SearchBar'
import { Notification } from 'src/components/Notification'
import { usePageTitle } from 'src/hooks/usePageTitle'
import TableHeaderSection from 'src/components/TableHeaderSection'
import AddObjectButton from 'src/components/AddObjectButton.tsx'
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline'

const getUserList = async () => {
  const users = await User.list(USER_ROLES.admin)

  return users.map((user) => {
    user.researcher = false
    if (!isNil(user.roles)) {
      user.roles.forEach((role) => {
        if (role.name === 'Researcher' || user.name === 'RESEARCHER') {
          user.researcher = true
        }
      })
    }
    user.key = user.id
    return user
  })
}

export const AdminManageUsers = function AdminManageUsers() {
  usePageTitle('Manage Users')
  const [searchText, setSearchText] = useState('')
  const [userList, setUserList] = useState([])
  const [showAddUserModal, setShowAddUserModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState()
  const [isLoading, setIsLoading] = useState(false)

  const searchRef = useRef('')

  useEffect(() => {
    setIsLoading(true)
    getUserList().then((userList) => {
      setIsLoading(false)
      setUserList(userList)
      setIsLoading(false)
    }).catch(() => {
      setIsLoading(false)
      Notification.showError({ text: 'Error: Unable to retrieve user data from server' })
    })
  }, [])

  const addUser = () => {
    setSelectedUser(null)
    setShowAddUserModal(true)
  }

  const okModal = async () => {
    setShowAddUserModal(false)
    setIsLoading(true)
    const userList = await getUserList()
    setIsLoading(false)
    setUserList(userList)
  }

  const closeModal = () => {
    setShowAddUserModal(false)
  }

  const afterModalOpen = () => {
    setShowAddUserModal(false)
  }

  const handleSearchUser = (query) => {
    setSearchText(query)
  }

  return (
    <div style={Styles.PAGE}>
      <div>
        <TableHeaderSection
          icon={{ src: manageUsersIcon }}
          title="Manage Users"
          description="Select and manage users and their roles"
        />
      </div>
      <div style={{ ...Styles.SEARCH_ACTION_HEADER_SECTION }}>
        <SearchBar
          handleSearchChange={handleSearchUser}
          searchRef={searchRef}
        />
        <AddObjectButton
          id="btn_addUser"
          label="ADD USER"
          onClick={addUser}
          icon={<AddCircleOutlineIcon />}
          className="button button-blue"
        />
      </div>
      <ManageUsersTable userList={userList} isLoading={isLoading} searchText={searchText} />
      <AddUserModal
        isRendered={showAddUserModal}
        showModal={showAddUserModal}
        onOKRequest={okModal}
        onCloseRequest={closeModal}
        onAfterOpen={afterModalOpen}
        user={selectedUser}
      />
    </div>
  )
}

export default AdminManageUsers
