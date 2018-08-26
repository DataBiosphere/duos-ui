import { Component } from 'react';
import { div, form, input, label, span, hh, p } from 'react-hyperscript-helpers';
import { BaseModal } from '../BaseModal';
import { DataSet } from '../../libs/ajax'

let USER_ID = 5;

export const AddDatasetModal = hh(class AddDatasetModal extends Component {

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
    this.props.onOKRequest('AddDataset');
  }

  closeHandler() {
    // this is the method to handle Cancel click
    // could do some cleaning here 
    // or delegate it to the parent
    // we need to use it to close the
    // DO SOMETHING HERE ...

    // and call parent's close handler
    this.props.onCloseRequest('AddDataset');
  }

  afterOpenHandler() {
    // DO SOMETHING HERE ...

    // and call parent's after open handler
    this.props.onAfterOpen('AddDataset');

  }

  render() {
    return (

      BaseModal({
        showModal: this.props.showModal,
        onRequestClose: this.closeHandler,
        onAfterOpen: this.afterOpenHandler,
        linkType: this.props.linkType,
        id: 'btn_addDataset',
        modalBtnStyle: "admin-box-wrapper",
        modalSize: "large",
        imgSrc: "/images/icon_dataset_add.png",
        color: "dataset",
        iconName: 'add-dataset',
        iconSize: 'large',
        title: "Add Datasets",
        description: 'Store Datasets associated with Data Use Limitations',
        action: { label: "Add", handler: this.OKHandler }
      },
        [
          form({ className: "form-horizontal css-form", name: "consentForm", noValidate: "true", encType: "multipart/form-data" }, [
            div({ className: "form-group admin-form-group first-form-group" }, [
              label({ className: "col-lg-3 col-md-3 col-sm-3 col-xs-4 control-label dataset-color" }, ["Datasets File"]),
              div({ className: "col-lg-9 col-md-9 col-sm-9 col-xs-8 bold" }, [
                div({ className: "fileUpload col-lg-3 col-md-3 col-sm-4 col-xs-12 dataset-color upload-button" }, [
                  span({}, ["Upload file"]),
                  span({ className: "cm-icon-button glyphicon glyphicon-upload caret-margin", "aria-hidden": "true" }, []),
                  input({ type: "file", onChange: this.handleFileChange, id: "txt_file", className: "upload", required: "true" }),
                ]),
                p({ className: "fileName" }, [this.state.file.name]),
              ]),
            ]),

            div({ className: "form-group admin-form-group" }, [
              div({ className: "col-lg-9 col-lg-offset-3 col-md-9 col-lg-offset-3 col-sm-9 col-lg-offset-3 col-xs-8 col-lg-offset-4 bold" }, [
                div({ className: "checkbox dataset-label" }, [
                  input({ onChange: this.handleOverwriteChange, checked: this.state.overwrite, id: "txt_overwrite", type: "checkbox", className: "checkbox-inline", name: "checkOther" }),
                  label({ id: "lbl_overwrite", className: "regular-checkbox dataset-label", htmlFor: "txt_overwrite" }, ["Overwrite existing Datasets"]),
                ]),
              ]),
            ]),

          ])

          // div({ isRendered: alerts.lenght > 0, className: "form-group dataset-form-group" }, [
          //     div({ className: "admin-alerts dataset-admin-alerts" }, [
          //         alert({ "ng-repeat": "alert in alerts", type: "{{alert.type}}", className: "alert-title cancel-color no-margin" }, [
          //             h4({}, [alert.title]),
          //             span({}, [alert.msg]),
          // span({ style: "lineHeight: 22px" }, [
          //     "Please, ",
          //     a({ download: "errorsFile.txt", className: "hover-color bold", href: "{{url}}", onClick: DataSetModal.releaseUrl }, ["download this file"]),
          //     "with the mistakes found."
          // ]),

          //         ])
          //     ]),
          // ]),

        ])
    );
  }
});
