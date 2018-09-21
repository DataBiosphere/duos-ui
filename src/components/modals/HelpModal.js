import { Component } from 'react';
import { div, form, input, label, textarea, hh } from 'react-hyperscript-helpers';
import { BaseModal } from '../BaseModal';
import { Alert } from '../Alert';

export const HelpModal = hh(class HelpModal extends Component {

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
    this.props.onOKRequest('help');
  }

  closeHandler() {
    // this is the method to handle Cancel click
    // could do some cleaning here 
    // or delegate it to the parent
    // we need to use it to close the
    // DO SOMETHING HERE ...

    // and call parent's close handler
    this.props.onCloseRequest('help');
  }

  afterOpenHandler() {
    // DO SOMETHING HERE ...

    // and call parent's after open handler
    this.props.onAfterOpen('help');

  }

  render() {

    return (
      BaseModal({
        id: "helpModal",
        showModal: this.props.showModal,
        onRequestClose: this.closeHandler,
        onAfterOpen: this.afterOpenHandler,
        imgSrc: "/images/icon_add_help.png",
        color: "common",
        title: "Request Help",
        description: "Leave a comment, suggestion or report a bug",
        action: { label: "Submit", handler: this.OKHandler }
      },

        [
          form({ className: "form-horizontal css-form", name: "consentForm", noValidate: "true", encType: "multipart/form-data" }, [
            div({ className: "form-group first-form-group" }, [
              label({ id: "lbl_subject", className: "col-lg-3 col-md-3 col-sm-3 col-xs-4 control-label common-color" }, ["Subject"]),
              div({ className: "col-lg-9 col-md-9 col-sm-9 col-xs-8" }, [
                input({ type: "text", id: "txt_subject", className: "form-control col-lg-12 vote-input", required: "true" }),
              ]),
            ]),

            div({ className: "form-group" }, [
              label({ id: "lbl_description", className: "col-lg-3 col-md-3 col-sm-3 col-xs-4 control-label common-color" }, ["Description"]),
              div({ className: "col-lg-9 col-md-9 col-sm-9 col-xs-8" }, [
                textarea({ name: "helpDescription", id: "txt_description", rows: "5", className: "form-control col-lg-12 vote-input", required: "true" }),
              ]),
            ]),
          ]),
          div({ isRendered: false }, [
            Alert({ id: "modal", type: "danger", title: alert.title, description: alert.msg })
          ])
        ])
    );
  }
});
