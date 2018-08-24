import { Component } from 'react';
import { div, form, input, label, span, hh, h4, p, alert } from 'react-hyperscript-helpers';
import { BaseDialog } from '../BaseDialog';


export const ArchiveElectionModal = hh(class ArchiveElectionModal extends Component {


    render() {
        return (
            BaseDialog({
                linkType: "icon-tag",
                id: "btn_archiveElection",
                modalBtnIcon: "glyphicon-inbox " + (this.props.electionArchived === true ? "activated" : ""),
                color: "dul",
                title: "Archive election?",
                electionStatus: this.props.electionStatus,
                action: { label: "Yes", handler: this.submit }
            }, [
                div({ className: "dialog-description" }, [
                    span({}, ["Are you sure you want to archive this election? "]),
                    span({ isRendered: this.props.electionStatus === 'Open', className: "no-padding display-inline" }, ["The current election will be stopped without logging a result and this case will no longer be available for DAC Review."]),
                    span({ isRendered: this.props.electionStatus === 'Closed', className: "no-padding display-inline" }, ["This election result will no longer be valid."]),
                ]),

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
