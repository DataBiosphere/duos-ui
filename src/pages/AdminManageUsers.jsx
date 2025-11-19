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
      <div style={{ display: 'flex', justifyContent: 'space-between', width: '112%', marginLeft: '-6%', padding: '0 2.5%' }}>
        <TableHeaderSection
          icon={{ src: manageUsersIcon }}
          title="Manage Users"
          description="Select and manage users and their roles"
        />
        <SearchBar
          handleSearchChange={handleSearchUser}
          searchRef={searchRef}
          style={{ width: '60%', margin: '0 3% 0 0' }}
          button={(
            <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center' }}>
              <a
                id="btn_addUser"
                className="btn-primary btn-add common-background"
                style={{ marginTop: '30%', display: 'flex' }}
                onClick={addUser}
              >
                <span>Add User</span>
              </a>
            </div>
          )}
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
