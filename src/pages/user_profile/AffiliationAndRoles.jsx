import React from 'react';
import { useEffect, useState } from 'react';
import { Institution } from '../../libs/ajax/Institution';
import { User } from '../../libs/ajax/User';
import { find, isNil, isNumber } from 'lodash';
import { Notifications, setUserRoleStatuses } from '../../libs/utils';
import { Storage } from '../../libs/storage';
import { FormField, FormFieldTypes } from '../../components/forms/forms';
import Tooltip from '@mui/material/Tooltip';
import { ThemeProvider, createTheme } from '@mui/material/styles';

export default function AffiliationAndRole(props) {

  const theme = createTheme({
    components: {
      MuiTooltip: {
        styleOverrides: {
          tooltip: {
            fontSize: '14px',
            color: 'white',
            fontFamily: 'Montserrat'
          }
        }
      },
      MuiButton: {
        root: {
          fontSize: '14px',
          color: 'white',
          fontFamily: 'Montserrat',
          background: 'blue',
          '&:hover': {
            backgroundColor: 'darkblue',
          },
        }
      }
    }
  });

  const {
    user,
    userProps,
    institutions
  } = props;

  const [profile, setProfile] = useState({
    roles: '',
    institutionId: undefined,
    suggestedInstitution: undefined,
    selectedSigningOfficialId: undefined,
    suggestedSigningOfficial: undefined,
    id: undefined
  });

  const [selectedInstitution, setSelectedInstitution] = useState();

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
            suggestedInstitution: userProps.suggestedInstitution,
            selectedSigningOfficialId: parseInt(userProps.selectedSigningOfficialId),
            suggestedSigningOfficial: userProps.suggestedSigningOfficial,
            id: user.userId
          });
        }
      } catch (error) {
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
        setSelectedInstitution(institution);
      });
    } else {
      setSelectedInstitution(null);
    }
  }, [profile.institutionId]);


  const hasInstitution = () => {
    return (isNumber(profile.institutionId) && profile.institutionId !== 0) || (profile.suggestedInstitution !== undefined && profile.suggestedInstitution !== '');
  };

  const isSigningOfficial = () => {
    return user.isSigningOfficial;
  };

  const submitForm = async (event) => {
    event.preventDefault();
    await updateInstitution();
  };

  const formIsValid = () => {
    return !hasInstitution() || !isSigningOfficial();
  };

  const updateInstitution = async () => {
    const payload = {
      institutionId: profile.institutionId,
      suggestedInstitution: profile.suggestedInstitution
    };

    let updatedUser = await User.updateSelf(payload);
    setUserRoleStatuses(updatedUser, Storage);
    return updatedUser;
  };

  const generateInstitutionSelectionDisplay = () => {
    if (!isSigningOfficial() || (isNil(profile.institutionId) && isNil(profile.suggestedInstitution))) {
      return <div>
        <FormField
          id='institutionId'
          type={FormFieldTypes.SELECT}
          selectOptions={(institutions).map((i) => {
            return {
              institutionId: i.id,
              displayText: i.name,
            };
          })}
          placeholder='Search for Institution...'
          isCreatable={true}
          defaultValue={{
            institutionId: selectedInstitution?.institutionId,
            suggestedInstitution: profile.suggestedInstitution,
            displayText: (
              (!isNil(selectedInstitution)
                ? `${selectedInstitution.name}`
                : (!isNil(profile.suggestedInstitution)
                  ? `${profile.suggestedInstitution}`
                  : ''))
            ),
          }}
          selectConfig={{
            clearValue: () => {
              setProfile(Object.assign({},
                profile,
                {
                  institutionId: undefined,
                  suggestedInstitution: undefined
                }));
            },
          }}
          onChange={({ value }) => {
            if (!isNil(value?.institutionId)) {
              setProfile(Object.assign({}, profile, {
                institutionId: value?.institutionId,
                suggestedInstitution: undefined
              }));
            } else {
              setProfile(Object.assign({}, profile, {
                institutionId: undefined,
                suggestedInstitution: value?.displayText
              }));
            }
          }} >
        </FormField>
      </div>;
    } else {
      let institution = (profile.institutionId ? find(institutions, { id: profile.institutionId }) : null);
      const institutionName = (institution ? institution.name : profile.suggestedInstitution);
      return <div style={{ padding: 0 }}>
        <input
          id='profileInstitution'
          name='institution'
          type='text'
          disabled={true}
          className='form-control'
          value={institutionName} />
      </div>;
    }
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
    <div
      style={{
        color: '#000',
        fontFamily: 'Montserrat',
        fontSize: '16px',
        fontStyle: 'normal',
        fontWeight: '600',
        lineHeight: 'normal'
      }}
    >
      <p>Institution</p>
      {!(profile.institutionId) && <div className={'alert-danger alert'} style={{fontWeight: 'normal'}}>
        Please select an existing Institution. If you don&apos;t see your institution listed, please select the Contact
        Us link to request that your institution be added.
      </div>}
      <div style={{ marginTop: '15px' }} />
      {generateInstitutionSelectionDisplay()}
      {formIsValid() ? (
        <button
          id='btn_submit'
          onClick={submitForm}
          className='f-right btn-primary common-background'
          style={{
            marginTop: '2rem',
          }}
          disabled={!formIsValid()}>
          Save
        </button>
      ) : (
        <div>
          <ThemeProvider theme={theme}>
            <Tooltip
              title='You cannot edit your institution if you are a signing official already associated with an institution.'
              arrow>
              <div style={{ float: 'right' }}>
                <button
                  id='btn_submit'
                  onClick={submitForm}
                  className='f-right btn-primary common-background'
                  style={{
                    marginTop: '2rem',
                  }}
                  disabled={!formIsValid()}
                  title='You cannot edit your institution if you are a signing official already associated with an institution.'>
                  Save
                </button>
              </div>
            </Tooltip>
          </ThemeProvider>
        </div>
      )}
      <div style={{ marginTop: '83px' }} />
      <p>Role</p>
    </div>
    <p>
      {profile.roles}
    </p>
  </div>;
}
