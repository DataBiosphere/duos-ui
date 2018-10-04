import { Component } from 'react';
import { div, form, input, label, textarea, span, hh, p } from 'react-hyperscript-helpers';
import { BaseModal } from '../BaseModal';
import { Alert } from '../Alert';
import { Consent } from "../../libs/ajax";

const CONSENT_ID = "txt_consentId";
const CONSENT_NAME = "txt_consentName";
const USE_RESTRICTION = "txt_sdul";
const DATA_USE = "txt_dataUse";

export const AddDulModal = hh(class AddDulModal extends Component {

  constructor(props) {
    super(props);
    this.state = {
      isEditMode: false,
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
        msg: ['']
      }

    };

    this.handleFileChange = this.handleFileChange.bind(this);
    this.closeHandler = this.closeHandler.bind(this);
    this.afterOpenHandler = this.afterOpenHandler.bind(this);
    this.OKHandler = this.OKHandler.bind(this);
  }

  componentDidMount() {
    if (this.props.isEditMode) {
      this.setState({
        isEditMode: this.props.isEditMode,
        file: { name: this.props.editConsent.dulName },
        consent: {
          consentId: this.props.dul.consentId,
          name: this.props.dul.consentName,
          useRestriction: JSON.stringify(this.props.editConsent.useRestriction),
          dataUse: JSON.stringify(this.props.editConsent.dataUse),
          error: { show: false }
        }
      });
    } else {
      this.setState({
        isEditMode: false,
        consent: {
          consentId: '',
          name: '',
          useRestriction: '',
          dataUse: '',
        },
        file: ''
      });
    }
  };

  async OKHandler() {
    if (this.isValidJson(this.state.consent.useRestriction, "Unable to process Structured Limitations JSON") &&
      this.isValidJson(this.state.consent.dataUse, "Unable to process Data Use JSON")) {
      const consentResponse = await this.consentHandler();
      if (this.state.file.name !== ""
        && consentResponse === true
        && this.uploadFile()
      ) {
        this.props.onOKRequest('editDul');
      }
    }
  }

  closeHandler() {
    this.props.onCloseRequest('addDul');
  }

  afterOpenHandler() {
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
    const response = await Consent.postDul(this.state.consent.consentId, this.state.file.name, this.state.file);
    if (response !== true) {
      this.setState(prev => {
        prev.error.title = 'Server Error';
        prev.error.msg = 'Problem with the file UpLoad.';
        prev.error.show = true;
        return prev;
      });
    }
  }

  async consentHandler() {
    const consent = {};
    let response;
    consent.consentId = this.state.consent.consentId;
    consent.useRestriction = this.state.consent.useRestriction;
    consent.dataUse = this.state.consent.dataUse;
    consent.name = this.state.consent.name;
    if (this.state.isEditMode) {
      response = await Consent.update(consent);
    } else {
      response = await Consent.postConsent(consent);
    }
    if (response === true) {
      return true;
    } else {
      this.handleErrors(response);
    }
    return false;
  };


  handleErrors(message) {
    let errMessage = '';
    let errorTitle = 'Conflicts to resolve!';
    if (message.indexOf("PRIMARY") > -1) {
      errMessage = "There is a Data Use Limitation already registered with this Consent Id. ";
    } else if (message.indexOf("name") > -1) {
      errMessage = "There is a Data Use Limitation already registered with this name.";
    } else if (message.indexOf("Unable to process JSON") > -1) {
      errMessage = "Structured Limitations or Data Use has invalid format. Please write it as valid JSON.";
    } else {
      errorTitle = "Error, unable to create a new Data Use Limitation! ";
      errMessage = message;
    }

    this.setState(prev => {
      prev.disableOkBtn = true;
      prev.error.title = errorTitle;
      prev.error.show = true;
      prev.error.msg = errMessage;
      return prev;
    });
  };

  handleChange = (changeEvent) => {
    const name = changeEvent.target.name;
    const value = changeEvent.target.value;

    this.setState(prev => {
      prev.disableOkBtn = value === '';
      prev.consent[name] = value;
      return prev;
    });

  };

  onFileChange = (e) => {
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
      this.setState({disableOkBtn:true});
      return true;
    } catch (err) {
      this.handleErrors(error);
      return false;
    }
  };

  render() {

    const file = {
      name: "MyFile.txt"
    };

    return (

      BaseModal({
        id: "addDulModal",
        disableOkBtn: this.state.file === '' || this.state.disableOkBtn,
        showModal: this.props.showModal,
        onRequestClose: this.closeHandler,
        onAfterOpen: this.afterOpenHandler,
        imgSrc: "/images/icon_add_dul.png",
        color: "dul",
        title: this.state.isEditMode ? "Edit Data Use Limitations" : "Add Data Use Limitations",
        description: this.state.isEditMode ? "Edit a Data Use Limitations Record" : "Catalog a Data Use Limitation Record",
        action: {
          label: this.state.isEditMode ? "Edit" : "Add",
          handler: this.OKHandler
        }
      },
        [

          form({
            className: "form-horizontal css-form",
            name: "consentForm",
            noValidate: true,
            encType: "multipart/form-data"
          }, [
              div({ className: "form-group first-form-group" }, [
                label({
                  id: "lbl_consentId",
                  className: "col-lg-3 col-md-3 col-sm-3 col-xs-4 control-label dul-color"
                }, ["Unique id"]),
                div({ className: "col-lg-9 col-md-9 col-sm-9 col-xs-8" }, [
                  input({
                    type: "text", "ng-model": "consent.consentId",
                    value: this.state.consent.consentId,
                    onChange: this.handleChange,
                    id: CONSENT_ID,
                    name: "consentId",
                    className: "form-control col-lg-12 vote-input",
                    placeholder: "Unique id from Compliance",
                    required: true,
                    disabled: this.state.isEditMode,
                  }),
                ]),
              ]),

              div({ className: "form-group" }, [
                label({
                  id: "lbl_consentName",
                  className: "col-lg-3 col-md-3 col-sm-3 col-xs-4 control-label dul-color"
                }, ["Consent id"]),
                div({ className: "col-lg-9 col-md-9 col-sm-9 col-xs-8" }, [
                  input({
                    type: "text",
                    value: this.state.consent.name,
                    onChange: this.handleChange,
                    id: CONSENT_NAME,
                    name: "name",
                    className: "form-control col-lg-12 vote-input",
                    placeholder: "Consent id",
                    required: true,
                  }),
                ]),
              ]),

              div({ className: "form-group" }, [
                label({
                  id: "lbl_uploadFile",
                  className: "col-lg-3 col-md-3 col-sm-3 col-xs-4 control-label dul-color"
                }, ["Data Use Limitations File"]),
                div({ className: "col-lg-9 col-md-9 col-sm-9 col-xs-8 bold" }, [
                  div({ className: "fileUpload col-lg-3 col-md-3 col-sm-4 col-xs-12 upload-button" }, [
                    span({}, ["Upload file"]),
                    span({
                      className: "cm-icon-button glyphicon glyphicon-upload caret-margin",
                      "aria-hidden": "true"
                    }, []),
                    input({
                      id: "btn_uploadFile",
                      type: "file",
                      onChange: this.onFileChange,
                      className: "upload",
                      required: true
                    }),
                  ]),
                  p({
                    id: "txt_uploadFile",
                    className: "fileName"
                  }, [this.state.file !== null ? this.state.file.name : file.name]),
                ]),
              ]),

              div({ className: "form-group" }, [
                label({
                  id: "lbl_sdul",
                  className: "col-lg-3 col-md-3 col-sm-3 col-xs-4 control-label dul-color"
                }, ["Structured Limitations"]),
                div({ className: "col-lg-9 col-md-9 col-sm-9 col-xs-8" }, [
                  textarea({
                    id: USE_RESTRICTION,
                    value: this.state.consent.useRestriction,
                    onChange: this.handleChange,
                    name: "useRestriction",
                    className: "form-control col-lg-12 vote-input",
                    placeholder: "Structured string of the Data Use Limitations (JSON format, e.g. {\"type\":\"everything\"})",
                    required: true
                  })
                ]),
              ]),

              div({ className: "form-group" }, [
                label({
                  id: "lbl_dataUse",
                  className: "col-lg-3 col-md-3 col-sm-3 col-xs-4 control-label dul-color"
                }, ["Data Use"]),
                div({ className: "col-lg-9 col-md-9 col-sm-9 col-xs-8" }, [
                  textarea({
                    id: DATA_USE,
                    value: this.state.consent.dataUse,
                    onChange: this.handleChange,
                    name: "dataUse",
                    className: "form-control col-lg-12 vote-input",
                    placeholder: "Structured string of the Data Use Questions/Answers (JSON format, e.g. {\"generalUse\":true})",
                    required: true
                  })
                ])
              ])
            ]),

          div({ isRendered: this.state.error.show }, [
            Alert({ id: "modal", type: "danger", title: this.state.error.title, description: this.state.error.msg })
          ])
        ])
    );
  }

});
