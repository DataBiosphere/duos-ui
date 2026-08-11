import React from 'react'
import Modal from 'react-modal'
import CloseIconComponent from 'src/components/CloseIconComponent'
import 'src/components/modals/ConfirmationModal.css'
import { styled } from '@mui/material/styles'
import Stack from '@mui/material/Stack'
import Button from '@mui/material/Button'
import { AsyncSpinnerButton } from 'src/components/AsyncSpinnerButton'

const duosBlue = 'rgb(0, 96, 159)'
const duosBlueHover = 'rgb(9,72,183)'

const SecondaryButton = styled(Button)(() => ({
  'fontFamily': 'Montserrat, sans-serif',
  'color': duosBlue,
  'backgroundColor': 'white',
  'borderRadius': '4px',
  'fontSize': '1.45rem',
  'borderColor': duosBlue,
  '&:hover': {
    borderColor: duosBlueHover,
    color: duosBlueHover,
  },
}))

interface ConfirmationModalProps {
  showConfirmation: boolean
  closeConfirmation: () => void
  title: React.ReactNode
  message: React.ReactNode
  header: React.ReactNode
  onConfirm: () => Promise<void>
  styleOverride?: React.CSSProperties
  /** Blocks confirmation while the message is not yet safe to act on, e.g. an unloaded agreement. */
  confirmDisabled?: boolean
}

const ConfirmationModal = ({
  showConfirmation,
  closeConfirmation,
  title,
  message,
  header,
  onConfirm,
  styleOverride = {},
  confirmDisabled = false,
}: Readonly<ConfirmationModalProps>) => {
  const closeFn = () => closeConfirmation()

  const setHoverState = (e: React.MouseEvent<HTMLButtonElement>, backgroundColor: string) => {
    if (!e.currentTarget.disabled) {
      e.currentTarget.style.backgroundColor = backgroundColor
    }
  }

  const actionButtons = (
    <Stack spacing={2} direction="row">
      <SecondaryButton variant="outlined" className="confirmation-modal-secondary-button" onClick={closeFn}>Cancel</SecondaryButton>
      <AsyncSpinnerButton
        onClick={onConfirm}
        disabled={confirmDisabled}
        className="confirmation-modal-primary-button"
        style={{
          fontFamily: 'Montserrat, sans-serif',
          color: 'white',
          backgroundColor: duosBlue,
          borderRadius: '4px',
          fontSize: '1.45rem',
          border: 'none',
          fontWeight: 500,
        }}
        onMouseEnter={e => setHoverState(e, duosBlueHover)}
        onMouseLeave={e => setHoverState(e, duosBlue)}
      >
        Confirm
      </AsyncSpinnerButton>
    </Stack>
  )

  return (
    <Modal
      isOpen={showConfirmation}
      onRequestClose={closeFn}
      shouldCloseOnEsc={true}
      shouldCloseOnOverlayClick={true}
      className="confirmation-modal"
      overlayClassName="confirmation-modal-overlay"
      style={{ content: styleOverride }}
    >
      <div>
        <CloseIconComponent closeFn={closeFn} />
        <div className="confirmation-modal-header">{header}</div>
        <div className="confirmation-modal-title">{title}</div>
        <div className="confirmation-modal-message">{message}</div>
        <div className="confirmation-modal-actions">{actionButtons}</div>
      </div>
    </Modal>
  )
}

export default ConfirmationModal
