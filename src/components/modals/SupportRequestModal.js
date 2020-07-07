import { Component } from 'react';
import { div, form, input, label, textarea, hh, select, option } from 'react-hyperscript-helpers';
import { SupportRequestBaseModal } from '../SupportRequestBaseModal';
import { Alert } from '../Alert';
import { Support} from '../../libs/ajax';
import { Storage } from '../../libs/storage';

export const SupportRequestModal = hh(class SupportRequestModal extends Component {
  constructor(props) {
    super(props);
    const isLogged = Storage.userIsLogged();
    const name = isLogged ? Storage.getCurrentUser().displayName : '';
    const first_name = isLogged ? ', ' + name.split(' ')[0] : '';
    const email = isLogged ? Storage.getCurrentUser().email : '';
    const valid = isLogged ? true : false;
    const height = isLogged ? '550px': '700px';
    const top = isLogged ? '400px': '1';
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
      valid: valid
    };

    this.closeHandler = () => {
      //TODO: 'Support request canceled' that goes away after a few seconds.
      this.props.onCloseRequest('support');
    };

    this.afterOpenHandler = () => {
      // call parent's after open handler
      this.props.onAfterOpen('support');
    };

    this.OKHandler = async () => {
        const ticket = {};
        
        const token =  this.state.attachment != '' ? await Support.uploadAttachment(this.state.attachment): '';
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
            uploads: [token.token]
          },
          ticket_form_id: 360000669472
        };
        await Support.createSupportRequest(ticket);
        
        await this.setState(prev => {
          prev.type = 'question';
          prev.subject = '';
          prev.description = '';
          prev.attachment = '';
          return prev;
        });
        this.props.onOKRequest('support');
    };

    this.nameChangeHandler = (e) => {
      const nameText = e.target.value;
      this.setState(prev => {
        prev.name = nameText;
        return prev;
      });
    };

    this.typeChangeHandler = (e) => {
      const typeText = e.target.value;
      this.setState(prev => {
        prev.type = typeText;
        return prev;
      });
    };

    this.subjectChangeHandler = (e) => {
      const subjectText = e.target.value;
      this.setState(prev => {
        prev.subject = subjectText;
        return prev;
      });
    };

    this.descriptionChangeHandler = (e) => {
      const descriptionText = e.target.value;
      this.setState(prev => {
        prev.description = descriptionText;
        return prev;
      });
    };

    this.attachmentChangeHandler = (e) => {
      const file = e.target.files[0];
      this.setState(prev => {
        prev.attachment = file;
        return prev;
      });
    };

    this.emailChangeHandler = (e) => {
      let emailText = e.target.value;
      this.setState(prev => {
        prev.email = emailText;
        prev.valid = /.+@.+\.[A-Za-z]+$/.test(emailText) ? true: false; 
        return prev;
      });
    };
  }

  render() {

    return (
      SupportRequestBaseModal({
        id: 'SupportRequestModal',
        disableOkBtn: (this.state.name === '' || this.state.email === '' || this.state.subject === '' || this.state.description === '' || this.state.valid === false),
        showModal: this.props.showModal,
        onRequestClose: this.closeHandler,
        onAfterOpen: this.afterOpenHandler,
        imgSrc: '/images/icon_add_help.png',
        color: 'common',
        title: 'Contact Us',
        height: this.state.height,
        top: this.state.top,
        action: { label: 'Submit', handler: this.OKHandler },
      },

        [
          form({ className: 'form-horizontal css-form', name: 'zendeskTicketForm', noValidate: true, encType: 'multipart/form-data' }, [
            !this.state.isLogged && div({ className: 'form-group first-form-group' }, [
              label({ id: 'lbl_name', className: 'common-color' }, ['Name *']),
              input({ id: 'txt_name', placeholder:'What should we call you?', value: this.state.name, className: 'form-control col-lg-12', onChange: this.nameChangeHandler, required: true }),
            ]),
            div({ className: 'form-group first-form-group' }, [
              label({ id: 'lbl_type', className: 'common-color' }, ['Type *']),
              select({id: 'txt_question', className: 'col-lg-12 select-wrapper', value: this.state.type, onChange: this.typeChangeHandler, required: true}, [
                option({ value: 'question'} , ['Question']),
                option({ value: 'bug'}, ['Bug']),
                option({ value: 'feature_request'}, ['Feature Request'])
              ]),  
            ]),
            div({ className: 'form-group first-form-group' }, [
              label({ id: 'lbl_description', className: 'common-color' }, ['How can we help you' + this.state.first_name + '? *']),
              input({ id: 'txt_subject', placeholder:'Enter a subject', rows: '5', className: 'form-control col-lg-12 vote-input', onChange: this.subjectChangeHandler, required: true }),
              textarea({ id: 'txt_description', placeholder:'Enter a description', rows: '5', className: 'form-control col-lg-12 vote-input', onChange: this.descriptionChangeHandler, required: true }),
            ]),
            div({ className: 'form-group first-form-group' }, [
              label({ id: 'lbl_attachment', className: 'common-color' }, ['Attachment']),
              input({ type: 'file', id: 'txt_attachment', placeholder: 'Attach a file?', className: 'form-control col-lg-12 vote-input common-color', onChange: this.attachmentChangeHandler, ref: 'fileUpload', required: false }),
            ]),
            !this.state.isLogged && div({ className: 'form-group first-form-group' }, [
              label({ id: 'lbl_email', className: 'common-color' }, ['Contact email *']),
              input({ id: 'txt_email', className: 'form-control col-lg-12 vote-input',  placeholder:'Enter a email', value: this.state.email, onChange: this.emailChangeHandler, required: true }),
            ]),
          ]),
          div({ isRendered: false }, [
            Alert({ id: 'modal', type: 'danger', title: alert.title, description: alert.msg })
          ])
        ])
    );
  }
});
