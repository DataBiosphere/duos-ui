import { Component } from 'react';
import { div, form, input, label, span, hh, p, a } from 'react-hyperscript-helpers';
import { BaseModal } from '../BaseModal';
import { DataSet } from '../../libs/ajax';
import { Alert } from '../Alert';
import { Storage } from "../../libs/storage";


export const AddDatasetModal = hh(class AddDatasetModal extends Component {
  USER_ID = Storage.getCurrentUser().dacUserId;

  constructor() {
    super();
    this.state = {
      file: {
        name: '',
      },
      overwrite: false,
      errors: false,
      url: {}
    };
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

  OKHandler = () => {
    if (this.state.file.name !== "") {
      DataSet.postDatasetFile(this.state.file, this.state.overwrite, this.USER_ID)
        .then(() => {
          this.setState({ errors: false });
          // this.props.history.push(`dul_results_record/${electionId}`);
          this.props.onOKRequest('addDataset');
        })
        .catch(errorResponse => {
          this.setState({ errors: true });
          errorResponse.json().then(errors => this.generateFileAndUrl(errors));
        });
    }
  };

  generateFileAndUrl = (errors) => {
    let content = '';
    for (let i = 0; i < errors.length; i++) {
      content += errors[i] + "\r\n";
    }
    let blob = new Blob([content], { type: 'text/plain' });
    let url = (window.URL || window.webkitURL).createObjectURL(blob);
    this.setState({ url: url });
  };

  closeHandler() {
    this.setState({
      url: '',
      file: '',
      overwrite: '',
      errors: false
    });
    this.props.onCloseRequest('addDataset');
  }

  afterOpenHandler() {
    this.props.onAfterOpen('addDataset');

  }

  render() {

    const alertMessage = span({}, [
      "Some errors occurred, Datasets weren't uploaded.",
      div({}, [
        "Please, ",
        a({
          download: "errorsFile.txt",
          className: "hover-color bold",
          href: this.state.url,
        }, ["download this file"]),
        " with the mistakes found."
      ]),
    ]);

    return (

      BaseModal({
        id: "addDatasetModal",
        showModal: this.props.showModal,
        onRequestClose: this.closeHandler,
        onAfterOpen: this.afterOpenHandler,
        imgSrc: "/images/icon_dataset_add.png",
        color: "dataset",
        iconSize: 'large',
        title: "Add Datasets",
        description: 'Store Datasets associated with Data Use Limitations',
        action: { label: "Add", handler: this.OKHandler }
      },
        [

          form({ className: "form-horizontal css-form", name: "consentForm", noValidate: "true", encType: "multipart/form-data" }, [
            div({ className: "form-group first-form-group" }, [
              label({ id: "lbl_uploadFile", className: "col-lg-3 col-md-3 col-sm-3 col-xs-4 control-label dataset-color" }, ["Datasets File"]),
              div({ className: "col-lg-9 col-md-9 col-sm-9 col-xs-8 bold" }, [
                div({ className: "fileUpload col-lg-3 col-md-3 col-sm-4 col-xs-12 dataset-color btn-secondary btn-upload" }, [
                  span({ className: "glyphicon glyphicon-upload", "aria-hidden": "true" }),
                  "Upload file",
                  input({ id: "btn_uploadFile", type: "file", onChange: this.handleFileChange, className: "upload", required: "true" }),
                ]),
                p({ id: "txt_uploadFile", className: "fileName" }, [this.state.file.name]),
              ]),
            ]),

            div({ className: "form-group" }, [
              div({ className: "col-lg-9 col-lg-offset-3 col-md-9 col-lg-offset-3 col-sm-9 col-lg-offset-3 col-xs-8 col-lg-offset-4 bold" }, [
                div({ className: "checkbox dataset-label" }, [
                  input({ id: "chk_overwrite", onChange: this.handleOverwriteChange, checked: this.state.overwrite, type: "checkbox", className: "checkbox-inline", name: "checkOther" }),
                  label({ id: "lbl_overwrite", className: "regular-checkbox dataset-label", htmlFor: "chk_overwrite" }, ["Overwrite existing Datasets"]),
                ])
              ])
            ])
          ]),
          div({ isRendered: this.state.errors }, [
            Alert({ id: "addDataset", type: "danger", title: "Conflicts to resolve!", description: alertMessage })
          ]),
          div({ className: "row download-link" }, ["Click here to download a ", a({ className: "hover-color", href: "/DataSetSample.tsv" }, ["Dataset Spreadsheet Modal"])]),
        ])
    );
  }
});
