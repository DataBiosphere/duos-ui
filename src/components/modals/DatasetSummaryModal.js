import { Component } from 'react';
import { div, form, hr, label, span, hh, p } from 'react-hyperscript-helpers';
import { BaseModal } from '../BaseModal';
import { DataSet } from '../../libs/ajax'

let USER_ID = 5;

export const DatasetSummaryModal = hh(class DatasetSummaryModal extends Component {

  constructor() {
    super();
    this.state = {
      file: {
        name: "",
      },
      overwrite: false
    }
    this.handleFileChange = this.handleFileChange.bind(this);
    this.handleOverwriteChange = this.handleOverwriteChange.bind(this);

    this.closeHandler = this.closeHandler.bind(this);
    this.afterOpenHandler = this.afterOpenHandler.bind(this);
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
    // DO SOMETHING HERE ...

    if (this.state.file.name !== "") {
      DataSet.create(this.state.file, this.state.overwrite, USER_ID).then(
        function () {
          // cerrar modal
          alert("todo bien");
          this.props.onOKRequest('AddDataset');
        }).catch(function (errorResponse) {
          alert(JSON.stringify(errorResponse));
        })
    }

    // and call parent's OK Handler
    this.props.onOKRequest('addDataset');
  }

  closeHandler() {
    // this is the method to handle Cancel click
    // could do some cleaning here 
    // or delegate it to the parent
    // we need to use it to close the
    // DO SOMETHING HERE ...

    // and call parent's close handler
    this.props.onCloseRequest('addDataset');
  }

  afterOpenHandler() {
    // DO SOMETHING HERE ...

    // and call parent's after open handler
    this.props.onAfterOpen('addDataset');

  }

  render() {
    const{ DatasetId, DatasetName, Description, DataType, Indication, Species, nrParticipants, DataDepositor, PI, consentName, translatedUseRestriction } = this.state;

    return (

      BaseModal({
        showModal: this.props.showModal,
        onRequestClose: this.closeHandler,
        onAfterOpen: this.afterOpenHandler,
        imgSrc: "/images/icon_dataset_add.png",
        color: "dataset",
        iconSize: 'large',
        title: "Dataset Summary",
        description: 'Requested Dataset Information',
        action: { label: "Add", handler: this.OKHandler }
      },
        [

          div({ className: "col-lg-12 col-md-12 col-sm-12 col-xs-12 admin-modal-content app-summary-modal-content app-summary-modal-first-content" }, [

            div({ className: "row" }, [
              label({ className: "col-lg-3 col-md-3 col-sm-3 col-xs-4 control-label dataset-color" }, ["Dataset ID"]),
              div({ className: "col-lg-9 col-md-9 col-sm-9 col-xs-8 response-label" }, [DatasetId]),
            ]),

            div({ className: "row" }, [
              label({ className: "col-lg-3 col-md-3 col-sm-3 col-xs-4 control-label dataset-color" }, ["Dataset Name"]),
              div({ className: "col-lg-9 col-md-9 col-sm-9 col-xs-8 response-label" }, [DatasetName]),
            ]),

            div({ className: "row" }, [
              label({ className: "col-lg-3 col-md-3 col-sm-3 col-xs-4 control-label dataset-color" }, ["Description"]),
              div({ className: "col-lg-9 col-md-9 col-sm-9 col-xs-8 response-label" }, [Description]),
            ]),

            div({ className: "row" }, [
              label({ className: "col-lg-3 col-md-3 col-sm-3 col-xs-4 control-label dataset-color" }, ["Data Type"]),
              div({ className: "col-lg-9 col-md-9 col-sm-9 col-xs-8 response-label" }, [DataType]),
            ]),

            div({ className: "row" }, [
              label({ className: "col-lg-3 col-md-3 col-sm-3 col-xs-4 control-label dataset-color" }, ["Phenotype/Indication"]),
              div({ className: "col-lg-9 col-md-9 col-sm-9 col-xs-8 response-label" }, [Indication]),
            ]),

            div({ className: "row" }, [
              label({ className: "col-lg-3 col-md-3 col-sm-3 col-xs-4 control-label dataset-color" }, ["Species"]),
              div({ className: "col-lg-9 col-md-9 col-sm-9 col-xs-8 response-label" }, [Species]),
            ]),

            div({ className: "row" }, [
              label({ className: "col-lg-3 col-md-3 col-sm-3 col-xs-4 control-label dataset-color" }, ["# of Participants"]),
              div({ className: "col-lg-9 col-md-9 col-sm-9 col-xs-8 response-label" }, [nrParticipants]),
            ]),

            hr({}),

            div({ className: "row" }, [
              label({ className: "col-lg-3 col-md-3 col-sm-3 col-xs-4 control-label dataset-color" }, ["Data Depositor"]),
              div({ className: "col-lg-3 col-md-3 col-sm-9 col-xs-8 response-label" }, [DataDepositor]),
            ]),

            div({ className: "row" }, [
              label({ className: "col-lg-3 col-md-3 col-sm-3 col-xs-4 control-label dataset-color" }, ["Principal Investigator"]),
              div({ className: "col-lg-3 col-md-3 col-sm-9 col-xs-8 response-label" }, [PI]),
            ]),

            hr({}),

            div({ className: "row" }, [
              label({ className: "col-lg-3 col-md-3 col-sm-3 col-xs-4 control-label dataset-color" }, ["Consent ID"]),
              div({ className: "col-lg-9 col-md-9 col-sm-9 col-xs-8 response-label" }, [consentName]),
            ]),

            div({ className: "row" }, [
              label({ className: "col-lg-3 col-md-3 col-sm-3 col-xs-4 control-label dataset-color" }, ["Structured Limitations"]),
              div({ className: "col-lg-9 col-md-9 col-sm-9 col-xs-8 response-label translated-restriction" }, [translatedUseRestriction]),
            ]),

            hr({}),
          ]),

        ])
    );
  }
});
