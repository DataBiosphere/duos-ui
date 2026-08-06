import React from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
} from '@mui/material'
import { BulkConfirmState } from './types'

const FONT = 'Montserrat'
const BRAND_BLUE = '#0948b7'

interface BulkActionConfirmDialogProps {
  dialog: BulkConfirmState | null
  onConfirm: () => void
  onCancel: () => void
}

/** The noun for the relationships being changed, given the card scope. */
function itemNoun(scope: BulkConfirmState['scope'], count: number): string {
  const singular = scope === 'researcher' ? 'DAA' : 'researcher'
  return count === 1 ? singular : `${singular}s`
}

function buildTitle(dialog: BulkConfirmState): string {
  const noun = itemNoun(dialog.scope, dialog.count)
  const preposition = dialog.scope === 'researcher' ? 'for' : 'under'
  return dialog.mode === 'approve'
    ? `Approve pre-authorization for all ${dialog.count} remaining ${noun} ${preposition} ${dialog.targetLabel}?`
    : `Remove pre-authorization for all ${dialog.count} ${noun} ${preposition} ${dialog.targetLabel}?`
}

function buildBody(dialog: BulkConfirmState): string {
  const noun = itemNoun(dialog.scope, dialog.count)
  const preposition = dialog.scope === 'researcher' ? 'for' : 'under'
  if (dialog.mode === 'approve') {
    return `This will grant pre-authorization for all ${dialog.count} remaining ${noun} ${preposition} ${dialog.targetLabel}. Researchers without a library card will have one created automatically.`
  }
  return `This will remove pre-authorization for all ${dialog.count} ${noun} ${preposition} ${dialog.targetLabel}. This will not affect active or previously approved DARs.`
}

/**
 * Confirmation dialog shown before a bulk Approve All / Remove All action on a
 * researcher card or a DAA card.
 *
 * Deliberately separate from {@link ResearcherViewConfirmDialog} (the
 * single-relationship dialog) so the per-row flow stays untouched.
 */
export default function BulkActionConfirmDialog({
  dialog,
  onConfirm,
  onCancel,
}: Readonly<BulkActionConfirmDialogProps>) {
  if (!dialog) return null

  const isApprove = dialog.mode === 'approve'

  return (
    <Dialog
      open
      onClose={onCancel}
      maxWidth="sm"
      fullWidth
      data-cy="bulk-confirm-dialog"
    >
      <DialogTitle sx={{ fontFamily: FONT, fontWeight: 700 }}>
        {buildTitle(dialog)}
      </DialogTitle>

      <DialogContent>
        <Typography sx={{ fontFamily: FONT, fontSize: 14, color: '#555' }}>
          {buildBody(dialog)}
        </Typography>
      </DialogContent>

      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button
          onClick={onCancel}
          data-cy="bulk-confirm-dialog-cancel"
          sx={{ fontFamily: FONT, color: '#666' }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={onConfirm}
          data-cy="bulk-confirm-dialog-confirm"
          sx={{
            'fontFamily': FONT,
            'fontWeight': 700,
            'bgcolor': isApprove ? BRAND_BLUE : '#dc3545',
            '&:hover': { bgcolor: isApprove ? '#073a94' : '#b02a37' },
          }}
        >
          {isApprove ? 'Approve All' : 'Remove All'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
