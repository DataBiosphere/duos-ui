import React, { Component } from 'react';
import { div, form, input, label, textarea, hh, h, select, span, option, section, button, p } from 'react-hyperscript-helpers';
import { Support} from '../../libs/ajax';
import { Storage } from '../../libs/storage';
import { Notifications, isEmailAddress } from '../../libs/utils';
import { PageSubHeading } from '../PageSubHeading';
import CloudUploadIcon from '@material-ui/icons/CloudUpload';
import HighlightOffIcon from '@material-ui/icons/HighlightOff';
import Dropzone from 'react-dropzone';
import Modal from 'react-modal';
import * as fp from 'lodash/fp';
import addHelpIcon from '../../images/icon_add_help.png';

try {
  Modal.setAppElement('#root');
} catch (error) {
  // trycatch for unit testing purposes, since #root may not always exist
  // when testing a component in isolation
}

export const SupportRequestModal = hh(
  class SupportRequestModal extends Component {
    constructor(props) {
      super(props);
      this.state = {
        name: Storage.userIsLogged() ?
          Storage.getCurrentUser().displayName :
          '',
        isLogged: Storage.userIsLogged(),
        type: 'question',
        subject: '',
        description: '',
        attachment: '',
        email: Storage.userIsLogged() ? Storage.getCurrentUser().email : '',
        first_name: Storage.userIsLogged() ?
          Storage.getCurrentUser().displayName.split(' ')[0] :
          '',
        height: Storage.userIsLogged() ? (window.innerHeight < 550 ? window.innerHeight : '550px') : (window.innerHeight < 700 ? window.innerHeight : '700px'),
        top: Storage.userIsLogged() ? '400px' : '1',
        valid: Storage.userIsLogged(),
        validAttachment: true
      };
    }

    closeHandler = () => {
      Notifications.showInformation({
        text: 'Support request canceled',
        layout: 'topRight',
        timeout: 1500,
      });
      this.setState(prev => {
        prev.type = 'question';
        prev.subject = '';
        prev.description = '';
        prev.attachment = '';
        return prev;
      });
      this.props.onCloseRequest('support');
    };

    OKHandler = async () => {
      const attachmentToken = [];
      if (this.state.attachment !== '') {
        const results = [];
        for (var i = 0; i < this.state.attachment.length; i++) {
          try {
            results.push(Support.uploadAttachment(this.state.attachment[i]));
          } catch (e) {
            Notifications.showError({
              text: 'Unable to add attachment',
              layout: 'topRight',
            });
            this.setState((prev) => {
              prev.validAttachment = false;
            });
            break;
          }
        }
        const allToken = await Promise.all(results);
        for (var t = 0; t < allToken.length; t++) {
          if (!fp.hasIn('token')(allToken[t])) {
            Notifications.showError({
              text: 'Unable to add attachment',
              layout: 'topRight',
            });
            this.setState((prev) => {
              prev.validAttachment = false;
            });
          }
          if (this.state.validAttachment){
            attachmentToken.push(allToken[t].token);
          }
        }
      }
      if (this.state.validAttachment){
        const ticket = Support.createTicket(this.state.name, this.state.type,
          this.state.email, this.state.subject, this.state.description,
          attachmentToken, this.props.url);
        const response = await Support.createSupportRequest(ticket);
        if (response.status === 201) {
          Notifications.showSuccess(
            {text: 'Sent Successfully', layout: 'topRight', timeout: 1500}
          );
          await this.setState(prev => {
            prev.type = 'question';
            prev.subject = '';
            prev.description = '';
            prev.attachment = '';
            return prev;
          });
          this.props.onOKRequest('support');
        } else {
          Notifications.showError({
            text: `ERROR ${response.status} : Unable To Send`,
            layout: 'topRight',
          });
        }
      }
    };

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

    attachmentChangeHandler = (e) => {
      this.setState(prev => {
        prev.attachment = e;
        return prev;
      });
    };

    attachmentCancel = () => {
      this.setState(prev => {
        prev.attachment = '';
        return prev;
      });
    };

    emailChangeHandler = (e) => {
      let emailText = e.target.value;
      this.setState(prev => {
        prev.email = emailText;
        prev.valid = isEmailAddress(emailText);
        return prev;
      });
    };

    handleResize = () => {
      this.setState(prev => {
        prev.height =  Storage.userIsLogged() ? (window.innerHeight < 550 ? window.innerHeight : '550px') : (window.innerHeight < 700 ? window.innerHeight : '700px');
        return prev;
      });
    };

    render() {
      window.addEventListener('resize', this.handleResize);

      const customStyles = {
        overlay: {
          position: 'fixed',
          top: this.state.top,
          left: '10',
          right: '0',
          bottom: '0',
          backgroundColor: 'static',
          width: '400px',
          height: this.state.height,
          padding: '0px 450px 700px 0px',
          zIndex: 10000
        },

        content: {
          position: 'fixed',
          top: '1',
          left: '1',
          right: '20px',
          bottom: '20px',
          width: '400px',
          height: this.state.height,
          background: 'rgb(255, 255, 255)',
          outline: 'none',
        },
      };

      const iconStyle = {
        verticalAlign: 'middle',
        height: 40,
        width: 30,
        paddingLeft: '1rem',
      };
      const disableOkBtn = this.state.name === '' || this.state.email === '' ||
        this.state.subject === '' || this.state.description === '' ||
        this.state.valid === false;
      const uploadIcon = <CloudUploadIcon fill={'#707986'} style={iconStyle}/>;
      const closeIcon = <HighlightOffIcon fill={'#275c91'} style={iconStyle}/>;

      return (
        div({}, [
          h(Modal, {
            isOpen: this.props.showModal,
            onRequestClose: this.closeHandler,
            style: customStyles,
            contentLabel: 'Modal',
          }, [
            div({
              style: {
                width: '100%',
                padding: '0 15px 5px 15px',
              },
            }, [
              button({
                type: 'button',
                style: {
                  position: 'absolute',
                  top: '20px',
                  right: '20px',
                },
                className: 'close',
                onClick: this.closeHandler,
              }, [
                span({
                  className: 'glyphicon glyphicon-remove default-color',
                }),
              ]),
              PageSubHeading({
                id: 'SupportRequestModal',
                imgSrc: addHelpIcon,
                color: 'common',
                title: 'Contact Us',
              }),
            ]),
            div({
              style: {
                width: '100%',
                padding: '10px 15px',
                outline: '0',
              },
            }, [
              form({
                className: 'form-horizontal css-form',
                name: 'zendeskTicketForm',
                noValidate: true,
                encType: 'multipart/form-data',
              }, [
                !this.state.isLogged &&
                div({className: 'form-group first-form-group'}, [
                  label({id: 'lbl_name', className: 'common-color'},
                    ['Name *']),
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
                  label({id: 'lbl_type', className: 'common-color'},
                    ['Type *']),
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
                    ['How can we help you ' + this.state.first_name + '? *']),
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
                  h(Dropzone, {
                    onDrop: acceptedFiles => this.attachmentChangeHandler(acceptedFiles)
                  }, [({isDragActive, openUploader, getRootProps, getInputProps}) => ( // eslint-disable-line no-unused-vars
                    section({
                      style: {
                        backgroundColor: this.state.attachment.length !== 0 ?
                          'transparent' :
                          (isDragActive ? '#6898c1' : '#ebecee'),
                        fontSize: 14,
                        lineHeight: '30px',
                        paddingLeft: '1rem',
                        display: 'flex',
                        alignItems: 'center',
                        border: this.state.attachment.length === 0 ?
                          '1px dashed' :
                          'none',
                      },
                    }, [
                      div({...getRootProps()}, [
                        input({...getInputProps()}),
                        p({}, [
                          this.state.attachment.length === 0 ?
                            'Drag or Click to attach a files' :
                            this.state.attachment.length === 1 ?
                              this.state.attachment[0].name :
                              this.state.attachment.length + ' files selected'
                        ])
                      ]),
                      div({isRendered: this.state.attachment.length === 0},
                        [uploadIcon]),
                      button({
                        isRendered: this.state.attachment.length !== 0,
                        style: {
                          background: 'transparent',
                          border: 'none',
                          outline: 'none',
                        },
                        onClick: this.attachmentCancel,
                      }, [closeIcon]),
                    ])
                  )])
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
            ]),

            div({
              className: 'modal-footer',
            }, [
              button({
                id: 'btn_action',
                className: 'btn common-background',
                onClick: this.OKHandler,
                disabled: disableOkBtn,
              }, ['Submit']),
              button({
                id: 'btn_cancel',
                className: 'btn dismiss-background',
                onClick: this.closeHandler,
              }, ['Cancel']),
            ]),
          ]),
        ])
      );
    }
  });

