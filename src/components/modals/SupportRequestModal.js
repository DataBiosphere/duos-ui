import React, { Component } from 'react';
import { div, form, input, label, textarea, hh, select, option, section, button } from 'react-hyperscript-helpers';
import { SupportRequestBaseModal } from '../SupportRequestBaseModal';
import { Alert } from '../Alert';
import { Support} from '../../libs/ajax';
import { Storage } from '../../libs/storage';
import { Notifications } from '../../libs/utils';
import CloudUploadIcon from '@material-ui/icons/CloudUpload';
import HighlightOffIcon from '@material-ui/icons/HighlightOff';
import Dropzone from 'react-dropzone';


export const SupportRequestModal = hh(class SupportRequestModal extends Component {
  constructor(props) {
    super(props);
    this.state = {
      name: Storage.userIsLogged() ? Storage.getCurrentUser().displayName : '',
      isLogged: Storage.userIsLogged(),
      type: 'question',
      subject: '',
      description: '',
      attachment: '',
      email: Storage.userIsLogged() ? Storage.getCurrentUser().email : '',
      first_name: Storage.userIsLogged() ? Storage.getCurrentUser().displayName.split(' ')[0] : '',
      height: Storage.userIsLogged() ? '550px': '700px',
      top: Storage.userIsLogged() ? '400px': '1',
      valid: Storage.userIsLogged()
    };

    this.closeHandler = () => {
      Notifications.showInformation({text: `Support request canceled`, layout: 'topRight', timeout: 1500});
      this.props.onCloseRequest('support');
    };

    this.afterOpenHandler = () => {
      // call parent's after open handler
      this.props.onAfterOpen('support');
    };

    this.OKHandler = async () => {
      const attachmentToken = '';
      if(this.state.attachment !== ''){
        const attachmentToken = [];
        for (var i = 0; i < this.state.attachment.length; i++)
        {
          const token = await Support.uploadAttachment(this.state.attachment[i]);
          attachmentToken.push(token.token);
        }
      }
      //const attachmentToken =  this.state.attachment !== '' ? await Support.uploadAttachment(this.state.attachment): '';
      const ticket = Support.createTicket(this.state.name, this.state.type, this.state.email, this.state.subject, this.state.description, attachmentToken, this.props.url);
      const response = await Support.createSupportRequest(ticket);
      if (response.status === 201) {
        Notifications.showSuccess({text: `Sent Successfully`, layout: 'topRight', timeout: 1500});
      } else {
        Notifications.showError({ text: `ERROR ${response.status} : Unable To Send`, layout: 'topRight'});
      }

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
      this.setState(prev => {
        prev.attachment = e;
        return prev;
      });
    };

    this.attachmentCancel = () => {
      this.setState(prev => {
        prev.attachment = '';
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


    this.getUploadParams = () => {
      return { url: 'https://httpbin.org/post' };
    };

    this.handleChangeStatus = ({ meta }, status) => {
      console.log(status, meta);
    };

    this.handleSubmit = (files, allFiles) => {
      console.log(files.map(f => f.meta));
      allFiles.forEach(f => f.remove());
    };
  }

  render() {
    const iconStyle = {
      verticalAlign: 'middle',
      height: 40,
      width: 30,
      paddingLeft: '1rem'
    };
    const uploadIcon = <CloudUploadIcon fill={'#707986'} style={ iconStyle } />;
    const closeIcon = <HighlightOffIcon fill={'#275c91'} style={ iconStyle } />;

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
        form({
          className: 'form-horizontal css-form',
          name: 'zendeskTicketForm',
          noValidate: true,
          encType: 'multipart/form-data',
        }, [
          !this.state.isLogged &&
            div({className: 'form-group first-form-group'}, [
              label({id: 'lbl_name', className: 'common-color'}, ['Name *']),
              input({
                id: 'txt_name',
                placeholder: 'What should we call you?',
                value: this.state.name,
                className: 'form-control col-lg-12',
                onChange: this.nameChangeHandler,
                required: true,
              }),
            ]),
          div({className: 'form-group first-form-group'}, [
            label({id: 'lbl_type', className: 'common-color'}, ['Type *']),
            select({
              id: 'txt_question',
              className: 'col-lg-12 select-wrapper form-control',
              value: this.state.type,
              onChange: this.typeChangeHandler,
              required: true,
            }, [
              option({value: 'question'}, ['Question']),
              option({value: 'bug'}, ['Bug']),
              option({value: 'feature_request'}, ['Feature Request']),
            ]),
          ]),
          div({className: 'form-group first-form-group'}, [
            label({id: 'lbl_description', className: 'common-color'},
              ['How can we help you' + this.state.first_name + '? *']),
            input({
              id: 'txt_subject',
              placeholder: 'Enter a subject',
              rows: '5',
              className: 'form-control col-lg-12 vote-input',
              onChange: this.subjectChangeHandler,
              required: true,
            }),
            textarea({
              id: 'txt_description',
              placeholder: 'Enter a description',
              rows: '5',
              className: 'form-control col-lg-12 vote-input',
              onChange: this.descriptionChangeHandler,
              required: true,
            }),
          ]),
          div({className: 'form-group first-form-group'}, [
            label({id: 'lbl_attachment', className: 'common-color'},
              ['Attachment']),
              <Dropzone onDrop={acceptedFiles => this.attachmentChangeHandler(acceptedFiles)}
              onChangeStatus={this.handleChangeStatus}
              onSubmit={this.handleSubmit}>
              {({ isDragActive, openUploader, getRootProps, getInputProps}) => (
                section({ style: {backgroundColor: this.state.attachment.length !== 0 ? 'transparent' : (isDragActive ? '#6898c1' : '#ebecee') , fontSize: 14, lineHeight: '30px', paddingLeft: '1rem', display: 'flex', alignItems: 'center', border: this.state.attachment.length === 0 ? '1px dashed' : 'none'
              }}, [
                  <div {...getRootProps()}>
                    <input {...getInputProps()} />
                    <p>{this.state.attachment.length === 0 ? 'Drag or Click to attach a files' : (this.state.attachment.length === 1 ? this.state.attachment[0].name : this.state.attachment.length + " files selected")}</p>
                  </div>,
                  <icon>{this.state.attachment.length === 0 ? uploadIcon : ''}</icon>,
                  button({ isRendered: this.state.attachment.length !== 0 , style: {background: 'transparent', border: 'none', outline: 'none'}, onClick: this.attachmentCancel }, [closeIcon])
                ])
              )}
            </Dropzone>
          ]),
          !this.state.isLogged &&
            div({className: 'form-group first-form-group'}, [
              label({id: 'lbl_email', className: 'common-color'},
                ['Contact email *']),
              input({
                id: 'txt_email',
                className: 'form-control col-lg-12 vote-input',
                placeholder: 'Enter a email',
                value: this.state.email,
                onChange: this.emailChangeHandler,
                required: true,
              }),
            ]),
        ]),
        div({isRendered: false}, [
          Alert({
            id: 'modal',
            type: 'danger',
            title: alert.title,
            description: alert.msg,
          }),
        ]),
      ])
    );
  }
});