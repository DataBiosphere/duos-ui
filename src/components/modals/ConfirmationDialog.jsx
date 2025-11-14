import * as React from 'react'
import Button from '@mui/material/Button'
import { Dialog, ThemeProvider } from '@mui/material'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import DialogContentText from '@mui/material/DialogContentText'
import { muiThemeFix } from 'src/libs/muiThemeFix'

export const ConfirmationDialog = (props) => {
  const { title, openState, close, action, description } = props
  return (
    <ThemeProvider theme={muiThemeFix}>
      <Dialog
        open={openState}
        onClose={close}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          {title}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            {description}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={close} variant="outlined">Cancel</Button>
          <Button onClick={action} autoFocus color="error" variant="contained">Confirm</Button>
        </DialogActions>
      </Dialog>
    </ThemeProvider>
  )
}
