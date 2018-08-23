import { Component } from 'react';
import { button, div, h2, h4, h, form, input, label, fieldset, textarea, img, span, hh, p } from 'react-hyperscript-helpers';
import { BaseModal } from '../BaseModal';
import { DataSet } from '../../libs/ajax'

let USER_ID = 5;

export const AddDatasetModal = hh(class AddDatasetModal extends Component {

    constructor() {
        super();
        this.state = {
            file: {
                name: "",
            },
            overwrite: false
        }
        this.handleFileChange = this.handleFileChange.bind(this);
        this.handleOverwriteChange = this.handleOverwriteChange.bind(this);
        this.submit = this.submit.bind(this);
    };
    handleOverwriteChange(event) {
        this.setState({
            file: this.state.file,
            overwrite: event.target.checked
        });
    }

    handleFileChange(event) {
        if (event.target.files !== undefined && event.target.files[0]) {
            let file = event.target.files[0];
            this.setState({
                file: file,
                overwrite: this.state.overwrite
            });
        }
    }

    submit() {
        if(this.state.file.name !== "") {
            DataSet.create(this.state.file, this.state.overwrite, USER_ID).then(
                function() {
                // cerrar modal
                alert("todo bien");
            }).catch(function(errorResponse) {
                alert(JSON.stringify(errorResponse));
            })
        }
    }

    render() {
        return (
            BaseModal({
                linkType: this.props.linkType,
                id: this.props.id,
                modalBtnStyle: this.props.modalBtnStyle,
                modalSize: "large",
                imgSrc: "/images/icon_dataset_add.png",
                color: "dataset",
                icon_name: this.props.icon_name,
                icon_size: this.props.icon_size,
                title: this.props.title,
                description: this.props.description,
                action: { label: "Add", handler: this.submit }
            },
                [
                    form({ className: "form-horizontal css-form", name: "consentForm", noValidate: "true", encType: "multipart/form-data" }, [
                        div({ className: "form-group admin-form-group first-form-group" }, [
                            label({ className: "col-lg-3 col-md-3 col-sm-3 col-xs-4 control-label dataset-color" }, ["Datasets File"]),
                            div({ className: "col-lg-9 col-md-9 col-sm-9 col-xs-8 bold" }, [
                                div({ className: "fileUpload col-lg-3 col-md-3 col-sm-4 col-xs-12 dataset-color upload-button" }, [
                                    span({}, ["Upload file"]),
                                    span({ className: "cm-icon-button glyphicon glyphicon-upload caret-margin", "aria-hidden": "true" }, []),
                                    input({ type: "file", onChange: this.handleFileChange, id: "txt_file", className: "upload", required: "true" }),
                                ]),
                                p({ className: "fileName" }, [this.state.file.name]),
                            ]),
                        ]),

                        div({ className: "form-group admin-form-group" }, [
                            div({ className: "col-lg-9 col-lg-offset-3 col-md-9 col-lg-offset-3 col-sm-9 col-lg-offset-3 col-xs-8 col-lg-offset-4 bold" }, [
                                div({ className: "checkbox dataset-label" }, [
                                    input({ onChange: this.handleOverwriteChange, checked: this.state.overwrite, id: "txt_overwrite", type: "checkbox", className: "checkbox-inline", name: "checkOther" }),
                                    label({ id: "lbl_overwrite", className: "regular-checkbox dataset-label", htmlFor: "txt_overwrite" }, ["Overwrite existing Datasets"]),
                                ]),
                            ]),
                        ]),


                    ])

                    // div({ isRendered: alerts.lenght > 0, className: "form-group dataset-form-group" }, [
                    //     div({ className: "admin-alerts dataset-admin-alerts" }, [
                    //         alert({ "ng-repeat": "alert in alerts", type: "{{alert.type}}", className: "alert-title cancel-color no-margin" }, [
                    //             h4({}, [alert.title]),
                    //             span({}, [alert.msg]),
                    // span({ style: "lineHeight: 22px" }, [
                    //     "Please, ",
                    //     a({ download: "errorsFile.txt", className: "hover-color bold", href: "{{url}}", onClick: DataSetModal.releaseUrl }, ["download this file"]),
                    //     "with the mistakes found."
                    // ]),

                    //         ])
                    //     ]),
                    // ]),

                ])

        );
    }

});
