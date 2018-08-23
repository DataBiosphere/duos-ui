import { Component } from 'react';
import { div, form, input, label,  textarea, hh } from 'react-hyperscript-helpers';
import { BaseModal } from '../BaseModal';


export const HelpModal = hh(class HelpModal extends Component {

    OKHandler() {
        console.log("algo");
    }


    render() {
        const file = {
            name: "MyFile.txt"
        }

        // const alerts = [

        // ];

        return (
            BaseModal({
                linkType: this.props.linkType, modalBtnStyle: "f-left", modalBtnIcon: "", modalBtnText: "Create a Report",
                id: "title_requestHelp", modalSize: "large", imgSrc: "/images/icon_add_help.png", color: "common", title: "Request Help",
                description: "Leave a comment, suggestion or report a bug", action: { label: "Submit", handler: this.OKHandler }
            },

                [
                    form({ className: "form-horizontal css-form", name: "consentForm", noValidate: "true", encType: "multipart/form-data" }, [
                        div({ className: "form-group admin-form-group first-form-group" }, [
                            label({ id: "lbl_subject", className: "col-lg-3 col-md-3 col-sm-3 col-xs-4 control-label common-color" }, ["Subject"]),
                            div({ className: "col-lg-9 col-md-9 col-sm-9 col-xs-8 admin-input" }, [
                                input({ type: "text", "ng-model": "report.subject", id: "txt_subject", className: "form-control col-lg-12 vote-input", required: "true" }),
                            ]),
                        ]),

                        div({ className: "form-group admin-form-group" }, [
                            label({ id: "lbl_description", className: "col-lg-3 col-md-3 col-sm-3 col-xs-4 control-label common-color" }, ["Description"]),
                            div({ className: "col-lg-9 col-md-9 col-sm-9 col-xs-8 admin-input" }, [
                                textarea({ name: "helpDescription", "ng-model": "report.description", id: "txt_description", rows: "5", className: "form-control col-lg-12 vote-input", required: "true" }),
                            ]),
                        ]),

                    ])

                ])

        );
    }

});
