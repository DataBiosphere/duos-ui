import { Component } from 'react';
import { div, form, input, label, textarea, span, hh, p } from 'react-hyperscript-helpers';
import { BaseModal } from '../BaseModal';


export const AddDulModal = hh(class AddDulModal extends Component {

    constructor(props) {
        super(props);
        this.state = {
            showModal: this.props.showModal
        }
    }

    OKHandler() {
        console.log("algo");
    }

    // componentWillMount() {
    //     this.setState({
    //         showModal: this.props.showModal
    //     });
    // }

    componentWillMount() {
        console.log('componentWillMount', this.state, this.props);
    }

    componentWillUpdate() {
        console.log('componentWillUpdate', this.state, this.props);
    }

    componentDidMount() {
        console.log('componentDidMount', this.state, this.props);
    }

    componentDidUpdate() {
        console.log('componentDidUpdate', this.state, this.props);
    }


    render() {
        const file = {
            name: "MyFile.txt"
        }

        // const alerts = [

        // ];
        console.log('---------------------AddDulModal-render-------------------', this.state, this.props);
        return (

            BaseModal({
                // appElement: this,
                showModal: this.state.showModal,
                linkType: this.props.linkType,
                modalBtnStyle: this.props.modalBtnStyle,
                modalBtnIcon: this.props.modalBtnIcon,
                modalBtnText: this.props.modalBtnText,
                id: this.props.id,
                modalSize: "large",
                imgSrc: "/images/icon_add_dul.png",
                color: "dul",
                title: "Add Data Use Limitations",
                description: this.props.description,
                iconName: this.props.iconName,
                iconSize: this.props.iconSize,
                action: { label: "Add", handler: this.OKHandler }
            },
                [

                    form({ className: "form-horizontal css-form", name: "consentForm", noValidate: "true", encType: "multipart/form-data" }, [
                        div({ className: "form-group admin-form-group first-form-group" }, [
                            label({ className: "col-lg-3 col-md-3 col-sm-3 col-xs-4 control-label dul-color" }, ["Unique id"]),
                            div({ className: "col-lg-9 col-md-9 col-sm-9 col-xs-8 admin-input" }, [
                                input({
                                    type: "text", "ng-model": "consent.consentId",
                                    id: "txt_consentId", name: "inputConsentId",
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
                                    id: "txt_consentName", name: "inputName",
                                    className: "form-control col-lg-12 vote-input",
                                    placeholder: "Consent id", required: "true"
                                }),
                            ]),
                        ]),

                        div({ className: "form-group admin-form-group " }, [
                            label({ id: "lbl_file", className: "col-lg-3 col-md-3 col-sm-3 col-xs-4 control-label dul-color" }, ["Data Use Limitations File"]),
                            div({ className: "col-lg-9 col-md-9 col-sm-9 col-xs-8 bold" }, [
                                div({ className: "fileUpload col-lg-3 col-md-3 col-sm-4 col-xs-12 upload-button" }, [
                                    span({}, ["Upload file"]),
                                    span({ className: "cm-icon-button glyphicon glyphicon-upload caret-margin", "aria-hidden": "true" }, []),
                                    input({ type: "file", "ng-model": "file.name", "file-upload": "true", id: "txt_file", className: "upload", required: "true" }),
                                ]),
                                p({ className: "fileName" }, [file.name]),
                            ]),
                        ]),

                        div({ className: "form-group admin-form-group " }, [
                            label({ className: "col-lg-3 col-md-3 col-sm-3 col-xs-4 control-label dul-color" }, ["Structured Limitations"]),
                            div({ className: "col-lg-9 col-md-9 col-sm-9 col-xs-8 admin-input" }, [
                                textarea({
                                    "ng-model": "useRestriction",
                                    id: "txt_sdul", name: "inputSDUL",
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
                                    id: "txt_dataUse", name: "inputDU",
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
