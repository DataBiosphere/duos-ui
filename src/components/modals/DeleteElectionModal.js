import { Component } from 'react';
import { div, form, input, label, span, hh, h4, p, alert } from 'react-hyperscript-helpers';
import { BaseDialog } from '../BaseDialog';

export const DeleteElectionModal = hh(class DeleteElectionModal extends Component {

  render() {
    
    return (
      BaseDialog({
        linkType: "icon-tag",
        id: "btn_deleteElection",
        modalBtnIcon: "glyphicon-trash",
        electionType: this.props.electionType,
        color: "cancel",
        title: "Delete Consent?",
        electionStatus: this.props.electionStatus,
        action: { label: "Yes", handler: this.submit }
      }, [
          div({ className: "dialog-description" }, [
            span({}, ["Are you sure you want to delete this Consent?"]),
          ]),
        ])
    );
  }

});
