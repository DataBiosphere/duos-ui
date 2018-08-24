import { Component } from 'react';
import { div, form, input, label, span, hh, h4, p, alert } from 'react-hyperscript-helpers';
import { BaseDialog } from '../BaseDialog';


export const CreateElectionModal = hh(class CreateElectionModal extends Component {


    render() {
        return (
            BaseDialog({
                linkType: "button-tag",
                id: "btn_createElection",
                modalBtnStyle: "cell-button hover-color",
                modalBtnText: "Create",
                color: this.props.color,
                title: "Create election?",
                action: { label: "Yes", handler: this.submit }
            }, [
                    div({ className: "dialog-description" }, [
                        span({}, ["Are you sure you want the DAC to vote on this case? "]),
                        span({ isRendered: (this.props.electionStatus === 'Closed' && this.props.electionArchived !== true), className: "no-padding display-inline" }, ["The previous election will be archived and it's result will no longer be valid."]),
                    ])

                    // div({ className: "admin-alerts admin-create-alerts" }, [
                    //     alert({ "ng-repeat": "alert in alerts", type: "danger", className: "alert-title cancel-color"},[
                    //         h4({}, ["alert.title"]),
                    //         span({}, ["alert.msg"]),
                    //     ])
                    // ])
                ])
        );
    }

});
