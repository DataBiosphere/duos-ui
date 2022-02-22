import _ from 'lodash';
import React, {Component, Fragment} from 'react';
import {button, div, form, h, hh, input, label} from 'react-hyperscript-helpers';
import {User} from '../libs/ajax';
import {USER_ROLES} from '../libs/utils';
import {Alert} from '../components/Alert';
import {ResearcherReview} from './ResearcherReview';
import editUserIcon from '../images/icon_edit_user.png';
import {PageHeading} from "../components/PageHeading";

const adminRole = {'roleId': 4, 'name': USER_ROLES.admin};
const researcherRole = {'roleId': 5, 'name': USER_ROLES.researcher};
const signingOfficialRole = {'roleId': 7, 'name': USER_ROLES.signingOfficial};

export const AdminEditUser = hh(class AdminEditUser extends Component {

  constructor(props) {
    super(props);

    this.state = {
      displayName: '',
      email: '',
      displayNameValid: false,
      emailValid: false,
      invalidForm: true,
      submitted: false,
      alerts: [],
      updatedRoles: [researcherRole],
      emailPreference: false
    };

    this.nameRef = React.createRef();
    this.emailRef = React.createRef();
  }

  async componentDidMount() {
    const user = await User.getById(this.props.match.params.dacUserId);
    const currentRoles = _.map(user.roles, (ur) => {
      return {'roleId': ur.roleId, 'name': ur.name};
    });
    const updatedRoles = _.isEmpty(currentRoles) ? [researcherRole] : currentRoles;
    this.setState({
      displayName: user.displayName,
      email: user.email,
      user: user,
      updatedRoles: updatedRoles,
      emailPreference: user.emailPreference
    },
    () => {
      let r1 = this.nameRef.current;
      let r2 = this.emailRef.current;
      this.setState({
        displayNameValid: r1.validity.valid,
        emailValid: r2.validity.valid
      });
    });
  }

  OKHandler = async (event) => {
    event.persist();
    this.setState({
      submitted: true
    });
    const validForm = this.state.displayNameValid && this.state.emailValid;
    if (validForm === false) {
      return;
    }
    let user = {
      displayName: this.state.displayName,
      emailPreference: this.state.emailPreference,
      roles: this.state.updatedRoles
    };
    const userId = this.state.user.dacUserId;
    user.dacUserId = userId;
    const payload = {updatedUser: user};
    const updatedUser = await User.update(payload, userId);
    this.setState({emailValid: updatedUser});

    await this.updateRolesIfDifferent(userId, this.state.updatedRoles);
    event.preventDefault();
  };

  //TODO: currently doesn't seem to be updating roles (neither does User.update above)
  updateRolesIfDifferent = async (userId, updatedRoles) => {
    const user = await User.getById(userId);
    const currentRoles = user.roles;

    _.map(updatedRoles, role => {
      if (_.contains(currentRoles, role)) {
        User.addRoleToUser(userId, role.roleId);
      }
    });

    _.map(currentRoles, role => {
      if (!_.contains(updatedRoles, role)) {
        User.deleteRoleFromUser(userId, role.roleId);
      }
    });
  };


    emailPreferenceChanged = (e) => {
      // disable notifications checkbox is not checked: -> Set email preference TRUE
      // disable notifications checkbox is checked:     -> Set email preference FALSE
      const checkState = e.target.checked;
      this.setState({
        emailPreference: !checkState
      });
    };

    adminChanged = (e) => {
      const checkState = e.target.checked;
      // True? add admin role to state.updatedRoles
      // False? remove admin role from state.updatedRoles
      let newRoles = [researcherRole];
      if (checkState) {
        newRoles = _.concat(this.state.updatedRoles, adminRole);
      } else {
        newRoles = _.filter(this.state.updatedRoles, (r) => {
          return r.roleId !== adminRole.roleId;
        });
      }
      this.setState(prev => {
        prev.updatedRoles = newRoles;
        return prev;
      });
    };

    signingOfficialChanged = (e) => {
      const checkState = e.target.checked;
      // True? add admin role to state.updatedRoles
      // False? remove admin role from state.updatedRoles
      let newRoles = [researcherRole];
      if (checkState) {
        newRoles = _.concat(this.state.updatedRoles, signingOfficialRole);
      } else {
        newRoles = _.filter(this.state.updatedRoles, (r) => {
          return r.roleId !== signingOfficialRole.roleId;
        });
      }
      this.setState(prev => {
        prev.updatedRoles = newRoles;
        return prev;
      });
    };

    handleChange = (e) => {
      const name = e.target.name;
      const validName = name + 'Valid';
      this.setState({
        [name]: e.target.value,
        [validName]: e.currentTarget.validity.valid
      });
    };

    formChange = () => {
      this.setState(prev => {
        prev.invalidForm = (prev.displayNameValid && prev.emailValid);
        return prev;
      });
    };

    isAdmin = () => {
      const admins = _.filter(this.state.updatedRoles, _.matches(adminRole));
      return !_.isEmpty(admins);
    };

    isSigningOfficial = () => {
      const signingOfficials = _.filter(this.state.updatedRoles, _.matches(signingOfficialRole));
      return !_.isEmpty(signingOfficials);
    };

    render()
    {
      const {displayName, email, displayNameValid, emailValid} = this.state;
      const validForm = displayNameValid && emailValid;
      const {dacUserId} = this.props.match.params;
      return (
        div({className: "container container-wide"}, [
          div({className: "row no-margin"}, [
            div({className: "col-lg-7 col-md-7 col-sm-12 col-xs-12 no-padding"}, [
              PageHeading({
                id: "editUser",
                imgSrc: editUserIcon,
                iconSize: "medium",
                color: "common",
                title: "Edit User",
                description: "Edit a User in the system"
              }),
            ]),
            div({className: "col-lg-10 col-lg-offset-1 col-md-10 col-md-offset-1 col-sm-12 col-xs-12 no-padding"}, [

              form({
                className: 'form-horizontal css-form ',
                name: 'userForm',
                encType: 'multipart/form-data',
                onChange: this.formChange
              }, [
                div({className: 'form-group first-form-group'}, [
                  label({
                    id: 'lbl_name',
                    className: 'col-lg-3 col-md-3 col-sm-3 col-xs-4 control-label common-color'
                  }, ['Name']),
                  div({className: 'col-lg-9 col-md-9 col-sm-9 col-xs-8'}, [
                    input({
                      type: 'text',
                      name: 'displayName',
                      id: 'txt_name',
                      className: 'form-control col-lg-12 vote-input',
                      placeholder: 'User name',
                      required: true,
                      value: displayName,
                      autoFocus: true,
                      onChange: this.handleChange,
                      ref: this.nameRef
                    })
                  ])
                ]),

                div({className: 'form-group'}, [
                  label({
                    id: 'lbl_email',
                    className: 'col-lg-3 col-md-3 col-sm-3 col-xs-4 control-label common-color'
                  }, ['Google account id']),
                  div({className: 'col-lg-9 col-md-9 col-sm-9 col-xs-8'}, [
                    input({
                      type: 'email',
                      name: 'email',
                      id: 'txt_email',
                      className: 'form-control col-lg-12 vote-input',
                      placeholder: 'e.g. username@broadinstitute.org',
                      required: true,
                      value: email,
                      onChange: this.handleChange,
                      ref: this.emailRef
                    })
                  ])
                ]),
                div({className: 'form-group'}, [
                  label({className: 'col-lg-3 col-md-3 col-sm-3 col-xs-4 control-label common-color'}, ['Roles']),
                  div({className: 'col-lg-9 col-md-9 col-sm-9 col-xs-8 bold'}, [
                    div({className: 'col-lg-6 col-md-6 col-sm-6 col-xs-6'}, [
                      div({className: 'checkbox'}, [
                        input({
                          type: 'checkbox',
                          id: 'chk_signing_official',
                          checked: this.isSigningOfficial(),
                          className: 'checkbox-inline user-checkbox',
                          onChange: this.signingOfficialChanged
                        }),
                        label({
                          id: 'lbl_signing_official',
                          className: 'regular-checkbox rp-choice-questions',
                          htmlFor: 'chk_signing_official'
                        }, ['Signing Official'])
                      ]),
                    ])
                  ]),
                ]),

                div({className: 'form-group'}, [
                  div({
                    className: 'col-lg-9 col-lg-offset-3 col-md-9 col-md-offset-3 col-sm-9 col-sm-offset-3 col-xs-8 col-xs-offset-4',
                    style: {'paddingLeft': '30px'}
                  }, [
                    div({className: 'checkbox'}, [
                      input({
                        type: 'checkbox',
                        id: 'chk_admin',
                        checked: this.isAdmin(),
                        className: 'checkbox-inline user-checkbox',
                        onChange: this.adminChanged
                      }),
                      label({
                        id: 'lbl_admin',
                        className: 'regular-checkbox rp-choice-questions',
                        htmlFor: 'chk_admin'
                      }, ['Admin'])
                    ])
                  ])
                ]),
                div({className: 'form-group'}, [
                  div({
                    isRendered: this.isAdmin(),
                    className: 'col-lg-9 col-lg-offset-3 col-md-9 col-md-offset-3 col-sm-9 col-sm-offset-3 col-xs-8 col-xs-offset-4',
                    style: {'paddingLeft': '30px'}
                  }, [
                    div({className: 'checkbox'}, [
                      input({
                        id: 'chk_emailPreference',
                        type: 'checkbox',
                        className: 'checkbox-inline user-checkbox',
                        // If email preference is TRUE  -> disable checkbox is not checked
                        // If email preference is FALSE -> disable checkbox is checked
                        checked: !this.state.emailPreference,
                        onChange: this.emailPreferenceChanged
                      }),
                      label({className: 'regular-checkbox rp-choice-questions bold', htmlFor: 'chk_emailPreference'},
                        ['Disable Admin email notifications'])
                    ])
                  ])
                ]),
                div({className: 'col-lg-12 col-xs-12 inline-block'}, [
                  button({
                    id: 'btn_save',
                    onClick: this.OKHandler,
                    className: 'f-right btn-primary common-background',
                    disabled: !validForm
                  }, ['Save']),
                ])
              ])
            ]),
            ResearcherReview({userId: dacUserId}),

            div({isRendered: this.state.emailValid === false && this.state.submitted === true}, [
              Alert({
                id: 'emailUsed', type: 'danger', title: 'Conflicts to resolve!',
                description: 'There is a user already registered with this google account.'
              })
            ]),
            div({isRendered: this.state.alerts.length > 0}, [
              this.state.alerts.map((alert, ix) => {
                return (
                  h(Fragment, {key: 'alert_' + ix}, [
                    Alert({id: 'modal_' + ix, type: alert.type, title: alert.title, description: alert.msg})
                  ])
                );
              })
            ])
          ])
        ])
      );
    }
});
