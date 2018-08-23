import { Component } from 'react';
import { div, form, input, label, hh } from 'react-hyperscript-helpers';
import { BaseModal } from '../BaseModal';


export const ElectionTimeoutModal = hh(class ElectionTimeoutModal extends Component {

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
                imgSrc: "/images/icon_timeout.png",
                color: "common",
                iconName: this.props.iconName,
                iconSize: this.props.iconSize,
                title: this.props.title,
                description: this.props.description,
                action: { label: "Save", handler: this.OKHandler }
            },
                [
                    form({ className: "form-horizontal css-form", name: "consentForm", noValidate: "true", encType: "multipart/form-data" }, [
                        div({ className: "form-group admin-form-group first-form-group" }, [
                            label({ id: "lbl_currentTimeout", className: "col-lg-4 col-md-4 col-sm-6 col-xs-12 control-label common-color" }, ["Current timeout:"]),
                            div({ className: "col-lg-8 col-md-8 col-sm-6 col-xs-12 admin-input response-label" }, [
                                label({ id: "txt_currentTimeout" }, ["this.timeout.amountOfDays"]),
                            ]),
                        ]),

                        div({ className: "form-group admin-form-group" }, [
                            label({ id: "lbl_lastUpdatedBy", className: "col-lg-4 col-md-4 col-sm-6 col-xs-12 control-label common-color" }, ["Last updated by:"]),
                            div({ className: "col-lg-8 col-md-8 col-sm-6 col-xs-12 admin-input response-label" }, [
                                label({ id: "txt_lastUpdatedBy" }, ["this.timeout.displayName"]),
                            ]),
                        ]),

                        div({ className: "form-group admin-form-group", isRendered: "timeout.updateDate != null" }, [
                            label({ id: "lbl_lastUpdatedDate", className: "col-lg-4 col-md-4 col-sm-6 col-xs-12 control-label common-color" }, ["Last updated date:"]),
                            div({ className: "col-lg-8 col-md-8 col-sm-6 col-xs-12 admin-input response-label" }, [
                                label({ id: "txt_lastUpdatedDate" }, ["timeout.updateDate | date:dateFormat"]),
                            ]),
                        ]),

                        div({ className: "form-group admin-form-group", isRendered: "timeout.updateDate == null && timeout.createDate != null" }, [
                            label({ id: "lbl_currentTimeout", className: "col-lg-4 col-md-4 col-sm-6 col-xs-12 control-label common-color" }, ["Last updated date:"]),
                            div({ id: "txt_currentTimeout", className: "col-lg-8 col-md-8 col-sm-6 col-xs-12 admin-input response-label" }, [
                                label({}, ["timeout.createDate | date:dateFormat"]),
                            ]),
                        ]),

                        div({ className: "form-group admin-form-group" }, [
                            label({ id: "lbl_setTimeout", className: "col-lg-4 col-md-4 col-sm-6 col-xs-12 control-label common-color" }, ["Set new timeout:"]),
                            div({ className: "col-lg-8 col-md-8 col-sm-6 col-xs-12 admin-input" }, [
                                input({ id: "txt_setTimeout", type: "number", min: "1", "ng-model": "timeout.newTimeout", name: "days", required: true, "ng-change": "setTimeout()", style: { 'width': '55px', 'padding': '5px 2px 2px 5px', 'color': '#777777' } }),
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
