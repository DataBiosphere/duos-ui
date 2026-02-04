import React from 'react'
import ModalWrapper from 'src/components/collaborator_list/ModalWrapper'
import './DeletePresentationOrPublication.css'
import CloseIconComponent from '../CloseIconComponent'
import { styled } from '@mui/material/styles'
import Stack from '@mui/material/Stack'
import Button from '@mui/material/Button'

interface DeletePresentationOrPublicationProps {
  readonly name: string
  readonly objectName: string
  readonly showDelete: boolean
  readonly confirmAction: () => void
  readonly closeAction: () => void
}

const duosBlue = '#0948B7'
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

const PrimaryButton = styled(Button)(({ theme }) => ({
  'fontFamily': 'Montserrat, sans-serif',
  'color': theme.palette.getContrastText(duosBlue),
  'backgroundColor': duosBlue,
  'borderRadius': '4px',
  'fontSize': '1.45rem',
  '&:hover': {
    backgroundColor: duosBlueHover,
  },
}))

export function DeletePresentationOrPublication(props: DeletePresentationOrPublicationProps): React.JSX.Element {
  const { name, objectName, showDelete, confirmAction, closeAction } = props

  return (
    <ModalWrapper
      isOpen={showDelete}
      onRequestClose={closeAction}
      shouldCloseOnEsc={true}
      shouldCloseOnOverlayClick={true}
      className="delete-modal"
    >
      <div>
        <CloseIconComponent closeFn={closeAction} />
        <div className="delete-modal-header" style={{ width: '100%' }}>
          Delete {objectName}
        </div>
        <div className="delete-modal-title-text">
          Are you sure you want to delete <strong>{name}</strong>?
        </div>
        <div className="delete-modal-message"><i>This action is permanent and cannot be undone.</i></div>
        <div className="delete-modal-actions">
          <Stack spacing={2} direction="row">
            <PrimaryButton variant="contained" className="delete-modal-primary-button" onClick={confirmAction}>
              Delete
            </PrimaryButton>
            <SecondaryButton variant="outlined" className="delete-modal-secondary-button" onClick={closeAction}>
              Cancel
            </SecondaryButton>
          </Stack>
        </div>
      </div>
    </ModalWrapper>
  )
}
