import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  IconButton,
  Box,
  Typography,
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import MinimizeIcon from '@mui/icons-material/Minimize'
import { ChatMessage } from 'src/types/ai'
import AIChat from './AIChat'

export interface AIAssistantModalProps {
  open: boolean
  onClose: () => void
}

const styles = {
  dialog: {
    '& .MuiDialog-paper': {
      width: '600px',
      maxWidth: '90vw',
      height: '700px',
      maxHeight: '85vh',
    },
  },
  titleContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '1rem 1.5rem',
    borderBottom: '1px solid #E0E0E0',
  },
  titleText: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontFamily: 'Montserrat',
    fontSize: '1.25rem',
    fontWeight: 600,
    color: '#0948B7',
  },
  actions: {
    display: 'flex',
    gap: '0.5rem',
  },
  content: {
    padding: 0,
    height: 'calc(100% - 64px)',
  },
}

const STORAGE_KEY = 'duos-ai-chat-history'

export const AIAssistantModal: React.FC<AIAssistantModalProps> = ({ open, onClose }) => {
  const [_minimized, setMinimized] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])

  // Load chat history from session storage
  useEffect(() => {
    if (open) {
      try {
        const stored = sessionStorage.getItem(STORAGE_KEY)
        if (stored) {
          const parsed = JSON.parse(stored)
          // Convert timestamp strings back to Date objects
          const messagesWithDates = parsed.map((msg: ChatMessage) => ({
            ...msg,
            timestamp: new Date(msg.timestamp),
          }))
          setMessages(messagesWithDates)
        }
      }
      catch (error) {
        console.error('Failed to load chat history:', error)
      }
    }
  }, [open])

  // Save chat history to session storage
  const handleMessagesChange = (newMessages: ChatMessage[]) => {
    setMessages(newMessages)
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(newMessages))
    }
    catch (error) {
      console.error('Failed to save chat history:', error)
    }
  }

  const handleMinimize = () => {
    setMinimized(true)
    onClose()
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      sx={styles.dialog}
      aria-labelledby="ai-assistant-dialog-title"
    >
      <Box sx={styles.titleContainer}>
        <Typography sx={styles.titleText} id="ai-assistant-dialog-title">
          🤖 DUOS AI Assistant
        </Typography>
        <Box sx={styles.actions}>
          <IconButton
            onClick={handleMinimize}
            size="small"
            aria-label="Minimize"
          >
            <MinimizeIcon />
          </IconButton>
          <IconButton
            onClick={onClose}
            size="small"
            aria-label="Close"
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </Box>
      <DialogContent sx={styles.content}>
        <AIChat
          initialMessages={messages}
          onMessagesChange={handleMessagesChange}
        />
      </DialogContent>
    </Dialog>
  )
}

export default AIAssistantModal
