import { Component } from 'react';
import { div, hh, label, hr, span } from 'react-hyperscript-helpers';

export const SingleResultBox = hh(class SingleResultBox extends Component {

  render() {

    return (
      div({ id: this.props.id, className: "jumbotron box-vote-singleresults col-lg-6 col-md-6 col-sm-6 col-xs-12" }, [
          div({ className: "row" }, [
            div({ className: "col-lg-12 col-md-12 col-sm-12 col-xs-12 cm-user-name bold" }, [this.props.data.displayName]),
          ]),
          hr({ className: "box-separator" }),
          div({ className: "row" }, [
            label({
              className: "col-lg-2 col-md-2 col-sm-3 col-xs-3 control-label vote-label " + this.props.color + "-color"
            }, ["Vote: "]),

            div({
              id: "lbl_vote_" + this.props.id, className: "col-lg-4 col-md-4 col-sm-9 col-xs-9 vote-label bold"
            }, [
                span({ isRendered: this.props.data.vote.vote === '1' }, ["YES"]),
                span({ isRendered: this.props.data.vote.vote === '0' }, ["NO"]),
                span({ isRendered: this.props.data.vote.vote === null }, []),
              ]),

            label({
              className: "col-lg-2 col-md-2 col-sm-3 col-xs-3 control-label vote-label " + this.props.color + "-color"
            }, ["Date: "]),

            div({ id: "lbl_date_" + this.props.id, className: "voteDate col-lg-4 col-md-4 col-sm-9 col-xs-9 vote-label" }, [
              span({ isRendered: this.props.data.vote.createDate === null }, ["---"]),
              span({ isRendered: this.props.data.vote.createDate !== null && this.props.data.vote.updateDate === null }, [this.props.data.vote.createDate /* | date:dateFormat */]),
              span({ isRendered: this.props.data.vote.createDate !== null && this.props.data.vote.updateDate !== null }, [this.props.data.vote.updateDate /* | date:dateFormat */]),
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
              span({ isRendered: this.props.data.vote.vote !== null }, [this.props.data.vote.rationale]),
              span({ isRendered: this.props.data.vote.vote === null }, ["---"]),
            ]),
          ]),
      ])
    );
  }
});
