import { Component } from 'react';
import { button, div, h2, h4, h, form, input, label, fieldset, textarea, img, span, hh, p } from 'react-hyperscript-helpers';
import { BaseModal } from '../BaseModal';


export const AddUserModal = hh(class AddUserModal extends Component {

  constructor(props) {
    super(props);
    this.state = {rolesList: [], inputName: '', inputGoogleId: ''};
    this.toggleState = this.toggleState.bind(this);
    this.handleChange = this.handleChange.bind(this);
  }

    OKHandler(event) {
        console.log("CERRAR MODAL");
        event.preventDefault();
    }

    toggleState(role) {
      const existingRole = this.state.rolesList.find(stRole => stRole === role);
      let roleList = this.state.rolesList;
      if (!existingRole) {
        roleList.push(role);
        this.setState({rolesList: roleList});
      } else {
        roleList.splice(this.state.rolesList.indexOf(role), 1);
        this.setState({rolesList: roleList});
      }
      console.log(this.state)
    }

    handleChange(event) {
      const value = event.target.name;
      this.setState({[value]: event.target.value});
    }

    availableRole() {

    }


  render() {
    return (
      BaseModal({
          linkType: this.props.linkType, modalBtnStyle: "col-lg-5 col-md-5 col-sm-5 col-xs-5 admin-add-button common-background no-margin", modalBtnIcon: "add-user_white",
          id: "title_addUser", modalSize: "large", imgSrc: "/images/icon_add_user.png", color: "common", title: "Add User",
          description: "Catalog a new User in the system", action: { label: "Add", handler: this.OKHandler }
        },
        [
          form({ className: "form-horizontal css-form", name: "consentForm", noValidate: "true", encType: "multipart/form-data" }, [
            div({ className: "form-group admin-form-group first-form-group" }, [
              label({ className: "col-lg-3 col-md-3 col-sm-3 col-xs-4 control-label common-color" }, ["Name"]),
              div({ className: "col-lg-9 col-md-9 col-sm-9 col-xs-8 admin-input" }, [
                input({
                  type: "text", "ng-model": "user.displayName",
                  name: "inputName", id: "txt_name",
                  className: "form-control col-lg-12 vote-input",
                  placeholder: "User name",
                  required: "true",
                  onChange: this.handleChange
                }),
              ]),
            ]),

            div({ className: "form-group admin-form-group" }, [
              label({ className: "col-lg-3 col-md-3 col-sm-3 col-xs-4 control-label common-color" }, ["Google account id"]),
              div({ className: "col-lg-9 col-md-9 col-sm-9 col-xs-8 admin-input" }, [
                input({
                  type: "email", "ng-model": "user.email",
                  name: "inputGoogleId", id: "txt_email",
                  className: "form-control col-lg-12 vote-input",
                  placeholder: "e.g. username@broadinstitute.org",
                  required: "true",
                  onChange: this.handleChange
                }),
              ]),
            ]),

            div({ className: "form-group admin-form-group" }, [
              label({ className: "col-lg-3 col-md-3 col-sm-3 col-xs-4 control-label common-color" }, ["Roles"]),
              div({ className: "col-lg-9 col-md-9 col-sm-9 col-xs-8 bold" }, [
                div({ className: "col-lg-6 col-md-6 col-sm-6 col-xs-6" }, [
                  div({ className: "checkbox" }, [
                    input({
                      type: "checkbox",
                      id:"chk_member",
                      className: "checkbox-inline user-checkbox",
                      defaultChecked: this.state.rolesList.find(role => role === 'MEMBER'),
                      // checked: ,
                      onChange: () => this.toggleState('MEMBER'),
                      // "ng-model": "checkModel.MEMBER",
                      // "add-role": true,
                      // disabled: (this.state.CHAIRPERSON || this.state.ALUMNI || this.state.RESEARCHER)
                    }),
                    label({ id: "lbl_member", className: "regular-checkbox rp-choice-questions", htmlFor: "chk_member" }, ["Member"]),
                  ]),
                  div({ className: "checkbox" }, [
                    input({
                      type: "checkbox",
                      id:"chk_chairperson",
                      className: "checkbox-inline user-checkbox",
                      "ng-model": "checkModel.CHAIRPERSON",
                      // "add-role": true,
                      disabled: "checkModel.MEMBER || checkModel.ALUMNI || checkModel.RESEARCHER" }),
                    label({ id: "lbl_chairperson", className: "regular-checkbox rp-choice-questions", htmlFor: "chk_chairperson" }, ["Chairperson"]),
                  ]),
                  div({ className: "checkbox" }, [
                    input({
                      type: "checkbox",
                      id:"chk_alumni",
                      className: "checkbox-inline user-checkbox",
                      "ng-model": "checkModel.ALUMNI",
                      // "add-role": true,
                      disabled: "checkModel.MEMBER || checkModel.CHAIRPERSON"
                    }),
                    label({ id: "lbl_alumni", className: "regular-checkbox rp-choice-questions", htmlFor: "chk_alumni" }, ["Alumni"]),
                  ]),
                ]),
                div({ className: "col-lg-6 col-md-6 col-sm-6 col-xs-6" }, [
                  div({ className: "checkbox" }, [
                    input({
                      type: "checkbox",
                      id:"chk_admin",
                      className: "checkbox-inline user-checkbox",
                      "ng-model": "checkModel.ADMIN",
                      // "add-role": true
                    }),
                    label({ id: "lbl_admin", className: "regular-checkbox rp-choice-questions", htmlFor: "chk_admin" }, ["Admin"]),
                  ]),
                  div({ className: "checkbox" }, [
                    input({
                      type: "checkbox",
                      id:"chk_researcher",
                      className: "checkbox-inline user-checkbox",
                      "ng-model": "checkModel.RESEARCHER",
                      // "add-role": true,
                      disabled: "checkModel.MEMBER || checkModel.ALUMNI || checkModel.RESEARCHER"
                    }),
                    label({ id: "lbl_researcher", className: "regular-checkbox rp-choice-questions", htmlFor: "chk_researcher" }, ["Researcher"]),
                  ]),
                  div({ className: "checkbox" }, [
                    input({
                      type: "checkbox",
                      id:"chk_dataOwner",
                      className: "checkbox-inline user-checkbox",
                      "ng-model": "checkModel.DATAOWNER",
                      // "add-role": true
                    }),
                    label({ id: "lbl_dataOwner", className: "regular-checkbox rp-choice-questions", htmlFor: "chk_dataOwner" }, ["Data Owner"]),
                  ]),
                ]),
              ]),
            ]),
          ]),

          // div({ isRendered: alerts.lenght > 0, className: "form-group alert-form-group" }, [
          //     div({ className: "col-lg-9 col-lg-offset-3 col-md-9 col-md-offset-3 col-sm-9 col-sm-offset-3 col-xs-8 col-xs-offset-4", style:"paddingLeft: 26px" }, [
          //         div({ isRendered: checkModel.ADMIN, className: "checkbox" }, [
          //              input({ id: "emailPreference", type:"checkbox", className: "checkbox-inline user-checkbox", "set-mail-preference": true, "ng-model":"emailPreference" }),
          //              label({ className: "regular-checkbox rp-choice-questions bold", for: "emailPreference"}, ["Disable Admin email notifications"]),
          //          ])
          //      ]),

          //      div({ className: "admin-alerts" }, [
          //          alert({ "ng-repeat": "alert in alerts", type: "{{alert.type}}", className: "alert-title cancel-color" }, [
          //              h4({}, [alert.title]),
          //              span({}, [alert.msg]),
          //              div({ className: "warning" }, [alert.warning]),
          //          ])
          //      ]),
          //  ]),

        ])

    );
  }

});
