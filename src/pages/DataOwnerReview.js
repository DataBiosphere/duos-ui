import { Component } from 'react';
import { div, button, hr, img, h2, br, h4, a, h3, form, fieldset, label, input, span } from 'react-hyperscript-helpers';
import { PageHeading } from '../components/PageHeading';
import { OptionsRadioGroup } from '../components/OptionsRadioGroup';

class DataOwnerReview extends Component {

  constructor(props) {
    super(props);
    this.state = {
      value: '',
      voteStatus: null,
      rationale: '',
      darFields: {
        rus: ' rus rus rus rus rus ......'
      }

    }

    this.myHandler = this.myHandler.bind(this);
  }

  myHandler(event) {
    // TBD
  }

  logVote = (e) => {

  }

  openApplication = (e) => {

  }

  openDatasetApplication = (e) => {

  }

  downloadDUL = (e) => {

  }

  handleRadioChange = (e, field, value) => {
    this.setState(prev => { 
      prev[field] = value; return prev; });
  }


  render() {
    return (

      // div({ className: "container" }, [
      //   div({ className: "row no-margin" }, [
      //     div({ className: "col-lg-7 col-md-7 col-sm-12 col-xs-12 no-padding" }, [
      //       PageHeading({ imgSrc: "../images/icon_dataset_review.png", iconSize: "large", color: "dataset", title: "Dataset Access Request Review", description: "Should data access be granted to this applicant?" }),
      //     ]),
      //   ]),
      //   hr({ className: "section-separator" }),

      //   button({}, ["Click Me!"])
      // ])


      div({ className: "container" }, [

        div({ className: "row fsi-row-lg-level fsi-row-md-level title-wrapper" }, [
          img({ src: "/images/icon_dataset_review.png", alt: "Dataset Review icon", className: "cm-icons main-icon-title" }),
          h2({ className: "main-title margin-sm dataset-color" }, [
            "Dataset Access Request Review", br(),
            div({ className: "main-title-description" }, ["Should data access be granted to this applicant?"]),
          ]),
        ]),

        hr({ className: "section-separator" }),
        div({ className: "row fsi-row-lg-level fsi-row-md-level no-margin" }, [

          div({ className: "col-lg-6 col-md-6 col-sm-12 col-xs-12 panel panel-primary cm-boxes" }, [
            div({ className: "panel-heading cm-boxhead dataset-color" }, [
              h4({}, ["Research Purpose",
                a({ className: "enabled hover-color application-link", onClick: this.openApplication }, ["Application summary"]),
              ]),
            ]),
            div({ id: "rp", className: "panel-body cm-boxbody" }, [ this.state.darFields.rus]),
          ]),

          div({ className: "col-lg-6 col-md-6 col-sm-12 col-xs-12 panel panel-primary cm-boxes" }, [
            div({ className: "panel-heading cm-boxhead dataset-color" }, [
              h4({}, ["Data Use Limitations",
                a({ className: "enabled hover-color application-link", onClick: this.openDatasetApplication }, ["Dataset summary"]),
              ]),
            ]),
            div({ id: "dul", className: "panel-body cm-boxbody" }, [
              button({ className: "col-lg-6 col-md-6 col-sm-8 col-xs-12 btn vote-reminder hover-color", onClick: this.downloadDUL }, ["Download Data Use Letter"]),
            ]),
          ]),

        ]),

        div({ className: "col-lg-8 col-lg-offset-2 col-md-8 col-md-offset-2 col-sm-12 col-xs-12" }, [
          div({ className: "jumbotron box-vote" }, [
            h3({ className: "cm-results-subtitle dataset-color" }, ["Your vote"]),
            hr({ className: "box-separator" }),

            form({ className: "form-horizontal", id: "voteForm" }, [
              fieldset({ "ng-disabled": "isFormDisabled" }, [
                div({ className: "form-group first-form-group" }, [

                  label({
                    className: "col-lg-2 col-md-2 col-sm-2 col-xs-3 control-label vote-label dataset-color"
                  }, ["Vote"]),

                  div({ className: "col-lg-10 col-md-10 col-sm-10 col-xs-9" }, [

                    // div({ className: "radio-inline" }, [

                    //   input({
                    //     type: "radio", "value": this.state.voteStatus, onClick: this.positiveVote,
                    //     className: "regular-radio", id: "inputVotePositive",
                    //     "ng-value": "true", name: "inputVote"
                    //   }),
                    //   label({ for: "inputVotePositive" }, []),
                    //   label({ for: "inputVotePositive", className: "radio-button-text" }, ["Approve"]),

                    //   input({
                    //     type: "radio", "value": this.state.voteStatus, onClick: this.negativeVote,
                    //     "ng-value": "false", className: "regular-radio", id: "inputVoteNegative",
                    //     name: "inputVote"
                    //   }),
                    //   label({ for: "inputVoteNegative" }, []),
                    //   label({ for: "inputVoteNegative", className: "radio-button-text" }, ["Disapprove"]),

                    //   input({
                    //     type: "radio", "value": "hasConcerns", onClick: "concerns()",
                    //     "ng-value": "true", className: "regular-radio", id: "inputConcern",
                    //     name: "inputVote"
                    //   }),
                    //   label({ for: "inputConcern" }, []),
                    //   label({ for: "inputConcern", className: "radio-button-text" }, ["Raise a concern"]),
                    // ]),

                    OptionsRadioGroup({
                      value: this.state.voteStatus,
                      optionLabels: ['Approve', "Disapprove", "Raise a concern"],
                      optionValues: ['1', '0', "C"],
                      name: 'voteStatus',
                      onChange: this.handleRadioChange
                    }),

                  ]),
                ]),

                div({ className: "form-group" }, [
                  span({ isRendered: this.state.voteStatus === '1' }, [
                    label({ className: "col-lg-2 col-md-2 col-sm-2 col-xs-3 control-label vote-label dataset-color" }, ["Comments"]),
                  ]),

                  span({ isRendered: this.state.voteStatus !== '1' }, [
                    label({ className: "col-lg-2 col-md-2 col-sm-2 col-xs-3 control-label vote-label dataset-color" }, ["Rationale"]),
                  ]),

                  div({ className: "col-lg-10 col-md-10 col-sm-10 col-xs-9" }, [
                    input({
                      type: "text", value: this.state.rationale,
                      name: "inputRationale",
                      className: "form-control col-lg-10 col-md-8 col-sm-6 col-xs-6 vote-input",
                      placeholder: "Describe your rationale here (be as specific as possible)."
                    }),
                  ]),
                  div({ className: "row" }, [
                    div({ className: "col-lg-9 col-md-9 col-sm-8 col-xs-12 votes-alerts" }, [
                      //     alert({ "ng-repeat":"alert in alertsDAR", type:"danger", className:"alert-title cancel-color f-left"}, [
                      //         h4({},["this.alert.title <i}),this.alert.msg </i},["]),
                      //         ]),
                    ]),

                    div({ className: "col-lg-3 col-md-3 col-sm-4 col-xs-4 col-xs-offset-8 f-right no-margin" }, [
                      button({
                        "ng-disabled": "this.state.voteStatus === null && hasConcerns === null", onClick: this.logVote,
                        className: "btn btn-primary col-lg-12 col-md-12 col-sm-12 col-xs-12 vote-button dataset-background"
                      }, [
                          "Vote"
                        ]),
                    ]),
                  ]),
                ]), 
              ]),
            ]),
          ]),
        ]),
      ])
    );
  }
}

export default DataOwnerReview;

