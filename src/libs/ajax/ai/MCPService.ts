import { MCPTool, MCPToolResult } from 'src/types/ai'

const MCP_SERVER_URL = 'http://127.0.0.1:8000'

export class MCPService {
  /**
   * List available tools from the MCP server
   */
  static async listTools(): Promise<MCPTool[]> {
    try {
      const response = await fetch(`${MCP_SERVER_URL}/tools`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(5000),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      return data.tools || []
    }
    catch (error) {
      console.error('Failed to list MCP tools:', error)
      return []
    }
  }

  /**
   * Execute a specific tool
   */
  static async executeTool(
    toolName: string,
    parameters: object,
  ): Promise<MCPToolResult> {
    try {
      const response = await fetch(`${MCP_SERVER_URL}/tools/${toolName}/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(parameters),
        signal: AbortSignal.timeout(30000),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      return {
        success: true,
        result: data,
      }
    }
    catch (error) {
      console.error(`Failed to execute tool ${toolName}:`, error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Enrich a prompt with available tools information
   */
  static async enrichPromptWithTools(
    prompt: string,
    availableTools: MCPTool[],
  ): Promise<string> {
    if (availableTools.length === 0) {
      return prompt
    }

    const toolsDescription = availableTools.map(tool =>
      `- ${tool.name}: ${tool.description}`,
    ).join('\n')

    return `${prompt}\n\nAVAILABLE TOOLS:\n${toolsDescription}\n\nYou can use these tools to provide more detailed information if needed.`
  }
}
