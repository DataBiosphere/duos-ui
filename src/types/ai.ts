export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  metadata?: {
    toolCalls?: ToolCall[]
    pageTextContent?: string
  }
}

export interface AIResponse {
  content: string
  toolCalls?: ToolCall[]
  error?: string
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
}

export interface ToolCall {
  toolName: string
  parameters: object
  result?: object
}

export interface MCPTool {
  name: string
  description: string
  parameters: {
    type: string
    properties: object
    required: string[]
  }
}

export interface MCPToolResult {
  success: boolean
  result?: unknown
  error?: string
}
