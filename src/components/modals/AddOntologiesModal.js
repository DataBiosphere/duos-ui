import { Component } from 'react';
import { div, form, input, label, span, hh, p } from 'react-hyperscript-helpers';
import { BaseModal } from '../BaseModal';
import { Alert } from '../Alert';

export const AddOntologiesModal = hh(class AddOntologiesModal extends Component {

  constructor(props) {
    super(props);

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
    this.props.onOKRequest('addOntologies');
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

  render() {

    return (

      BaseModal({
        showModal: this.props.showModal,
        onRequestClose: this.closeHandler,
        onAfterOpen: this.afterOpenHandler,
        imgSrc: "/images/icon-add-ontology.png",
        color: "common",
        iconName: 'add-ontologies',
        iconSize: 'large',
        title: 'Add Ontologies',
        description: 'Store Ontologies for index',
        action: { label: "Add", handler: this.OKHandler }
      },
        [
          form({ className: "form-horizontal css-form", name: "consentForm", noValidate: "true", encType: "multipart/form-data" }, [
            div({ className: "form-group first-form-group" }, [
              label({ className: "col-lg-3 col-md-3 col-sm-3 col-xs-4 control-label common-color" }, ["Ontology File"]),
              div({ className: "col-lg-9 col-md-9 col-sm-9 col-xs-8 bold" }, [
                div({ className: "fileUpload col-lg-3 col-md-3 col-sm-4 col-xs-12 common-color upload-button" }, [
                  span({}, ["Upload file"]),
                  span({ className: "cm-icon-button glyphicon glyphicon-upload caret-margin", "aria-hidden": "true" }, []),
                  input({ id: "txt_file", type: "file", "ng-model": "file.name", "file-upload": "true", className: "upload", required: "true" }),
                ]),
                p({ className: "fileName" }, ["file.name"]),
              ]),
            ]),

            div({ className: "form-group" }, [
              label({ className: "col-lg-3 col-md-3 col-sm-3 col-xs-4 control-label common-color" }, ["Prefix"]),
              div({ className: "col-lg-9 col-md-9 col-sm-9 col-xs-8" }, [
                input({ id: "txt_prefix", type: "text", "ng-model": "prefix", className: "form-control col-lg-12 vote-input", name: "ontology_prefix", placeholder: "Ontology Prefix", required: "true" }),
              ]),
            ]),

            div({ isRendered: false }, [
              Alert({ id: "modal", type: "danger", title: alert.title, description: alert.msg })
            ])
          ])
        ])
    );
  }

});
