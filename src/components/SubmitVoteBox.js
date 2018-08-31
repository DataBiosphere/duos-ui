import { Component } from 'react';
import { div, hh, h3, hr, form, fieldset, input, label, span, button } from 'react-hyperscript-helpers';

export const SubmitVoteBox = hh(class SubmitVoteBox extends Component {


  constructor(props) {
    super(props);
    this.state = {
      value: '',
      currentUser: {},
      enableVoteButton: false,
      voteStatus: '1'
    }

    this.setEnableVoteButton = this.setEnableVoteButton.bind(this);
  }

  setEnableVoteButton() {
    console.log('----------setEnableVoteButton----------');
    this.setState(prev => {
      prev.enableVoteButton = true;
      return prev;
    });
  }

  logVote = () => {
    console.log('----------logVote----------');
  }

  setEnableVoteButton = () => {
    console.log('----------setEnableVoteButton----------');
  }

  render() {

    return div({ id: this.props.id, className: "jumbotron box-vote " + this.props.color + "-background-lighter" }, [
      h3({ className: "box-vote-title italic " + this.props.color + "-color" }, [this.props.title]),
      hr({ className: "box-separator" }),
      form({ id: "form_" + this.props.id, className: "form-horizontal" }, [
        fieldset({ disable: this.props.isDisabled }, [
          div({ className: "form-group first-form-group" }, [
            label({ className: "col-lg-2 col-md-2 col-sm-2 col-xs-3 control-label vote-label " + this.props.color + "-color" }, ["Your vote*"]),
            div({ className: "col-lg-10 col-md-10 col-sm-10 col-xs-9" }, [
              div({ className: "radio-inline" }, [
                input({
                  id: "rad_positiveVote",
                  name: "inputVote",
                  type: "radio",
                  className: "regular-radio",
                  value: this.state.voteStatus,
                  onClick: this.positiveVote
                }),
                label({ htmlFor: "rad_positiveVote" }, []),
                label({ id: "lbl_positiveVote", htmlFor: "rad_positiveVote", className: "radio-button-text" }, ["Yes"]),

                input({
                  id: "rad_negativeVote",
                  name: "inputVote",
                  type: "radio",
                  className: "regular-radio",
                  value: this.state.voteStatus,
                  onClick: this.setEnableVoteButton
                }),
                label({ htmlFor: "rad_negativeVote" }, []),
                label({ id: "lbl_negativeVote", htmlFor: "rad_negativeVote", className: "radio-button-text" }, ["No"]),
              ]),
            ]),
          ]),

          div({ className: "form-group" }, [
            span({ isRendered: this.state.voteStatus === '1' }, [
              label({ id: "lbl_comments", className: "col-lg-2 col-md-2 col-sm-2 col-xs-3 control-label vote-label " + this.props.color + "-color" }, ["Comments"]),
            ]),
            span({ isRendered: this.state.voteStatus !== '1' }, [
              label({ id: "lbl_rationale", className: "col-lg-2 col-md-2 col-sm-2 col-xs-3 control-label vote-label " + this.props.color + "-color" }, ["Rationale"]),
            ]),
            div({ className: "col-lg-10 col-md-10 col-sm-10 col-xs-9" }, [
              input({
                id: "txt_rationale",
                name: "inputRationale",
                type: "text",
                className: "form-control col-lg-10 col-md-8 col-sm-6 col-xs-6 vote-input",
                title: "Optional: describe your rationale or add comments here (please be as specific as possible)",
                placeholder: "Optional: describe your rationale or add comments here (please be as specific as possible)",
                value: this.state.rationale,
                onChange: this.setEnableVoteButton                
              }),
            ]),
          ]),

          div({ className: "form-group form-group-bottom" }, [
            div({ className: "col-lg-3 col-lg-offset-9 col-md-3 col-md-offset-9 col-sm-6 col-sm-offset-6 col-xs-6 col-xs-offset-6" }, [
              button({
                id: "btn_submitVote",
                disabled: this.state.voteStatus === null || !this.state.enableVoteButton,
                onClick: this.logVote,
                className: "btn btn-primary col-lg-12 col-md-12 col-sm-12 col-xs-12 vote-button " + this.props.color + "-background"
              }, [this.props.action.label]),
            ]),
          ]),
        ])
      ])
    ])
  }
});
