import { useState, useRef, useEffect } from 'react';
import { a, div, h, span, img } from 'react-hyperscript-helpers';
import { AddUserModal } from '../components/modals/AddUserModal';
import { User } from '../libs/ajax';
import manageUsersIcon from '../images/icon_manage_users.png';
import {USER_ROLES} from '../libs/utils';
import { isNil } from 'lodash/fp';
import { ManageUsersTable } from '../components/manage_users_table/ManageUsersTable';
import { Styles } from '../libs/theme';
import SearchBar from '../components/SearchBar';
import {Notification} from '../components/Notification';

const getUserList = async () => {
  const users = await User.list(USER_ROLES.admin);

  return users.map(user => {
    user.researcher = false;
    if (!isNil(user.roles)) {
      user.roles.forEach(role => {
        if (role.name === 'Researcher' || user.name === 'RESEARCHER') {
          user.researcher = true;
        }
      });
    }
    user.key = user.id;
    return user;
  });
};

export const AdminManageUsers = function AdminManageUsers() {
  const [searchText, setSearchText] = useState('');
  const [userList, setUserList] = useState([]);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState();
  const [isLoading, setIsLoading] = useState(false);

  const searchRef = useRef('');

  useEffect(() => {
    setIsLoading(true);
    getUserList().then((userList) => {
      setIsLoading(false);
      setUserList(userList);
      setIsLoading(false);
    }).catch(() => {
      setIsLoading(false);
      Notification.showError({text: 'Error: Unable to retrieve user data from server'});
    });
  }, []);

  const addUser = () => {
    setSelectedUser(null);
    setShowAddUserModal(true);
  };

  const okModal = async () => {
    setShowAddUserModal(false);
    setIsLoading(true);
    let userList = await getUserList();
    setIsLoading(false);
    setUserList(userList);
  };

  const closeModal = () => {
    setShowAddUserModal(false);
  };

  const afterModalOpen = () => {
    setShowAddUserModal(false);
  };

  const handleSearchUser = (query) => {
    setSearchText(query);
  };

  return div({ style: Styles.PAGE }, [
    div({ style: { display: 'flex', justifyContent: 'space-between', width: '112%', marginLeft: '-6%', padding: '0 2.5%' } }, [
      div(
        { className: 'left-header-section', style: Styles.LEFT_HEADER_SECTION },
        [
          div({ style: Styles.ICON_CONTAINER }, [
            img({
              id: 'manage-users-icon',
              src: manageUsersIcon,
              style: Styles.HEADER_IMG,
            }),
          ]),
          div({ style: Styles.HEADER_CONTAINER }, [
            div({ style: {
              fontFamily: 'Montserrat',
              fontWeight: 600,
              fontSize: '2.8rem'
            } }, [
              'Edit User',
            ]),
            div(
              {
                style: {
                  fontFamily: 'Montserrat',
                  fontSize: '1.6rem'
                },
              },
              ['Edit a User in the system']
            ),
          ]),
        ]
      ),
      h(SearchBar, {
        handleSearchChange: handleSearchUser,
        searchRef,
        style: {
          width: '60%',
          margin: '0 3% 0 0',
        },
        button: div({
          style: {
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'flex-end',
            justifyContent: 'center',
          }
        }, [
          a({
            id: 'btn_addUser',
            className: 'btn-primary btn-add common-background',
            style: {
              marginTop: '30%',
              display: 'flex'
            },
            onClick: addUser
          }, [
            div({ className: 'all-icons add-user_white' }),
            span({}, ['Add User']),
          ]),
        ]),
      }),
    ]),
    h(ManageUsersTable, {
      userList,
      isLoading,
      searchText
    }),

    AddUserModal({
      isRendered: showAddUserModal,
      showModal: showAddUserModal,
      onOKRequest: okModal,
      onCloseRequest: closeModal,
      onAfterOpen: afterModalOpen,
      user: selectedUser,
    }),
  ]);
};

export default AdminManageUsers;
