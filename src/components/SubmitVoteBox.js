import { Component } from 'react';
import { div, hh, h3, hr, form, fieldset, input, label, span, button } from 'react-hyperscript-helpers';
import { YesNoRadioGroup } from '../components/YesNoRadioGroup';
import { OptionsRadioGroup } from '../components/OptionsRadioGroup';
import { Alert } from '../components/Alert';
import { ConfirmationDialog } from '../components/ConfirmationDialog';

export const SubmitVoteBox = hh(class SubmitVoteBox extends Component {

  constructor(props) {
    super(props);
    this.state = {
      value: '',
      currentUser: {},
      enableVoteButton: false,
      voteStatus: this.props.voteStatus,
      status: this.props.status,
      showDialogSubmit: false,
      rationale: ''
    }
    this.setEnableVoteButton = this.setEnableVoteButton.bind(this);
  }

  setEnableVoteButton() {
    this.setState(prev => {
      prev.enableVoteButton = true;
      return prev;
    });
  }

  logVote = (e) => {
    this.setState({ showDialogSubmit: true });
  }


  dialogHandlerSubmit = (answer) => (e) => {
    if (answer === true) {
      console.log(answer);
    } else {
      console.log(answer);
    }
    this.setState({ showDialogSubmit: false });
    this.props.action.handler(answer);
  };

  render() {
    let dialogTitle = "";
    let dialogMessage = "";
    let dialogType = "";
    let dialogLabel = ""

    //if agreement election
    if (this.props.id === "agreement") {
      dialogTitle = "Post Decision Agreement?";
      dialogMessage = "Are you sure you want to post this Decision Agreement?";
      dialogType = "";
      dialogLabel = "Yes"
    }

    //if final election
    if (this.props.id === "finalAccess") {
      dialogTitle = "Post Final Access Decision?";
      dialogMessage = "Are you sure you want to post this Final Access Decision?";
      dialogType = "";
      dialogLabel = "Yes"
    }

    //if collect election 
    if (this.props.id === "accessCollect" || this.props.id === "rpCollect" || this.props.id === "dulCollect") {
      dialogTitle = "Post Final Vote?";
      dialogMessage = "If you post this vote the Election will be closed with current results.";
      dialogType = "";
      dialogLabel = "Yes"
    }

    //if review election
    if (this.props.id === "accessReview" || this.props.id === "rpReview" || this.props.id === "dulReview" || this.props.id === "dataOwnerReview" || this.props.id === "researcherReview") {
      dialogTitle = "Vote confirmation";
      dialogMessage = "Your vote has been successfully logged!";
      dialogType = "informative";
      dialogLabel = "Ok"
    }

    return (

      div({ id: "box_" + this.props.id }, [
        h3({ className: "box-vote-title italic " + this.props.color + "-color" }, [this.props.title]),
        hr({ className: "box-separator" }),

        div({ isRendered: this.props.agreementData !== undefined }, [this.props.agreementData]),

        form({ id: "form_" + this.props.id, className: "form-horizontal" }, [
          fieldset({ disable: this.props.isDisabled }, [
            div({ className: "form-group first-form-group" }, [
              label({ className: "col-lg-2 col-md-2 col-sm-2 col-xs-3 control-label vote-label " + this.props.color + "-color" }, ["Your vote*"]),
              div({ className: "col-lg-10 col-md-10 col-sm-10 col-xs-9" }, [
                YesNoRadioGroup({
                  id: this.props.id,
                  isRendered: (this.props.radioType === "boolean") || (this.props.radioType === undefined),
                  value: this.props.status,
                  name: "rad_" + this.props.id,
                  onChange: this.setEnableVoteButton
                }),

                OptionsRadioGroup({
                  id: this.props.id,
                  isRendered: this.props.radioType === "multiple",
                  value: this.props.status,
                  optionLabels: this.props.radioLabels,
                  optionValues: this.props.radioValues,
                  name: "rad_" + this.props.id,
                  onChange: this.setEnableVoteButton
                }),
              ]),
            ]),

            div({ className: "form-group" }, [
              span({ isRendered: this.state.voteStatus === '1' }, [
                label({ id: "lbl_comments" + this.props.id, className: "col-lg-2 col-md-2 col-sm-2 col-xs-3 control-label vote-label " + this.props.color + "-color" }, ["Comments"]),
              ]),
              span({ isRendered: this.state.voteStatus !== '1' }, [
                label({ id: "lbl_rationale" + this.props.id, className: "col-lg-2 col-md-2 col-sm-2 col-xs-3 control-label vote-label " + this.props.color + "-color" }, ["Rationale"]),
              ]),
              div({ className: "col-lg-10 col-md-10 col-sm-10 col-xs-9" }, [
                input({
                  id: "txt_rationale" + this.props.id,
                  name: "inputRationale" + this.props.id,
                  type: "text",
                  className: "form-control col-lg-10 col-md-8 col-sm-6 col-xs-6 vote-input",
                  title: "Optional: describe your rationale or add comments here (please be as specific as possible)",
                  placeholder: "Optional: describe your rationale or add comments here (please be as specific as possible)",
                  value: this.props.rationale,
                  onChange: this.setEnableVoteButton
                }),
              ]),
            ]),

            div({ className: "form-group form-group-bottom" }, [
              div({ className: "col-lg-9 col-md-9 col-sm-6 col-xs-12" }, [
                div({ isRendered: this.props.showAlert === true, className: "vote-box-alert" }, [
                  Alert({ id: "submitVote", type: "danger", title: this.props.alertMessage })
                ]),
              ]),
              div({ className: "col-lg-3 col-md-3 col-sm-6 col-xs-12" }, [
                button({
                  type: 'button',
                  id: "btn_submit_" + this.props.id,
                  disabled: this.state.voteStatus === null || !this.state.enableVoteButton,
                  onClick: this.logVote,
                  className: "btn btn-primary col-lg-12 col-md-12 col-sm-12 col-xs-12 " + this.props.color + "-background"
                }, [this.props.action.label]),

                ConfirmationDialog({
                  title: dialogTitle, color: this.props.color, type: dialogType,
                  showModal: this.state.showDialogSubmit,
                  action: { label: dialogLabel, handler: this.dialogHandlerSubmit }
                }, [div({ className: "dialog-description" }, [dialogMessage])])
              ]),
            ]),
          ])
        ])
      ])
    );
  }
});
