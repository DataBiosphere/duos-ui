import { Component } from 'react';
import { div, form, input, label, span, hh, h4, p, alert } from 'react-hyperscript-helpers';
import { BaseDialog } from '../BaseDialog';

export const CancelElectionModal = hh(class CancelElectionModal extends Component {

  render() {

    return (
      BaseDialog({
        linkType: "button-tag",
        id: "btn_cancelElection",
        modalBtnStyle: "cell-button cancel-color",
        modalBtnText: "Cancel",
        color: "cancel",
        title: "Cancel election?",
        action: { label: "Yes", handler: this.submit }
      }, [

          div({ className: "dialog-description" }, [
            span({}, ["Are you sure you want to cancel the current election process? "]),
            span({ isRendered: this.props.electionType === 'dul', className: "no-padding display-inline" }, ["The current election will be stopped without logging a result."]),
          ]),
          div({ isRendered: this.props.electionType === 'dul', className: "form-group" }, [
            div({ className: "col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding" }, [
              div({ className: "checkbox" }, [
                input({ id: "chk_archiveCancelElection", type: "checkbox", "ng-model": "electionArchived", className: "checkbox-inline", checked: "checked" }),
                label({ id: "lbl_archiveCancelElection", htmlFor: "chk_archiveCancelElection", className: "regular-checkbox normal" }, ["Archive election"]),
              ]),
            ]),
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
