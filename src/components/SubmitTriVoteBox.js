import { PureComponent } from 'react';
import { div, hh, h3, hr, form, fieldset, input, label, span, button } from 'react-hyperscript-helpers';
import { OptionsRadioGroup } from '../components/OptionsRadioGroup';
import { Alert } from '../components/Alert';

export const SubmitTriVoteBox = hh(class SubmitTriVoteBox extends PureComponent {

  state = {
    enableVoteButton: true,
    requiredMessage: false,
    voteStatus: this.props.voteStatus === undefined ? null : this.props.voteStatus,
    rationale: this.props.rationale === null ? '' : this.props.rationale,
  };

  logVote = () => {
    if (this.state.voteStatus != null) {
      this.setState({
        enableVoteButton: false,
        requiredMessage: false
      });
      this.props.action.handler(this.state.voteStatus, this.state.rationale);
    } else {
      this.setState({
        requiredMessage: true
      });
    }
  };

  optionsChange = (e, name, value) => {
    this.setState({
      voteStatus: value,
      requiredMessage: false,
    });
  };

  changeRationale = async (e) => {
    e.preventDefault();
    await this.setState({
      rationale: e.target.value,
    });
  };

  render() {

    const { id, isDisabled, title, agreementData, color, showAlert, alertMessage, radioLabels, radioValues } = this.props;
    let { enableVoteButton, requiredMessage, voteStatus = '', rationale = '' } = this.state;

    const showComments = voteStatus === '1' || voteStatus === 'true' || voteStatus === true;
    const showRationale = voteStatus === '0' || voteStatus === '2' || voteStatus === 'false' || voteStatus === false || voteStatus === null || voteStatus === '';

    return (

      div({ id: 'box_' + id, className: isDisabled === true ? 'box-vote-disabled' : '' }, [
        h3({ className: 'box-vote-title italic ' + color + '-color' }, [title]),
        hr({ className: 'box-separator' }),

        div({ isRendered: agreementData !== undefined }, [agreementData]),

        form({ id: 'form_' + id, className: 'form-horizontal' }, [
          fieldset({ disabled: isDisabled }, [
            div({ className: 'form-group first-form-group' }, [
              label({ className: 'col-lg-2 col-md-2 col-sm-2 col-xs-3 control-label vote-label ' + color + '-color' }, ['Your vote*']),
              div({ className: 'col-lg-10 col-md-10 col-sm-10 col-xs-9' }, [

                OptionsRadioGroup({
                  id: id,
                  value: voteStatus,
                  optionLabels: radioLabels,
                  optionValues: radioValues,
                  name: 'rad_' + id,
                  onChange: this.optionsChange
                })
              ])
            ]),

            div({ className: 'form-group' }, [
              span({ isRendered: showComments }, [
                label({ id: 'lbl_comments' + id, className: 'col-lg-2 col-md-2 col-sm-2 col-xs-3 control-label vote-label ' + color + '-color' }, ['Comments']),
              ]),
              span({ isRendered: showRationale }, [
                label({ id: 'lbl_rationale' + id, className: 'col-lg-2 col-md-2 col-sm-2 col-xs-3 control-label vote-label ' + color + '-color' }, ['Rationale']),
              ]),
              div({ className: 'col-lg-10 col-md-10 col-sm-10 col-xs-9' }, [
                input({
                  id: 'txt_rationale' + id,
                  name: 'inputRationale' + id,
                  type: 'text',
                  className: 'form-control col-lg-10 col-md-8 col-sm-6 col-xs-6 vote-input',
                  title: 'Optional: describe your rationale or add comments here (please be as specific as possible)',
                  placeholder: 'Optional: describe your rationale or add comments here (please be as specific as possible)',
                  value: rationale,
                  onChange: this.changeRationale
                })
              ])
            ]),

            div({ className: 'form-group form-group-bottom' }, [
              div({ className: 'col-lg-9 col-md-9 col-sm-6 col-xs-12' }, [
                div({ isRendered: showAlert === true, className: 'vote-box-alert' }, [
                  Alert({ id: 'submitVote', type: 'danger', title: alertMessage })
                ]),
                div({ isRendered: requiredMessage === true, className: 'vote-box-alert' }, [
                  Alert({ id: 'required', type: 'danger', title: 'Please, complete all required fields.' })
                ])
              ]),
              div({ className: 'col-lg-3 col-md-3 col-sm-6 col-xs-12' }, [
                button({
                  type: 'button',
                  id: 'btn_submit_' + id,
                  disabled: !enableVoteButton || isDisabled === true,
                  onClick: this.logVote,
                  className: 'btn-primary btn-vote col-lg-12 col-md-12 col-sm-12 col-xs-12 ' + color + '-background'
                }, [this.props.action.label]),
              ])
            ])
          ])
        ])
      ])
    );
  }
});
