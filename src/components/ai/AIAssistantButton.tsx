import React from 'react'
import { Fab, Tooltip } from '@mui/material'
import SmartToyIcon from '@mui/icons-material/SmartToy'

export interface AIAssistantButtonProps {
  onClick: () => void
  disabled?: boolean
}

const styles = {
  fab: {
    'position': 'fixed' as const,
    'bottom': '2rem',
    'right': '2rem',
    'zIndex': 1000,
    'backgroundColor': '#0948B7',
    '&:hover': {
      backgroundColor: '#0636A0',
    },
  },
}

export const AIAssistantButton: React.FC<AIAssistantButtonProps> = ({ onClick, disabled = false }) => {
  return (
    <Tooltip title="DUOS AI Assistant" placement="left">
      <Fab
        color="primary"
        aria-label="Open AI Assistant"
        onClick={onClick}
        disabled={disabled}
        sx={styles.fab}
      >
        <SmartToyIcon />
      </Fab>
    </Tooltip>
  )
}

export default AIAssistantButton
