import { Component } from 'react';
import { div, hr, label, hh } from 'react-hyperscript-helpers';
import { BaseModal } from '../BaseModal';
import { DataSet } from '../../libs/ajax'

let USER_ID = 5;

export const DatasetSummaryModal = hh(class DatasetSummaryModal extends Component {

  constructor() {
    super();
    this.state = {
      DatasetId: 'SC-15542',
      DatasetName: 'Dataset Name',
      Description: 'This is the description',
      DataType: 'DNA',
      Indication: 'Some indication',
      Species: 'human',
      nrParticipants: '201',
      DataDepositor: 'Me',
      PI: 'Also me',
      consentName: 'Consent Name',
      translatedUseRestriction: 'Translated DUL'
    }


    this.closeHandler = this.closeHandler.bind(this);
    this.OKHandler = this.OKHandler.bind(this);
  };

  handleOverwriteChange(event) {
    this.setState({
      file: this.state.file,
      overwrite: event.target.checked
    });
  }

  handleFileChange(event) {
    if (event.target.files !== undefined && event.target.files[0]) {
      let file = event.target.files[0];
      this.setState({
        file: file,
        overwrite: this.state.overwrite
      });
    }
  }

  OKHandler() {
    // this is the method for handling OK click
    // we might do something here, adding a user for instance
    // or delegate it to the parent....
  }

  closeHandler() {
    // this is the method to handle Cancel click
  }


  render() {

    return (

      BaseModal({
        showModal: this.props.showModal,
        onRequestClose: this.closeHandler,
        color: "dataset",
        type: "informative",
        iconSize: 'none',
        title: "Dataset Summary",
        description: 'Requested Dataset Information',
        action: { label: "Close", handler: this.OKHandler }
      },
        [
          div({ className: "summary" }, [
            div({ className: "row" }, [
              label({ className: "col-lg-3 col-md-3 col-sm-3 col-xs-4 control-label dataset-color" }, ["Dataset ID"]),
              div({ className: "col-lg-9 col-md-9 col-sm-9 col-xs-8 response-label" }, [this.state.DatasetId]),
            ]),

            div({ className: "row" }, [
              label({ className: "col-lg-3 col-md-3 col-sm-3 col-xs-4 control-label dataset-color" }, ["Dataset Name"]),
              div({ className: "col-lg-9 col-md-9 col-sm-9 col-xs-8 response-label" }, [this.state.DatasetName]),
            ]),

            div({ className: "row" }, [
              label({ className: "col-lg-3 col-md-3 col-sm-3 col-xs-4 control-label dataset-color" }, ["Description"]),
              div({ className: "col-lg-9 col-md-9 col-sm-9 col-xs-8 response-label" }, [this.state.Description]),
            ]),

            div({ className: "row" }, [
              label({ className: "col-lg-3 col-md-3 col-sm-3 col-xs-4 control-label dataset-color" }, ["Data Type"]),
              div({ className: "col-lg-9 col-md-9 col-sm-9 col-xs-8 response-label" }, [this.state.DataType]),
            ]),

            div({ className: "row" }, [
              label({ className: "col-lg-3 col-md-3 col-sm-3 col-xs-4 control-label dataset-color" }, ["Phenotype/Indication"]),
              div({ className: "col-lg-9 col-md-9 col-sm-9 col-xs-8 response-label" }, [this.state.Indication]),
            ]),

            div({ className: "row" }, [
              label({ className: "col-lg-3 col-md-3 col-sm-3 col-xs-4 control-label dataset-color" }, ["Species"]),
              div({ className: "col-lg-9 col-md-9 col-sm-9 col-xs-8 response-label" }, [this.state.Species]),
            ]),

            div({ className: "row" }, [
              label({ className: "col-lg-3 col-md-3 col-sm-3 col-xs-4 control-label dataset-color" }, ["# of Participants"]),
              div({ className: "col-lg-9 col-md-9 col-sm-9 col-xs-8 response-label" }, [this.state.nrParticipants]),
            ]),

            hr({}),

            div({ className: "row" }, [
              label({ className: "col-lg-3 col-md-3 col-sm-3 col-xs-4 control-label dataset-color" }, ["Data Depositor"]),
              div({ className: "col-lg-3 col-md-3 col-sm-9 col-xs-8 response-label" }, [this.state.DataDepositor]),
            ]),

            div({ className: "row" }, [
              label({ className: "col-lg-3 col-md-3 col-sm-3 col-xs-4 control-label dataset-color" }, ["Principal Investigator"]),
              div({ className: "col-lg-3 col-md-3 col-sm-9 col-xs-8 response-label" }, [this.state.PI]),
            ]),

            hr({}),

            div({ className: "row" }, [
              label({ className: "col-lg-3 col-md-3 col-sm-3 col-xs-4 control-label dataset-color" }, ["Consent ID"]),
              div({ className: "col-lg-9 col-md-9 col-sm-9 col-xs-8 response-label" }, [this.state.consentName]),
            ]),

            div({ className: "row" }, [
              label({ className: "col-lg-3 col-md-3 col-sm-3 col-xs-4 control-label dataset-color" }, ["Structured Limitations"]),
              div({ className: "col-lg-9 col-md-9 col-sm-9 col-xs-8 response-label translated-restriction" }, [this.state.translatedUseRestriction]),
            ]),

          ]),

        ])
    );
  }
});
