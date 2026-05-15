const TOOL_TIMEOUT_MS = 15_000

export async function callTool(
  sessionId: string,
  toolName: string,
  args: Record<string, unknown> = {},
): Promise<unknown> {
  const body = JSON.stringify({
    jsonrpc: '2.0',
    id: 1,
    method: 'tools/call',
    params: { name: toolName, arguments: args },
  })

  const port = process.env.PORT ?? '8080'
  const url = `http://127.0.0.1:${port}/mcp/${encodeURIComponent(sessionId)}`

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TOOL_TIMEOUT_MS)

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      signal: controller.signal,
    })
    const parsed = await res.json() as { result?: unknown, error?: { message?: string } }
    if (parsed.error) {
      console.warn(`[mcpClient] Tool "${toolName}" returned error:`, parsed.error)
      return { error: parsed.error.message ?? 'Tool returned an error' }
    }
    return parsed.result ?? {}
  }
  catch (err: unknown) {
    if (err instanceof Error && err.name === 'AbortError') {
      console.warn(`[mcpClient] Tool "${toolName}" timed out`)
      return { error: `Tool "${toolName}" timed out` }
    }
    const msg = err instanceof Error ? err.message : String(err)
    console.warn(`[mcpClient] Could not reach MCP server for tool "${toolName}": ${msg}`)
    return { error: `Tool "${toolName}" is not available` }
  }
  finally {
    clearTimeout(timer)
  }
}
