import { Component } from 'react';
import { div, form, input, label, textarea, span, hh, p } from 'react-hyperscript-helpers';
import { BaseModal } from '../BaseModal';
import { Alert } from '../Alert';
import { Consent } from "../../libs/ajax";


export const AddDulModal = hh(class AddDulModal extends Component {

  constructor(props) {
    super(props);
    this.state = {
      consent: {
        consentId: '',
        name: '',
        useRestriction: '',
        dataUse: '',
      },
      file: '',
      error: {
        show: false,
        title: '',
        msj: ''
      }
    };

    this.handleFileChange = this.handleFileChange.bind(this);
    this.closeHandler = this.closeHandler.bind(this);
    this.afterOpenHandler = this.afterOpenHandler.bind(this);
    this.OKHandler = this.OKHandler.bind(this);
  }

  componentWillReceiveProps(nextProps) {
    this.setState({
      consent: {
        consentId: nextProps.dul.consentId,
        name: nextProps.dul.consentName,
        useRestriction: JSON.stringify(nextProps.editConsent.useRestriction),
        dataUse: JSON.stringify(nextProps.editConsent.dataUse)
      }
    });
  }

  OKHandler() {
    if (this.isValidJson(this.state.consent.useRestriction ,"Unable to process Structured Limitations JSON") &&
      this.isValidJson(this.state.consent.dataUse, "Unable to process Data Use JSON")) {
      const consentResponse = await this.updateConsent();
      if (this.state.file.name !== ""
        && consentResponse === true
        && this.uploadFile()
      ) {
        this.props.onOKRequest('editDul');
      }
    }
    console.log("handle validation");
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

  async uploadFile() {

    const response = await Consent.CreateDulResource(this.state.consent.consentId, this.state.file.name, this.state.file);
    if (response !== true) {
      this.setState(prev => {
        prev.error.title = 'Server Error';
        prev.error.msj = 'Problem with the file UpLoad.';
        prev.error.show = true;
        return prev;
      });
    }
  }

  async updateConsent() {
    const consent = {};
    consent.consentId = this.state.consent.consentId;
    consent.useRestriction = this.state.consent.useRestriction;
    consent.dataUse = this.state.consent.dataUse;
    consent.name = this.state.consent.name;
    const response = await Consent.update(consent);

    if (response) {
      // this.closeAlert();
      return true;
    } else if (response.data.message === undefined) {
      this.handleErrors(0, response.data.cause.localizedMessage)
    } else {
      this.handleErrors(0, response.data.message);
    }
    return false;
  };

  handleErrors (index, message) {

    var tle = 'Conflicts to resolve!';
    if (message.indexOf("PRIMARY") > -1) {
      message = "There is a Data Use Limitation already registered with this Consent Id. ";
    } else if (message.indexOf("name") > -1) {
      message = "There is a Data Use Limitation already registered with this name.";
    } else if (message.indexOf("Unable to process JSON") > -1){
      message = "Structured Limitations or Data Use has invalid format. Please write it as valid JSON.";
    }
    else {
      tle = "Error, unable to create a new Data Use Limitation! ";
      message = message;
    }

    this.setState(prev => {
      prev.error.title = tle,
        prev.error.show = true;
      prev.error.msj = message;
      return prev;
    });
  };

  handleChange = (changeEvent) => {
    const fieldId = changeEvent.target.id;
    const value = changeEvent.target.value;
    if (fieldId === 'txt_consentName') {
      this.setState(prev => {
        prev.consent.name = value;
        return value;
      });
    }
    if (fieldId === 'txt_sdul') {
      this.setState(prev => {
        prev.consent.useRestriction = value;
        return value;
      });
    }
    if (fieldId === 'txt_dataUse') {
      this.setState(prev => {
        prev.consent.dataUse = value;
        return value;
      });
    }
  };

  onFileChange = (e) => {
    console.log("FILE ", this.state.file);
    if (e.target.files !== undefined && e.target.files[0]) {
      let file = e.target.files[0];
      this.setState({
        file: file,
      });
    }
  };

  isValidJson = (obj, error) => {
    try {
      JSON.parse(obj);
      return true;
    } catch (err) {
      this.handleErrors(0, error);
      return false;
    }
  };
  render() {
    const file = {
      name: "MyFile.txt"
    };

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
                  value: this.state.consent.consentId,
                  onChange: this.handleChange,
                  id: "txt_consentId",
                  name: "inputConsentId",
                  className: "form-control col-lg-12 vote-input",
                  placeholder: "Unique id from Compliance",
                  required: "true",
                  disabled: false
                }),
              ]),
            ]),

            div({ className: "form-group" }, [
              label({ id: "lbl_consentName", className: "col-lg-3 col-md-3 col-sm-3 col-xs-4 control-label dul-color" }, ["Consent id"]),
              div({ className: "col-lg-9 col-md-9 col-sm-9 col-xs-8" }, [
                input({
                  type: "text",
                  value: this.state.consent.name,
                  onChange: this.handleChange,
                  id: "txt_consentName",
                  name: "inputName",
                  className: "form-control col-lg-12 vote-input",
                  placeholder: "Consent id",
                  required: "true",
                }),
              ]),
            ]),

            div({ className: "form-group" }, [
              label({ id: "lbl_uploadFile", className: "col-lg-3 col-md-3 col-sm-3 col-xs-4 control-label dul-color" }, ["Data Use Limitations File"]),
              div({ className: "col-lg-9 col-md-9 col-sm-9 col-xs-8 bold" }, [
                div({ className: "fileUpload col-lg-3 col-md-3 col-sm-4 col-xs-12 upload-button" }, [
                  span({}, ["Upload file"]),
                  span({ className: "cm-icon-button glyphicon glyphicon-upload caret-margin", "aria-hidden": "true" }, []),
                  input({
                    id: "btn_uploadFile",
                    type: "file",
                    onChange: this.onFileChange,
                    className: "upload",
                    required: "true" }),
                ]),
                p({ id: "txt_uploadFile", className: "fileName" }, [this.state.file !== null ? this.state.file.name : file.name]),
              ]),
            ]),

            div({ className: "form-group" }, [
              label({ id: "lbl_sdul", className: "col-lg-3 col-md-3 col-sm-3 col-xs-4 control-label dul-color" }, ["Structured Limitations"]),
              div({ className: "col-lg-9 col-md-9 col-sm-9 col-xs-8" }, [
                textarea({
                  id: "txt_sdul",
                  value: this.state.consent.useRestriction,
                  onChange: this.handleChange,
                  name: "inputSDUL",
                  className: "form-control col-lg-12 vote-input",
                  placeholder: "Structured string of the Data Use Limitations (JSON format, e.g. {&quot;type&quot;:&quot;everything&quot;})",
                  required: "true"
                })
              ]),
            ]),

            div({ className: "form-group" }, [
              label({ id: "lbl_dataUse", className: "col-lg-3 col-md-3 col-sm-3 col-xs-4 control-label dul-color" }, ["Data Use"]),
              div({ className: "col-lg-9 col-md-9 col-sm-9 col-xs-8" }, [
                textarea({
                  id: "txt_dataUse",
                  value: this.state.consent.dataUse,
                  onChange: this.handleChange,
                  name: "inputDU",
                  className: "form-control col-lg-12 vote-input",
                  placeholder: "Structured string of the Data Use Questions/Answers (JSON format, e.g. {&quot;generalUse&quot;:true})",
                  required: "true"
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
