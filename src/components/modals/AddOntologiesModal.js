import { Component, Fragment } from 'react';
import { div, form, input, label, span, hh, p, select, h, option } from 'react-hyperscript-helpers';
import { BaseModal } from '../BaseModal';
import { Alert } from '../Alert';
import { Ontology } from "../../libs/ajax";

export const AddOntologiesModal = hh(class AddOntologiesModal extends Component {

  fileUploadErrorAlert = (msg) => {
    this.setState(prev => {
      prev.error.show = true;
      prev.error.title = "Ontologies weren't Indexed";
      prev.error.msg = msg;
    });
  };

  constructor(props) {
    super(props);
    this.state = {
      ontologyTypes: [],
      file: {
        name: ''
      },
      ontology: {
        type: '',
        prefix: ''
      },
      error: {
        show: false,
        title: '',
        msg: ['']
      }
    };

    this.handleFileChange = this.handleFileChange.bind(this);
    this.handleSelection = this.handleSelection.bind(this);
    this.handlePrefixChange = this.handlePrefixChange.bind(this);
    this.closeHandler = this.closeHandler.bind(this);
    this.afterOpenHandler = this.afterOpenHandler.bind(this);
    this.OKHandler = this.OKHandler.bind(this);
  }

  async getOntologiesType() {

    // types are sent in uppercase strings, this code sets first capital letter and the rest lowercase.
    let ontologyTypes = [];
    for (let type of await Ontology.getOntologyTypes()) {
      type = type.toLowerCase();
      ontologyTypes.push(type.charAt(0).toUpperCase() + type.substr(1));
    }

    this.setState(prev => {
      prev.ontologyTypes = ontologyTypes;
      prev.ontology.type = ontologyTypes[0];
      return prev;
    });

  };

  componentWillMount() {
    this.getOntologiesType();
  };

  OKHandler() {
    const fileMetaData = {
      prefix: this.state.ontology.prefix,
      type: this.state.ontology.type
    };

    const fileData = {
      file: this.file,
      fileMetadata: fileMetaData
    };

    let response = Ontology.postOntologyFile(fileData);
    response.then(function () {
      this.setState(prev => {
        prev.error.show = false;
      });
      this.props.onOKRequest('addOntologies');
    }).catch((errorResponse) => {
      if (errorResponse.status === 304) {
        this.fileUploadErrorAlert("Please check the prefix, it doesn't match any ontology Id in file");
      } else {
        this.fileUploadErrorAlert(errorResponse.data.message);
      }
    });

  }

  closeHandler() {
    // this is the method to handle Cancel click
    // could do some cleaning here 
    // or delegate it to the parent
    // we need to use it to close the
    // DO SOMETHING HERE ...

    // and call parent's close handler
    this.props.onCloseRequest('addOntologies');
  }

  afterOpenHandler() {
    // DO SOMETHING HERE ...

    // and call parent's after open handler
    this.props.onAfterOpen('addOntologies');
  }

  handleFileChange(event) {
    if (event.target.files !== undefined && event.target.files[0]) {
      let file = event.target.files[0];
      this.setState({
        file: file,
      });
    }
  }

  handleSelection(event) {
    const typeChange = event.target.value;
    this.setState(prev => {
      prev.ontology.type = typeChange;
      return typeChange;
    });
  }

  handlePrefixChange(event) {
    const value = event.target.value;
    this.setState(prev => {
      prev.ontology.prefix = value;
      return value;
    });
  }

  render() {

    return (

      BaseModal({
        id: "addOntologiesModal",
          showModal: this.props.showModal,
          onRequestClose: this.closeHandler,
          onAfterOpen: this.afterOpenHandler,
          imgSrc: "/images/icon-add-ontology.png",
          color: "common",
          iconName: 'add-ontologies',
          iconSize: 'large',
          title: 'Add Ontologies',
          description: 'Store Ontologies for index',
          action: {label: "Add", handler: this.OKHandler}
        },
        [
          form({
            className: "form-horizontal css-form",
            name: "consentForm",
            noValidate: true,
            encType: "multipart/form-data"
          }, [
            div({className: "form-group first-form-group"}, [
              label({
                id: "lbl_uploadFile",
                className: "col-lg-3 col-md-3 col-sm-3 col-xs-4 control-label common-color"
              }, ["Ontology File"]),
              div({className: "col-lg-9 col-md-9 col-sm-9 col-xs-8 bold"}, [
                div({className: "fileUpload col-lg-3 col-md-3 col-sm-4 col-xs-12 common-color upload-button"}, [
                  span({}, ["Upload file"]),
                  span({
                    className: "cm-icon-button glyphicon glyphicon-upload caret-margin",
                    "aria-hidden": "true"
                  }, []),
                  input({
                    id: "btn_uploadFile",
                    type: "file",
                    onChange: this.handleFileChange,
                    className: "upload",
                    required: true
                  }),
                ]),
                p({id: "txt_uploadFile", className: "fileName"}, [this.state.file.name]),
              ]),
            ]),


            div({className: "form-group"}, [
              label({
                id: "lbl_type",
                className: "col-lg-3 col-md-3 col-sm-3 col-xs-4 control-label common-color"
              }, ["Type"]),
              div({className: "col-lg-9 col-md-9 col-sm-9 col-xs-8"}, [
                select({
                  id: "sel_type", className: "form-control select-option",
                  value: this.state.ontology.type,
                  onChange: this.handleSelection
                }, [
                  this.state.ontologyTypes.map((type, index) => {
                    return h(Fragment, {key: index}, [
                      option({value: type}, [type]),
                    ])
                  })
                ])
              ])
            ]),

            div({className: "form-group"}, [
              label({
                id: "lbl_prefix",
                className: "col-lg-3 col-md-3 col-sm-3 col-xs-4 control-label common-color"
              }, ["Prefix"]),
              div({className: "col-lg-9 col-md-9 col-sm-9 col-xs-8"}, [
                input({
                  id: "txt_prefix",
                  type: "text",
                  "ng-model": "prefix",
                  className: "form-control col-lg-12 vote-input",
                  value: this.state.ontology.prefix,
                  name: "ontology_prefix",
                  placeholder: "Ontology Prefix",
                  required: true,
                  onChange: this.handlePrefixChange
                }),
              ]),
            ]),

            div({isRendered: this.state.error.show}, [
              Alert({id: "modal", type: "danger", title: this.state.error.title, description: this.state.error.msg})
            ])
          ])
        ])
    );
  }

});
