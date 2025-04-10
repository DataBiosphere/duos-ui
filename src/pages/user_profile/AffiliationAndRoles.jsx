import React from 'react';
import { useEffect, useState } from 'react';
import { Institution } from '../../libs/ajax/Institution';
import { isNil } from 'lodash';
import { Notifications } from '../../libs/utils';

export default function AffiliationAndRole(props) {

  const {
    user,
    userProps,
  } = props;

  const [profile, setProfile] = useState({
    roles: '',
    institutionId: undefined,
    selectedSigningOfficialId: undefined,
    id: undefined
  });

  const [institution, setInstitution] = useState(undefined);

  useEffect(() => {
    const init = async () => {
      try {
        const rolesList = [];
        if (!isNil(user) && !isNil(user.roles)) {
          for (let i = 0; i < user.roles.length; i++) {
            const newRole = user.roles[i].name;
            rolesList.push(newRole);
          }
          const allRoles = rolesList.join(', ');
          setProfile({
            roles: allRoles,
            institutionId: user.institutionId || userProps.institutionId,
            selectedSigningOfficialId: parseInt(userProps.selectedSigningOfficialId),
            id: user.userId
          });
        }
      } catch (_error) {
        Notifications.showError({ text: 'Error: Unable to retrieve user data from server' });
      }
    };
    init();

  }, [user, userProps]);

  useEffect(() => {
    if (profile.institutionId) {
      Institution.getById(profile.institutionId).then((institution) => {
        if (!institution) {
          return;
        }
        setInstitution(institution);
      });
    } else {
      setInstitution(null);
    }
  }, [profile.institutionId]);

  const generateInstitutionSelectionDisplay = () => {
    return institution ?
        <div>{institution?.name}</div>
      : <div>Please use the Contact Us form to request an institutional affiliation</div>
  };

  const subHeadStyle = {
    color: '#000',
    fontFamily: 'Montserrat',
    fontSize: '16px',
    fontStyle: 'normal',
    fontWeight: '600',
    lineHeight: 'normal'
  };

  return <div>
    <h1
      style={{
        color: '#01549F',
        fontSize: '20px',
        fontWeight: '600',
      }} >
      Affiliation & Role
    </h1>
    <div style={{ marginTop: '20px' }} />
    <div>
      <p style={subHeadStyle}>Institution</p>
      <div style={{ marginTop: '15px' }} />
      {generateInstitutionSelectionDisplay()}
      <div style={{ marginTop: '15px' }} />
      <p style={subHeadStyle}>Role</p>
    </div>
    <p>
      {profile.roles}
    </p>
  </div>;
}
