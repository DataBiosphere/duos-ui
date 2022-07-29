import {map, sortedUniq} from 'lodash';
import {h, button} from 'react-hyperscript-helpers';
import {styles} from './ManageUsersTable';
import {Link} from 'react-router-dom';

export function usernameCellData({displayName, userId, label= 'user-name'}) {
  return {
    data: h(Link, {to: `/admin_edit_user/${userId}`}, [displayName]),
    value: displayName,
    id: userId,
    style : {
      color: '#354052',
      fontSize: styles.fontSize.username,
      paddingRight: '2%'
    },
    label
  };
}

export function googleIdCellData({userId, email, label = 'google-id'}) {
  return {
    data: email,
    value: email,
    id: userId,
    style: {
      color: styles.color.googleId,
      fontSize: styles.fontSize.googleId,
      fontWeight: '500'
    },
    label
  };
}

//Redirect for admin review page, only used in admin manage dar collections table
export function roleCellData({userId, roles, label = 'user-role'}) {
  return {
    isComponent: true,
    data: sortedUniq(map(roles, 'name')).join('   '),
    label,
    id: userId,
  };
}

export function actionsCellData({userId, user, editUser}) {
  return {
    isComponent: true,
    id: userId,
    style: {
      color: styles.color.actions,
      fontSize: styles.fontSize.actions
    },
    label: 'table-actions',
    data: button({
      id: userId + '_btnEditUser',
      name: 'btn_editUser',
      className: 'cell-button hover-color',
      onClick: editUser(user)
    }, ['Edit']),
  };
}

export default {
  usernameCellData,
  googleIdCellData,
  roleCellData,
  actionsCellData
};