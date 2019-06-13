import { Component } from 'react';
import { div, form, input, label, span, hh, h, p, a, small } from 'react-hyperscript-helpers';
import { BaseModal } from '../BaseModal';
import { DataSet } from '../../libs/ajax';
import { Alert } from '../Alert';
import { Storage } from "../../libs/storage";
import AsyncSelect from 'react-select/lib/Async';


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
      "Some errors occurred, Datasets weren't uploaded. Please, ",
      a({
        download: "errorsFile.txt",
        className: "hover-color bold",
        href: this.state.url,
      }, ["download this file"]),
      " with the mistakes found."
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
        description: 'Upload Datasets associated with Data Use Limitations',
        action: { label: "Add", handler: this.OKHandler }
      },
        [
          form({ className: "form-vertical css-form", name: "consentForm", noValidate: true, encType: "multipart/form-data" }, [

            /* Row 1 */
            div({ className: "row" }, [
              div({ className: "col-xs-12 col-sm-6 col-md-5" }, [
                div({ className: "form-group" }, [
                  label({className: "control-label common-color"}, ["Dataset Name*"]),
                  input({ id: "dataset_name", type: "text", className: "form-control", required: true }),
                  small({className: "form-text text-muted font-normal"}, ["The publicly visible name for this dataset displayed in the DUOS Dataset Catalog"])
                ])
              ]),

              div({ className: "col-xs-12 col-sm-6 col-md-5 col-md-offset-1" }, [
                div({ className: "form-group" }, [
                  label({className: "control-label common-color"}, ["FireCloud/Terra Workspace URL*"]),
                  input({ id: "workspace_url", type: "text", className: "form-control", required: true })
                ])
              ])
            ]),

            /* Row 2 */
            div({ className: "row" }, [
              div({ className: "col-xs-12 col-sm-6 col-md-5" }, [
                div({ className: "form-group" }, [
                  label({className: "control-label common-color"}, ["Data Type*"]),
                  input({ id: "datatype", type: "text", className: "form-control", required: true, placeholder: "example: RNASeq, WES, WGS etc." })
                ])
              ]),

              div({ className: "col-xs-12 col-sm-6 col-md-5 col-md-offset-1" }, [
                div({ className: "form-group" }, [
                  label({className: "control-label common-color"}, ["Species*"]),
                  input({ id: "species", type: "text", className: "form-control", required: true })
                ])
              ])
            ]),

            /* Row 3 */
            div({ className: "row" }, [
              div({ className: "col-xs-12 col-sm-6 col-md-5" }, [
                div({ className: "form-group" }, [
                  label({className: "control-label common-color"}, ["Phenotype/Indication*"]),
                  input({ id: "phenotype_indication", type: "text", className: "form-control", required: true }),
                  small({className: "form-text text-muted font-normal"}, ["For a list of phenotypes, please see:"]),
                  a({className: "", href: "http://disease-ontology.org/", target: "_blank"}, ["http://disease-ontology.org/"])
                ])
              ]),

              div({ className: "col-xs-12 col-sm-6 col-md-5 col-md-offset-1" }, [
                div({ className: "form-group" }, [
                  label({className: "control-label common-color"}, ["# of Participants*"]),
                  input({ id: "participants", type: "text", className: "form-control", required: true })
                ])
              ])
            ]),

            /* Row 4 */
            div({ className: "row" }, [
              div({ className: "col-xs-12 col-sm-6 col-md-5" }, [
                div({ className: "form-group" }, [
                  label({className: "control-label common-color"}, ["Dataset Description*"]),
                  input({ id: "dataset_description", type: "text", className: "form-control", required: true })
                ])
              ]),

              div({ className: "col-xs-12 col-sm-6 col-md-5 col-md-offset-1" }, [
                div({ className: "form-group" }, [
                  label({className: "control-label common-color"}, ["dbGaP/repository study URL*"]),
                  input({ id: "dbGaP_StudyURL", type: "text", className: "form-control", required: true })
                ])
              ])
            ]),

            /* Row 5 */
            div({ className: "row" }, [
              div({ className: "col-xs-12 col-sm-6 col-md-5" }, [
                div({ className: "form-group" }, [
                  label({className: "control-label common-color"}, ["Principal Investigator(s)*"]),
                  input({ id: "principal_investigator", type: "text", className: "form-control", required: true })
                ])
              ]),

              div({ className: "col-xs-12 col-sm-6 col-md-5 col-md-offset-1" }, [
                div({ className: "form-group" }, [
                  label({className: "control-label common-color"}, ["Dataset Depositor*"]),
                  input({ id: "dataset_depositor", type: "text", className: "form-control", required: true })
                ])
              ])
            ]),

            /* Row 6 */
            div({ className: "row" }, [
              div({ className: "col-xs-12 col-sm-6 col-md-5" }, [
                div({ className: "form-group" }, [
                  label({className: "control-label common-color"}, ["Data Owner"]),
                  h(AsyncSelect, {
                    id: "data_owner",
                    // key: this.state.formData.datasets.value,
                    // isDisabled: this.state.formData.dar_code !== null,
                    isMulti: false,
                    // loadOptions: (query, callback) => this.searchDataSets(query, callback),
                    // onChange: (option) => this.onDatasetsChange(option),
                    // value: this.state.formData.datasets,
                    // noOptionsMessage: () => this.state.optionMessage,
                    // loadingMessage: () => this.state.optionMessage,
                    classNamePrefix: "select",
                    placeholder: "Select a DUOS User...",
                    className: 'select-autocomplete',
                    required: false
                  })
                ])
              ]),

              div({ className: "col-xs-12 col-sm-6 col-md-5 col-md-offset-1" }, [
                div({ className: "form-group" }, [
                  label({className: "control-label common-color"}, ["Data Access Committee"]),
                  h(AsyncSelect, {
                    id: "data_accessCommittee",
                    // key: this.state.formData.datasets.value,
                    // isDisabled: this.state.formData.dar_code !== null,
                    isMulti: false,
                    // loadOptions: (query, callback) => this.searchDataSets(query, callback),
                    // onChange: (option) => this.onDatasetsChange(option),
                    // value: this.state.formData.datasets,
                    // noOptionsMessage: () => this.state.optionMessage,
                    // loadingMessage: () => this.state.optionMessage,
                    classNamePrefix: "select",
                    placeholder: "Select a DUOS User...",
                    className: 'select-autocomplete',
                    required: false
                  })
                ])
              ])
            ]),
          
            /* Row 7 */
            div({ className: "row" }, [
              div({ className: "col-xs-12 col-sm-6 col-md-5" }, [
                div({ className: "form-group" }, [
                  label({className: "control-label common-color"}, ["Publication Reference"]),
                  input({ id: "publication_reference", type: "text", className: "form-control", required: false }),
                ])
              ])
            ])
          ]),

          // a({ className: "hover-color", href: "#" }, ["Upload a .cvs file"])


          // form({ className: "form-horizontal css-form", name: "consentForm", noValidate: true, encType: "multipart/form-data" }, [
          //   div({ className: "form-group first-form-group" }, [
          //     label({ id: "lbl_uploadFile", className: "col-lg-3 col-md-3 col-sm-3 col-xs-4 control-label dataset-color" }, ["Datasets File"]),
          //     div({ className: "col-lg-9 col-md-9 col-sm-9 col-xs-8 bold" }, [
          //       div({ className: "fileUpload col-lg-3 col-md-3 col-sm-4 col-xs-12 dataset-color btn-secondary btn-upload" }, [
          //         span({ className: "glyphicon glyphicon-upload", "aria-hidden": "true" }),
          //         "Upload file",
          //         input({ id: "btn_uploadFile", type: "file", onChange: this.handleFileChange, className: "upload", required: true }),
          //       ]),
          //       p({ id: "txt_uploadFile", className: "fileName" }, [this.state.file.name]),
          //     ]),
          //   ]),

          //   div({ className: "form-group" }, [
          //     div({ className: "col-lg-9 col-lg-offset-3 col-md-9 col-lg-offset-3 col-sm-9 col-lg-offset-3 col-xs-8 col-lg-offset-4 bold" }, [
          //       div({ className: "checkbox dataset-label" }, [
          //         input({ id: "chk_overwrite", onChange: this.handleOverwriteChange, checked: this.state.overwrite, type: "checkbox", className: "checkbox-inline", name: "checkOther" }),
          //         label({ id: "lbl_overwrite", className: "regular-checkbox dataset-label", htmlFor: "chk_overwrite" }, ["Overwrite existing Datasets"]),
          //       ])
          //     ])
          //   ])
          // ]),
          div({ isRendered: this.state.errors }, [
            Alert({ id: "addDataset", type: "danger", title: "Conflicts to resolve!", description: alertMessage })
          ]),
        ])
    );
  }
});
