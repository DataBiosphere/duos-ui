import { Component } from 'react';
import { div, form, input, label, hh } from 'react-hyperscript-helpers';
import { BaseModal } from '../BaseModal';


export const EditUserModal = hh(class EditUserModal extends Component {

    editUser() {
        console.log("algo");
    }

    replaceRoleAlert() {

    }

    newUserAlert() {

    }


    render() {
        const file = {
            name: "MyFile.txt"
        }

        


        // const alerts = [

        // ];

        return (

            BaseModal({
                linkType: this.props.linkType, modalBtnStyle: "cell-button hover-color", modalBtnIcon: "", modalBtnText: "Edit",
                id: "title_editUser", modalSize: "large", imgSrc: "/images/icon_edit_user.png", color: "common", title: "Edit User",
                description: "Edit a User in the system", action: { label: "Save", handler: this.editUser() }
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
                                        input({ type: "checkbox", id: "chk_member", className: "checkbox-inline user-checkbox", "ng-model": "checkModel.MEMBER", "add-role-edit": "true", "ng-change": "memberChanged(checkModel.MEMBER,USER_ROLES.member)", disabled: "checkModel.CHAIRPERSON || checkModel.ALUMNI || checkModel.RESEARCHER", checked: "checked" }),
                                        label({ id: "lbl_member", className: "regular-checkbox rp-choice-questions", htmlFor: "chk_member" }, ["Member"]),
                                    ]),
                                    div({ className: "checkbox" }, [
                                        input({ type: "checkbox", id: "chk_chairperson", className: "checkbox-inline user-checkbox", "ng-model": "checkModel.CHAIRPERSON", "add-role-edit": "true", "ng-change": "chairpersonChanged(checkModel.CHAIRPERSON,USER_ROLES.chairperson)", disabled: "checkModel.MEMBER || checkModel.ALUMNI || checkModel.RESEARCHER || (wasMember && delegateMemberRequired)" }),
                                        label({ id: "lbl_chairperson", className: "regular-checkbox rp-choice-questions", htmlFor: "chk_chairperson" }, ["Chairperson"]),
                                    ]),
                                    div({ className: "checkbox" }, [
                                        input({ type: "checkbox", id: "chk_alumni", className: "checkbox-inline user-checkbox", "ng-model": "checkModel.ALUMNI", "add-role-edit": "true", onClick: this.replaceRoleAlert, disabled: "checkModel.MEMBER || checkModel.CHAIRPERSON" }),
                                        label({ id: "lbl_alumni", className: "regular-checkbox rp-choice-questions", htmlFor: "chk_alumni" }, ["Alumni"]),
                                    ]),
                                ]),
                                div({ className: "col-lg-6 col-md-6 col-sm-6 col-xs-6" }, [
                                    div({ className: "checkbox" }, [
                                        input({ type: "checkbox", id: "chk_admin", className: "checkbox-inline user-checkbox", "ng-model": "checkModel.ADMIN", "add-role-edit": "true", onClick: this.newUserAlert }),
                                        label({ id: "lbl_admin", className: "regular-checkbox rp-choice-questions", htmlFor: "chk_admin" }, ["Admin"]),
                                    ]),
                                    div({ className: "checkbox" }, [
                                        input({ type: "checkbox", id: "chk_researcher", className: "checkbox-inline user-checkbox", "ng-model": "checkModel.RESEARCHER", "add-role-edit": "true", "ng-change": "researcherChanged(checkModel.RESEARCHER)", disabled: "checkModel.MEMBER || checkModel.RESEARCHER" }),
                                        label({ id: "lbl_researcher", className: "regular-checkbox rp-choice-questions", htmlFor: "chk_researcher" }, ["Researcher"]),
                                    ]),
                                    div({ className: "checkbox" }, [
                                        input({ type: "checkbox", id: "chk_dataOwner", className: "checkbox-inline user-checkbox", "ng-model": "checkModel.DATAOWNER", "add-role-edit": "true", "ng-change": "dataOwnerChanged(checkModel.DATAOWNER)" }),
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

                    // div({ isRendered: "delegateDacUser.needsDelegation", className: "form-group admin-form-group" }, [
                    //     div({ className: "row f-left" }, [
                    //         div({ className: "default-color", style: {padding: '0 40px 15px 40px'} }, ["Member responsabilities must be delegated to a different user, please select one from below:"]),
                    //     ]),

                    //     label({ id:"lbl_alternativeUser", className: "col-lg-3 col-md-3 col-sm-3 col-xs-4 control-label common-color" }, ["Alternative User"]),
                    //     div({ className: "col-lg-9 col-md-9 col-sm-9 col-xs-8 admin-input" }, [

                    //         select({ id: "sel_alternativeUser", className: "form-control col-lg-12", "ng-model": "$parent.alternativeDACMemberUser", required: "delegateDacUser.needsDelegation" }, [
                    //             option({ "ng-repeat": "user in delegateDacUser.delegateCandidates", value: "{{user}}" }, [this.user.displayName] )
                    //         ]),

                    //     ]),
                    // ]),

                    // div({ isRendered: "delegateDataOwner.needsDelegation", className: "form-group admin-form-group" }, [
                    //     div({ className: "row f-left" }, [
                    //         div({ className: "default-color", style: {padding: '0 40px 15px 40px'} }, ["Member responsabilities must be delegated to a different user, please select one from below:"]),
                    //     ]),

                    //     label({ id:"lbl_alternativeDataOwner", className: "col-lg-3 col-md-3 col-sm-3 col-xs-4 control-label common-color" }, ["Alternative DataOwner"]),
                    //     div({ className: "col-lg-9 col-md-9 col-sm-9 col-xs-8 admin-input" }, [

                    //         select({ id: "sel_alternativeDataOwner", className: "form-control col-lg-12", "ng-model": "$parent.alternativeDataOwnerUser", required: "delegateDataOwner.needsDelegation" }, [
                    //             option({ "ng-repeat": "dataOwner in delegateDataOwner.delegateCandidates", value: "{{dataOwner}}" }, [this.dataOwner.displayName] )
                    //         ]),

                    //     ]),
                    // ]),
                ])

        );
    }

});
