// import _ from 'lodash/fp';
// import { Component, Fragment } from 'react';
// import { div, h, span } from 'react-hyperscript-helpers';
// import { Link } from 'react-router-dom';
//
// // import { a, button, div, form, h, input, label, span, table, tbody, td, th, thead, tr } from 'react-hyperscript-helpers';
// import ReactTooltip from 'react-tooltip';
// import { ConfirmationDialog } from '../components/ConfirmationDialog';
// import { ConnectDatasetModal } from '../components/modals/ConnectDatasetModal';
// import { TranslatedDulModal } from '../components/modals/TranslatedDulModal';
// import { PageHeading } from '../components/PageHeading';
// import { PaginatorBar } from '../components/PaginatorBar';
// import { SearchBox } from '../components/SearchBox';
// import { DAR, DataSet, Files } from '../libs/ajax';
// import { Storage } from '../libs/storage';
//
// class SupportRequest extends Component {
//
//   currentUser = {};
//
//   USER_ID = Storage.getCurrentUser().dacUserId;
//
//   constructor(props) {
//     super(props);
//     this.state = {
//       value: '',
//       limit: 5,
//       currentPage: 1,
//       reports: [],
//       showHelpModal: false,
//       isAdmin: Storage.getCurrentUser().isAdmin
//     };
//   }
//
//   render() {
//     const { isActive, authState: { profile: { firstName } } } = this.props;
//     // const { submitting, submitError, subject, description, type, email, nameEntered, uploadingFile, attachmentToken, attachmentName, clinicalUser } = this.state;
//     // const greetUser = this.hasName() ? `, ${firstName}` : '';
//     // const errors = validate(this.getRequest(), constraints);
//
//     return isActive && div({
//       style: {
//         position: 'fixed', bottom: '1.5rem', right: '1.5rem',
//         backgroundColor: 'white',
//         borderRadius: '0.5rem',
//         width: 450,
//         // boxShadow: Style.modalShadow,
//         zIndex: 2
//       }
//     });
//
//   }
//   // // below is Terra-ui code
//   // constructor(props) {
//   //   super(props);
//   //   this.state = this.initialFormState();
//   // }
//   //
//   // componentDidUpdate(prevProps) {
//   //   if (!prevProps.isActive && this.props.isActive) {
//   //     this.setState(this.initialFormState());
//   //   }
//   // }
//   //
//   // initialFormState() {
//   //   const { authState: { profile: { contactEmail, email } } } = this.props;
//   //   return {
//   //     subject: '',
//   //     description: '',
//   //     type: 'question',
//   //     email: contactEmail || email || '',
//   //     nameEntered: '',
//   //     attachmentToken: '',
//   //     uploadingFile: false,
//   //     attachmentName: '',
//   //     clinicalUser: undefined
//   //   };
//   // }
//   //
//   // hasName() {
//   //   const { authState: { profile: { firstName } } } = this.props;
//   //   return !(firstName === 'N/A' || firstName === undefined);
//   // }
//   //
//   // async uploadFile(files) {
//   //   try {
//   //     this.setState({ uploadingFile: true });
//   //     const attachmentRes = await Ajax().User.uploadAttachment(files[0]);
//   //     const attachmentToken = attachmentRes.token;
//   //     const attachmentName = attachmentRes.attachment.file_name;
//   //     this.setState({ attachmentToken, attachmentName, uploadingFile: false });
//   //   } catch (error) {
//   //     await reportError('Error uploading attachment', error);
//   //     this.setState({ uploadingFile: false });
//   //   }
//   // }
//   //
//   // getRequest() {
//   //   const { authState: { profile: { firstName, lastName } } } = this.props;
//   //   const { nameEntered, email, description, subject, type, attachmentToken, clinicalUser } = this.state;
//   //
//   //   return {
//   //     name: this.hasName() ? `${firstName} ${lastName}` : nameEntered,
//   //     email,
//   //     description,
//   //     subject,
//   //     type,
//   //     attachmentToken,
//   //     clinicalUser
//   //   };
//   // }
//   //
//   // render() {
//   //   const { isActive, authState: { profile: { firstName } } } = this.props;
//   //   const { submitting, submitError, subject, description, type, email, nameEntered, uploadingFile, attachmentToken, attachmentName, clinicalUser } = this.state;
//   //   const greetUser = this.hasName() ? `, ${firstName}` : '';
//   //   const errors = validate(this.getRequest(), constraints);
//   //
//   //   return isActive && div({
//   //     style: {
//   //       position: 'fixed', bottom: '1.5rem', right: '1.5rem',
//   //       backgroundColor: 'white',
//   //       borderRadius: '0.5rem',
//   //       width: 450,
//   //       boxShadow: Style.modalShadow,
//   //       zIndex: 2
//   //     }
//   //   }, [
//   //     h(Dropzone, {
//   //       maxSize: 20 * 1024 * 1024,
//   //       multiple: false,
//   //       style: { flexGrow: 1 },
//   //       activeStyle: { cursor: 'copy' },
//   //       onDropRejected: e => reportError('Error uploading attachment', e),
//   //       onDropAccepted: files => this.uploadFile(files)
//   //     }, [({ dragging, openUploader }) => div({ style: { padding: '1rem' } }, [
//   //       div({ style: { fontSize: 18, fontWeight: 'bold', color: colors.dark() } }, ['Contact Us']),
//   //       !this.hasName() && h(Fragment, [
//   //         h(IdContainer, [id => h(Fragment, [
//   //           h(FormLabel, { required: true, htmlFor: id }, ['Name']),
//   //           h(TextInput, {
//   //             id,
//   //             placeholder: 'What should we call you?',
//   //             autoFocus: true,
//   //             value: nameEntered,
//   //             onChange: v => this.setState({ nameEntered: v })
//   //           })
//   //         ])])
//   //       ]),
//   //       h(IdContainer, [id => h(Fragment, [
//   //         h(FormLabel, { required: true, htmlFor: id }, ['Type']),
//   //         h(Select, {
//   //           id,
//   //           isMulti: false,
//   //           value: type,
//   //           onChange: ({ value }) => this.setState({ type: value }),
//   //           options: [
//   //             { value: 'question', label: 'Question' },
//   //             { value: 'bug', label: 'Bug' },
//   //             { value: 'feature_request', label: 'Feature Request' }
//   //           ]
//   //         })
//   //       ])]),
//   //       h(IdContainer, [id => h(Fragment, [
//   //         h(FormLabel, { required: true, htmlFor: id }, [`How can we help you${greetUser}?`]),
//   //         h(TextInput, {
//   //           id,
//   //           style: { borderBottomLeftRadius: 0, borderBottomRightRadius: 0, borderBottomStyle: 'dashed' },
//   //           placeholder: 'Enter a subject',
//   //           autoFocus: this.hasName(),
//   //           value: subject,
//   //           onChange: v => this.setState({ subject: v })
//   //         })
//   //       ])]),
//   //       h(TextArea, {
//   //         style: { height: 200, borderTopLeftRadius: 0, borderTopRightRadius: 0, borderTopStyle: 'dashed' },
//   //         'aria-label': 'Enter a description',
//   //         placeholder: 'Enter a description',
//   //         value: description,
//   //         onChange: v => this.setState({ description: v })
//   //       }),
//   //       h(FormLabel, ['Attachment']),
//   //       attachmentToken ?
//   //         div({ style: { display: 'flex', alignItems: 'center' } }, [
//   //           h(Clickable, {
//   //             tooltip: 'Change file',
//   //             style: { flex: 'auto' },
//   //             onClick: openUploader
//   //           }, [
//   //             div({
//   //               style: { marginLeft: '1rem', paddingTop: '0.5rem' }
//   //             }, [
//   //               'Successfully uploaded: ', span({ style: { color: colors.dark() } }, [attachmentName])
//   //             ])
//   //           ]),
//   //           h(Link, {
//   //             tooltip: 'Remove file',
//   //             style: { flex: 0, paddingTop: '0.5rem' },
//   //             onClick: () => this.setState({ attachmentToken: '' })
//   //           }, [icon('times-circle', { size: 23 })])
//   //         ]) :
//   //         h(Clickable, {
//   //           style: {
//   //             flex: 1, backgroundColor: dragging ? colors.accent(0.2) : colors.dark(0.1), borderRadius: 3,
//   //             border: `1px dashed ${colors.dark(0.7)}`
//   //           },
//   //           onClick: openUploader
//   //         }, [
//   //           div({ style: { fontSize: 14, lineHeight: '30px', paddingLeft: '1rem', display: 'flex', alignItems: 'center' } }, [
//   //             'Drag or', h(Link, { style: { margin: '0 0.25rem' } }, ['Click']), 'to attach a file',
//   //             icon('upload-cloud', { size: 25, style: { opacity: 0.4, marginLeft: '0.5rem' } })
//   //           ])
//   //         ]),
//   //       uploadingFile && spinnerOverlay,
//   //       h(IdContainer, [id => h(Fragment, [
//   //         h(FormLabel, { required: true, htmlFor: id }, ['Contact email']),
//   //         h(TextInput, {
//   //           id,
//   //           value: email,
//   //           placeholder: 'Enter your email address',
//   //           onChange: v => this.setState({ email: v })
//   //         })
//   //       ])]),
//   //       h(FormLabel, { required: true }, ['Are you a clinical user?']),
//   //       h(RadioButton, {
//   //         text: 'Yes', name: 'is-clinical-user', checked: clinicalUser === true,
//   //         labelStyle: { margin: '0 2rem 0 0.25rem' },
//   //         onChange: () => this.setState({ clinicalUser: true })
//   //       }),
//   //       h(RadioButton, {
//   //         text: 'No', name: 'is-clinical-user', checked: clinicalUser === false,
//   //         labelStyle: { margin: '0 2rem 0 0.25rem' },
//   //         onChange: () => this.setState({ clinicalUser: false })
//   //       }),
//   //       submitError && div({ style: { marginTop: '0.5rem', textAlign: 'right', color: colors.danger() } }, [submitError]),
//   //       submitting && spinnerOverlay,
//   //       div({ style: styles.buttonRow }, [
//   //         h(ButtonSecondary, {
//   //           style: { marginRight: '1rem' },
//   //           onClick: () => SupportRequest.dismiss()
//   //         }, ['Cancel']),
//   //         h(ButtonPrimary, {
//   //           disabled: errors,
//   //           tooltip: Utils.summarizeErrors(errors),
//   //           onClick: () => this.submit()
//   //         }, ['SEND'])
//   //       ])
//   //     ])])
//   //   ]);
// }
//
// // const constraints = {
// //   name: { presence: { allowEmpty: false } },
// //   subject: { presence: { allowEmpty: false } },
// //   description: { presence: { allowEmpty: false } },
// //   email: { email: true, presence: { allowEmpty: false } },
// //   clinicalUser: { presence: { allowEmpty: false } }
// // };
// //
// // const styles = {
// //   buttonRow: {
// //     marginTop: '1rem',
// //     display: 'flex', justifyContent: 'flex-end', alignItems: 'baseline'
// //   }
// // };
// //
// // // If you are making changes to the Support Request Modal, make sure you test the following:
// // // 1. Submit a ticket via Terra while signed in and signed out
// // // 2. Check the tickets are generated on Zendesk
// // // 3. Reply internally (as a Light Agent) and make sure an email is not sent
// // // 4. Reply externally (ask one of the Comms team with Full Agent access) and make sure you receive an email
// //
// // const SupportRequest = _.flow(
// //   Utils.connectStore(contactUsActive, 'isActive'),
// //   Utils.connectStore(authStore, 'authState')
// // )(class SupportRequest extends Component {
//   // constructor(props) {
//   //   super(props);
//   //   this.state = this.initialFormState();
//   // }
//   //
//   // componentDidUpdate(prevProps) {
//   //   if (!prevProps.isActive && this.props.isActive) {
//   //     this.setState(this.initialFormState());
//   //   }
//   // }
//   //
//   // initialFormState() {
//   //   const { authState: { profile: { contactEmail, email } } } = this.props;
//   //   return {
//   //     subject: '',
//   //     description: '',
//   //     type: 'question',
//   //     email: contactEmail || email || '',
//   //     nameEntered: '',
//   //     attachmentToken: '',
//   //     uploadingFile: false,
//   //     attachmentName: '',
//   //     clinicalUser: undefined
//   //   };
//   // }
//   //
//   // hasName() {
//   //   const { authState: { profile: { firstName } } } = this.props;
//   //   return !(firstName === 'N/A' || firstName === undefined);
//   // }
//   //
//   // async uploadFile(files) {
//   //   try {
//   //     this.setState({ uploadingFile: true });
//   //     const attachmentRes = await Ajax().User.uploadAttachment(files[0]);
//   //     const attachmentToken = attachmentRes.token;
//   //     const attachmentName = attachmentRes.attachment.file_name;
//   //     this.setState({ attachmentToken, attachmentName, uploadingFile: false });
//   //   } catch (error) {
//   //     await reportError('Error uploading attachment', error);
//   //     this.setState({ uploadingFile: false });
//   //   }
//   // }
//   //
//   // getRequest() {
//   //   const { authState: { profile: { firstName, lastName } } } = this.props;
//   //   const { nameEntered, email, description, subject, type, attachmentToken, clinicalUser } = this.state;
//   //
//   //   return {
//   //     name: this.hasName() ? `${firstName} ${lastName}` : nameEntered,
//   //     email,
//   //     description,
//   //     subject,
//   //     type,
//   //     attachmentToken,
//   //     clinicalUser
//   //   };
//   // }
//   //
//   // render() {
//   //   const { isActive, authState: { profile: { firstName } } } = this.props;
//   //   const { submitting, submitError, subject, description, type, email, nameEntered, uploadingFile, attachmentToken, attachmentName, clinicalUser } = this.state;
//   //   const greetUser = this.hasName() ? `, ${firstName}` : '';
//   //   const errors = validate(this.getRequest(), constraints);
//   //
//   //   return isActive && div({
//   //     style: {
//   //       position: 'fixed', bottom: '1.5rem', right: '1.5rem',
//   //       backgroundColor: 'white',
//   //       borderRadius: '0.5rem',
//   //       width: 450,
//   //       boxShadow: Style.modalShadow,
//   //       zIndex: 2
//   //     }
//   //   }, [
//   //     h(Dropzone, {
//   //       maxSize: 20 * 1024 * 1024,
//   //       multiple: false,
//   //       style: { flexGrow: 1 },
//   //       activeStyle: { cursor: 'copy' },
//   //       onDropRejected: e => reportError('Error uploading attachment', e),
//   //       onDropAccepted: files => this.uploadFile(files)
//   //     }, [({ dragging, openUploader }) => div({ style: { padding: '1rem' } }, [
//   //       div({ style: { fontSize: 18, fontWeight: 'bold', color: colors.dark() } }, ['Contact Us']),
//   //       !this.hasName() && h(Fragment, [
//   //         h(IdContainer, [id => h(Fragment, [
//   //           h(FormLabel, { required: true, htmlFor: id }, ['Name']),
//   //           h(TextInput, {
//   //             id,
//   //             placeholder: 'What should we call you?',
//   //             autoFocus: true,
//   //             value: nameEntered,
//   //             onChange: v => this.setState({ nameEntered: v })
//   //           })
//   //         ])])
//   //       ]),
//   //       h(IdContainer, [id => h(Fragment, [
//   //         h(FormLabel, { required: true, htmlFor: id }, ['Type']),
//   //         h(Select, {
//   //           id,
//   //           isMulti: false,
//   //           value: type,
//   //           onChange: ({ value }) => this.setState({ type: value }),
//   //           options: [
//   //             { value: 'question', label: 'Question' },
//   //             { value: 'bug', label: 'Bug' },
//   //             { value: 'feature_request', label: 'Feature Request' }
//   //           ]
//   //         })
//   //       ])]),
//   //       h(IdContainer, [id => h(Fragment, [
//   //         h(FormLabel, { required: true, htmlFor: id }, [`How can we help you${greetUser}?`]),
//   //         h(TextInput, {
//   //           id,
//   //           style: { borderBottomLeftRadius: 0, borderBottomRightRadius: 0, borderBottomStyle: 'dashed' },
//   //           placeholder: 'Enter a subject',
//   //           autoFocus: this.hasName(),
//   //           value: subject,
//   //           onChange: v => this.setState({ subject: v })
//   //         })
//   //       ])]),
//   //       h(TextArea, {
//   //         style: { height: 200, borderTopLeftRadius: 0, borderTopRightRadius: 0, borderTopStyle: 'dashed' },
//   //         'aria-label': 'Enter a description',
//   //         placeholder: 'Enter a description',
//   //         value: description,
//   //         onChange: v => this.setState({ description: v })
//   //       }),
//   //       h(FormLabel, ['Attachment']),
//   //       attachmentToken ?
//   //         div({ style: { display: 'flex', alignItems: 'center' } }, [
//   //           h(Clickable, {
//   //             tooltip: 'Change file',
//   //             style: { flex: 'auto' },
//   //             onClick: openUploader
//   //           }, [
//   //             div({
//   //               style: { marginLeft: '1rem', paddingTop: '0.5rem' }
//   //             }, [
//   //               'Successfully uploaded: ', span({ style: { color: colors.dark() } }, [attachmentName])
//   //             ])
//   //           ]),
//   //           h(Link, {
//   //             tooltip: 'Remove file',
//   //             style: { flex: 0, paddingTop: '0.5rem' },
//   //             onClick: () => this.setState({ attachmentToken: '' })
//   //           }, [icon('times-circle', { size: 23 })])
//   //         ]) :
//   //         h(Clickable, {
//   //           style: {
//   //             flex: 1, backgroundColor: dragging ? colors.accent(0.2) : colors.dark(0.1), borderRadius: 3,
//   //             border: `1px dashed ${colors.dark(0.7)}`
//   //           },
//   //           onClick: openUploader
//   //         }, [
//   //           div({ style: { fontSize: 14, lineHeight: '30px', paddingLeft: '1rem', display: 'flex', alignItems: 'center' } }, [
//   //             'Drag or', h(Link, { style: { margin: '0 0.25rem' } }, ['Click']), 'to attach a file',
//   //             icon('upload-cloud', { size: 25, style: { opacity: 0.4, marginLeft: '0.5rem' } })
//   //           ])
//   //         ]),
//   //       uploadingFile && spinnerOverlay,
//   //       h(IdContainer, [id => h(Fragment, [
//   //         h(FormLabel, { required: true, htmlFor: id }, ['Contact email']),
//   //         h(TextInput, {
//   //           id,
//   //           value: email,
//   //           placeholder: 'Enter your email address',
//   //           onChange: v => this.setState({ email: v })
//   //         })
//   //       ])]),
//   //       h(FormLabel, { required: true }, ['Are you a clinical user?']),
//   //       h(RadioButton, {
//   //         text: 'Yes', name: 'is-clinical-user', checked: clinicalUser === true,
//   //         labelStyle: { margin: '0 2rem 0 0.25rem' },
//   //         onChange: () => this.setState({ clinicalUser: true })
//   //       }),
//   //       h(RadioButton, {
//   //         text: 'No', name: 'is-clinical-user', checked: clinicalUser === false,
//   //         labelStyle: { margin: '0 2rem 0 0.25rem' },
//   //         onChange: () => this.setState({ clinicalUser: false })
//   //       }),
//   //       submitError && div({ style: { marginTop: '0.5rem', textAlign: 'right', color: colors.danger() } }, [submitError]),
//   //       submitting && spinnerOverlay,
//   //       div({ style: styles.buttonRow }, [
//   //         h(ButtonSecondary, {
//   //           style: { marginRight: '1rem' },
//   //           onClick: () => SupportRequest.dismiss()
//   //         }, ['Cancel']),
//   //         h(ButtonPrimary, {
//   //           disabled: errors,
//   //           tooltip: Utils.summarizeErrors(errors),
//   //           onClick: () => this.submit()
//   //         }, ['SEND'])
//   //       ])
//   //     ])])
//   //   ]);
// //   }
// //
// //   static dismiss() {
// //     contactUsActive.set(false);
// //   }
// //
// //   submit = Utils.withBusyState(v => this.setState({ submitting: v }), async () => {
// //     const { type, email, subject, description, attachmentToken, clinicalUser } = this.state;
// //     const currUrl = window.location.href;
// //     const hasAttachment = attachmentToken !== '';
// //
// //     try {
// //       await Ajax().User.createSupportRequest({ ...this.getRequest(), currUrl });
// //       notify('success', 'Message sent successfully', { timeout: 3000 });
// //     } catch (error) {
// //       notify('error', div(['Error submitting support request. ',
// //         h(Link, {
// //           style: { fontWeight: 800, color: 'white' },
// //           hover: { color: 'white', textDecoration: 'underline' },
// //           href: `mailto:terra-support@broadinstitute.zendesk.org?subject=${type}%3A%20${subject}&body=Original%20support%20request%3A%0A` +
// //             `------------------------------------%0AContact email%3A%20${email}%0AIs clinical user%3A%20${clinicalUser}%0A%0A${description}%0A%0A------------------------------------` +
// //             `%0AError%20reported%20from%20Zendesk%3A%0A%0A${JSON.stringify(error)}`,
// //           ...Utils.newTabLinkProps
// //         }, 'Click here to email support'), hasAttachment && ' and make sure to add your attachment to the email.']
// //       ));
// //     } finally {
// //       SupportRequest.dismiss();
// //     }
// //   })
// // });
// //
// export default SupportRequest;

