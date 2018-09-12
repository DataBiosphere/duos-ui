import { Component } from 'react';
import { div, form, input, label, hh } from 'react-hyperscript-helpers';
import { BaseModal } from '../BaseModal';
import { User } from "../../libs/ajax";
import { Alert } from '../Alert';


export const AddUserModal = hh(class AddUserModal extends Component {

  constructor(props) {
    super(props);
    this.state = {
      roles: [],
      displayName: '',
      email: ''
    };
    this.toggleState = this.toggleState.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.OKHandler = this.OKHandler.bind(this);

    this.closeHandler = this.closeHandler.bind(this);
    this.afterOpenHandler = this.afterOpenHandler.bind(this);
    this.OKHandler = this.OKHandler.bind(this);
  }

  OKHandler(event) {
    // this is the method for handling OK click
    // we might do something here, adding a user for instance
    // or delegate it to the parent....
    // DO SOMETHING HERE ...
    let roles = this.state.roles.slice();
    const rolesName = roles.map(
      role => { return { name: role } }
    );
    const userData = {
      displayName: this.state.displayName,
      email: this.state.email,
      roles: rolesName
    };
    User.create(userData);
    event.preventDefault();
    // and call parent's OK Handler
    this.props.onOKRequest('addUser');
  }

  closeHandler() {
    // this is the method to handle Cancel click
    // could do some cleaning here
    // or delegate it to the parent
    // we need to use it to close the
    // DO SOMETHING HERE ...

    // and call parent's close handler
    this.props.onCloseRequest('addUser');
  }

  afterOpenHandler() {
    // DO SOMETHING HERE ...

    // and call parent's after open handler
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

  handleChange(event) {
    const value = event.target.name;
    this.setState({ [value]: event.target.value });
  }

  render() {
    return (
      BaseModal({
        showModal: this.props.showModal,
        onRequestClose: this.closeHandler,
        onAfterOpen: this.afterOpenHandler,
        imgSrc: "/images/icon_add_user.png",
        color: "common",
        title: "Add User",
        description: "Catalog a new User in the system",
        action: { label: "Add", handler: this.OKHandler }
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
                      defaultChecked: this.state.roles.find(role => role === 'Member'),
                      onChange: () => this.toggleState('Member'),
                      disabled: this.state.roles.includes('Chairperson') || this.state.roles.includes('Alumni') || this.state.roles.includes('Researcher')
                    }),
                    label({ id: "lbl_member", className: "regular-checkbox rp-choice-questions", htmlFor: "chk_member" }, ["Member"]),
                  ]),
                  div({ className: "checkbox" }, [
                    input({
                      type: "checkbox",
                      id: "chk_chairperson",
                      className: "checkbox-inline user-checkbox",
                      defaultChecked: this.state.roles.find(role => role === 'Chairperson'),
                      onChange: () => this.toggleState('Chairperson'),
                      disabled: this.state.roles.includes('Member') || this.state.roles.includes('Alumni') || this.state.roles.includes('Researcher')
                    }),
                    label({ id: "lbl_chairperson", className: "regular-checkbox rp-choice-questions", htmlFor: "chk_chairperson" }, ["Chairperson"]),
                  ]),
                  div({ className: "checkbox" }, [
                    input({
                      type: "checkbox",
                      id: "chk_alumni",
                      defaultChecked: this.state.roles.find(role => role === 'Alumni'),
                      className: "checkbox-inline user-checkbox",
                      onChange: () => this.toggleState('Alumni'),
                      disabled: this.state.roles.includes('Member') || this.state.roles.includes('Chairperson'),
                    }),
                    label({ id: "lbl_alumni", className: "regular-checkbox rp-choice-questions", htmlFor: "chk_alumni" }, ["Alumni"]),
                  ]),
                ]),
                div({ className: "col-lg-6 col-md-6 col-sm-6 col-xs-6" }, [
                  div({ className: "checkbox" }, [
                    input({
                      type: "checkbox",
                      id: "chk_admin",
                      defaultChecked: this.state.roles.find(role => role === 'Admin'),
                      className: "checkbox-inline user-checkbox",
                      onChange: () => this.toggleState('Admin'),
                    }),
                    label({ id: "lbl_admin", className: "regular-checkbox rp-choice-questions", htmlFor: "chk_admin" }, ["Admin"]),
                  ]),
                  div({ className: "checkbox" }, [
                    input({
                      type: "checkbox",
                      id: "chk_researcher",
                      defaultChecked: this.state.roles.find(role => role === 'Researcher'),
                      className: "checkbox-inline user-checkbox",
                      onChange: () => this.toggleState('Researcher'),
                      disabled: this.state.roles.includes('Member') || this.state.roles.includes('Chairperson')
                    }),
                    label({ id: "lbl_researcher", className: "regular-checkbox rp-choice-questions", htmlFor: "chk_researcher" }, ["Researcher"]),
                  ]),
                  div({ className: "checkbox" }, [
                    input({
                      type: "checkbox",
                      id: "chk_dataOwner",
                      defaultChecked: this.state.roles.find(role => role === 'Dataowner'),
                      className: "checkbox-inline user-checkbox",
                      onChange: () => this.toggleState('Dataowner'),
                    }),
                    label({ id: "lbl_dataOwner", className: "regular-checkbox rp-choice-questions", htmlFor: "chk_dataOwner" }, ["Data Owner"]),
                  ]),
                ]),
              ]),
            ]),
            div({ className: "form-group" }, [
              div({
                isRendered: this.state.roles.includes('Admin'),
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
