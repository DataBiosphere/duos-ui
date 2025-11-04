import React, { useState, useRef, useEffect } from 'react'
import { Box, TextField, IconButton, CircularProgress, Alert } from '@mui/material'
import SendIcon from '@mui/icons-material/Send'
import { ChatMessage } from 'src/types/ai'
import { AIService } from 'src/libs/ajax/ai/AIService'
import AIChatMessage from './AIChatMessage'

export interface AIChatProps {
  initialMessages?: ChatMessage[]
  onMessagesChange?: (messages: ChatMessage[]) => void
}

const styles = {
  chatContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    height: '100%',
    maxHeight: '600px',
  },
  messagesContainer: {
    flex: 1,
    overflowY: 'auto' as const,
    padding: '1rem',
    display: 'flex',
    flexDirection: 'column' as const,
  },
  inputContainer: {
    display: 'flex',
    gap: '0.5rem',
    padding: '1rem',
    borderTop: '1px solid #E0E0E0',
    alignItems: 'flex-end',
  },
  loadingContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '1rem',
    color: '#666',
  },
}

const generateId = () => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

export const AIChat: React.FC<AIChatProps> = ({ initialMessages = [], onMessagesChange }) => {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages)
  const [inputText, setInputText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    onMessagesChange?.(messages)
  }, [messages, onMessagesChange])

  const handleSendMessage = async () => {
    if (!inputText.trim() || loading) {
      return
    }

    const userMessageContent = inputText.trim()
    setInputText('')
    setError(null)

    // Capture current page text content
    const pageTextContent = document.documentElement.innerText

    // Add user message
    const userMessage: ChatMessage = {
      id: generateId(),
      role: 'user',
      content: userMessageContent,
      timestamp: new Date(),
      metadata: { pageTextContent },
    }

    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    setLoading(true)

    // Create a placeholder message for streaming
    const aiMessageId = generateId()
    const streamingMessage: ChatMessage = {
      id: aiMessageId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
    }
    setMessages([...newMessages, streamingMessage])

    try {
      // Send message to AI with streaming
      const response = await AIService.sendMessage(
        userMessageContent,
        messages,
        pageTextContent,
        (chunk: string) => {
          // Update the streaming message with new chunks
          setMessages((prevMessages) => {
            const updatedMessages = [...prevMessages]
            const lastMessage = updatedMessages[updatedMessages.length - 1]
            if (lastMessage && lastMessage.id === aiMessageId) {
              lastMessage.content += chunk
            }
            return updatedMessages
          })
        },
      )

      // Ensure final content is set (in case streaming didn't update everything)
      setMessages((prevMessages) => {
        const updatedMessages = [...prevMessages]
        const lastMessage = updatedMessages[updatedMessages.length - 1]
        if (lastMessage && lastMessage.id === aiMessageId) {
          lastMessage.content = response.content
        }
        return updatedMessages
      })
    }
    catch (err) {
      // Remove the streaming message on error
      setMessages(newMessages)
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
    }
    finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <Box sx={styles.chatContainer}>
      <Box sx={styles.messagesContainer}>
        {messages.length === 0 && (
          <Box sx={{ textAlign: 'center', color: '#666', padding: '2rem' }}>
            <p>👋 Hello! I&apos;m your AI assistant for the DUOS Data Library.</p>
            <p>I can help you understand datasets, data use restrictions, and navigate the system.</p>
            <p>Ask me anything!</p>
          </Box>
        )}
        {messages.map(message => (
          <AIChatMessage
            key={message.id}
            message={message}
            isUser={message.role === 'user'}
          />
        ))}
        {loading && (
          <Box sx={styles.loadingContainer}>
            <CircularProgress size={20} />
            <span>AI is thinking...</span>
          </Box>
        )}
        {error && (
          <Alert severity="error" onClose={() => setError(null)} sx={{ marginTop: '1rem' }}>
            {error}
          </Alert>
        )}
        <div ref={messagesEndRef} />
      </Box>
      <Box sx={styles.inputContainer}>
        <TextField
          fullWidth
          multiline
          maxRows={4}
          placeholder="Ask a question about DUOS..."
          value={inputText}
          onChange={e => setInputText(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={loading}
          variant="outlined"
          size="small"
        />
        <IconButton
          color="primary"
          onClick={handleSendMessage}
          disabled={!inputText.trim() || loading}
          aria-label="Send message"
        >
          <SendIcon />
        </IconButton>
      </Box>
    </Box>
  )
}

export default AIChat
