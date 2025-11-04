import React from 'react'
import { Box, IconButton, Tooltip, Typography } from '@mui/material'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import PersonIcon from '@mui/icons-material/Person'
import SmartToyIcon from '@mui/icons-material/SmartToy'
import ReactMarkdown from 'react-markdown'
import { ChatMessage } from 'src/types/ai'

export interface AIChatMessageProps {
  message: ChatMessage
  isUser: boolean
}

const styles = {
  messageContainer: {
    display: 'flex',
    gap: '1rem',
    marginBottom: '1.5rem',
    alignItems: 'flex-start',
  },
  avatar: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  userAvatar: {
    backgroundColor: '#0948B7',
    color: 'white',
  },
  aiAvatar: {
    backgroundColor: '#00A097',
    color: 'white',
  },
  messageContent: {
    flex: 1,
    backgroundColor: '#F3F6F7',
    padding: '1rem',
    borderRadius: '8px',
    position: 'relative' as const,
  },
  userMessageContent: {
    backgroundColor: '#E3F2FD',
  },
  timestamp: {
    fontSize: '0.75rem',
    color: '#666',
    marginTop: '0.5rem',
  },
  copyButton: {
    'position': 'absolute' as const,
    'top': '0.5rem',
    'right': '0.5rem',
    'opacity': 0.6,
    '&:hover': {
      opacity: 1,
    },
  },
  markdown: {
    '& p': {
      margin: '0 0 0.5rem 0',
    },
    '& p:last-child': {
      margin: 0,
    },
    '& pre': {
      backgroundColor: '#F5F5F5',
      padding: '0.5rem',
      borderRadius: '4px',
      overflow: 'auto',
    },
    '& code': {
      fontFamily: 'monospace',
      fontSize: '0.9em',
    },
    '& ul, & ol': {
      marginLeft: '1.5rem',
    },
  },
}

export const AIChatMessage: React.FC<AIChatMessageProps> = ({ message, isUser }) => {
  const handleCopy = () => {
    navigator.clipboard.writeText(message.content)
  }

  const formatTimestamp = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <Box sx={styles.messageContainer}>
      <Box
        sx={{
          ...styles.avatar,
          ...(isUser ? styles.userAvatar : styles.aiAvatar),
        }}
      >
        {isUser ? <PersonIcon fontSize="small" /> : <SmartToyIcon fontSize="small" />}
      </Box>
      <Box sx={{ flex: 1 }}>
        <Box
          sx={{
            ...styles.messageContent,
            ...(isUser ? styles.userMessageContent : {}),
          }}
        >
          <Tooltip title="Copy message">
            <IconButton
              size="small"
              onClick={handleCopy}
              sx={styles.copyButton}
            >
              <ContentCopyIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Box sx={styles.markdown}>
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </Box>
        </Box>
        <Typography sx={styles.timestamp}>
          {formatTimestamp(message.timestamp)}
        </Typography>
      </Box>
    </Box>
  )
}

export default AIChatMessage
