import _ from 'lodash';
import {union, contains, map, isEmpty} from 'lodash/fp';
import React, {useState, useEffect, useRef} from 'react';
import { Institution } from '../libs/ajax/Institution';
import { User } from '../libs/ajax/User';
import {Notifications, USER_ROLES} from '../libs/utils';
import {ResearcherReview} from '../components/ResearcherReview';
import editUserIcon from '../images/icon_edit_user.png';
import {PageHeading} from '../components/PageHeading';
import {SearchSelect} from '../components/SearchSelect';

const adminRole = {'roleId': 4, 'name': USER_ROLES.admin};
const researcherRole = {'roleId': 5, 'name': USER_ROLES.researcher};
const signingOfficialRole = {'roleId': 7, 'name': USER_ROLES.signingOfficial};


export const AdminEditUser = (props) => {
  const [state, setState] = useState({
    user: {},
    displayName: '',
    email: '',
    displayNameValid: false,
    updatedRoles: [researcherRole],
    emailPreference: false,
    institutionOptions: [],
    institutionId: null
  });
  const [fetchingComplete, setFetchingComplete] = useState(false);

  const nameRef = useRef();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const user = await User.getById(props.match.params.userId);
        const institutionList = await Institution.list();
        const institutionOptions = institutionList.map((institution) => {
          return {
            key: institution.id,
            displayText: institution.name
          };
        });
        const currentRoles = _.map(user.roles, (ur) => {
          return {'roleId': ur.roleId, 'name': ur.name};
        });
        const updatedRoles = isEmpty(currentRoles) ? [researcherRole] : currentRoles;
        setState((prev) => ({
          ...prev,
          displayName: user.displayName,
          email: user.email,
          user: user,
          updatedRoles: updatedRoles,
          emailPreference: user.emailPreference,
          institutionOptions:institutionOptions,
          institutionId: user.institutionId,
        }));
        setFetchingComplete(true);
      }
      catch(e) {
        Notifications.showError({text: 'Error: Unable to retrieve current user from server'});
      }
    };
    fetchData();
  }, [props.match.params.userId]);

  useEffect(() => {
    if (fetchingComplete) {
      setState((prev) => ({
        ...prev,
        displayNameValid: nameRef.current.validity.valid
      }));
    }
  }, [fetchingComplete]);

  const OKHandler = async (event) => {
    event.preventDefault();

    if (!state.displayNameValid) {
      return;
    }
    const userId = state.user.userId;
    let user = {
      userId: userId,
      displayName: state.displayName,
      emailPreference: state.emailPreference,
      institutionId: state.institutionId
    };

    try {
      await User.update(user, userId);
      await updateRolesIfDifferent(userId, state.updatedRoles);
      props.navigate('/admin_manage_users');
    } catch (error) {
      Notifications.showError({ text: 'Error: Failed to update user' });
    }
  };

  const updateRolesIfDifferent = async (userId, updatedRoles) => {
    const user = await User.getById(userId);
    const currentRoleIds = map('roleId')(user.roles);
    // Always make sure researcher is a role we already have or need to add.
    const updatedRoleIds = union([researcherRole.roleId])(map('roleId')(updatedRoles));

    _.map(updatedRoleIds, roleId => {
      if (!contains(roleId)(currentRoleIds)) {
        User.addRoleToUser(userId, roleId);
      }
    });

    _.map(currentRoleIds, roleId => {
      if (!contains(roleId)(updatedRoleIds)) {
        // Safety check ... never delete the researcher role!!!
        if (roleId !== researcherRole.roleId) {
          User.deleteRoleFromUser(userId, roleId);
        }
      }
    });
  };

  const emailPreferenceChanged = (e) => {
    // disable notifications checkbox is not checked: -> Set email preference TRUE
    // disable notifications checkbox is checked:     -> Set email preference FALSE
    const checkState = e.target.checked;
    setState({
      ...state,
      emailPreference: !checkState
    });
  };

  const roleStatusChanged = (e, role) => {
    const checkState = e.target.checked;
    // True? add role to state.updatedRoles
    // False? remove role from state.updatedRoles
    let newRoles = [researcherRole];
    if (checkState) {
      newRoles = _.concat(state.updatedRoles, role);
    }
    else {
      newRoles = _.filter(state.updatedRoles, (r) => {
        return r.roleId !== role.roleId;
      });
    }
    setState({
      ...state,
      updatedRoles: newRoles
    });
  };

  const userHasRole = (role) => {
    const matches = _.filter(state.updatedRoles, _.matches(role));
    return !isEmpty(matches);
  };

  const handleChange = (e) => {
    const name = e.target.name;
    const validName = name + 'Valid';
    setState({
      ...state,
      [name]: e.target.value,
      [validName]: e.currentTarget.validity.valid
    });
  };

  const { displayName, email, displayNameValid, institutionId, institutionOptions } = state;
  return (
    <div className='container container-wide'>
      <div className='row no-margin'>
        <div className='col-lg-7 col-md-7 col-sm-12 col-xs-12 no-padding'>
          <PageHeading
            id='editUser'
            imgSrc={editUserIcon}
            iconSize='medium'
            color='common'
            title='Edit User'
            description='Edit a User in the system'
          />
        </div>
        <div className='col-lg-10 col-lg-offset-1 col-md-10 col-md-offset-1 col-sm-12 col-xs-12 no-padding'>
          <form className='form-horizontal css-form' name='userForm' encType='multipart/form-data'>
            <div className='form-group first-form-group'>
              <label id='lbl_name' className='col-lg-3 col-md-3 col-sm-3 col-xs-4 control-label common-color'>Name</label>
              <div className='col-lg-9 col-md-9 col-sm-9 col-xs-8'>
                <input
                  type='text'
                  name='displayName'
                  id='txt_name'
                  className='form-control col-lg-12 vote-input'
                  placeholder='User name'
                  required={true}
                  value={displayName}
                  autoFocus={true}
                  onChange={handleChange}
                  ref={nameRef}
                />
              </div>
            </div>

            <div className='form-group'>
              <label id='lbl_email' className='col-lg-3 col-md-3 col-sm-3 col-xs-4 control-label common-color'>Google account id</label>
              <div className='col-lg-9 col-md-9 col-sm-9 col-xs-8'>
                <input
                  type='email'
                  name='email'
                  id='txt_email'
                  className='form-control col-lg-12 vote-input'
                  placeholder='e.g. username@broadinstitute.org'
                  required={true}
                  value={email}
                  disabled={true}
                />
              </div>
            </div>

            <div className='form-group'>
              <label id='lbl_institution' className='col-lg-3 col-md-3 col-sm-3 col-xs-4 control-label common-color'>Institution</label>
              <div className='col-lg-9 col-md-9 col-sm-9 col-xs-8'>
                <SearchSelect
                  id='select_institution'
                  label='institution'
                  onSelection={(selection) => {
                    setState({
                      ...state,
                      institutionId: selection?.value?.institutionId
                    });
                  }}
                  options={institutionOptions || []}
                  placeholder='Please Select an Institution'
                  value={institutionId}
                  className='form-control'
                />
              </div>
            </div>

            <div className='form-group'>
              <label className='col-lg-3 col-md-3 col-sm-3 col-xs-4 control-label common-color'>Roles</label>
              <div className='col-lg-9 col-md-9 col-sm-9 col-xs-8 bold'>
                <div className='col-lg-6 col-md-6 col-sm-6 col-xs-6'>
                  <div className='checkbox'>
                    <input
                      type='checkbox'
                      id='chk_researcher'
                      checked={true}
                      readOnly={true}
                      className='checkbox-inline user-checkbox'
                    />
                    <label id='lbl_researcher' className='regular-checkbox rp-choice-questions' htmlFor='chk_researcher'>Researcher</label>
                  </div>
                </div>
              </div>
            </div>

            <div className='form-group'>
              <div
                className='col-lg-9 col-lg-offset-3 col-md-9 col-md-offset-3 col-sm-9 col-sm-offset-3 col-xs-8 col-xs-offset-4'
                style={{ paddingLeft: '30px' }}>
                <div className='checkbox'>
                  <input
                    type='checkbox'
                    id='chk_signing_official'
                    checked={userHasRole(signingOfficialRole)}
                    className='checkbox-inline user-checkbox'
                    onChange={(e) => roleStatusChanged(e, signingOfficialRole)}
                  />
                  <label id='lbl_signing_official' className='regular-checkbox rp-choice-questions' htmlFor='chk_signing_official'>Signing Official</label>
                </div>
              </div>
            </div>

            <div className='form-group'>
              <div className='col-lg-9 col-lg-offset-3 col-md-9 col-md-offset-3 col-sm-9 col-sm-offset-3 col-xs-8 col-xs-offset-4' style={{ paddingLeft: '30px' }}>
                <div className='checkbox'>
                  <input
                    type='checkbox'
                    id='chk_admin'
                    checked={userHasRole(adminRole)}
                    className='checkbox-inline user-checkbox'
                    onChange={(e) => roleStatusChanged(e, adminRole)}
                  />
                  <label id='lbl_admin' className='regular-checkbox rp-choice-questions' htmlFor='chk_admin'>Admin</label>
                </div>
              </div>
            </div>

            <div className='form-group'>
              {
                userHasRole(adminRole) && (
                  <div
                    className='col-lg-9 col-lg-offset-3 col-md-9 col-md-offset-3 col-sm-9 col-sm-offset-3 col-xs-8 col-xs-offset-4'
                    style={{ paddingLeft: '30px' }}
                  >
                    <div className='checkbox'>
                      <input
                        id='chk_emailPreference'
                        type='checkbox'
                        className='checkbox-inline user-checkbox'
                        // If email preference is TRUE  -> disable checkbox is not checked
                        // If email preference is FALSE -> disable checkbox is checked
                        checked={!state.emailPreference}
                        onChange={emailPreferenceChanged}
                      />
                      <label htmlFor='chk_emailPreference' className='regular-checkbox rp-choice-questions bold'>Disable Admin email notifications</label>
                    </div>
                  </div>
                )
              }
              <div className='col-lg-12 col-xs-12 inline-block'>
                <div style={{ marginLeft: '40px' }}>
                  <button
                    id='btn_save'
                    onClick={() => props.navigate('/admin_manage_users')}
                    className='f-left btn-primary btn-back'
                  >
                   Back
                  </button>
                </div>
                <button
                  id='btn_save'
                  onClick={OKHandler}
                  className='f-right btn-primary common-background'
                  disabled={!displayNameValid}
                >
                  Save
                </button>
              </div>
            </div>
          </form>
        </div>
        {
          !isEmpty(state.user) && (
            <ResearcherReview user={state.user} />
          )
        }
      </div>
    </div>
  );
};
