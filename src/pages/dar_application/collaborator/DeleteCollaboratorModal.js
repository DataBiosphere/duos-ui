import React from 'react';
import {div, h} from 'react-hyperscript-helpers';
import Modal from 'react-modal';
import CloseIconComponent from '../../../components/CloseIconComponent';
import './DeleteCollaboratorModal.css';
import {styled} from '@mui/material/styles';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';

const DeleteModal = (props) => {
  const {showDelete, closeDelete, header, title, message, onConfirm, styleOverride = {}} = props;
  const closeFn = () => closeDelete();

  const duosBlue = '#0948B7';
  const duosBlueHover = 'rgb(9,72,183)';

  const SecondaryButton = styled(Button)(() => ({
    fontFamily: 'Montserrat, sans-serif',
    color: duosBlue,
    backgroundColor: 'white',
    borderRadius: '4px',
    fontSize: '1.45rem',
    borderColor: duosBlue,
    '&:hover': {
      borderColor: duosBlueHover,
      color: duosBlueHover,
    },
  }));

  const PrimaryButton = styled(Button)(({theme}) => ({
    fontFamily: 'Montserrat, sans-serif',
    color: theme.palette.getContrastText(duosBlue),
    backgroundColor: duosBlue,
    borderRadius: '4px',
    fontSize: '1.45rem',
    '&:hover': {
      backgroundColor: duosBlueHover,
    },
  }));

  const actionButtons = <Stack spacing={2} direction={'row'}>
    <PrimaryButton variant={'contained'} className={'delete-modal-primary-button'} onClick={onConfirm}>Delete</PrimaryButton>
    <SecondaryButton variant={'outlined'} className={'delete-modal-secondary-button'} onClick={closeFn}>Cancel</SecondaryButton>
  </Stack>;

  return h(Modal, {
    isOpen: showDelete,
    onRequestClose: closeFn,
    shouldCloseOnEsc: true,
    shouldCloseOnOverlayClick: true,
    className: 'delete-modal',
    style: { content: styleOverride }
  }, [
    div({}, [
      h(CloseIconComponent, {closeFn}),
      div({className: 'delete-modal-header'}, [header]),
      div({classname: 'delete-modal-title'}, [title]),
      div({className: 'delete-modal-message'}, [message]),
      div({className: 'delete-modal-actions'}, [actionButtons])
    ])
  ]);
};

export default DeleteModal;
