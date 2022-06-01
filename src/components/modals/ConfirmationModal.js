import React from 'react';
import {div, h} from 'react-hyperscript-helpers';
import Modal from 'react-modal';
import CloseIconComponent from '../CloseIconComponent';
import './ConfirmationModal.css';
import {styled} from '@mui/material/styles';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';

const ConfirmationModal = (props) => {
  const {showConfirmation, closeConfirmation, title, message, header, onConfirm} = props;
  const closeFn = () => closeConfirmation();

  const SecondaryButton = styled(Button)(() => ({
    fontFamily: 'Montserrat, sans-serif',
    color: 'rgb(0, 96, 159)',
    backgroundColor: 'white',
    borderRadius: '4px',
    fontSize: '1.45rem',
    borderColor: 'rgb(0, 96, 159)',
    '&:hover': {
      borderColor: 'rgb(52,156,224)',
      color: 'rgb(52,156,224)'
    },
  }));

  const PrimaryButton = styled(Button)(({theme}) => ({
    fontFamily: 'Montserrat, sans-serif',
    color: theme.palette.getContrastText('rgb(0, 96, 159)'),
    backgroundColor: 'rgb(0, 96, 159)',
    borderRadius: '4px',
    fontSize: '1.45rem',
    '&:hover': {
      backgroundColor: 'rgb(52,156,224)',
    },
  }));

  const actionButtons = <Stack spacing={2} direction={'row'}>
    <SecondaryButton variant={'outlined'} className={'confirmation-modal-secondary-button'} onClick={closeFn}>Cancel</SecondaryButton>
    <PrimaryButton variant={'contained'} className={'confirmation-modal-primary-button'} onClick={onConfirm}>Confirm</PrimaryButton>
  </Stack>;

  return h(Modal, {
    isOpen: showConfirmation,
    shouldCloseOnOverlayClick: true,
    className: 'confirmation-modal'
  }, [
    div({}, [
      h(CloseIconComponent, {closeFn}),
      div({className: 'confirmation-modal-header'}, [header]),
      div({className: 'confirmation-modal-title'}, [title]),
      div({className: 'confirmation-modal-message'}, [message]),
      div({className: 'confirmation-modal-actions'}, [actionButtons])
    ])
  ]);
};

export default ConfirmationModal;