import React, {useEffect, useState} from 'react';
import {Institution as InstitutionAPI} from '../../libs/ajax/Institution';
import {Notifications} from '../../libs/utils';
import {DuosUser, Institution} from '../../types/model';

interface AffiliationAndRoleProps {
  readonly user: DuosUser;
}

export default function AffiliationAndRole(props: AffiliationAndRoleProps) {

  const {user} = props;
  const [institution, setInstitution] = useState<Institution>();
  const [roles, setRoles] = useState<string>('');

  useEffect(() => {
    const init = async () => {
      try {
        const allRoles = user?.roles?.map((role) => role.name).join(', ');
        setRoles(allRoles);
        if (user.institutionId) {
          const institution: Institution = await InstitutionAPI.getById(user.institutionId);
          if (institution) {
            setInstitution(institution);
          }
        }
      } catch (_error) {
        Notifications.showError({text: 'Error: Unable to retrieve user information'});
      }
    };
    init();
  }, [user]);

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
        }}>
      Affiliation & Role
    </h1>
    <div style={{marginTop: '20px'}}/>
    <div>
      <p style={subHeadStyle}>Institution</p>
      <div style={{marginTop: '15px'}}/>
      {institution
          ? <div data-cy='institutional-affiliation'>{institution.name}</div>
          : <div data-cy='institutional-affiliation'>Please use the Contact Us form to request an institutional
            affiliation</div>
      }
      <div style={{marginTop: '15px'}}/>
      <p style={subHeadStyle}>Role</p>
      <p data-cy='user-roles'>{roles}</p>
    </div>
  </div>;
}
