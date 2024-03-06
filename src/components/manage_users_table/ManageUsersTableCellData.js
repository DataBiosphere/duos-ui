import React from 'react';
import {isNil, isEmpty, map, sortedUniq} from 'lodash';
import {styles} from './ManageUsersTable';
import {Link} from 'react-router-dom';
import ReactTooltip from 'react-tooltip';
import voca from 'voca';

export function usernameCellData({displayName, userId, label= 'user-name'}) {
  return {
    // clicking on username lets you edit user
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
          effect="solid"
          multiline={true}
          className="tooltip-wrapper"
        />
      </div>
    ),
    value: displayName,
    id: userId,
    style: {
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

export function permissionsCellData({userId, roles, libraryCards, label = 'permissions'}) {
  const hasLibraryCard = !isNil(libraryCards) && !isEmpty(libraryCards);
  const roleNames = map(roles, 'name').filter((roleName) => roleName !== 'Researcher');
  const perms = (hasLibraryCard ? roleNames.concat('LibraryCard') : roleNames);

  // need to split, e.g., SigningOfficial -> Signing Official
  const formattedPerms = perms.map((perm) => voca.words(perm).join(' '));

  return {
    isComponent: true,
    data: sortedUniq(formattedPerms).join('   ') || 'None',
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