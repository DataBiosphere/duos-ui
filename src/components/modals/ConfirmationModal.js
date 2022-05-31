import {button, div, h} from 'react-hyperscript-helpers';
import {Styles} from '../../libs/theme';
import Modal from 'react-modal';
import CloseIconComponent from '../CloseIconComponent';

const ConfirmationModal = (props) => {
  const {showConfirmation, closeConfirmation, title, message, header, onConfirm, styleOverride = {}} = props;
  const closeFn = () => closeConfirmation();

  const confirmButton = button({className: 'cell-button hover-color', onClick: onConfirm}, ['Confirm']);
  const computedStyle = Object.assign({}, Styles.MODAL.CONFIRMATION, styleOverride);

  return h(Modal, {
    isOpen: showConfirmation,
    shouldCloseOnOverlayClick: true,
    style: {
      content: computedStyle
    }
  }, [
    div({style: Styles.MODAL.CONFIRMATION}, [
      h(CloseIconComponent, {closeFn}),
      div({style: Styles.MODAL.DAR_SUBHEADER}, [header]),
      div({style: Styles.MODAL.TITLE_HEADER}, [title]),
      div({style: Styles.MODAL.DAR_DETAIL}, [message]),
      div({style: {width: '40%', float: 'right'}}, [
        div({style: {width: '45%', float: 'left'}}, [
          button({className: 'cell-button cancel-color', onClick: closeFn }, ['Cancel'])
        ]),
        div({style: {width: '45%', float: 'right'}}, [
          confirmButton
        ])
      ])
    ])
  ]);
};

export default ConfirmationModal;