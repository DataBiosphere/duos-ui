import { button, div, h } from 'react-hyperscript-helpers';
import { Styles } from '../../libs/theme';
import Modal from 'react-modal';

const ConfirmationModal = (props) => {
  //NOTE: Modal should be simple (raw information should be passed in as props) in order to ensure plug and play use
  const {showModal, closeModal, title, message, header, onClick} = props;

  return h(Modal, {
    isOpen: showModal,
    onRequestClose: closeModal,
    shouldCloseOnOverlayClick: true,
    title: title,
    message: message,
    header: header,
    style: {
      content: Styles.MODAL.CONTENT
    }
  }, [
    div({style: Styles.MODAL.CONTENT}, [
      div({style: Styles.MODAL.DAR_SUBHEADER}, [`${header}`]),
      div({style: Styles.MODAL.TITLE_HEADER}, [`${title}`]),
      div({style: Styles.MODAL.TITLE_HEADER}, [`${message}`]),
      div({className: 'row'}, [
        div({}, [
          button({onClick: closeModal}, ["Cancel"])
        ]),
        div({}, [
          button({onClick: onClick}, ["Confirm"])
      ])
    ])
  ])
 ])
};

export default ConfirmationModal;