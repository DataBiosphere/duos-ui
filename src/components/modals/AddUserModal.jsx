import _ from 'lodash';
import React, { Fragment, useState, useRef, useEffect } from 'react';
import { User } from '../../libs/ajax';
import { USER_ROLES } from '../../libs/utils';
import { Alert } from '../Alert';
import { BaseModal } from '../BaseModal';
import addUserIcon from '../../images/icon_add_user.png';

const adminRole = { 'roleId': 4, 'name': USER_ROLES.admin };
const researcherRole = { 'roleId': 5, 'name': USER_ROLES.researcher };

export const AddUserModal = (props) => {
  const [state, setState] = useState({
    displayName: '',
    email: '',
    displayNameValid: false,
    emailValid: false,
    invalidForm: true,
    submitted: false,
    alerts: [],
    updatedRoles: [researcherRole],
    emailPreference: false
  });

  const nameRef = useRef();
  const emailRef = useRef();

  useEffect(() => {
    if (!props.showModal) return;
    let r1 = nameRef.current;
    let r2 = emailRef.current;
    if (r1 && r2) {
      setState((prev) => ({
        ...prev,
        displayNameValid: r1.validity.valid,
        emailValid: r2.validity.valid
      }));
    }
  }, [props.showModal]);

  const OKHandler = async (event) => {
    event.persist();
    setState({
      ...state,
      submitted: true
    });
    const validForm = state.displayNameValid && state.emailValid;
    if (!validForm) return;

    const user = {
      displayName: state.displayName,
      emailPreference: state.emailPreference,
      roles: state.updatedRoles,
      email: state.email
    };

    const createdUser = await User.create(user);

    setState({
      ...state,
      emailValid: createdUser
    });
    event.preventDefault();

    if (state.emailValid !== false) {
      props.onOKRequest('addUser');
    }
  };

  const closeHandler = () => {
    props.onCloseRequest('addUser');
  };

  const afterOpenHandler = () => {
    props.onAfterOpen('addUser');
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

  const adminChanged = (e) => {
    const checkState = e.target.checked;
    // True? add admin role to state.updatedRoles
    // False? remove admin role from state.updatedRoles
    let newRoles = [researcherRole];
    if (checkState) {
      newRoles = _.concat(state.updatedRoles, adminRole);
    } else {
      newRoles = _.filter(state.updatedRoles, (r) => r.roleId !== adminRole.roleId);
    }
    setState({
      ...state,
      updatedRoles: newRoles
    });
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

  const formChange = () => {
    setState((prev) => ({
      ...prev,
      invalidForm: prev.displayNameValid && prev.emailValid
    }));
  };

  const isAdmin = () => {
    const admins = _.filter(state.updatedRoles, _.matches(adminRole));
    return !_.isEmpty(admins);
  };


  const { displayName, email, displayNameValid, emailValid } = state;
  const validForm = displayNameValid && emailValid;

  return (
    <BaseModal
      id='addUserModal'
      showModal={props.showModal}
      disableOkBtn={!validForm}
      onRequestClose={closeHandler}
      onAfterOpen={afterOpenHandler}
      imgSrc={addUserIcon}
      color='common'
      title='Add User'
      description='Catalog a new User in the system'
      action={{ label: 'Add', handler: OKHandler }}
    >
      <form className='form-horizontal css-form' name='userForm' encType='multipart/form-data' onChange={formChange}>
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
              onChange={handleChange}
              ref={emailRef}
            />
          </div>
        </div>

        <div className='form-group'>
          <label className='col-lg-3 col-md-3 col-sm-3 col-xs-4 control-label common-color'>Role</label>
          <div className='col-lg-9 col-md-9 col-sm-9 col-xs-8 bold'>
            <div className='col-lg-6 col-md-6 col-sm-6 col-xs-6'>
              <div className='checkbox'>
                <input
                  type='checkbox'
                  id='chk_admin'
                  checked={isAdmin()}
                  className='checkbox-inline user-checkbox'
                  onChange={adminChanged}
                />
                <label id='lbl_admin' className='regular-checkbox rp-choice-questions' htmlFor='chk_admin'>Admin</label>
              </div>
            </div>
          </div>
        </div>

        <div className='form-group'>
          {
            isAdmin() && (
              <div className='col-lg-9 col-lg-offset-3 col-md-9 col-md-offset-3 col-sm-9 col-sm-offset-3 col-xs-8 col-xs-offset-4' style={{ 'paddingLeft': '30px' }}>
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
        </div>
      </form>
      {
        state.emailValid === false && state.submitted === true && (
          <div>
            <Alert
              id='emailUsed'
              type='danger'
              title='Conflicts to resolve!'
              description='There is a user already registered with this google account.'
            />
          </div>
        )
      }
      {
        state.alerts.length > 0 && (
          <div>
            {alert.map((alert, ix) => (
              <Fragment key={'alert_' + ix}>
                <Alert id={'modal_' + ix} type={alert.type} title={alert.title} description={alert.msg} />
              </Fragment>
            ))
            }
          </div>
        )
      }
    </BaseModal>
  );
};
