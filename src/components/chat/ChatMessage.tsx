import React from 'react'
import ReactMarkdown from 'react-markdown'
import { CircularProgress } from '@mui/material'
import type { ChatMessage as ChatMessageType } from './useChatStream'
import { Theme } from 'src/libs/theme'

interface ChatMessageProps {
  message: ChatMessageType
}

const styles = {
  row: (isUser: boolean): React.CSSProperties => ({
    display: 'flex',
    justifyContent: isUser ? 'flex-end' : 'flex-start',
    marginBottom: '0.75rem',
  }),
  bubble: (isUser: boolean, isError: boolean): React.CSSProperties => ({
    maxWidth: '82%',
    padding: '0.6rem 0.9rem',
    borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
    backgroundColor: isError
      ? '#fde8e8'
      : isUser
        ? Theme.palette.secondary
        : '#f0f4f7',
    color: isError ? Theme.palette.error : isUser ? '#ffffff' : '#1a1a1a',
    fontFamily: 'Montserrat, sans-serif',
    fontSize: '1.35rem',
    lineHeight: '1.5',
    wordBreak: 'break-word',
  }),
  // react-markdown renders <p> tags; reset their margins inside bubbles
  markdownWrap: {
    '& p': { margin: 0 },
  } as React.CSSProperties,
  status: {
    marginTop: '0.4rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
    color: '#6b7280',
    fontFamily: 'Montserrat, sans-serif',
    fontSize: '1.2rem',
    fontStyle: 'italic',
  } as React.CSSProperties,
  cursor: {
    display: 'inline-block',
    width: '2px',
    height: '1em',
    backgroundColor: Theme.palette.secondary,
    marginLeft: '2px',
    verticalAlign: 'text-bottom',
    animation: 'duos-chat-blink 1s step-end infinite',
  } as React.CSSProperties,
}

// Minimal global keyframe injection — runs once, harmless if called multiple times.
function ensureBlinkKeyframe() {
  if (typeof document === 'undefined') return
  if (document.getElementById('duos-chat-styles')) return
  const style = document.createElement('style')
  style.id = 'duos-chat-styles'
  style.textContent = `
    @keyframes duos-chat-blink {
      0%, 100% { opacity: 1; }
      50%       { opacity: 0; }
    }
  `
  document.head.appendChild(style)
}
ensureBlinkKeyframe()

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.role === 'user'
  const isError = message.isError === true

  return (
    <div style={styles.row(isUser)}>
      <div style={styles.bubble(isUser, isError)}>
        {isUser
          ? (
              <span>{message.content}</span>
            )
          : (
              <>
                {/* react-markdown for assistant responses */}
                <div style={{ lineHeight: '1.5' }}>
                  <ReactMarkdown>{message.content}</ReactMarkdown>
                  {message.isStreaming && !message.status && message.content && (
                    <span style={styles.cursor} aria-hidden />
                  )}
                </div>

                {/* Live tool-call status */}
                {message.status && (
                  <div style={styles.status}>
                    <CircularProgress size={12} thickness={5} sx={{ color: '#6b7280' }} />
                    {message.status}
                  </div>
                )}

                {/* Placeholder pulse when streaming hasn't produced text yet */}
                {message.isStreaming && !message.content && !message.status && (
                  <div style={styles.status}>
                    <CircularProgress size={12} thickness={5} sx={{ color: '#6b7280' }} />
                    Thinking…
                  </div>
                )}
              </>
            )}
      </div>
    </div>
  )
}

export default ChatMessage
