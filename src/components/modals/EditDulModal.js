import { Component } from 'react';
import { div, form, input, label, textarea, span, hh, p } from 'react-hyperscript-helpers';
import { BaseModal } from '../BaseModal';
import { Consent } from '../../libs/ajax';


export const EditDulModal = hh(class EditDulModal extends Component {

  constructor(props) {
    super(props);

    this.closeHandler = this.closeHandler.bind(this);
    this.afterOpenHandler = this.afterOpenHandler.bind(this);
    this.OKHandler = this.OKHandler.bind(this);
    this.state = {
      consent: {
        consentId: '',
        name: '',
        sdul: '',
        dataUse: '',
      },
      file : ''
    }
  }

componentWillReceiveProps(nextProps) {
    console.log("------next------");
    console.log(nextProps);
    console.log("------next------");
    console.log(JSON.stringify(nextProps.editConsent));
    // const consentData = this.getConsent(nextProps.dul.consentId);
  // let consentData = {};

    // console.log("CONSENT!!! _ ", consentData);
    this.setState({
      consent:{
        consentId: nextProps.dul.consentId,
        name: nextProps.dul.consentName,

        // sdul: JSON.stringify(consentData.useRestriction),
        // dataUse: JSON.stringify(consentData.dataUse)

        sdul: JSON.stringify(nextProps.editConsent.useRestriction),
        dataUse: JSON.stringify(nextProps.editConsent.dataUse)
    }});
  }

  //  getConsent(consentId) {
  //   let info= {};
  //
  //   if (!!consentId) {
  //     Consent.ConsentResource(consentId).then(data => {
  //         info.useRestriction = data.useRestriction;
  //         info.dataUse = data.dataUse;
  //     });
  //   }
  //   return info;
  // };

  /*
  * this.getConsent(nextProps.dul.consentId).then(data => {
      consentData.useRestriction = data.useRestriction;
      consentData.dataUse = data.dataUse;
      // return consentData;
    });
    */
  componentWillMount() {

    // if (this.props.dul !== undefined) {
    //   console.log("Will mount -> ", this.props);
    //   this.setState(prev => {
    //     prev.consent.consentId = this.props.dul.consentId;
    //     return prev;
    //   });
    // }
  }

  OKHandler() {
    // this is the method for handling OK click
    // we might do something here, adding a user for instance
    // or delegate it to the parent....
    // DO SOMETHING HERE ...

    // and call parent's OK Handler
    this.props.onOKRequest('editDul');
  }

  closeHandler() {
    // this is the method to handle Cancel click
    // could do some cleaning here 
    // or delegate it to the parent
    // we need to use it to close the
    // DO SOMETHING HERE ...

    // and call parent's close handler
    this.props.onCloseRequest('editDul');
  }

  afterOpenHandler() {
    // DO SOMETHING HERE ...

    // and call parent's after open handler
    this.props.onAfterOpen('editDul');

  }

  formHandler = (e) => {

  };

  handleChange = (changeEvent) => {
    const fieldId = changeEvent.target.id;
    const value = changeEvent.target.value;
    console.log("changeEvent", fieldId, value);
    if (fieldId==='txt_consentName') {  this.setState(prev => {   prev.consent.name = value;   return value;  });  }
    if (fieldId==='txt_sdul') {  this.setState(prev => {   prev.consent.sdul = value;   return value;  });  }
    if (fieldId==='txt_dataUse') {  this.setState(prev => {   prev.consent.dataUse = value;   return value;  });  }
  };

  onFileChange = (e) => {
    this.setState({file:e.target.files[0]})
  };

  // no hacer esto
  getDataUseLimitationData = (consentId) => {
    Consent.ConsentDulResource(consentId);
  };

  render() {



    console.log('editDul: ', this.props.showModal, this.props.dul);
    // console.log('editConsent' , this.props.editConsent)
    if (this.props.showModal === false) {
      return null;
    }

    return (
      BaseModal({
        showModal: this.props.showModal,
        onRequestClose: this.closeHandler,
        onAfterOpen: this.afterOpenHandler,
        imgSrc: "/images/icon_edit_dul.png",
        color: "dul",
        title: "Edit Data Use Limitations",
        description: "Edit a Data Use Limitations Record",
        action: { label: "Save", handler: this.OKHandler }
      },
        [

          form({ className: "form-horizontal css-form", name: "consentForm", noValidate: "true", encType: "multipart/form-data" }, [
            div({ className: "form-group first-form-group" }, [
              label({ className: "col-lg-3 col-md-3 col-sm-3 col-xs-4 control-label dul-color" }, ["Unique id"]),
              div({ className: "col-lg-9 col-md-9 col-sm-9 col-xs-8" }, [
                input({
                  type: "text", value : this.state.consent.consentId, onChange: this.handleChange,
                  id: "txt_consentId", name: "inputConsentId",
                  className: "form-control col-lg-12 vote-input",
                  placeholder: "Unique id from Compliance", disabled: true
                }),
              ]),
            ]),

            div({ className: "form-group" }, [
              label({ className: "col-lg-3 col-md-3 col-sm-3 col-xs-4 control-label dul-color" }, ["Consent id"]),
              div({ className: "col-lg-9 col-md-9 col-sm-9 col-xs-8" }, [
                input({
                  type: "text", value: this.state.consent.name, onChange: this.handleChange,
                  id: "txt_consentName", name: "inputName",
                  className: "form-control col-lg-12 vote-input",
                  placeholder: "Consent id", required: "true"
                }),
              ]),
            ]),

            div({ className: "form-group" }, [
              label({ id: "lbl_file", className: "col-lg-3 col-md-3 col-sm-3 col-xs-4 control-label dul-color" }, ["Data Use Limitations File"]),
              div({ className: "col-lg-9 col-md-9 col-sm-9 col-xs-8 bold" }, [
                div({ className: "fileUpload col-lg-3 col-md-3 col-sm-4 col-xs-12 upload-button" }, [
                  span({}, ["Upload file"]),
                  span({ className: "cm-icon-button glyphicon glyphicon-upload caret-margin", "aria-hidden": "true" }, []),
                  input({ type: "file", value: '', id: "txt_file", className: "upload", required: "true", onChange: this.onFileChange }),
                ]),
                p({ className: "fileName" }, [this.state.file !== null ? this.state.file.name : 'sample.txt']),
              ]),
            ]),

            div({ className: "form-group" }, [
              label({ className: "col-lg-3 col-md-3 col-sm-3 col-xs-4 control-label dul-color" }, ["Structured Limitations"]),
              div({ className: "col-lg-9 col-md-9 col-sm-9 col-xs-8" }, [
                textarea({
                  value: this.state.consent.sdul, onChange: this.handleChange,
                  id: "txt_sdul", name: "inputSDUL",
                  className: "form-control col-lg-12 vote-input",
                  placeholder: "Structured string of the Data Use Limitations (JSON format, e.g. {&quot;type&quot;:&quot;everything&quot;})", required: "true"
                })
              ]),
            ]),

            div({ className: "form-group" }, [
              label({ className: "col-lg-3 col-md-3 col-sm-3 col-xs-4 control-label dul-color" }, ["Data Use"]),
              div({ className: "col-lg-9 col-md-9 col-sm-9 col-xs-8" }, [
                textarea({
                  value: this.state.consent.dataUse, onChange: this.handleChange,
                  id: "txt_dataUse", name: "inputDU",
                  className: "form-control col-lg-12 vote-input",
                  placeholder: "Structured string of the Data Use Questions/Answers (JSON format, e.g. {&quot;generalUse&quot;:true})", required: "true"
                }),
              ]),
            ]),
          ])

          // div({ isRendered: alerts.lenght > 0, className: "alert-form-group" }, [
          //     div({ className: "admin-alerts no-margin" }, [
          //         alert({ "ng-repeat": "alert in alerts", type: "{{alert.type}}", className: "alert-title cancel-color" }, [
          //             h4({}, [alert.title]),
          //             span({}, [alert.msg]),
          //         ])
          //     ]),
          // ]),

        ])

    );
  }

});