import { Component, Fragment } from 'react';
import { div, hr, span, a, h, color } from 'react-hyperscript-helpers';
import { PageHeading } from '../components/PageHeading';
import { HelpModal } from '../components/modals/HelpModal';
import { SupportModal } from '../components/modals/SupportModal';
import { Storage } from '../libs/storage';


class SupportRequest extends Component {

  constructor(props) {
    super(props);
    this.state = {
      value: '',
      limit: 5,
      currentPage: 1,
      reports: [],
      showHelpModal: false,
      showSupportModal: false,
      isAdmin: Storage.getCurrentUser().isAdmin
    };
  }


  supportModal = (e) => {
    this.setState(prev => {
      prev.showSupportModal = true;
      return prev;
    });
  };

  okModal = () => {
    this.getReportsList();
    this.setState(prev => {
      prev.showSupportModal = false;
      prev.currentPage = 1;
      return prev;
    });
  };

  closeModal = () => {
    this.setState(prev => {
      prev.showSupportModal = false;
      prev.currentPage = 1;
      return prev;
    });
  };

  afterModalOpen = () => {
    this.setState(prev => { prev.showSupportModal = false; return prev; });
  };

  render() {

    return (
      div({ className: "container" }, [
        div({ className: "col-lg-6 col-md-7 col-sm-12 col-xs-12 no-padding" }, [
          PageHeading({ id: "Support Help", imgSrc: "/images/icon_manage_help.png", iconSize: "large", color: "common", title: "Support Help", description: "List of comments, suggestions and bug reports" }),
        ]),

        div({ className: "col-lg-6 col-md-5 col-sm-12 col-xs-12 search-wrapper no-padding" }, [
          a({
            id: 'btn_requestHelp',
            className: "col-lg-5 col-md-5 col-sm-5 col-xs-5 btn-primary btn-add common-background no-margin",
            onClick: this.supportModal
          }, [
            div({ className: "all-icons add-help_white" }),
            span({}, ["Create a Support Report"]),
          ]),
          SupportModal({
            showModal: this.state.showSupportModal,
            onOKRequest: this.okModal,
            onCloseRequest: this.closeModal,
            onAfterOpen: this.afterModalOpen
          }),
        ])
      ])
    );

  }
}

export default SupportRequest;

