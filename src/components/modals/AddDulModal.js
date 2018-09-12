import { Component } from 'react';
import { div, form, input, label, textarea, span, hh, p } from 'react-hyperscript-helpers';
import { BaseModal } from '../BaseModal';
import { Alert } from '../Alert';


export const AddDulModal = hh(class AddDulModal extends Component {

  constructor(props) {
    super(props);
    this.state = {
      file: {
        name: "",
      }
    }

    this.handleFileChange = this.handleFileChange.bind(this);
    this.closeHandler = this.closeHandler.bind(this);
    this.afterOpenHandler = this.afterOpenHandler.bind(this);
    this.OKHandler = this.OKHandler.bind(this);
  }

  OKHandler() {
    // this is the method for handling OK click
    // we might do something here, adding a user for instance
    // or delegate it to the parent....
    // DO SOMETHING HERE ...

    // and call parent's OK Handler
    this.props.onOKRequest('addDul');
  }

  closeHandler() {
    // this is the method to handle Cancel click
    // could do some cleaning here 
    // or delegate it to the parent
    // we need to use it to close the
    // DO SOMETHING HERE ...

    // and call parent's close handler
    this.props.onCloseRequest('addDul');
  }

  afterOpenHandler() {
    // DO SOMETHING HERE ...

    // and call parent's after open handler
    this.props.onAfterOpen('addDul');
  }

  handleFileChange(event) {
    if (event.target.files !== undefined && event.target.files[0]) {
      let file = event.target.files[0];
      this.setState({
        file: file,
      });
    }
  }

  render() {
    const file = {
      name: "MyFile.txt"
    }

    return (

      BaseModal({
        showModal: this.props.showModal,
        onRequestClose: this.closeHandler,
        onAfterOpen: this.afterOpenHandler,
        imgSrc: "/images/icon_add_dul.png",
        color: "dul",
        title: "Add Data Use Limitations",
        description: 'Catalog a Data Use Limitation Record in the system',
        action: { label: "Add", handler: this.OKHandler }
      },
        [

          form({ className: "form-horizontal css-form", name: "consentForm", noValidate: "true", encType: "multipart/form-data" }, [
            div({ className: "form-group first-form-group" }, [
              label({ id: "lbl_consentId", className: "col-lg-3 col-md-3 col-sm-3 col-xs-4 control-label dul-color" }, ["Unique id"]),
              div({ className: "col-lg-9 col-md-9 col-sm-9 col-xs-8" }, [
                input({
                  type: "text", "ng-model": "consent.consentId",
                  id: "txt_consentId", name: "inputConsentId",
                  className: "form-control col-lg-12 vote-input",
                  placeholder: "Unique id from Compliance", required: "true"
                }),
              ]),
            ]),

            div({ className: "form-group" }, [
              label({ id: "lbl_consentName", className: "col-lg-3 col-md-3 col-sm-3 col-xs-4 control-label dul-color" }, ["Consent id"]),
              div({ className: "col-lg-9 col-md-9 col-sm-9 col-xs-8" }, [
                input({
                  type: "text", "ng-model": "consent.name",
                  id: "txt_consentName", name: "inputName",
                  className: "form-control col-lg-12 vote-input",
                  placeholder: "Consent id", required: "true"
                }),
              ]),
            ]),

            div({ className: "form-group" }, [
              label({ id: "lbl_uploadFile", className: "col-lg-3 col-md-3 col-sm-3 col-xs-4 control-label dul-color" }, ["Data Use Limitations File"]),
              div({ className: "col-lg-9 col-md-9 col-sm-9 col-xs-8 bold" }, [
                div({ className: "fileUpload col-lg-3 col-md-3 col-sm-4 col-xs-12 upload-button" }, [
                  span({}, ["Upload file"]),
                  span({ className: "cm-icon-button glyphicon glyphicon-upload caret-margin", "aria-hidden": "true" }, []),
                  input({ id: "btn_uploadFile", type: "file", onChange: this.handleFileChange, className: "upload", required: "true" }),
                ]),
                p({ id: "txt_uploadFile", className: "fileName" }, [file.name]),
              ]),
            ]),

            div({ className: "form-group" }, [
              label({ id: "lbl_sdul", className: "col-lg-3 col-md-3 col-sm-3 col-xs-4 control-label dul-color" }, ["Structured Limitations"]),
              div({ className: "col-lg-9 col-md-9 col-sm-9 col-xs-8" }, [
                textarea({
                  id: "txt_sdul", name: "inputSDUL",
                  className: "form-control col-lg-12 vote-input",
                  placeholder: "Structured string of the Data Use Limitations (JSON format, e.g. {&quot;type&quot;:&quot;everything&quot;})", required: "true"
                })
              ]),
            ]),

            div({ className: "form-group" }, [
              label({ id: "lbl_dataUse", className: "col-lg-3 col-md-3 col-sm-3 col-xs-4 control-label dul-color" }, ["Data Use"]),
              div({ className: "col-lg-9 col-md-9 col-sm-9 col-xs-8" }, [
                textarea({
                  id: "txt_dataUse", name: "inputDU",
                  className: "form-control col-lg-12 vote-input",
                  placeholder: "Structured string of the Data Use Questions/Answers (JSON format, e.g. {&quot;generalUse&quot;:true})", required: "true"
                })
              ])
            ])
          ]),

          div({ isRendered: false }, [
            Alert({ id: "modal", type: "danger", title: "alert.title", description: "alert.msg" })
          ])
        ])
    );
  }

});
