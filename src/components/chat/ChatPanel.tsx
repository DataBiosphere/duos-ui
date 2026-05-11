import React, { useEffect, useRef, useState, KeyboardEvent } from 'react'
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome'
import CloseIcon from '@mui/icons-material/Close'
import SendIcon from '@mui/icons-material/Send'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import { IconButton, Tooltip } from '@mui/material'
import { ChatMessage } from './ChatMessage'
import { useChatStream } from './useChatStream'
import { Theme } from 'src/libs/theme'

interface ChatPanelProps {
  /** Pass App-level auth state to hide the FAB when signed out. */
  isLoggedIn: boolean
}

const PANEL_WIDTH = 400
const PANEL_HEIGHT = 560

const styles = {
  fab: {
    position: 'fixed' as const,
    bottom: '2rem',
    right: '2rem',
    width: '52px',
    height: '52px',
    borderRadius: '50%',
    backgroundColor: Theme.palette.primary,
    color: '#ffffff',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
    zIndex: 1300,
    transition: 'transform 0.15s ease, box-shadow 0.15s ease',
  },
  panel: {
    position: 'fixed' as const,
    bottom: '5.5rem',
    right: '2rem',
    width: `${PANEL_WIDTH}px`,
    height: `${PANEL_HEIGHT}px`,
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
    display: 'flex',
    flexDirection: 'column' as const,
    overflow: 'hidden',
    zIndex: 1300,
    fontFamily: 'Montserrat, sans-serif',
    // Slide-up entry animation
    animation: 'duos-chat-slideup 0.2s ease-out',
  },
  header: {
    backgroundColor: Theme.palette.primary,
    color: '#ffffff',
    padding: '0.75rem 1rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexShrink: 0,
  },
  headerTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontWeight: 600,
    fontSize: '1.45rem',
    letterSpacing: '0.01em',
  },
  headerActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.1rem',
  },
  disclaimer: {
    backgroundColor: '#fffbeb',
    borderBottom: '1px solid #fde68a',
    padding: '0.45rem 0.9rem',
    fontSize: '1.1rem',
    color: '#92400e',
    fontFamily: 'Montserrat, sans-serif',
    flexShrink: 0,
    lineHeight: '1.4',
  },
  messageList: {
    flex: 1,
    overflowY: 'auto' as const,
    padding: '1rem',
  },
  emptyState: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.75rem',
    color: '#9ca3af',
    fontFamily: 'Montserrat, sans-serif',
    fontSize: '1.35rem',
    textAlign: 'center' as const,
    padding: '0 1.5rem',
  },
  inputRow: {
    display: 'flex',
    alignItems: 'flex-end',
    gap: '0.5rem',
    padding: '0.75rem',
    borderTop: '1px solid #e5e7eb',
    flexShrink: 0,
  },
  textarea: {
    flex: 1,
    resize: 'none' as const,
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    padding: '0.6rem 0.75rem',
    fontFamily: 'Montserrat, sans-serif',
    fontSize: '1.35rem',
    lineHeight: '1.5',
    outline: 'none',
    maxHeight: '120px',
    overflowY: 'auto' as const,
    color: '#111827',
  },
  sendButton: (disabled: boolean) => ({
    width: '36px',
    height: '36px',
    borderRadius: '8px',
    backgroundColor: disabled ? '#e5e7eb' : Theme.palette.secondary,
    color: disabled ? '#9ca3af' : '#ffffff',
    border: 'none',
    cursor: disabled ? 'not-allowed' : 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    transition: 'background-color 0.15s ease',
    marginBottom: '1px',
  }),
}

// Panel open/close animation keyframe (injected alongside the blink keyframe)
function ensureSlideUpKeyframe() {
  if (typeof document === 'undefined') return
  const existing = document.getElementById('duos-chat-styles')
  if (existing && existing.textContent?.includes('duos-chat-slideup')) return
  const rule = `
    @keyframes duos-chat-slideup {
      from { opacity: 0; transform: translateY(12px); }
      to   { opacity: 1; transform: translateY(0); }
    }
  `
  if (existing) {
    existing.textContent += rule
  }
}
ensureSlideUpKeyframe()

export const ChatPanel: React.FC<ChatPanelProps> = ({ isLoggedIn }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const { messages, isStreaming, sendMessage, clearMessages } = useChatStream()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-scroll to the latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => textareaRef.current?.focus(), 50)
    }
  }, [isOpen])

  const handleOpen = () => setIsOpen(true)
  const handleClose = () => setIsOpen(false)

  const handleSend = async () => {
    const text = inputValue.trim()
    if (!text || isStreaming) return
    setInputValue('')
    // Reset textarea height
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
    await sendMessage(text)
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // Auto-grow textarea up to ~5 lines
  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value)
    e.target.style.height = 'auto'
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`
  }

  if (!isLoggedIn) return null

  return (
    <>
      {/* Floating action button */}
      {!isOpen && (
        <Tooltip title="DUOS Assistant" placement="left">
          <button
            style={styles.fab}
            onClick={handleOpen}
            aria-label="Open DUOS Assistant"
          >
            <AutoAwesomeIcon fontSize="small" />
          </button>
        </Tooltip>
      )}

      {/* Chat panel */}
      {isOpen && (
        <div
          style={styles.panel}
          role="dialog"
          aria-label="DUOS Assistant"
          aria-modal="false"
        >
          {/* Header */}
          <div style={styles.header}>
            <div style={styles.headerTitle}>
              <AutoAwesomeIcon style={{ fontSize: '1.6rem' }} />
              DUOS Assistant
            </div>
            <div style={styles.headerActions}>
              {messages.length > 0 && (
                <Tooltip title="Clear conversation">
                  <IconButton
                    size="small"
                    onClick={clearMessages}
                    aria-label="Clear conversation"
                    sx={{ color: 'rgba(255,255,255,0.75)', '&:hover': { color: '#ffffff' } }}
                  >
                    <DeleteOutlineIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
              <Tooltip title="Close">
                <IconButton
                  size="small"
                  onClick={handleClose}
                  aria-label="Close DUOS Assistant"
                  sx={{ color: 'rgba(255,255,255,0.75)', '&:hover': { color: '#ffffff' } }}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </div>
          </div>

          {/* AI disclaimer */}
          <div style={styles.disclaimer}>
            AI-generated responses may be inaccurate. Always verify access requirements before submitting a DAR.
          </div>

          {/* Message list */}
          <div style={styles.messageList}>
            {messages.length === 0
              ? (
                  <div style={styles.emptyState}>
                    <AutoAwesomeIcon sx={{ fontSize: '2.5rem', color: '#d1d5db' }} />
                    <span>Ask me about datasets, data access requests, or consent codes.</span>
                  </div>
                )
              : (
                  <>
                    {messages.map((msg) => (
                      <ChatMessage key={msg.id} message={msg} />
                    ))}
                    <div ref={messagesEndRef} />
                  </>
                )}
          </div>

          {/* Input row */}
          <div style={styles.inputRow}>
            <textarea
              ref={textareaRef}
              style={styles.textarea}
              rows={1}
              placeholder="Ask a question… (Shift+Enter for new line)"
              value={inputValue}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              disabled={isStreaming}
              aria-label="Message input"
            />
            <button
              style={styles.sendButton(!inputValue.trim() || isStreaming)}
              onClick={handleSend}
              disabled={!inputValue.trim() || isStreaming}
              aria-label="Send message"
            >
              <SendIcon style={{ fontSize: '1.6rem' }} />
            </button>
          </div>
        </div>
      )}
    </>
  )
}

export default ChatPanel
