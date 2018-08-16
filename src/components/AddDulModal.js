

import { Component } from 'react';
import { button, div, h2, h4, h, form, input, label, fieldset, textarea, img, span, hh, p } from 'react-hyperscript-helpers';
import Modal from 'react-modal';

// const customStyles = {
//     content: {
//         top: '50%',
//         left: '50%',
//         right: 'auto',
//         bottom: 'auto',
//         marginRight: '-50%',
//         transform: 'translate(-50%, -50%)'
//     }
// };

const customStyles = {
    overlay: {
        position: 'fixed',
        top: '20px',
        left: '50px',
        right: '50px',
        bottom: '20px',
        backgroundColor: 'rgba(255, 255, 255, 0.75)'
    },

    content: {
        position: 'absolute',
        top: '40%',
        left: '50%',
        marginTop: '-30px',
        marginLeft: '-50px',
        // transform: 'translate(-50%, -50%)'
    }
};

export const AddDulModal = hh(class AddDulModal extends Component {

    constructor() {
        super();

        this.state = {
            modalIsOpen: false
        };

        this.openModal = this.openModal.bind(this);
        this.afterOpenModal = this.afterOpenModal.bind(this);
        this.closeModal = this.closeModal.bind(this);
        this.ok = this.ok.bind(this);
        this.cancel = this.cancel.bind(this);
    }

    openModal() {
        this.setState({ modalIsOpen: true });
    }

    afterOpenModal() {
        // references are now sync'd and can be accessed.
        // this.subtitle.style.color = '#f00';
    }

    closeModal() {
        this.setState({ modalIsOpen: false });
    }

    ok() {

    }

    cancel() {

    }

    render() {
        const file = {
            name: "MyFile.txt"
        }

        const alerts = [

        ];

        return (
            div({}, [
                button({ onClick: this.openModal }, ["Open Modal"]),
                h(Modal, {
                    isOpen: this.state.modalIsOpen,
                    onAfterOpen: this.afterOpenModal,
                    onRequestClose: this.closeModal,
                    style: customStyles,
                    contentLabel: "Add Dul Modal (Sample)"
                },
                    [
                        div({  }, [
                            div({}, [
                                div({ className: "modal-header admin-modal-header" }, [
                                    button({ type: "button", className: " modal-close-btn close", onClick: this.cancel }, [
                                        span({ "aria-hidden": "true" }, ["&times;"]),
                                    ]),
                                    h2({ className: "cm-title-admin dul-color" }, [
                                        img({ src: "/images/icon_add_dul.png", alt: "Add DUL icon", className: "cm-icons" }),
                                        span({}, ["Add Data Use Limitations"]),
                                        div({ className: "cm-title-description" }, ["Catalog a Data Use Limitations Record"]),
                                    ]),
                                ]),
                                div({ className: "modal-footer" }, [
                                    form({ className: "form-horizontal css-form", name: "consentForm", noValidate: "true", encType: "multipart/form-data" }, [
                                        fieldset({}, [
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

                                            div({ className: "admin-modal-footer" }, [
                                                // div({ isRendered: alerts.lenght > 0, className: "alert-form-group" }, [
                                                //     div({ className: "admin-alerts no-margin" }, [
                                                //         alert({ "ng-repeat": "alert in alerts", type: "{{alert.type}}", className: "alert-title cancel-color" }, [
                                                //             h4({}, [alert.title]),
                                                //             alert.msg
                                                //         ])
                                                //     ]),
                                                // ]),
                                                button({ "ng-disabled": "consentForm.$invalid || disableButton", className: "col-lg-3 col-md-3 col-sm-4 col-xs-6 btn dul-background", style: {"marginRight": "0"}, onClick: this.ok }, ["Add"]),
                                                button({ className: "col-lg-3 col-md-3 col-sm-4 col-xs-6 btn dismiss-background", onClick: this.cancel }, ["Cancel"]),
                                            ]),
                                        ]),
                                    ]),
                                ]),
                            ]),
                        ]),
                    ]),
            ])
        );
    }
});
