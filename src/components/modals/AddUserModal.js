import { Component } from 'react';
import { div, form, input, label, hh } from 'react-hyperscript-helpers';
import { BaseModal } from '../BaseModal';


export const AddUserModal = hh(class AddUserModal extends Component {

  constructor(props) {
    super(props);

    this.closeHandler = this.closeHandler.bind(this);
    this.afterOpenHandler = this.afterOpenHandler.bind(this);
    this.OKHandler = this.OKHandler.bind(this);
  }

  OKHandler() {
    // this is the method for handling OK click
    // we might do something here, adding a user for instance
    // or delegate it to the parent....
    // DO SOMETHING HERE ...

    // and call parent's OK Handler
    this.props.onOKRequest('adduser');
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

  render() {

    return (

      BaseModal({
        showModal: this.props.showModal,
        onRequestClose: this.closeHandler,
        onAfterOpen: this.afterOpenHandler,
        linkType: this.props.linkType,
        modalBtnStyle: this.props.modalBtnStyle,
        modalBtnIcon: this.props.modalBtnIcon,
        modalBtnText: this.props.modalBtnText,
        id: this.props.id,
        modalSize: "large",
        imgSrc: "/images/icon_add_user.png",
        color: "common",
        title: "Add User",
        description: "Catalog a new User in the system",
        iconName: this.props.iconName,
        iconSize: this.props.iconSize,
        action: { label: "Add", handler: this.OKHandler }
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
                  placeholder: "User name", required: "true"
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
                  placeholder: "e.g. username@broadinstitute.org", required: "true"
                }),
              ]),
            ]),

            div({ className: "form-group admin-form-group" }, [
              label({ className: "col-lg-3 col-md-3 col-sm-3 col-xs-4 control-label common-color" }, ["Roles"]),
              div({ className: "col-lg-9 col-md-9 col-sm-9 col-xs-8 bold" }, [
                div({ className: "col-lg-6 col-md-6 col-sm-6 col-xs-6" }, [
                  div({ className: "checkbox" }, [
                    input({ type: "checkbox", id: "chk_member", className: "checkbox-inline user-checkbox", "ng-model": "checkModel.MEMBER", "add-role": "true", disabled: "checkModel.CHAIRPERSON || checkModel.ALUMNI || checkModel.RESEARCHER" }),
                    label({ id: "lbl_member", className: "regular-checkbox rp-choice-questions", htmlFor: "chk_member" }, ["Member"]),
                  ]),
                  div({ className: "checkbox" }, [
                    input({ type: "checkbox", id: "chk_chairperson", className: "checkbox-inline user-checkbox", "ng-model": "checkModel.CHAIRPERSON", "add-role": "true", disabled: "checkModel.MEMBER || checkModel.ALUMNI || checkModel.RESEARCHER" }),
                    label({ id: "lbl_chairperson", className: "regular-checkbox rp-choice-questions", htmlFor: "chk_chairperson" }, ["Chairperson"]),
                  ]),
                  div({ className: "checkbox" }, [
                    input({ type: "checkbox", id: "chk_alumni", className: "checkbox-inline user-checkbox", "ng-model": "checkModel.ALUMNI", "add-role": "true", disabled: "checkModel.MEMBER || checkModel.CHAIRPERSON" }),
                    label({ id: "lbl_alumni", className: "regular-checkbox rp-choice-questions", htmlFor: "chk_alumni" }, ["Alumni"]),
                  ]),
                ]),
                div({ className: "col-lg-6 col-md-6 col-sm-6 col-xs-6" }, [
                  div({ className: "checkbox" }, [
                    input({ type: "checkbox", id: "chk_admin", className: "checkbox-inline user-checkbox", "ng-model": "checkModel.ADMIN", "add-role": "true" }),
                    label({ id: "lbl_admin", className: "regular-checkbox rp-choice-questions", htmlFor: "chk_admin" }, ["Admin"]),
                  ]),
                  div({ className: "checkbox" }, [
                    input({ type: "checkbox", id: "chk_researcher", className: "checkbox-inline user-checkbox", "ng-model": "checkModel.RESEARCHER", "add-role": "true", disabled: "checkModel.MEMBER || checkModel.ALUMNI || checkModel.RESEARCHER" }),
                    label({ id: "lbl_researcher", className: "regular-checkbox rp-choice-questions", htmlFor: "chk_researcher" }, ["Researcher"]),
                  ]),
                  div({ className: "checkbox" }, [
                    input({ type: "checkbox", id: "chk_dataOwner", className: "checkbox-inline user-checkbox", "ng-model": "checkModel.DATAOWNER", "add-role": "true" }),
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
          //              label({ className: "regular-checkbox rp-choice-questions bold", htmlFor: "emailPreference"}, ["Disable Admin email notifications"]),
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
