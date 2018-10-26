import { Component } from 'react';
import { div, hh, h3, hr, form, fieldset, input, label, span, button } from 'react-hyperscript-helpers';
import { OptionsRadioGroup } from '../components/OptionsRadioGroup';
import { Alert } from '../components/Alert';

export const SubmitTriVoteBox = hh(class SubmitTriVoteBox extends Component {


  constructor(props) {
    super(props);

    this.state = {
      loading: true,
      currentUser: {},
      enableVoteButton: true,
      voteStatus: this.props.voteStatus,
      prevVoteStatus: this.props.voteStatus,
      showDialogSubmit: false,
      rationale: this.props.rationale != null ? this.props.rationale : '',
      prevRationale: this.props.rationale != null ? this.props.rationale : '',
      requiredMessage: false,
      modifiedVote: false
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

  optionsChange = (e, name, value) => {
    this.setState({
      voteStatus: value,
      requiredMessage: false,
      modifiedVote: true
    });
  };

  changeRationale = async (e) => {
    e.preventDefault();
    await this.setState({
      rationale: e.target.value
    });
  };

  render() {

    const { id, isDisabled, title, color, agreementData, radioLabels, radioValues, showAlert, alertMessage } = this.props;
    const { enableVoteButton, voteStatus = '', rationale = '' } = this.state;

    return (

      div({ id: "box_" + id, className: isDisabled === true ? "box-vote-disabled" : "" }, [
        h3({ className: "box-vote-title italic " + color + "-color" }, [title]),
        hr({ className: "box-separator" }),

        div({ isRendered: agreementData !== undefined }, [agreementData]),

        form({ id: "form_" + this.props.id, className: "form-horizontal" }, [
          fieldset({ disabled: isDisabled }, [
            div({ className: "form-group first-form-group" }, [
              label({ className: "col-lg-2 col-md-2 col-sm-2 col-xs-3 control-label vote-label " + color + "-color" }, ["Your vote*"]),
              div({ className: "col-lg-10 col-md-10 col-sm-10 col-xs-9" }, [

                OptionsRadioGroup({
                  id: id,
                  value: voteStatus,
                  optionLabels: radioLabels,
                  optionValues: radioValues,
                  name: "rad_" + id,
                  onChange: this.optionsChange
                })
              ])
            ]),

            div({ className: "form-group" }, [
              span({ isRendered: voteStatus === '1' || voteStatus === 'true' || voteStatus === true }, [
                label({ id: "lbl_comments" + id, className: "col-lg-2 col-md-2 col-sm-2 col-xs-3 control-label vote-label " + color + "-color" }, ["Comments"]),
              ]),
              span({ isRendered: voteStatus === '0' || voteStatus === '2' || voteStatus === 'false' || voteStatus === false || voteStatus === null || voteStatus === '' }, [
                label({ id: "lbl_rationale" + id, className: "col-lg-2 col-md-2 col-sm-2 col-xs-3 control-label vote-label " + color + "-color" }, ["Rationale"]),
              ]),
              div({ className: "col-lg-10 col-md-10 col-sm-10 col-xs-9" }, [
                input({
                  id: "txt_rationale" + id,
                  name: "inputRationale" + id,
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
                div({ isRendered: showAlert === true, className: "vote-box-alert" }, [
                  Alert({ id: "submitVote", type: "danger", title: alertMessage })
                ]),
                div({ isRendered: this.state.requiredMessage === true, className: "vote-box-alert" }, [
                  Alert({ id: "required", type: "danger", title: "Please, complete all required fields." })
                ])
              ]),
              div({ className: "col-lg-3 col-md-3 col-sm-6 col-xs-12" }, [
                button({
                  type: 'button',
                  id: "btn_submit_" + id,
                  disabled: !enableVoteButton || isDisabled === true,
                  onClick: this.logVote,
                  className: "btn-primary btn-vote col-lg-12 col-md-12 col-sm-12 col-xs-12 " + color + "-background"
                }, [this.props.action.label]),
              ])
            ])
          ])
        ])
      ])
    );
  }
});
