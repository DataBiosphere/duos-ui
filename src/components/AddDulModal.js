import { Component } from 'react';
import { button, div, h2, h4, h, form, input, label, fieldset, textarea, img, span, hh, p } from 'react-hyperscript-helpers';
import { BaseModal } from '../components/BaseModal';


export const AddDulModal = hh(class AddDulModal extends Component {

    OKHandler (){
        console.log ("algo");
    }


    render() {
        const file = {
            name: "MyFile.txt"
        }

        // const alerts = [

        // ];
        
        return (

        BaseModal({ modalBtnStyle: "col-lg-6 col-md-6 col-sm-5 col-xs-5 admin-add-button dul-background no-margin", modalBtnIcon: "add-dul_white",
        modalName: "AddDulModal", modalSize: "medium", imgSrc: "/images/icon_add_dul.png", color: "dul", title: "Add Data Use Limitations", 
        description: "Catalog a Data Use Limitations Record", action: { label: "OK", handler: this.OKHandler} },
        [

        form({ className: "form-horizontal css-form", name: "consentForm", noValidate: "true", encType: "multipart/form-data" }, [
            div({ className: "form-group admin-form-group first-form-group" }, [
                label({ className: "col-lg-3 col-md-3 col-sm-3 col-xs-4 control-label dul-color" }, ["Unique id"]),
                div({ className: "col-lg-9 col-md-9 col-sm-9 col-xs-8 admin-input" }, [
                    input({
                        type: "text", "ng-model": "consent.consentId",
                        name: "inputConsentId",
                        className: "form-control col-lg-12 vote-input",
                        placeholder: "Unique id from Compliance", required: "true"
                    }),
                ]),
            ]),

            div({ className: "form-group admin-form-group " }, [
                label({ className: "col-lg-3 col-md-3 col-sm-3 col-xs-4 control-label dul-color" }, ["Consent id"]),
                div({ className: "col-lg-9 col-md-9 col-sm-9 col-xs-8 admin-input" }, [
                    input({
                        type: "text", "ng-model": "consent.name",
                        name: "inputName",
                        className: "form-control col-lg-12 vote-input",
                        placeholder: "Consent id", required: "true"
                    }),
                ]),
            ]),

            div({ className: "form-group admin-form-group " }, [
                label({ className: "col-lg-3 col-md-3 col-sm-3 col-xs-4 control-label dul-color" }, ["Data Use Limitations File"]),
                div({ className: "col-lg-9 col-md-9 col-sm-9 col-xs-8 bold" }, [
                    div({ className: "fileUpload col-lg-3 col-md-3 col-sm-4 col-xs-12 upload-button" }, [
                        span({}, ["Upload file"]),
                        span({ className: "cm-icon-button glyphicon glyphicon-upload caret-margin", "aria-hidden": "true" }, []),
                        input({ type: "file", "ng-model": "file.name", "file-upload": "true", className: "upload", required: "true" }),
                    ]),
                    p({ className: "fileName" }, [file.name]),
                ]),
            ]),

            div({ className: "form-group admin-form-group " }, [
                label({ className: "col-lg-3 col-md-3 col-sm-3 col-xs-4 control-label dul-color" }, ["Structured Limitations"]),
                div({ className: "col-lg-9 col-md-9 col-sm-9 col-xs-8 admin-input" }, [
                    textarea({
                        "ng-model": "useRestriction",
                        name: "inputSDUL",
                        className: "form-control col-lg-12 vote-input",
                        placeholder: "Structured string of the Data Use Limitations (JSON format, e.g. {&quot;type&quot;:&quot;everything&quot;})", required: "true"
                    })
                ]),
            ]),

            div({ className: "form-group admin-form-group " }, [
                label({ className: "col-lg-3 col-md-3 col-sm-3 col-xs-4 control-label dul-color" }, ["Data Use"]),
                div({ className: "col-lg-9 col-md-9 col-sm-9 col-xs-8 admin-input" }, [
                    textarea({
                        "ng-model": "dataUse",
                        name: "inputDU",
                        className: "form-control col-lg-12 vote-input",
                        placeholder: "Structured string of the Data Use Questions/Answers (JSON format, e.g. {&quot;generalUse&quot;:true})", required: "true"
                    }),
                ]),
            ]),
        ])

        // div({ isRendered: alerts.lenght > 0, className: "alert-form-group" }, [
        //     div({ className: "admin-alerts no-margin" }, [
        //         alert({ "ng-repeat": "alert in alerts", type: "{{alert.type}}", className: "alert-title cancel-color" }, [
        //             h4({}, [alert.title]),
        //             span({}, [alert.msg]),
        //         ])
        //     ]),
        // ]),

        ])

        );
    }
    
});
