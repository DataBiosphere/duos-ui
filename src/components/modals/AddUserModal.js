import React, { Component, Fragment } from 'react';
import { div, form, input, label, hh, h, select, option } from 'react-hyperscript-helpers';
import { BaseModal } from '../BaseModal';
import { User } from "../../libs/ajax";
import { Alert } from '../Alert';
import { USER_ROLES_UPPER } from '../../libs/utils';

export const AddUserModal = hh(class AddUserModal extends Component {

  constructor(props) {
    super(props);

    this.state = this.initialState();

    this.toggleState = this.toggleState.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.nameRef = React.createRef();
    this.emailRef = React.createRef();
  }

  initialState() {
    let initialValue;

    let rolesState = {}
    rolesState[USER_ROLES_UPPER.admin] = false;
    rolesState[USER_ROLES_UPPER.alumni] = false;
    rolesState[USER_ROLES_UPPER.chairperson] = false;
    rolesState[USER_ROLES_UPPER.dataOwner] = false;
    rolesState[USER_ROLES_UPPER.member] = false;
    rolesState[USER_ROLES_UPPER.researcher] = false;

    initialValue = {
      loading: true,
      displayName: '',
      email: '',
      displayNameValid: false,
      emailValid: false,
      invalidForm: true,
      submitted: false,
      roleValid: false,
      alerts: [],
      rolesState: rolesState,
      roles: [],
      delegateDacUser: {
        needsDelegation: false,
        delegateCandidates: []
      },
      delegateDataOwner: {
        needsDelegation: false,
        delegateCandidates: []
      }
    };

    return initialValue;
  }

  componentDidMount() {
    this.initForm();
  }

  async initForm() {

    if (this.props.showModal === false) {
      return;
    }

    let rolesState = {}
    rolesState[USER_ROLES_UPPER.admin] = false;
    rolesState[USER_ROLES_UPPER.alumni] = false;
    rolesState[USER_ROLES_UPPER.chairperson] = false;
    rolesState[USER_ROLES_UPPER.dataOwner] = false;
    rolesState[USER_ROLES_UPPER.member] = false;
    rolesState[USER_ROLES_UPPER.researcher] = false;

    if (this.props.user && this.props.user !== undefined) {

      const user = await User.getByEmail(this.props.user.email);

      user.roles.forEach(role => {
        rolesState[role.name.toUpperCase()] = true;
      });

      this.setState({
        mode: 'Edit',
        roles: user.roles.map(role => role.name.toUpperCase()),
        displayName: user.displayName,
        email: user.email,
        user: user,
        rolesState: Object.assign({}, rolesState),
        originalRolesState: Object.assign({}, rolesState),
        originalRoles: user.roles.slice(),
        emailPreference: false,
        delegateDacUser: {
          needsDelegation: false,
          delegateCandidates: []
        },
        delegateDataOwner: {
          needsDelegation: false,
          delegateCandidates: []
        },
        delegateMemberRequired: false,
        newAlternativeUserNeeded: {},
      },
        () => {
          let r1 = this.nameRef.current;
          let r2 = this.emailRef.current;

          this.setState({
            wasChairperson: rolesState[USER_ROLES_UPPER.chairperson],
            wasMember: rolesState[USER_ROLES_UPPER.member],
            wasDataOwner: rolesState[USER_ROLES_UPPER.dataOwner],
            wasResearcher: rolesState[USER_ROLES_UPPER.researcher],
            displayNameValid: r1.validity.valid,
            emailValid: r2.validity.valid,
            loading: false
          });
        });
    } else {
      this.setState({
        mode: 'Add',
        roles: [],
        displayName: '',
        email: '',
        rolesState: Object.assign({}, rolesState),
        originalRolesState: Object.assign({}, rolesState),
        emailPreference: false,
        delegateDacUser: {
          needsDelegation: false,
          delegateCandidates: []
        },
        delegateDataOwner: {
          needsDelegation: false,
          delegateCandidates: []
        },
        delegateMemberRequired: false,
        newAlternativeUserNeeded: {},
        wasChairperson: false,
        wasMember: false,
        wasDataOwner: false,
        wasResearcher: false,
        loading: false
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
  }

  OKHandler = async (event) => {

    event.persist();

    let key;
    let updatedRoles = [];

    this.setState({
      submitted: true
    });

    const validForm = this.state.displayNameValid && this.state.emailValid && this.state.roleValid;

    if (validForm === false) {
      return;
    }

    for (key in this.state.rolesState) {

      if (this.state.rolesState[key] === true) {
        if (key === USER_ROLES_UPPER.admin) {
          updatedRoles.push({
            name: key,
            emailPreference: this.state.emailPreference
          });
        } else updatedRoles.push({
          name: key
        });
      }
    }

    switch (this.state.mode) {

      case 'Add':
        const newUser = {
          displayName: this.state.displayName,
          email: this.state.email,
          roles: updatedRoles
        };
        await User.create(newUser);
        break;

      case 'Edit':
        let payload = {};

        const editUser = {
          displayName: this.state.displayName,
          email: this.state.email,
          completed: this.state.user.completed,
          createDate: this.state.user.createDate,
          dacUserId: this.state.user.dacUserId,
          researcher: this.state.user.researcher,
          status: this.state.user.status,
          roles: updatedRoles,
        };
        payload.updatedUser = editUser;

        if (this.state.delegateDacUser.needsDelegation) {
          payload.userToDelegate = JSON.parse(this.state.alternativeDACMemberUser);
        }

        if (this.state.delegateDataOwner.needsDelegation) {
          payload.alternativeDataOwnerUser = JSON.parse(this.state.alternativeDataOwnerUser);
        }

        await User.update(payload, this.state.user.dacUserId);
        break;

      default:
        break;
    }

    event.preventDefault();
    this.props.onOKRequest('addUser');

  }

  closeHandler = () => {
    this.props.onCloseRequest('addUser');
  }

  afterOpenHandler = () => {
    this.props.onAfterOpen('addUser');
  }

  toggleState(roleName) {
    let rs = Object.assign({}, this.state.rolesState);
    rs[roleName] = !rs[roleName];

    this.setState(prev => {
      prev.rolesState = Object.assign({}, rs);
      prev.roleValid = this.validateRoles(rs);
      prev.invalidForm = (prev.rolevValid && prev.displayNameValid && prev.emailValid);
      return prev;
    });
  }

  validateRoles(rs) {
    let roleValid = false;
    for (let key in rs) {
      if (rs[key]) {
        roleValid = true;
      }
    }
    return roleValid;
  }

  userWas = (rol) => {
    let match = false;
    this.state.user.roles.forEach(role => {
      if (role.name.toUpperCase() === rol.toUpperCase()) {
        match = true;
      }
    });
    return match;
  };

  async searchDACUsers(role) {
    let user = {
      roles: this.props.user.roles.map(
        (role, ix) => {
          return { name: role.name };
        }
      ),
      displayName: this.props.user.displayName,
      email: this.props.user.email,
    };
    return await User.validateDelegation(role, user);
  };

  checkNoEmptyDelegateCandidates = (needsDelegation, delegateCandidates, role) => {
    const valid = needsDelegation === true && delegateCandidates.length === 0 ? false : true;
    if (!valid) {
      this.errorNoAvailableCandidates(role);
    }
    return valid;
  };

  emailPreferenceChanged = (e) => {
    const checkState = e.target.checked;
    this.setState({
      emailPreference: checkState
    })
  };

  memberChanged = async (e) => {
    const checkState = e.target.checked;

    // need to set the role in roles
    if (this.state.wasMember) {
      if (!checkState) {
        // removing member role, need to verify if needs to add another user as member 
        const result = await this.searchDACUsers(USER_ROLES_UPPER.member)
        if (this.checkNoEmptyDelegateCandidates(result.needsDelegation, result.delegateCandidates, USER_ROLES_UPPER.member)) {
          this.setState(prev => {
            prev.delegateMemberRequired = result.needsDelegation;
            prev.delegateDacUser.delegateCandidates = result.delegateCandidates;
            prev.delegateDacUser.needsDelegation = result.needsDelegation;
            return prev;
          }, () => {
            if (this.state.delegateDacUser.delegateCandidates.length === 1) {
              this.setState({
                alternativeDACMemberUser: JSON.stringify(this.state.delegateDacUser.delegateCandidates[0])
              })
            }
          });
          // return;
        }
      } else {
        // adding member role to an already member, no need to do anything else
        this.closeNoAvailableCandidatesAlert(USER_ROLES_UPPER.member);
        this.setState(prev => {
          prev.delegateMemberRequired = false;
          prev.delegateDacUser.delegateCandidates = [];
          prev.delegateDacUser.needsDelegation = false;
          return prev;
        });
      }
    } else {
    }
    this.toggleState(USER_ROLES_UPPER.member);
  };

  chairpersonChanged = async (e) => {
    const checkState = e.target.checked;

    // need to set the role in roles
    if (this.state.wasChairperson) {
      if (!checkState) {
        const result = await this.searchDACUsers(USER_ROLES_UPPER.chairperson);
        if (this.checkNoEmptyDelegateCandidates(result.needsDelegation, result.delegateCandidates, USER_ROLES_UPPER.chairperson)) {
          this.setState(prev => {
            prev.delegateMemberRequired = false;
            prev.delegateDacUser.delegateCandidates = result.delegateCandidates;
            prev.delegateDacUser.needsDelegation = result.needsDelegation;;
            return prev;
          }, () => {
            if (this.state.delegateDacUser.delegateCandidates.length === 1) {
              this.setState({
                alternativeDACMemberUser: JSON.stringify(this.state.delegateDacUser.delegateCandidates[0])
              })
            }
          });
          // return;
        }
      } else {
        this.closeNoAvailableCandidatesAlert(USER_ROLES_UPPER.chairperson);
        this.setState(prev => {
          prev.delegateMemberRequired = false;
          prev.delegateDacUser.delegateCandidates = [];
          prev.delegateDacUser.needsDelegation = false;
          return prev;
        });
      }
    } else {
      if (checkState) {
        this.changeChairpersonRoleAlert();
      }
      else {
        this.closeAlert('1');
      }

    }
    this.toggleState(USER_ROLES_UPPER.chairperson);
  };

  dataOwnerChanged = async (e) => {
    const checkState = e.target.checked;

    // need to set the role in roles
    if (this.state.wasDataOwner) {
      if (!checkState) {
        const result = await this.searchDACUsers(USER_ROLES_UPPER.dataOwner);
        if (this.checkNoEmptyDelegateCandidates(result.needsDelegation, result.delegateCandidates, USER_ROLES_UPPER.dataOwner)) {
          this.setState(prev => {
            prev.delegateDataOwner.delegateCandidates = result.delegateCandidates;
            prev.delegateDataOwner.needsDelegation = result.needsDelegation;
            return prev;
          }, () => {
            if (this.state.delegateDataOwner.delegateCandidates.length === 1) {
              this.setState({
                alternativeDataOwnerUser: JSON.stringify(this.state.delegateDataOwner.delegateCandidates[0])
              })
            }
          });
          // return;
        }
      } else {
        this.closeNoAvailableCandidatesAlert(USER_ROLES_UPPER.dataOwner);
        this.setState(prev => {
          prev.delegateDataOwner.delegateCandidates = [];
          prev.delegateDataOwner.needsDelegation = false;
          return prev;
        });
      }
    } else {

    }
    this.toggleState(USER_ROLES_UPPER.dataOwner);
  };

  researcherChanged = (e) => {
    const checkState = e.target.checked;

    // need to set the role in roles
    if (this.state.wasResearcher) {
      if (!checkState) {
        this.changeResearcherRoleAlert();
      }
      else {
        this.closeAlert('3');
      }
    }
    this.toggleState(USER_ROLES_UPPER.researcher);
  };

  alumniChanged = (e) => {
    const role = USER_ROLES_UPPER.alumni;
    this.toggleState(role);
  }

  adminChanged = (e) => {
    const role = USER_ROLES_UPPER.admin;
    this.toggleState(role);
  }

  /*****ALERTS*****/

  changeChairpersonRoleAlert = (index) => {
    this.setState(prev => {
      prev.alerts[0] = {
        type: 'danger',
        title: 'Warning!',
        msg: 'In order to have only one Chairperson in the system, the current Chairperson is going to become an Alumni.',
        alertType: '1'
      };
      return prev;
    });
  };

  changeResearcherRoleAlert = (index) => {
    this.setState(prev => {
      prev.alerts[0] = {
        type: 'danger',
        title: 'Warning!',
        msg: 'By removing the researcher role, the user Data Access Requests will be canceled, and all the elections related to them.',
        alertType: '3'
      };
      return prev;
    });
  };

  errorNoAvailableCandidates = (role) => {
    this.setState(prev => {
      prev.newAlternativeUserNeeded[role] = true;
      prev.alerts[0] = {
        type: 'danger',
        title: "Edition can't be made!",
        msg: "There are no available users to delegate " + role.toLowerCase() + " responsibilities, please add a new User.",
        alertType: role
      };
      return prev;
    });

  };

  errorOnEdition = (index) => {
    this.setState(prev => {
      prev.alerts[0] = {
        type: 'danger',
        title: "Edition can't be made!",
        msg: index,
        alertType: '2'
      };
      return prev;
    });
  };

  closeAlert = (alertType) => {
    const alerts = this.state.alerts.filter(alert => {
      return alert.alertType !== alertType
    });
    this.setState({
      alerts: alerts
    });
  };

  closeNoAvailableCandidatesAlert = (role) => {
    this.setState(prev => {
      prev.alerts = [];
      return prev;
    });
    // const alerts = this.state.alerts.filter(alert => alert.alertType !== alertType);
    // this.setState({
    //   alerts: alerts
    // });

    // var l = this.alerts.length;
    // var i = 0;
    // while (i < l) {
    //   if (this.alerts[i].alertType === role) {
    //     // this.alerts.splice(i, 1);
    //     this.setState(prev => {
    //       prev.newAlternativeUserNeeded[role] = false;
    //       return prev;
    //     });
    //     return;
    //   }
    //   i++;
    // }
  };

  handleChange(event) {
    const name = event.target.name;
    const validName = name + 'Valid';

    this.setState({
      [name]: event.target.value,
      [validName]: event.currentTarget.validity.valid,
      roleValid: this.validateRoles(this.state.rolesState)
    });
  }

  selectAlternativeDACMemberUser = (e) => {
    const target = e.currentTarget;
    const value = target.value;

    this.setState(prev => {
      prev.alternativeDACMemberUser = value;
      return prev;
    });
  }

  selectAlternativeDataOwnerUser = (e) => {
    const target = e.target;
    const value = target.value;

    this.setState(prev => {
      prev.alternativeDataOwnerUser = value;
      return prev;
    });
  }

  formChange = (e) => {
    this.setState(prev => {
      prev.roleValid = this.validateRoles(prev.rolesState);
      prev.invalidForm = (prev.roleValid && prev.displayNameValid && prev.emailValid);
      return prev;
    })
  }

  render() {

    const { displayName, email, roles, rolesState, emailPreference, displayNameValid, emailValid, roleValid } = this.state;

    // if (loading) {  return LoadingIndicator();   }

    const validForm = displayNameValid && emailValid && roleValid;

    const isChairPerson = rolesState[USER_ROLES_UPPER.chairperson];
    const isMember = rolesState[USER_ROLES_UPPER.member];
    const isAdmin = rolesState[USER_ROLES_UPPER.admin];
    const isResearcher = rolesState[USER_ROLES_UPPER.researcher];
    const isDataOwner = rolesState[USER_ROLES_UPPER.dataOwner];
    const isAlumni = rolesState[USER_ROLES_UPPER.alumni];

    const isResearcherDisabled = isMember || isChairPerson;
    const isMemberDisabled = isChairPerson || isAlumni || isResearcher;
    const isChairPersonDisabled = isMember || isAlumni || isResearcher;
    const isAlumniDisabled = isMember || isChairPerson;

    return (
      BaseModal({
        id: "addUserModal",
        showModal: this.props.showModal,
        disableOkBtn: !validForm, //this.state.invalidForm === true || this.state.roleValid === false,
        onRequestClose: this.closeHandler,
        onAfterOpen: this.afterOpenHandler,
        imgSrc: this.state.mode === 'Add' ? "/images/icon_add_user.png" : "/images/icon_edit_user.png",
        color: "common",
        title: this.state.mode === 'Add' ? "Add User" : "Edit User",
        description: this.state.mode === 'Add' ? "Catalog a new User in the system" : "Edit a User in the system",
        action: { label: this.state.mode === 'Add' ? "Add" : 'Save', handler: this.OKHandler }
      },
        [
          form({ className: "form-horizontal css-form", name: "userForm", encType: "multipart/form-data", onChange: this.formChange }, [
            div({ className: "form-group first-form-group" }, [
              label({ id: "lbl_name", className: "col-lg-3 col-md-3 col-sm-3 col-xs-4 control-label common-color" }, ["Name"]),
              div({ className: "col-lg-9 col-md-9 col-sm-9 col-xs-8" }, [
                input({
                  type: "text",
                  name: "displayName",
                  id: "txt_name",
                  className: "form-control col-lg-12 vote-input",
                  placeholder: "User name",
                  required: true,
                  value: displayName,
                  autoFocus: true,
                  onChange: this.handleChange,
                  ref: this.nameRef
                }),
              ]),
            ]),

            div({ className: "form-group" }, [
              label({ id: "lbl_email", className: "col-lg-3 col-md-3 col-sm-3 col-xs-4 control-label common-color" }, ["Google account id"]),
              div({ className: "col-lg-9 col-md-9 col-sm-9 col-xs-8" }, [
                input({
                  type: "email",
                  name: "email",
                  id: "txt_email",
                  className: "form-control col-lg-12 vote-input",
                  placeholder: "e.g. username@broadinstitute.org",
                  required: true,
                  value: email,
                  onChange: this.handleChange,
                  ref: this.emailRef
                }),
              ]),
            ]),

            div({ className: "form-group" }, [
              label({ className: "col-lg-3 col-md-3 col-sm-3 col-xs-4 control-label common-color" }, ["Roles"]),
              div({ className: "col-lg-9 col-md-9 col-sm-9 col-xs-8 bold" }, [
                div({ className: "col-lg-6 col-md-6 col-sm-6 col-xs-6" }, [

                  div({ className: "checkbox", disabled: isMemberDisabled }, [
                    input({
                      type: "checkbox",
                      id: "chk_member",
                      className: "checkbox-inline user-checkbox",
                      checked: isMember,
                      // defaultChecked: isMember,
                      onChange: this.memberChanged,
                      disabled: isMemberDisabled,
                    }),
                    label({ id: "lbl_member", className: "regular-checkbox rp-choice-questions", htmlFor: "chk_member" }, ["Member"])
                  ]),

                  div({ className: "checkbox", disabled: isChairPersonDisabled }, [
                    input({
                      type: "checkbox",
                      id: "chk_chairperson",
                      className: "checkbox-inline user-checkbox",
                      checked: isChairPerson,
                      // defaultChecked: isChairPerson,
                      onChange: this.chairpersonChanged,
                      disabled: isChairPersonDisabled
                    }),
                    label({ id: "lbl_chairperson", className: "regular-checkbox rp-choice-questions", htmlFor: "chk_chairperson" }, ["Chairperson"])
                  ]),

                  div({ className: "checkbox", disabled: isAlumniDisabled }, [
                    input({
                      type: "checkbox",
                      id: "chk_alumni",
                      checked: isAlumni,
                      // defaultChecked: isAlumni,
                      className: "checkbox-inline user-checkbox",
                      onChange: this.alumniChanged,
                      disabled: isAlumniDisabled,
                    }),
                    label({ id: "lbl_alumni", className: "regular-checkbox rp-choice-questions", htmlFor: "chk_alumni" }, ["Alumni"])
                  ]),

                ]),

                div({ className: "col-lg-6 col-md-6 col-sm-6 col-xs-6" }, [

                  div({ className: "checkbox" }, [
                    input({
                      type: "checkbox",
                      id: "chk_admin",
                      checked: isAdmin,
                      // defaultChecked: isAdmin,
                      className: "checkbox-inline user-checkbox",
                      onChange: this.adminChanged,
                    }),
                    label({ id: "lbl_admin", className: "regular-checkbox rp-choice-questions", htmlFor: "chk_admin" }, ["Admin"])
                  ]),

                  div({ className: "checkbox", disabled: isResearcherDisabled }, [
                    input({
                      type: "checkbox",
                      id: "chk_researcher",
                      checked: isResearcher,
                      // defaultChecked: isResearcher,
                      className: "checkbox-inline user-checkbox",
                      onChange: this.researcherChanged,
                      disabled: isResearcherDisabled
                    }),
                    label({ id: "lbl_researcher", className: "regular-checkbox rp-choice-questions", htmlFor: "chk_researcher" }, ["Researcher"])
                  ]),

                  div({ className: "checkbox" }, [
                    input({
                      type: "checkbox",
                      id: "chk_dataOwner",
                      checked: isDataOwner,
                      // defaultChecked: isDataOwner,
                      className: "checkbox-inline user-checkbox",
                      onChange: this.dataOwnerChanged,
                    }),
                    label({ id: "lbl_dataOwner", className: "regular-checkbox rp-choice-questions", htmlFor: "chk_dataOwner" }, ["Data Owner"])
                  ])
                ])
              ])
            ]),
            div({ className: "form-group" }, [
              div({
                isRendered: roles.includes('Admin'),
                className: "col-lg-9 col-lg-offset-3 col-md-9 col-md-offset-3 col-sm-9 col-sm-offset-3 col-xs-8 col-xs-offset-4",
                style: { 'paddingLeft': '26px' }
              }, [
                  div({ className: "checkbox" }, [
                    input({
                      id: "chk_emailPreference",
                      type: "checkbox",
                      className: "checkbox-inline user-checkbox",
                      checked: emailPreference,
                      // defaultChecked: emailPreference,
                      onChange: this.emailPreferenceChanged,
                    }),
                    label({ className: "regular-checkbox rp-choice-questions bold", htmlFor: "chk_emailPreference" }, ["Disable Admin email notifications"])
                  ])
                ])
            ])
          ]),

          div({ isRendered: this.state.nameValid === false && this.state.submitted === true }, [
            Alert({ id: "nameAlertl", type: 'danger', title: 'Invalid Name!', description: 'Please provide a valid Name' })
          ]),

          div({ isRendered: this.state.emailValid === false && this.state.submitted === true }, [
            Alert({ id: "emailAlert", type: 'danger', title: 'Invalid Email!', description: 'Please provide a valid email address' })
          ]),

          div({ isRendered: this.state.alerts.length > 0 }, [
            this.state.alerts.map((alert, ix) => {
              return (
                h(Fragment, { key: "alert_" + ix }, [
                  Alert({ id: "modal_" + ix, type: alert.type, title: alert.title, description: alert.msg })
                ])
              );
            })
          ]),

          div({ isRendered: this.state.delegateDacUser.needsDelegation, className: "form-group rp-last-group" }, [
            div({ className: "row no-margin f-center" }, [
              div({ className: "control-label default-color f-center", style: { "paddingBottom": "10px" } }, ["Member responsabilities must be delegated to a different user, please select one from below:"]),

              label({ id: "lbl_alternativeUser", className: "col-lg-3 col-md-3 col-sm-3 col-xs-4 control-label common-color" }, ["Alternative User"]),
              div({ className: "col-lg-9 col-md-9 col-sm-9 col-xs-8 " }, [
                select({
                  id: "sel_alternativeUser", className: "form-control col-lg-12", value: this.state.alternativeDACMemberUser,
                  required: this.state.delegateDacUser.needsDelegation, onChange: this.selectAlternativeDACMemberUser
                }, [
                    this.state.delegateDacUser.delegateCandidates.map((user, uIndex) => {
                      return h(Fragment, { key: uIndex }, [
                        option({ value: JSON.stringify(user) }, [user.displayName])
                      ]);
                    })
                  ])
              ])
            ])
          ]),

          div({ isRendered: this.state.delegateDataOwner.needsDelegation, className: "form-group rp-last-group" }, [
            div({ className: "row no-margin f-center" }, [
              div({ className: "control-label default-color f-center", style: { "paddingBottom": "10px" } }, ["Member responsabilities must be delegated to a different user, please select one from below:"]),

              label({ id: "lbl_alternativeDataOwner", className: "col-lg-3 col-md-3 col-sm-3 col-xs-4 control-label common-color" }, ["Alternative DataOwner"]),
              div({ className: "col-lg-9 col-md-9 col-sm-9 col-xs-8 " }, [
                select({
                  id: "sel_alternativeDataOwner", className: "form-control col-lg-12", value: this.state.alternativeDataOwnerUser,
                  required: this.state.delegateDataOwner.needsDelegation, onChange: this.selectAlternativeDataOwnerUser, placeholder: "Select an alternative Data Owner"
                }, [
                    this.state.delegateDataOwner.delegateCandidates.map((user, uIndex) => {
                      return h(Fragment, { key: uIndex }, [
                        option({ value: JSON.stringify(user) }, [user.displayName])
                      ]);
                    })
                  ])
              ])
            ])
          ]),

          div({ isRendered: false }, [
            Alert({ id: "modal", type: "danger", title: alert.title, description: alert.msg })
          ])])
    );
  }
});
