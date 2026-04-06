import React from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
} from '@mui/material'
import { ConfirmDialogState } from './types'

const FONT = 'Montserrat'
const BRAND_BLUE = '#0948b7'

interface ResearcherViewConfirmDialogProps {
  dialog: ConfirmDialogState | null
  onConfirm: () => void
  onCancel: () => void
}

/**
 * Confirmation dialog shown before authorizing or revoking a researcher's
 * access to a specific DAA.
 */
export default function ResearcherViewConfirmDialog({
  dialog,
  onConfirm,
  onCancel,
}: ResearcherViewConfirmDialogProps) {
  if (!dialog) return null

  const isAuthorize = dialog.action === 'authorize'

  return (
    <Dialog
      open
      onClose={onCancel}
      maxWidth="sm"
      fullWidth
      data-cy="confirm-dialog"
    >
      <DialogTitle sx={{ fontFamily: FONT, fontWeight: 700 }}>
        {isAuthorize
          ? `Authorize ${dialog.researcherName}?`
          : `Revoke access for ${dialog.researcherName}?`}
      </DialogTitle>

      <DialogContent>
        <Typography sx={{ fontFamily: FONT, fontSize: 14, color: '#555' }}>
          {isAuthorize
            ? `By authorizing, you are granting ${dialog.researcherName} pre-authorization to submit Data Access Requests under ${dialog.daaLabel}.`
            : `By revoking, you are removing ${dialog.researcherName}'s pre-authorization under ${dialog.daaLabel}. This will not affect active or previously approved DARs.`}
        </Typography>
      </DialogContent>

      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button
          onClick={onCancel}
          data-cy="confirm-dialog-cancel"
          sx={{ fontFamily: FONT, color: '#666' }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={onConfirm}
          data-cy="confirm-dialog-confirm"
          sx={{
            fontFamily: FONT,
            fontWeight: 700,
            bgcolor: isAuthorize ? BRAND_BLUE : '#dc3545',
            '&:hover': { bgcolor: isAuthorize ? '#073a94' : '#b02a37' },
          }}
        >
          {isAuthorize ? 'Authorize' : 'Revoke Access'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
