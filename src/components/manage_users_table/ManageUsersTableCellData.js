import {map, sortedUniq} from 'lodash';
import {h} from 'react-hyperscript-helpers';
import {styles} from './ManageUsersTable';
import {Link} from 'react-router-dom';

export function usernameCellData({displayName, userId, label= 'user-name'}) {
  return {
    // clicking on username lets you edit user
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

export function emailCellData({userId, email, label = 'email'}) {
  return {
    data: email,
    value: email,
    id: userId,
    style: {
      color: styles.color.email,
      fontSize: styles.fontSize.email,
      fontWeight: '500'
    },
    label
  };
}

export function permissionsCellData({userId, roles, libraryCards, institution, label = 'permissions'}) {
  const hasLibraryCard = libraryCards?.map((lc) => lc.institutionId)?.includes(institution?.id);
  const roleNames = map(roles, 'name').filter((roleName) => roleName !== 'Researcher');
  const perms = (hasLibraryCard ? roleNames.concat('Library Card') : roleNames);
  return {
    isComponent: true,
    data: sortedUniq(perms).join('   ') || 'None',
    label,
    id: userId,
  };
}

export function institutionCellData({userId, institution, label = 'insitution'}) {
  return {
    isComponent: true,
    data: institution?.name || 'N/A',
    label,
    id: userId,
  };
}

export default {
  usernameCellData,
  emailCellData,
  permissionsCellData,
  institutionCellData,
};