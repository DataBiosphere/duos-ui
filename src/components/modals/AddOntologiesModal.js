import { Component } from 'react';
import { div, form, input, label, span, hh, p } from 'react-hyperscript-helpers';
import { BaseModal } from '../BaseModal';


export const AddOntologiesModal = hh(class AddOntologiesModal extends Component {

    OKHandler() {
        console.log("algo");
    }


    render() {
        // const alerts = [

        // ];

        return (

            BaseModal({
                linkType: this.props.linkType,
                id: this.props.id,
                modalBtnStyle: this.props.modalBtnStyle,
                modalSize: "large",
                imgSrc: "/images/icon-add-ontology.png",
                color: "common",
                iconName: this.props.iconName,
                iconSize: this.props.iconSize,
                title: this.props.title,
                description: this.props.description,
                action: { label: "Add", handler: this.OKHandler }
            },
                [
                    form({ className: "form-horizontal css-form", name: "consentForm", noValidate: "true", encType: "multipart/form-data" }, [
                        div({ className: "form-group admin-form-group first-form-group" }, [
                            label({ className: "col-lg-3 col-md-3 col-sm-3 col-xs-4 control-label common-color" }, ["Ontology File"]),
                            div({ className: "col-lg-9 col-md-9 col-sm-9 col-xs-8 bold" }, [
                                div({ className: "fileUpload col-lg-3 col-md-3 col-sm-4 col-xs-12 common-color upload-button" }, [
                                    span({}, ["Upload file"]),
                                    span({ className: "cm-icon-button glyphicon glyphicon-upload caret-margin", "aria-hidden": "true" }, []),
                                    input({ id: "txt_file", type: "file", "ng-model": "file.name", "file-upload": "true", className: "upload", required: "true" }),
                                ]),
                                p({ className: "fileName" }, ["file.name"]),
                            ]),
                        ]),

                        div({ className: "form-group admin-form-group" }, [
                            label({ className: "col-lg-3 col-md-3 col-sm-3 col-xs-4 control-label common-color" }, ["Prefix"]),
                            div({ className: "col-lg-9 col-md-9 col-sm-9 col-xs-8" }, [
                                input({ id: "txt_prefix", type: "text", "ng-model": "prefix", className: "form-control col-lg-12 vote-input", name: "ontology_prefix", placeholder: "Ontology Prefix", required: "true" }),
                            ]),
                        ]),

                        // div({ className: "alert-modal-footer" }, [
                        //     div({ className: "form-group dataset-form-group" }, [
                        //         div({ className: "admin-alerts dataset-admin-alerts" }, [
                        //             alert({ "ng-repeat": "alert in alerts", type: "{{alert.type}}", className: "alert-title cancel-color no-margin" }, [
                        //                 h4({}, [alert.title]),
                        //                 span({}, [alert.msg]),
                        //             ])
                        //         ]),
                        //     ]),
                        // ]),

                    ])
                ])
        );
    }

});
