import { Component } from 'react';
import { div, form, input, label, textarea, hh, select, option } from 'react-hyperscript-helpers';
import { SupportRequestBaseModal } from '../SupportRequestBaseModal';
import { Alert } from '../Alert';
import { Support, User } from '../../libs/ajax';
import { Storage } from "../../libs/storage";
import { convertCompilerOptionsFromJson } from 'typescript';

export const SupportRequestModal = hh(class SupportRequestModal extends Component {
  constructor(props) {
    super(props);
    const isLogged = Storage.userIsLogged();
    let name = isLogged ? Storage.getCurrentUser().displayName : '';
    let first_name = isLogged ? ", " + name.split(" ")[0] : '';
    let email = isLogged ? Storage.getCurrentUser().email : '';
    let height = isLogged ? "550px": '700px';
    let top = isLogged ? '400px': '1';
    this.state = {
      name: name,
      isLogged: isLogged,
      type: 'question',
      subject: '',
      description: '',
      attachment: '',
      email: email,
      first_name: first_name,
      height: height,
      top: top,
      vaild: false
    };
    this.closeHandler = this.closeHandler.bind(this);
    this.afterOpenHandler = this.afterOpenHandler.bind(this);
    this.OKHandler = this.OKHandler.bind(this);
    this.nameChangeHandler = this.nameChangeHandler.bind(this);
    this.typeChangeHandler = this.typeChangeHandler.bind(this);
    this.subjectChangeHandler = this.subjectChangeHandler.bind(this);
    this.descriptionChangeHandler = this.descriptionChangeHandler.bind(this);
    this.attachmentChangeHandler = this.attachmentChangeHandler.bind(this);
    this.emailChangeHandler = this.emailChangeHandler.bind(this);
  }

  async OKHandler() {
    const ticket = {};
    ticket.request = {
      requester: { name: this.state.name, email: this.state.email },
      subject: this.state.subject,
      // BEWARE changing the following ids or values! If you change them then you must thoroughly test.
      custom_fields: [
        { id: 360012744452, value: this.state.type},
        { id: 360007369412, value: this.state.description},
        { id: 360012744292, value: this.state.name},
        { id: 360012782111, value: this.state.email },
        { id: 360018545031, value: this.state.email }
      ],
      comment: {
        body: this.state.description + '\n\n------------------\nSubmitted from: ' + this.props.url,
        //${currUrl}
        uploads: [this.state.attachment.token]
      },
      ticket_form_id: 360000669472
    };
    await Support.createSupportRequest(ticket);
    
    await this.setState(prev => {
      prev.name = '';
      prev.type = "question";
      prev.subject = '';
      prev.description = '';
      prev.attachment = '';
      prev.email = '';
      return prev;
    });
    this.props.onOKRequest('support');;
  }

  closeHandler() {
    // this is the method to handle Cancel click
    // could do some cleaning here
    // or delegate it to the parent
    // we need to use it to close the
    // DO SOMETHING HERE ...

    // and call parent's close handler
    this.props.onCloseRequest('support');
  }

  afterOpenHandler() {
    // call parent's after open handler
    this.props.onAfterOpen('support');

  }

  nameChangeHandler = (e) => {
    const nameText = e.target.value;
    this.setState(prev => {
      prev.name = nameText;
      return prev;
    });
  };

  typeChangeHandler = (e) => {
    const typeText = e.target.value;
    this.setState(prev => {
      prev.type = typeText;
      return prev;
    });
  };

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

  async attachmentChangeHandler(e){
    const file = e.target.files[0];
    const attachmentText = await Support.uploadAttachment(file);
    this.setState(prev => {
      prev.attachment = attachmentText;
      return prev;
    });
  };

  emailChangeHandler = (e) => {
    let emailText = e.target.value;
    this.state.vaild = /.+@.+\.[A-Za-z]+$/.test(emailText) ? true: false; 
    this.setState(prev => {
      prev.email = emailText;
      return prev;
    });
  };

  render() {

    return (
      SupportRequestBaseModal({
        id: "SupportRequestModal",
        disableOkBtn: (this.state.name === '' || this.state.email === '' || this.state.subject === '' || this.state.description === '' || this.state.vaild === false),
        showModal: this.props.showModal,
        onRequestClose: this.closeHandler,
        onAfterOpen: this.afterOpenHandler,
        imgSrc: "/images/icon_add_help.png",
        color: "common",
        title: "Contact Us",
        height: this.state.height,
        top: this.state.top,
        action: { label: "Submit", handler: this.OKHandler },
      },

        [
          form({ className: "form-horizontal css-form", name: "consentForm", noValidate: true, encType: "multipart/form-data" }, [
            !this.state.isLogged && div({ className: "form-group first-form-group" }, [
              label({ id: "lbl_name", className: "common-color" }, ["Name *"]),
              input({ id: "txt_name", placeholder:'What should we call you?', value: this.state.name, className: "form-control col-lg-12", onChange: this.nameChangeHandler, required: true }),
            ]),
            div({ className: "form-group first-form-group" }, [
              label({ id: "lbl_type", className: "common-color" }, ["Type *"]),
              select({id: "txt_question", className: "col-lg-12 select-wrapper", value: this.state.type, onChange: this.typeChangeHandler, required: true}, [
                option({ value: "question"} , ["Question"]),
                option({ value: "bug"}, ["Bug"]),
                option({ value: "feature_request"}, ["Feature Request"])
              ]),  
            ]),
            div({ className: "form-group first-form-group" }, [
              label({ id: "lbl_description", className: "common-color" }, ["How can we help you" + this.state.first_name + "? *"]),
              input({ id: "txt_subject", placeholder:'Enter a subject', rows: "5", className: "form-control col-lg-12 vote-input", onChange: this.subjectChangeHandler, required: true }),
              textarea({ id: "txt_description", placeholder:'Enter a description', rows: "5", className: "form-control col-lg-12 vote-input", onChange: this.descriptionChangeHandler, required: true }),
            ]),
            div({ className: "form-group first-form-group" }, [
              label({ id: "lbl_attachment", className: "common-color" }, ["Attachment"]),
              input({ type: "file", id: "txt_attachment", placeholder: 'Attach a file?', className: "form-control col-lg-12 vote-input common-color", onChange: this.attachmentChangeHandler, ref: 'fileUpload', required: false }),
            ]),
            !this.state.isLogged && div({ className: "form-group first-form-group" }, [
              label({ id: "lbl_email", className: "common-color" }, ["Contact email *"]),
              input({ id: "txt_email", className: "form-control col-lg-12 vote-input",  placeholder:'Enter a email', value: this.state.email, onChange: this.emailChangeHandler, required: true }),
            ]),
          ]),
          div({ isRendered: false }, [
            Alert({ id: "modal", type: "danger", title: alert.title, description: alert.msg })
          ])
        ])
    );
  }
});
