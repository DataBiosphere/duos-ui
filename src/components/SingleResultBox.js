import { Component } from 'react';
import { div, hh, label, hr, span, input } from 'react-hyperscript-helpers';
import { ConfirmationDialog } from '../components/ConfirmationDialog';
import * as Utils from '../libs/utils';

export const SingleResultBox = hh(class SingleResultBox extends Component {

  constructor(props) {
    super(props);
    this.state = {
      showDialogReminder: false,
    }
  }

  openDialogReminder = (e) => {
    this.setState({ showDialogReminder: true });
  };

  dialogHandlerReminder = (answer) => (e) => {
    this.setState({ showDialogReminder: false });
  };

  render() {

    //if reminder sent succesfully
    const dialogTitle = "Email Notification Sent";
    const dialogColor = this.props.color;
    const reminderSent = this.props.reminderSent;

    //if error sending reminder
    // const dialogTitle = "Email Notification Error";
    // const dialogColor = "cancel";
    // const reminderSent = false;

    return (
      div({ id: this.props.id, className: "jumbotron box-vote-singleresults col-lg-6 col-md-6 col-sm-6 col-xs-12" }, [
        div({ className: "row" }, [
          div({ className: "col-lg-8 col-md-8 col-sm-12 col-xs-12 cm-user-name" }, [this.props.data.displayName]),
          div({ className: "col-lg-4 col-md-4 col-sm-12 col-xs-12" }, [
            span({ isRendered: this.props.data.vote.updateDate !== null, className: "vote-update f-right" }, ["Updated vote!"]),
            input({
              isRendered: this.props.data.vote.vote === null,
              type: "button",
              value: "Send a reminder",
              disable: this.props.data.buttonDisabled,
              onClick: this.openDialogReminder,
              className: "btn btn-primary vote-reminder f-right " + (this.props.color) + "-color"
            }),

            ConfirmationDialog({
              title: dialogTitle, color: dialogColor, showModal: this.state.showDialogReminder, type: "informative", action: { label: "Ok", handler: this.dialogHandlerReminder }
            }, [
                div({ className: "dialog-description" }, [
                  span({ isRendered: reminderSent === true }, ["The reminder was successfully sent."]),
                  span({ isRendered: reminderSent === false }, ["The reminder couldn't be sent. Please contact Support."]),
                ]),
              ]),
          ])
        ]),

        hr({ className: "box-separator" }),
        div({ className: "row" }, [
          label({
            className: "col-lg-2 col-md-2 col-sm-3 col-xs-3 control-label vote-label " + this.props.color + "-color"
          }, ["Vote: "]),

          div({
            id: "lbl_vote_" + this.props.id, className: "col-lg-4 col-md-4 col-sm-9 col-xs-9 vote-label bold"
          }, [
              span({ isRendered: this.props.data.vote.vote === '1' || this.props.data.vote.vote === true || this.props.data.vote.vote === 'true'  }, ["YES"]),
              span({ isRendered: this.props.data.vote.vote === '0' || this.props.data.vote.vote === false || this.props.data.vote.vote === 'false'}, ["NO"]),
              span({ isRendered: this.props.data.vote.vote === null }, ["---"]),
            ]),

          label({
            className: "col-lg-2 col-md-2 col-sm-3 col-xs-3 control-label vote-label " + this.props.color + "-color"
          }, ["Date: "]),

          div({ id: "lbl_date_" + this.props.id, className: "voteDate col-lg-4 col-md-4 col-sm-9 col-xs-9 vote-label" }, [
            span({ isRendered: this.props.data.vote.createDate === null }, ["---"]),
            span(
              { isRendered: this.props.data.vote.createDate !== null && this.props.data.vote.updateDate === null },
              [Utils.formatDate(this.props.data.vote.createDate) /* | date:dateFormat */]
            ),
            span(
              { isRendered: this.props.data.vote.createDate !== null && this.props.data.vote.updateDate !== null },
              [Utils.formatDate(this.props.data.vote.updateDate) /* | date:dateFormat */]
            ),
          ]),
        ]),

        div({ className: "row" }, [
          span({ isRendered: this.props.data.vote.vote === '1' }, [
            label({ className: "col-lg-2 col-md-2 col-sm-3 col-xs-3 control-label vote-label " + this.props.color + "-color" }, ["Comments:"]),
          ]),
          span({ isRendered: this.props.data.vote.vote !== '1' }, [
            label({ className: "col-lg-2 col-md-2 col-sm-3 col-xs-3 control-label vote-label " + this.props.color + "-color" }, ["Rationale:"]),
          ]),
          div({ id: "lbl_rationale_" + this.props.id, className: "inputRationale col-lg-10 col-md-10 col-sm-9 col-xs-9 vote-label" }, [
            span({ isRendered: this.props.data.vote.rationale !== null }, [this.props.data.vote.rationale]),
            span({ isRendered: this.props.data.vote.rationale === null }, ["---"]),
          ]),
        ]),
      ])
    );
  }
});
