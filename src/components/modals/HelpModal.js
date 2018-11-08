import { Component } from 'react';
import { div, form, input, label, textarea, hh } from 'react-hyperscript-helpers';
import { BaseModal } from '../BaseModal';
import { Alert } from '../Alert';
import { Help } from '../../libs/ajax';
import { Storage } from "../../libs/storage";

export const HelpModal = hh(class HelpModal extends Component {

  constructor(props) {
    super(props);
    this.state = {
      subject: '',
      description: '',
    };
    this.closeHandler = this.closeHandler.bind(this);
    this.afterOpenHandler = this.afterOpenHandler.bind(this);
    this.OKHandler = this.OKHandler.bind(this);
    this.subjectChangeHandler = this.subjectChangeHandler.bind(this);
    this.descriptionChangeHandler = this.descriptionChangeHandler.bind(this);
  }

  async OKHandler() {
    const report = {};
    report.description = this.state.description;
    report.subject = this.state.subject;
    report.userId = Storage.getCurrentUser().dacUserId;
    await Help.createHelpMeReport(report);
    await this.setState(prev => {
      prev.subject = '';
      prev.description = '';
      return prev;
    })
    this.props.onOKRequest('help');;
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
<<<<<<< HEAD
    // DO SOMETHING HERE ...

    // and call parent's after open handler
=======
    // call parent's after open handler
>>>>>>> e91a15aa0b00ba88642a96803bad846fee159cf9
    this.props.onAfterOpen('help');

  }

  subjectChangeHandler = (e) => {
    const subjectText = e.target.value;
    this.setState(prev => {
      prev.subject = subjectText;
      return prev;
    });
  };

  descriptionChangeHandler = (e) => {
    const descriptionText = e.target.value;
    this.setState(prev => {
      prev.description = descriptionText;
      return prev;
    });
  };


  render() {

    return (
      BaseModal({
        id: "helpModal",
        disableOkBtn: (this.state.subject === '' || this.state.description === ''),
        showModal: this.props.showModal,
        onRequestClose: this.closeHandler,
        onAfterOpen: this.afterOpenHandler,
        imgSrc: "/images/icon_add_help.png",
        color: "common",
        title: "Request Help",
        description: "Leave a comment, suggestion or report a bug",
        action: { label: "Submit", handler: this.OKHandler },
      },

        [
          form({ className: "form-horizontal css-form", name: "consentForm", noValidate: true, encType: "multipart/form-data" }, [
            div({ className: "form-group first-form-group" }, [
              label({ id: "lbl_subject", className: "col-lg-3 col-md-3 col-sm-3 col-xs-4 control-label common-color" }, ["Subject"]),
              div({ className: "col-lg-9 col-md-9 col-sm-9 col-xs-8" }, [
                input({ type: "text", id: "txt_subject", className: "form-control col-lg-12 vote-input", onChange: this.subjectChangeHandler, required: true }),
              ]),
            ]),

            div({ className: "form-group" }, [
              label({ id: "lbl_description", className: "col-lg-3 col-md-3 col-sm-3 col-xs-4 control-label common-color" }, ["Description"]),
              div({ className: "col-lg-9 col-md-9 col-sm-9 col-xs-8" }, [
                textarea({ name: "helpDescription", id: "txt_description", rows: "5", className: "form-control col-lg-12 vote-input", onChange: this.descriptionChangeHandler, required: true }),
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
