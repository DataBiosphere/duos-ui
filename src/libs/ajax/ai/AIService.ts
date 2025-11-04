import { AIResponse, ChatMessage } from 'src/types/ai'

const LLAMA_SERVER_URL = 'http://127.0.0.1:8080'
const DEFAULT_TIMEOUT = 60000
const DEFAULT_MAX_TOKENS = 8192
const DEFAULT_TEMPERATURE = 0.8
const DEFAULT_TOP_P = 0.95

export const ERROR_MESSAGES = {
  CONNECTION_FAILED: 'Unable to connect to AI assistant. Please check if the service is running.',
  TIMEOUT: 'Request timed out. Please try again with a shorter question.',
  INVALID_RESPONSE: 'Received an invalid response. Please try again.',
  RATE_LIMIT: 'Too many requests. Please wait a moment and try again.',
} as const

export class AIService {
  /**
   * Check if the llama.cpp server is healthy
   */
  static async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${LLAMA_SERVER_URL}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      })
      return response.ok
    }
    catch (error) {
      console.error('Health check failed:', error)
      return false
    }
  }

  /**
   * Build a prompt with page text context
   */
  private static buildPromptWithTextContext(
    userMessage: string,
    conversationHistory: ChatMessage[],
    pageTextContent?: string,
  ): string {
    // Build system prompt with page context
    let systemPrompt = 'You are a helpful assistant for the DUOS Data Library.'

    if (pageTextContent) {
      systemPrompt += `\n\nCURRENT PAGE TEXT CONTENT:\n\n\`\`\`\n${pageTextContent}\n\`\`\`\n\nThe user is viewing this page. Use the text content to understand what information is currently visible to the user.`
    }

    // Build conversation history
    let conversationText = ''
    for (const msg of conversationHistory) {
      if (msg.role === 'user') {
        conversationText += `\n\n<user>\n${msg.content}\n</user>`
      }
      else if (msg.role === 'assistant') {
        conversationText += `\n\n<assistant>\n${msg.content}\n</assistant>`
      }
    }

    // Build final prompt
    const prompt = `<system>\n${systemPrompt}\n</system>${conversationText}\n\n<user>\n${userMessage}\n</user>\n\n<assistant>`

    return prompt
  }

  /**
   * Send a message to the AI and stream the response
   */
  static async sendMessageStreaming(
    userMessage: string,
    conversationHistory: ChatMessage[] = [],
    pageTextContent?: string,
    onChunk?: (chunk: string) => void,
  ): Promise<AIResponse> {
    try {
      const prompt = this.buildPromptWithTextContext(
        userMessage,
        conversationHistory,
        pageTextContent,
      )

      const controller = new AbortController()
      let lastDataTime = Date.now()
      let timeoutId: number | undefined

      // Reset timeout whenever we receive data
      const resetTimeout = () => {
        if (timeoutId !== undefined) {
          clearTimeout(timeoutId)
        }
        timeoutId = window.setTimeout(() => {
          const timeSinceLastData = Date.now() - lastDataTime
          if (timeSinceLastData > DEFAULT_TIMEOUT) {
            controller.abort()
          }
        }, DEFAULT_TIMEOUT)
      }

      resetTimeout()

      const response = await fetch(`${LLAMA_SERVER_URL}/completion`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          temperature: DEFAULT_TEMPERATURE,
          top_p: DEFAULT_TOP_P,
          max_tokens: DEFAULT_MAX_TOKENS,
          stream: true,
          stop: ['</assistant>', '<user>'],
        }),
        signal: controller.signal,
      })

      if (!response.ok) {
        if (timeoutId !== undefined) {
          clearTimeout(timeoutId)
        }
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const reader = response.body?.getReader()
      if (!reader) {
        if (timeoutId !== undefined) {
          clearTimeout(timeoutId)
        }
        throw new Error('No reader available')
      }

      const decoder = new TextDecoder()
      let buffer = ''
      let fullContent = ''

      try {
        while (true) {
          const { done, value } = await reader.read()

          if (done) {
            if (timeoutId !== undefined) {
              clearTimeout(timeoutId)
            }
            break
          }

          // Update last data time and reset timeout
          lastDataTime = Date.now()
          resetTimeout()

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() || ''

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6))
                if (data.content) {
                  fullContent += data.content
                  onChunk?.(data.content)
                }
              }
              catch (_e) {
                // Skip invalid JSON
              }
            }
          }
        }
      }
      finally {
        if (timeoutId !== undefined) {
          clearTimeout(timeoutId)
        }
        reader.releaseLock()
      }

      return {
        content: fullContent,
      }
    }
    catch (error) {
      console.error('AI Service streaming error:', error)

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error(ERROR_MESSAGES.TIMEOUT)
        }
        if (error.message.includes('fetch')) {
          throw new Error(ERROR_MESSAGES.CONNECTION_FAILED)
        }
      }

      throw new Error(ERROR_MESSAGES.INVALID_RESPONSE)
    }
  }

  /**
   * Send a message to the AI and get a response (non-streaming)
   */
  static async sendMessageNonStreaming(
    userMessage: string,
    conversationHistory: ChatMessage[] = [],
    pageTextContent?: string,
  ): Promise<AIResponse> {
    try {
      const prompt = this.buildPromptWithTextContext(
        userMessage,
        conversationHistory,
        pageTextContent,
      )

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT)

      const response = await fetch(`${LLAMA_SERVER_URL}/completion`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          temperature: DEFAULT_TEMPERATURE,
          top_p: DEFAULT_TOP_P,
          max_tokens: DEFAULT_MAX_TOKENS,
          stream: false,
          stop: ['</assistant>', '<user>'],
        }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      return {
        content: data.content || '',
        usage: data.usage,
      }
    }
    catch (error) {
      console.error('AI Service error:', error)

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error(ERROR_MESSAGES.TIMEOUT)
        }
        if (error.message.includes('fetch')) {
          throw new Error(ERROR_MESSAGES.CONNECTION_FAILED)
        }
      }

      throw new Error(ERROR_MESSAGES.INVALID_RESPONSE)
    }
  }

  /**
   * Send a message to the AI and get a response (uses streaming by default)
   */
  static async sendMessage(
    userMessage: string,
    conversationHistory: ChatMessage[] = [],
    pageTextContent?: string,
    onChunk?: (chunk: string) => void,
  ): Promise<AIResponse> {
    return this.sendMessageStreaming(userMessage, conversationHistory, pageTextContent, onChunk)
  }
}
