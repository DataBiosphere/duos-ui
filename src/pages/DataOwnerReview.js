import { Component } from 'react';
import { div, button, hr, h4, a } from 'react-hyperscript-helpers';
import { PageHeading } from '../components/PageHeading';
import { SubmitVoteBox } from '../components/SubmitVoteBox';

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

      div({ className: "container container-wide" }, [
        div({ className: "row no-margin" }, [
          div({ className: "col-lg-7 col-md-7 col-sm-12 col-xs-12 no-padding" }, [
            PageHeading({ imgSrc: "../images/icon_dataset_review.png", iconSize: "large", color: "dataset", title: "Dataset Access Request Review", description: "Should data access be granted to this applicant?" }),
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
            SubmitVoteBox({
              id: "dataOwnerReview",
              color: "dataset",
              title: "Your Vote",
              isDisabled: "isFormDisabled",
              status: this.state.voteStatus,
              radioType: "multiple",
              radioLabels: ['Approve', "Disapprove", "Raise a concern"],
              radioValues: ['1', '0', "2"],
              showAlert: false,
              alertMessage: "something",
              action: { label: "Vote", handler: this.submit }
            }),
          ]),
        ]),
      ])
    );
  }
}

export default DataOwnerReview;

