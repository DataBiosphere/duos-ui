'use strict'

const http = require('http')

/**
 * Minimal MCP client for the proxy's agentic loop.
 *
 * Sends a `tools/call` request to the embedded MCP server endpoint
 * (`/mcp/:sessionId`) using the MCP Streamable HTTP transport's JSON-RPC
 * envelope.  The MCP server is implemented in Step 3; until then this client
 * fails gracefully so the proxy remains functional for queries that do not
 * require tool calls.
 *
 * This module intentionally has no dependency on @modelcontextprotocol/sdk so
 * it can be imported without the full SDK.  Step 3 may upgrade this to use the
 * SDK client if richer transport features (SSE, session resumption) are needed.
 */

const TOOL_TIMEOUT_MS = 15_000

/**
 * Call a single MCP tool on the embedded server.
 *
 * @param {string} sessionId - The proxy session ID embedded in the MCP URL
 * @param {string} toolName  - MCP tool name (e.g. "list_datasets")
 * @param {object} args      - Arguments object passed to the tool
 * @returns {Promise<object>} The `result` field from the JSON-RPC response, or
 *                            an `{ error }` object on failure.
 */
function callTool(sessionId, toolName, args = {}) {
  return new Promise((resolve) => {
    const body = JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/call',
      params: { name: toolName, arguments: args },
    })

    const port = process.env.PORT || 8080
    const options = {
      hostname: '127.0.0.1',
      port,
      path: `/mcp/${encodeURIComponent(sessionId)}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
    }

    const req = http.request(options, (res) => {
      let raw = ''
      res.setEncoding('utf8')
      res.on('data', (chunk) => { raw += chunk })
      res.on('end', () => {
        try {
          const parsed = JSON.parse(raw)
          // JSON-RPC error object
          if (parsed.error) {
            console.warn(`[mcpClient] Tool "${toolName}" returned error:`, parsed.error)
            resolve({ error: parsed.error.message || 'Tool returned an error' })
          } else {
            resolve(parsed.result ?? {})
          }
        } catch {
          console.warn(`[mcpClient] Non-JSON response from MCP server for tool "${toolName}"`)
          resolve({ error: 'Unexpected response from tool server' })
        }
      })
    })

    req.on('error', (err) => {
      // MCP server not yet available (Step 3 not implemented) — fail gracefully.
      console.warn(`[mcpClient] Could not reach MCP server for tool "${toolName}": ${err.message}`)
      resolve({ error: `Tool "${toolName}" is not available` })
    })

    req.setTimeout(TOOL_TIMEOUT_MS, () => {
      req.destroy()
      resolve({ error: `Tool "${toolName}" timed out` })
    })

    req.write(body)
    req.end()
  })
}

module.exports = { callTool }
