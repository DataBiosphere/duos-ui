import { Component } from 'react';
import { div, hh, h3, hr, form, fieldset, input, label, span, button } from 'react-hyperscript-helpers';
import { YesNoRadioGroup } from '../components/YesNoRadioGroup';
import { Alert } from '../components/Alert';

export const SubmitVoteBox = hh(class SubmitVoteBox extends Component {

  constructor(props) {
    super(props);

    this.state = {
      loading: true,
      currentUser: {},
      enableVoteButton: true,
      voteStatus: this.props.voteStatus != null ? this.props.voteStatus : '',
      prevVoteStatus: this.props.voteStatus != null ? this.props.voteStatus : '',
      showDialogSubmit: false,
      rationale: this.props.rationale != null ? this.props.rationale : '',
      prevRationale: this.props.rationale != null ? this.props.rationale : '',
      requiredMessage: false
    }
  }

  logVote = (e) => {
    if (this.state.voteStatus != null) {
      this.setState({
        enableVoteButton: false,
        requiredMessage: false
      });
      this.props.action.handler(this.state.voteStatus, this.state.rationale);
    } else {
      this.setState({ requiredMessage: true });
    }
  };

  static getDerivedStateFromProps(nextProps, prevState) {
    if (nextProps.rationale !== prevState.prevRationale
      || nextProps.voteStatus !== prevState.prevVoteStatus) {
      return {
        rationale : nextProps.rationale,
        prevRationale : nextProps.rationale,
        voteStatus : nextProps.voteStatus,
        prevVoteStatus: nextProps.voteStatus
      }
    }
    return null;
  }

  yesNoChange = (e, name, value) => {
    this.setState({ voteStatus: e.target.value , requiredMessage: false });
  };

  changeRationale = (e) => {
    this.setState({ rationale: e.target.value });
  };

  render() {

    const { voteStatus = '', rationale = '', enableVoteButton } = this.state;

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
                  value: voteStatus,
                  name: "rad_" + this.props.id,
                  onChange: this.yesNoChange
                }),
              ])
            ]),

            div({ className: "form-group" }, [
              span({ isRendered: voteStatus === '1' || voteStatus === 'true' || voteStatus === true }, [
                label({ id: "lbl_comments" + this.props.id, className: "col-lg-2 col-md-2 col-sm-2 col-xs-3 control-label vote-label " + this.props.color + "-color" }, ["Comments"]),
              ]),
              span({ isRendered: voteStatus === '0' || voteStatus === '2' || voteStatus === 'false' || voteStatus === false || voteStatus === null || voteStatus === '' }, [
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
                  value: rationale,
                  onChange: this.changeRationale
                })
              ])
            ]),

            div({ className: "form-group form-group-bottom" }, [
              div({ className: "col-lg-9 col-md-9 col-sm-6 col-xs-12" }, [
                div({ isRendered: this.props.showAlert === true, className: "vote-box-alert" }, [
                  Alert({ id: "submitVote", type: "danger", title: this.props.alertMessage })
                ]),
                div({ isRendered: this.state.requiredMessage === true, className: "vote-box-alert" }, [
                  Alert({ id: "required", type: "danger", title: "Please, complete all required fields." })
                ])
              ]),
              div({ className: "col-lg-3 col-md-3 col-sm-6 col-xs-12" }, [
                button({
                  type: 'button',
                  id: "btn_submit_" + this.props.id,
                  disabled: !enableVoteButton || this.props.disabled === true,
                  onClick: this.logVote,
                  className: "btn-primary btn-vote col-lg-12 col-md-12 col-sm-12 col-xs-12 " + this.props.color + "-background"
                }, [this.props.action.label]),
              ])
            ])
          ])
        ])
      ])
    );
  }
});
