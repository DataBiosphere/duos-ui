import React from 'react'
import { Box, Button } from '@mui/material'

const BRAND_BLUE = '#0948b7'
const FONT = 'Montserrat'

interface BulkActionButtonsProps {
  readonly onApproveAll: () => void
  readonly onRemoveAll: () => void
  readonly approveAllDisabled: boolean
  readonly removeAllDisabled: boolean
  /** Distinguishes the data-cy hooks per card, e.g. `researcher-12` / `daa-3` */
  readonly dataCyPrefix: string
}

/**
 * "Approve All" / "Remove All" buttons rendered in an accordion card header.
 *
 * The header row is itself a toggle button, so every click here calls
 * `stopPropagation()` to avoid collapsing/expanding the card. A disabled button
 * does nothing — no dialog, no call — because MUI suppresses the click handler.
 */
export default function BulkActionButtons({
  onApproveAll,
  onRemoveAll,
  approveAllDisabled,
  removeAllDisabled,
  dataCyPrefix,
}: BulkActionButtonsProps) {
  return (
    <Box
      sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
      // Guard against the header toggle even when the click lands between buttons.
      onClick={e => e.stopPropagation()}
    >
      <Button
        variant="contained"
        size="small"
        data-cy={`bulk-approve-all-${dataCyPrefix}`}
        disabled={approveAllDisabled}
        onClick={(e) => {
          e.stopPropagation()
          onApproveAll()
        }}
        sx={{
          'bgcolor': BRAND_BLUE,
          'fontFamily': FONT,
          'fontWeight': 700,
          'textTransform': 'uppercase',
          'fontSize': 11,
          '&:hover': { bgcolor: '#073a94' },
        }}
      >
        Approve All
      </Button>
      <Button
        variant="outlined"
        size="small"
        data-cy={`bulk-remove-all-${dataCyPrefix}`}
        disabled={removeAllDisabled}
        onClick={(e) => {
          e.stopPropagation()
          onRemoveAll()
        }}
        sx={{
          borderColor: '#dc3545',
          color: '#dc3545',
          borderWidth: 1.5,
          fontFamily: FONT,
          fontWeight: 700,
          textTransform: 'uppercase',
          fontSize: 11,
        }}
      >
        Remove All
      </Button>
    </Box>
  )
}
