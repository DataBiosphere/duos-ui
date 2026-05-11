import { useState, useCallback, useRef } from 'react'
import { Token } from 'src/libs/config'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type MessageRole = 'user' | 'assistant'

export interface ChatMessage {
  id: string
  role: MessageRole
  /** Accumulated text content of the message. */
  content: string
  /** Live status note shown while a tool call is in flight. */
  status?: string
  isStreaming?: boolean
  isError?: boolean
}

// SSE event shapes emitted by /api/chat
interface SseToken  { type: 'token';  content: string }
interface SseStatus { type: 'status'; content: string }
interface SseDone   { type: 'done' }
interface SseError  { type: 'error';  content: string }
type SseEvent = SseToken | SseStatus | SseDone | SseError

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

interface UseChatStreamReturn {
  messages: ChatMessage[]
  isStreaming: boolean
  sendMessage: (text: string) => Promise<void>
  clearMessages: () => void
}

export function useChatStream(): UseChatStreamReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isStreaming, setIsStreaming] = useState(false)
  // Ref lets us abort an in-flight request if the panel is closed or unmounted.
  const abortRef = useRef<AbortController | null>(null)

  const updateLastAssistantMessage = useCallback(
    (updater: (msg: ChatMessage) => ChatMessage) => {
      setMessages((prev) => {
        const next = [...prev]
        const idx = next.findLastIndex((m) => m.role === 'assistant')
        if (idx !== -1) next[idx] = updater(next[idx])
        return next
      })
    },
    [],
  )

  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || isStreaming) return

    // Cancel any prior in-flight request
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    const token = Token.getToken()
    if (!token) {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: 'You must be signed in to use the DUOS Assistant.',
          isError: true,
        },
      ])
      return
    }

    // Append user message and an empty streaming assistant message
    const assistantId = crypto.randomUUID()
    setMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), role: 'user', content: trimmed },
      { id: assistantId, role: 'assistant', content: '', isStreaming: true },
    ])
    setIsStreaming(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message: trimmed }),
        signal: controller.signal,
      })

      if (!response.ok || !response.body) {
        throw new Error(`HTTP ${response.status}`)
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      // Parse the SSE stream
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })

        // SSE events are separated by double newlines
        const chunks = buffer.split('\n\n')
        buffer = chunks.pop() ?? ''

        for (const chunk of chunks) {
          const dataLine = chunk.split('\n').find((l) => l.startsWith('data: '))
          if (!dataLine) continue
          try {
            const event: SseEvent = JSON.parse(dataLine.slice(6))

            if (event.type === 'token') {
              updateLastAssistantMessage((m) => ({
                ...m,
                content: m.content + event.content,
                status: undefined,
              }))
            } else if (event.type === 'status') {
              updateLastAssistantMessage((m) => ({ ...m, status: event.content }))
            } else if (event.type === 'error') {
              updateLastAssistantMessage((m) => ({
                ...m,
                content: event.content,
                status: undefined,
                isStreaming: false,
                isError: true,
              }))
            } else if (event.type === 'done') {
              updateLastAssistantMessage((m) => ({
                ...m,
                status: undefined,
                isStreaming: false,
              }))
            }
          } catch {
            // Malformed SSE data — skip
          }
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') return
      console.error('[useChatStream]', err)
      updateLastAssistantMessage((m) => ({
        ...m,
        content: 'Something went wrong. Please try again.',
        status: undefined,
        isStreaming: false,
        isError: true,
      }))
    } finally {
      setIsStreaming(false)
      updateLastAssistantMessage((m) => ({ ...m, isStreaming: false, status: undefined }))
    }
  }, [isStreaming, updateLastAssistantMessage])

  const clearMessages = useCallback(() => {
    abortRef.current?.abort()
    setMessages([])
    setIsStreaming(false)
  }, [])

  return { messages, isStreaming, sendMessage, clearMessages }
}
