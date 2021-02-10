import {button, div, h} from 'react-hyperscript-helpers';
import {Styles} from '../../libs/theme';
import Modal from 'react-modal';

const ConfirmationModal = (props) => {
  const {showConfirmation, setShowConfirmation, title, message, header, onConfirm, id} = props;
  return h(Modal, {
    isOpen: showConfirmation,
    shouldCloseOnOverlayClick: true,
    id: id,
    style: {
      content: Styles.MODAL.CONFIRMATION
    }
  }, [
    div({style: Styles.MODAL.CONFIRMATION}, [
      div({style: Styles.MODAL.DAR_SUBHEADER}, [`${header}`]),
      div({style: Styles.MODAL.TITLE_HEADER}, [`${title}`]),
      div({style: Styles.MODAL.DAR_DETAIL}, [`${message}`]),
      div({style: {width: "40%", float: "right"}}, [
        div({style: {width: "45%", float: "left"}}, [
          button({className: "cell-button cancel-color", onClick: () => setShowConfirmation(false)}, ["Cancel"])
        ]),
        div({style: {width: "45%", float: "right"}}, [
          button({className: "cell-button hover-color", onClick: () => onConfirm(id)}, ["Confirm"])
        ])
      ])
    ])
  ]);
};

export default ConfirmationModal;