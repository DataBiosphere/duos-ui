import { Component } from 'react';
import { div, hh, label, hr, span, input } from 'react-hyperscript-helpers';
import * as Utils from '../libs/utils';

export const SingleResultBox = hh(class SingleResultBox extends Component {

  constructor(props) {
    super(props);
    this.state = {
      showDialogReminder: false,
    };
  }

  openDialogReminder = () => {
    this.props.handler(this.props.data.vote.voteId);
  };


  render() {

    return (
      div({ id: this.props.id, className: 'col-lg-6 col-md-6 col-sm-6 col-xs-12 no-padding' }, [
        div({ className: 'jumbotron box-vote-singleresults' }, [
          div({ className: 'row' }, [
            div({ className: 'col-lg-8 col-md-8 col-sm-12 col-xs-12 cm-user-name' }, [this.props.data.displayName]),
            div({ className: 'col-lg-4 col-md-4 col-sm-12 col-xs-12' }, [
              span({ isRendered: this.props.data.vote.updateDate !== null, className: 'vote-update f-right' }, ['Updated vote!']),
              input({
                id: 'btn_reminder_' + this.props.id,
                isRendered: this.props.data.vote.vote === null,
                type: 'button',
                value: 'Send a reminder',
                disabled: this.props.buttonDisabled,
                onClick: this.openDialogReminder,
                className: 'btn-secondary btn-reminder f-right ' + (this.props.color) + '-color'
              })
            ])
          ]),

          hr({ className: 'box-separator' }),
          div({ className: 'row' }, [
            label({
              className: 'col-lg-2 col-md-2 col-sm-3 col-xs-3 control-label vote-label ' + this.props.color + '-color'
            }, ['Vote: ']),

            div({
              id: 'lbl_vote_' + this.props.id, className: 'col-lg-4 col-md-4 col-sm-9 col-xs-9 vote-label bold'
            }, [
              span({ isRendered: this.props.data.vote.vote === '1' || this.props.data.vote.vote === true || this.props.data.vote.vote === 'true' }, ['YES']),
              span({ isRendered: this.props.data.vote.vote === '0' || this.props.data.vote.vote === false || this.props.data.vote.vote === 'false' }, ['NO']),
              span({ isRendered: this.props.data.vote.vote === null }, ['---']),
            ]),

            label({
              className: 'col-lg-2 col-md-2 col-sm-3 col-xs-3 control-label vote-label ' + this.props.color + '-color'
            }, ['Date: ']),

            div({ id: 'lbl_date_' + this.props.id, className: 'voteDate col-lg-4 col-md-4 col-sm-9 col-xs-9 vote-label' }, [
              span({ isRendered: this.props.data.vote.createDate === null }, ['---']),
              span(
                { isRendered: this.props.data.vote.createDate !== null && this.props.data.vote.updateDate === null },
                [Utils.formatDate(this.props.data.vote.createDate)]
              ),
              span(
                { isRendered: this.props.data.vote.createDate !== null && this.props.data.vote.updateDate !== null },
                [Utils.formatDate(this.props.data.vote.updateDate)]
              ),
            ]),
          ]),

          div({ className: 'row' }, [
            span({ isRendered: this.props.data.vote.vote === '1' || this.props.data.vote.vote === true || this.props.data.vote.vote === 'true' }, [
              label({ className: 'col-lg-2 col-md-2 col-sm-3 col-xs-3 control-label vote-label ' + this.props.color + '-color' }, ['Comments:']),
            ]),
            span({ isRendered: this.props.data.vote.vote === null || this.props.data.vote.vote === '0' || this.props.data.vote.vote === false || this.props.data.vote.vote === 'false' }, [
              label({ className: 'col-lg-2 col-md-2 col-sm-3 col-xs-3 control-label vote-label ' + this.props.color + '-color' }, ['Rationale:']),
            ]),
            div({ id: 'lbl_rationale_' + this.props.id, className: 'inputRationale col-lg-10 col-md-10 col-sm-9 col-xs-9 vote-label' }, [
              span({ isRendered: this.props.data.vote.rationale !== null }, [this.props.data.vote.rationale]),
              span({ isRendered: this.props.data.vote.rationale === null }, ['---'])
            ])
          ])
        ])
      ])
    );
  }
});
