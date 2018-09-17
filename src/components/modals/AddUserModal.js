import { Component } from 'react';
import { div, form, input, label, hh } from 'react-hyperscript-helpers';
import { BaseModal } from '../BaseModal';
import { User } from "../../libs/ajax";
import { Alert } from '../Alert';
import { USER_ROLES } from '../../libs/utils';

export const AddUserModal = hh(class AddUserModal extends Component {

  alerts = [];

  constructor(props) {
    super(props);
    this.toggleState = this.toggleState.bind(this);
    this.handleChange = this.handleChange.bind(this);
  }

  componentWillMount() {
    console.log(this.props);
    this.initForm();

  }

  initForm() {
    if (this.props.user && this.props.user !== undefined) {
      this.setState({
        mode: 'Edit',
        roles: this.props.user.roles.map((role, ix) => role.name),
        displayName: this.props.user.displayName,
        email: this.props.user.email,
        user: this.props.user,
        delegateDacUser: {},
        delegateDataOwner: {},
        delegateMemberRequired: false,
        newAlternativeUserNeeded: {},
      },
        () => {
          this.setState({
            wasChairperson: this.userWas(USER_ROLES.chairperson),
            wasMember: this.userWas(USER_ROLES.member),
            wasDataOwner: this.userWas(USER_ROLES.dataOwner),
            wasResearcher: this.userWas(USER_ROLES.researcher),
          });
        });
    } else {
      this.setState({
        mode: 'Add',
        roles: [],
        displayName: '',
        email: ''
      });
    }
  }

  OKHandler = (event) => {

    let roles = this.state.roles.slice();
    const rolesName = roles.map(
      role => { return { name: role } }
    );

    switch (this.state.mode) {
      case 'Add':
        const newUser = {
          displayName: this.state.displayName,
          email: this.state.email,
          roles: rolesName
        };
        User.create(newUser);
        break;

      case 'Edit':

        const wasChairperson = this.userWas(USER_ROLES.chairperson);
        const wasMember = this.userWas(USER_ROLES.member);
        const wasDataOwner = this.userWas(USER_ROLES.dataOwner);
        const wasResearcher = this.userWas(USER_ROLES.researcher);

        console.log(wasChairperson, wasMember, wasDataOwner, wasResearcher);

        const editUser = {
          displayName: this.state.displayName,
          email: this.state.email,
          roles: rolesName,
          completed: this.state.user.completed,
          createDate: this.state.user.createDate,
          dacUserId: this.state.user.dacUserId,
          researcher: this.state.user.researcher,
          status: this.state.user.status,
        };
        User.update(editUser, this.state.user.dacUserId);
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

  toggleState(role) {
    const existingRole = this.state.roles.find(stRole => stRole === role);
    let roleList = this.state.roles;
    if (!existingRole) {
      roleList.push(role);
      this.setState({ roles: roleList });
    } else {
      roleList.splice(this.state.roles.indexOf(role), 1);
      this.setState({ roles: roleList });
    }
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

  //---------------------------------------
  // $scope.$on("changeChairpersonRoleAlert", function (event, arg) {
  //   $scope.$apply(function () {
  //       if (arg.alert) {
  //           $scope.changeChairpersonRoleAlert();
  //       } else {
  //           $scope.closeAlert(1);
  //       }
  //   });
  // });


  async searchDACUsers(role) {
    return await User.validateDelegation(role, this.state.user);
  };

  checkNoEmptyDelegateCandidates = (needsDelegation, delegateCandidates, role) => {
    const valid = needsDelegation === true && delegateCandidates.length === 0 ? false : true;
    if (!valid) {
      this.errorNoAvailableCandidates(role);
    }
    return valid;
  };

  memberChanged = (e) => {
    const checkState = e.target.checked;
    const role = USER_ROLES.member;
    console.log(checkState, role);
    // need to set the role in roles
    if (this.state.wasMember) {
      if (!checkState) {
        this.searchDACUsers(USER_ROLES.member).then(
          (result) => {
            if (this.checkNoEmptyDelegateCandidates(result.needsDelegation, result.delegateCandidates, role)) {
              this.setState(prev => {
                prev.delegateMemberRequired = role === USER_ROLES.member ? result.needsDelegation : false;
                prev.delegateDacUser.delegateCandidates = result.delegateCandidates;
                prev.delegateDacUser.needsDelegation = result.needsDelegation;
                return prev;
              });
              return;
            }
          });
      } else {
        this.closeNoAvailableCandidatesAlert(role);
        this.setState(prev => {
          prev.delegateDacUser.delegateCandidates = [];
          prev.delegateDacUser.needsDelegation = false;
          prev.delegateMemberRequired = false;
          return prev;
        });
      }
    }
  };

  chairpersonChanged = (e) => {
    const checkState = e.target.checked;
    const role = USER_ROLES.chairperson;
    console.log(checkState, role);
    // need to set the role in roles
    if (this.state.wasChairperson) {
      if (!checkState) {
        this.searchDACUsers(role).then(
          (result) => {
            if (this.checkNoEmptyDelegateCandidates(result.needsDelegation, result.delegateCandidates, role)) {
              this.setState(prev => {
                prev.delegateDacUser.delegateCandidates = result.delegateCandidates;
                prev.delegateDacUser.needsDelegation = result.needsDelegation;;
                // prev.delegateMemberRequired = false;
                return prev;
              });
              return;
            }
          });
      } else {
        this.closeNoAvailableCandidatesAlert(role);
        this.setState(prev => {
          prev.delegateDacUser.delegateCandidates = [];
          prev.delegateDacUser.needsDelegation = false;
          prev.delegateMemberRequired = false;
          return prev;
        });
      }
    }
  };

  dataOwnerChanged = (e) => {
    const checkState = e.target.checked;
    const role = USER_ROLES.dataOwner;
    console.log(checkState, role);
    // need to set the role in roles
    if (this.state.wasDataOwner) {
      if (!checkState) {
        this.searchDACUsers(USER_ROLES.dataOwner).then(
          (result) => {
            if (this.checkNoEmptyDelegateCandidates(result.needsDelegation, result.delegateCandidates, USER_ROLES.dataOwner)) {
              // $scope.delegateDataOwner.delegateCandidates = result.delegateCandidates;
              // $scope.delegateDataOwner.needsDelegation = result.needsDelegation;
              this.setState(prev => {
                prev.delegateDacUser.delegateCandidates = result.delegateCandidates;
                prev.delegateDacUser.needsDelegation = result.needsDelegation;
                // prev.delegateMemberRequired = false;
                return prev;
              });
              return;
            }
          });
      } else {
        this.closeNoAvailableCandidatesAlert(USER_ROLES.dataOwner);
        // $scope.delegateDataOwner.delegateCandidates = [];
        // $scope.delegateDataOwner.needsDelegation = false;
        this.setState(prev => {
          prev.delegateDacUser.delegateCandidates = [];
          prev.delegateDacUser.needsDelegation = false;
          // prev.delegateMemberRequired = false;
          return prev;
        });
      }
    }
  };

  researcherChanged = (e) => {
    const checkState = e.target.checked;
    const role = USER_ROLES.researcher;
    console.log(checkState, role);
    // need to set the role in roles
    if (this.state.wasResearcher) {
      if (!checkState) {
        this.changeResearcherRoleAlert();
      }
      else {
        this.closeAlert(3);
      }
    }
  };

  //--------------------------------------

  /*****ALERTS*****/

  // this.alerts = [];

  changeChairpersonRoleAlert = (index) => {
    this.alerts.splice(index, 1);
    this.alerts.push({
      type: 'danger',
      title: 'Warning!',
      msg: 'In order to have only one Chairperson in the system, the current Chairperson is going to become an Alumni.',
      alertType: 1
    });
  };

  changeResearcherRoleAlert = (index) => {
    this.alerts.splice(index, 1);
    this.alerts.push({
      type: 'danger',
      title: 'Warning!',
      msg: 'By removing the researcher role, the user Data Access Requests will be canceled, and all the elections related to them.',
      alertType: 3
    });
  };

  errorNoAvailableCandidates = (role) => {
    this.state.newAlternativeUserNeeded[role] = true;
    this.alerts.push({
      type: 'danger',
      title: "Edition can't be made!",
      msg: "There are no available users to delegate " + role.toLowerCase() + " responsibilities, please add a new User.",
      alertType: role
    });
  };

  errorOnEdition = (index) => {
    this.alerts.splice(index, 1);
    this.alerts.push({
      type: 'danger',
      title: "Edition can't be made!",
      msg: index,
      alertType: 2
    });
  };

  closeAlert = (alertType) => {
    var l = this.alerts.length;
    var i = 0;
    while (i < l) {
      if (this.alerts[i].alertType === alertType) {
        this.alerts.splice(i, 1);
        return;
      }
      i++;
    }
  };

  closeNoAvailableCandidatesAlert = (role) => {
    var l = this.alerts.length;
    var i = 0;
    while (i < l) {
      if (this.alerts[i].alertType === role) {
        // this.alerts.splice(i, 1);
        this.state.newAlternativeUserNeeded[role] = false;
        return;
      }
      i++;
    }
  };
  //-----------------------------------------


  handleChange(event) {
    const value = event.target.name;
    this.setState({ [value]: event.target.value });
  }

  render() {
    console.log(this.state);

    const { displayName, email, roles } = this.state;

    return (
      BaseModal({
        showModal: this.props.showModal,
        onRequestClose: this.closeHandler,
        onAfterOpen: this.afterOpenHandler,
        imgSrc: this.state.mode === 'Add' ? "/images/icon_add_user.png" : "/images/icon_edit_user.png",
        color: "common",
        title: this.state.mode === 'Add' ? "Add User" : "Edit User",
        description: this.state.mode === 'Add' ? "Catalog a new User in the system" : "Edit a User in the system",
        action: { label: this.state.mode === 'Add' ? "Add" : 'Save', handler: this.OKHandler }
      },
        [
          form({ className: "form-horizontal css-form", name: "consentForm", noValidate: "true", encType: "multipart/form-data" }, [
            div({ className: "form-group first-form-group" }, [
              label({ id: "lbl_name", className: "col-lg-3 col-md-3 col-sm-3 col-xs-4 control-label common-color" }, ["Name"]),
              div({ className: "col-lg-9 col-md-9 col-sm-9 col-xs-8" }, [
                input({
                  type: "text",
                  name: "displayName",
                  id: "txt_name",
                  className: "form-control col-lg-12 vote-input",
                  placeholder: "User name",
                  required: "true",
                  value: displayName,
                  onChange: this.handleChange
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
                  required: "true",
                  value: email,
                  onChange: this.handleChange
                }),
              ]),
            ]),

            div({ className: "form-group" }, [
              label({ className: "col-lg-3 col-md-3 col-sm-3 col-xs-4 control-label common-color" }, ["Roles"]),
              div({ className: "col-lg-9 col-md-9 col-sm-9 col-xs-8 bold" }, [
                div({ className: "col-lg-6 col-md-6 col-sm-6 col-xs-6" }, [
                  div({ className: "checkbox" }, [
                    input({
                      type: "checkbox",
                      id: "chk_member",
                      className: "checkbox-inline user-checkbox",
                      defaultChecked: roles.find(role => role === 'Member'),
                      onChange: this.memberChanged,
                      disabled: roles.includes('Chairperson') || roles.includes('Alumni') || roles.includes('Researcher')
                    }),
                    label({ id: "lbl_member", className: "regular-checkbox rp-choice-questions", htmlFor: "chk_member" }, ["Member"]),
                  ]),
                  div({ className: "checkbox" }, [
                    input({
                      type: "checkbox",
                      id: "chk_chairperson",
                      className: "checkbox-inline user-checkbox",
                      defaultChecked: roles.find(role => role === 'Chairperson'),
                      onChange: this.chairpersonChanged,
                      disabled: roles.includes('Member') || roles.includes('Alumni') || roles.includes('Researcher')
                    }),
                    label({ id: "lbl_chairperson", className: "regular-checkbox rp-choice-questions", htmlFor: "chk_chairperson" }, ["Chairperson"]),
                  ]),
                  div({ className: "checkbox" }, [
                    input({
                      type: "checkbox",
                      id: "chk_alumni",
                      defaultChecked: roles.find(role => role === 'Alumni'),
                      className: "checkbox-inline user-checkbox",
                      onChange: () => this.toggleState('Alumni'),
                      disabled: roles.includes('Member') || roles.includes('Chairperson'),
                    }),
                    label({ id: "lbl_alumni", className: "regular-checkbox rp-choice-questions", htmlFor: "chk_alumni" }, ["Alumni"]),
                  ]),
                ]),
                div({ className: "col-lg-6 col-md-6 col-sm-6 col-xs-6" }, [
                  div({ className: "checkbox" }, [
                    input({
                      type: "checkbox",
                      id: "chk_admin",
                      defaultChecked: roles.find(role => role === 'Admin'),
                      className: "checkbox-inline user-checkbox",
                      onChange: () => this.toggleState('Admin'),
                    }),
                    label({ id: "lbl_admin", className: "regular-checkbox rp-choice-questions", htmlFor: "chk_admin" }, ["Admin"]),
                  ]),
                  div({ className: "checkbox" }, [
                    input({
                      type: "checkbox",
                      id: "chk_researcher",
                      defaultChecked: roles.find(role => role === 'Researcher'),
                      className: "checkbox-inline user-checkbox",
                      onChange: this.researcherChanged,
                      disabled: roles.includes('Member') || roles.includes('Chairperson')
                    }),
                    label({ id: "lbl_researcher", className: "regular-checkbox rp-choice-questions", htmlFor: "chk_researcher" }, ["Researcher"]),
                  ]),
                  div({ className: "checkbox" }, [
                    input({
                      type: "checkbox",
                      id: "chk_dataOwner",
                      defaultChecked: roles.find(role => role === 'DataOwner'),
                      className: "checkbox-inline user-checkbox",
                      onChange: this.dataOwnerChanged,
                    }),
                    label({ id: "lbl_dataOwner", className: "regular-checkbox rp-choice-questions", htmlFor: "chk_dataOwner" }, ["Data Owner"]),
                  ]),
                ]),
              ]),
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
                    }),
                    label({ className: "regular-checkbox rp-choice-questions bold", htmlFor: "emailPreference" }, ["Disable Admin email notifications"]),
                  ])
                ]),
            ]),
          ]),

          div({ isRendered: false }, [
            Alert({ id: "modal", type: "danger", title: alert.title, description: alert.msg })
          ])
        ])
    );
  }
});
