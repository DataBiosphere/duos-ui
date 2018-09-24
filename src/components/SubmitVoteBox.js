import { Component } from 'react';
import { div, hh, h3, hr, form, fieldset, input, label, span, button } from 'react-hyperscript-helpers';
import { YesNoRadioGroup } from '../components/YesNoRadioGroup';
import { OptionsRadioGroup } from '../components/OptionsRadioGroup';
import { Alert } from '../components/Alert';

export const SubmitVoteBox = hh(class SubmitVoteBox extends Component {

  constructor(props) {
    super(props);
    this.state = {
      //      value: '',
      currentUser: {},
      enableVoteButton: false,
      voteStatus: this.props.voteStatus,
      showDialogSubmit: false,
      rationale: this.props.rationale
    }
  }

  logVote = (e) => {
    this.props.action.handler(this.state.voteStatus, this.state.rationale);
  };

  static getDerivedStateFromProps(nextProps, prevState) {
    if (prevState.flag === false || prevState.flag === undefined) {
      return {
        flag: true,
        rationale: nextProps.rationale,
        voteStatus: nextProps.voteStatus
      };
    }
  }

  yesNoChange = (e, name, value) => {
    this.setState({ voteStatus: value, enableVoteButton: true });
  };

  optionsChange = (e, name, value) => {
    this.setState({ voteStatus: value, enableVoteButton: true });
  };

  changeRationale = (e) => {
    this.setState({ rationale: e.target.value, enableVoteButton: true });
  };

  render() {

    console.log('render : ', this.state);
    // let dialogTitle = "";
    // let dialogMessage = "";
    // let dialogType = "";
    // let dialogLabel = "";

    // //if agreement election
    // if (this.props.id === "agreement") {
    //   dialogTitle = "Post Decision Agreement?";
    //   dialogMessage = "Are you sure you want to post this Decision Agreement?";
    //   dialogType = "";
    //   dialogLabel = "Yes"
    // }

    // //if final election
    // if (this.props.id === "finalAccess") {
    //   dialogTitle = "Post Final Access Decision?";
    //   dialogMessage = "Are you sure you want to post this Final Access Decision?";
    //   dialogType = "";
    //   dialogLabel = "Yes"
    // }

    // //if collect election 
    // if (this.props.id === "accessCollect" || this.props.id === "rpCollect" || this.props.id === "dulCollect") {
    //   dialogTitle = "Post Final Vote?";
    //   dialogMessage = "If you post this vote the Election will be closed with current results.";
    //   dialogType = "";
    //   dialogLabel = "Yes"
    // }

    // //if review election
    // if (this.props.id === "accessReview" || this.props.id === "rpReview" || this.props.id === "dulReview" || this.props.id === "dataOwnerReview" || this.props.id === "researcherReview") {
    //   dialogTitle = "Vote confirmation";
    //   dialogMessage = "Your vote has been successfully logged!";
    //   dialogType = "informative";
    //   dialogLabel = "Ok"
    // }

    const { voteStatus, rationale, enableVoteButton } = this.state;
    return (

      div({ id: "box_" + this.props.id, className: this.props.isDisabled === true ? "box-vote-disabled" : "" }, [
        h3({ className: "box-vote-title italic " + this.props.color + "-color" }, [this.props.title]),
        hr({ className: "box-separator" }),

        div({ isRendered: this.props.agreementData !== undefined }, [this.props.agreementData]),

        form({ id: "form_" + this.props.id, className: "form-horizontal" }, [
          fieldset({ disabled: this.props.isDisabled }, [
            div({ className: "form-group first-form-group" }, [
              label({ className: "col-lg-2 col-md-2 col-sm-2 col-xs-3 control-label vote-label " + this.props.color + "-color" }, ["Your vote*"]),
              div({ className: "col-lg-10 col-md-10 col-sm-10 col-xs-9" }, [

                YesNoRadioGroup({
                  id: this.props.id,
                  isRendered: (this.props.radioType === "boolean") || (this.props.radioType === undefined),
                  value: voteStatus,
                  name: "rad_" + this.props.id,
                  onChange: this.yesNoChange
                }),

                OptionsRadioGroup({
                  id: this.props.id,
                  isRendered: this.props.radioType === "multiple",
                  value: voteStatus,
                  optionLabels: this.props.radioLabels,
                  optionValues: this.props.radioValues,
                  name: "rad_" + this.props.id,
                  onChange: this.optionsChange
                }),
              ]),
            ]),

            div({ className: "form-group" }, [
              span({ isRendered: voteStatus === '1' || voteStatus === 'true' || voteStatus === true }, [
                label({ id: "lbl_comments_" + this.props.id, className: "col-lg-2 col-md-2 col-sm-2 col-xs-3 control-label vote-label " + this.props.color + "-color" }, ["Comments"]),
              ]),
              span({ isRendered: voteStatus === '0' || voteStatus === 'false' || voteStatus === false || voteStatus === null }, [
                label({ id: "lbl_rationale_" + this.props.id, className: "col-lg-2 col-md-2 col-sm-2 col-xs-3 control-label vote-label " + this.props.color + "-color" }, ["Rationale"]),
              ]),
              div({ className: "col-lg-10 col-md-10 col-sm-10 col-xs-9" }, [
                input({
                  id: "txt_rationale_" + this.props.id,
                  name: "inputRationale" + this.props.id,
                  type: "text",
                  className: "form-control col-lg-10 col-md-8 col-sm-6 col-xs-6 vote-input",
                  title: "Optional: describe your rationale or add comments here (please be as specific as possible)",
                  placeholder: "Optional: describe your rationale or add comments here (please be as specific as possible)",
                  value: rationale,
                  onChange: this.changeRationale
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
                  disabled: voteStatus === null || !enableVoteButton,
                  onClick: this.logVote,
                  className: "btn btn-primary col-lg-12 col-md-12 col-sm-12 col-xs-12 " + this.props.color + "-background"
                }, [this.props.action.label]),
              ]),
            ]),
          ])
        ])
      ])
    );
  }
});