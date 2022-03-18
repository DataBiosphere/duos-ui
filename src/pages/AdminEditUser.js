import _ from 'lodash';
import {union, contains, map, isEmpty} from 'lodash/fp';
import React, {Component} from 'react';
import {button, div, form, hh, input, label} from 'react-hyperscript-helpers';
import {User} from '../libs/ajax';
import {USER_ROLES} from '../libs/utils';
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
      user: {},
      displayName: '',
      email: '',
      displayNameValid: false,
      updatedRoles: [researcherRole],
      emailPreference: false
    };

    this.nameRef = React.createRef();
  }

  async componentDidMount() {
    const user = await User.getById(this.props.match.params.dacUserId);
    const currentRoles = _.map(user.roles, (ur) => {
      return {'roleId': ur.roleId, 'name': ur.name};
    });
    const updatedRoles = isEmpty(currentRoles) ? [researcherRole] : currentRoles;
    this.setState({
      displayName: user.displayName,
      email: user.email,
      user: user,
      updatedRoles: updatedRoles,
      emailPreference: user.emailPreference
    },
    () => {
      this.setState({
        displayNameValid: this.nameRef.current.validity.valid,
      });
    });
  }

  OKHandler = async (event) => {
    event.preventDefault();

    if (!this.state.displayNameValid) {
      return;
    }
    const userId = this.state.user.dacUserId;
    let user = {
      dacUserId: userId,
      displayName: this.state.displayName,
      emailPreference: this.state.emailPreference,
    };
    const payload = {updatedUser: user};
    const updatedUser = await User.update(payload, userId);
    await this.updateRolesIfDifferent(userId, this.state.updatedRoles);

    this.setState({
      user: Object.assign({}, updatedUser),
      displayNameValid: this.nameRef.current.validity.valid
    });
  };

  updateRolesIfDifferent = async (userId, updatedRoles) => {
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

  emailPreferenceChanged = (e) => {
    // disable notifications checkbox is not checked: -> Set email preference TRUE
    // disable notifications checkbox is checked:     -> Set email preference FALSE
    const checkState = e.target.checked;
    this.setState({
      emailPreference: !checkState
    });
  };

  roleStatusChanged = (e, role) => {
    const checkState = e.target.checked;
    // True? add role to state.updatedRoles
    // False? remove role from state.updatedRoles
    let newRoles = [researcherRole];
    if (checkState) {
      newRoles = _.concat(this.state.updatedRoles, role);
    } else {
      newRoles = _.filter(this.state.updatedRoles, (r) => {
        return r.roleId !== role.roleId;
      });
    }
    this.setState(prev => {
      prev.updatedRoles = newRoles;
      return prev;
    });
  };

  userHasRole = (role) => {
    const matches = _.filter(this.state.updatedRoles, _.matches(role));
    return !isEmpty(matches);
  };

  handleChange = (e) => {
    const name = e.target.name;
    const validName = name + 'Valid';
    this.setState({
      [name]: e.target.value,
      [validName]: e.currentTarget.validity.valid
    });
  };


  render() {
    const {displayName, email, displayNameValid} = this.state;
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
                    disabled: true
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
                        id: 'chk_researcher',
                        checked: true,
                        readOnly: true,
                        className: 'checkbox-inline user-checkbox',
                      }),
                      label({
                        id: 'lbl_researcher',
                        className: 'regular-checkbox rp-choice-questions',
                        htmlFor: 'chk_researcher'
                      }, ['Researcher'])
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
                      id: 'chk_signing_official',
                      checked: this.userHasRole(signingOfficialRole),
                      className: 'checkbox-inline user-checkbox',
                      onChange: e => this.roleStatusChanged(e, signingOfficialRole)
                    }),
                    label({
                      id: 'lbl_signing_official',
                      className: 'regular-checkbox rp-choice-questions',
                      htmlFor: 'chk_signing_official'
                    }, ['Signing Official'])
                  ]),
                ])
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
                      checked: this.userHasRole(adminRole),
                      className: 'checkbox-inline user-checkbox',
                      onChange: e => this.roleStatusChanged(e, adminRole)
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
                  isRendered: this.userHasRole(adminRole),
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
                  disabled: !displayNameValid
                }, ['Save']),
              ])
            ])
          ]),
          ResearcherReview({
            isRendered: !isEmpty(this.state.user),
            user: this.state.user
          })
        ])
      ])
    );
  }
});
