'use strict'

/**
 * MCP server endpoint — POST /mcp/:sessionId
 *
 * Receives JSON-RPC 2.0 tool-call requests from the proxy's agentic loop
 * (via mcpClient.js), looks up the user's OIDC token from the session store,
 * and forwards the call to the appropriate Consent API handler in
 * consentClient.js.
 *
 * The JSON-RPC envelope used here matches what mcpClient.js sends:
 *   { jsonrpc: "2.0", id, method: "tools/call",
 *     params: { name: "<toolName>", arguments: { ... } } }
 *
 * Only the "tools/call" method is implemented; other MCP methods return a
 * standard JSON-RPC "method not found" error.
 */

const express = require('express')
const { getSession } = require('./sessionStore')
const { callConsentTool } = require('./consentClient')

const router = express.Router()
router.use(express.json())

/**
 * Build a JSON-RPC 2.0 success response.
 */
function rpcOk(id, result) {
  return { jsonrpc: '2.0', id, result }
}

/**
 * Build a JSON-RPC 2.0 error response.
 * Codes follow the JSON-RPC spec:
 *   -32600 Invalid Request
 *   -32601 Method not found
 *   -32602 Invalid params
 *   -32603 Internal error
 */
function rpcErr(id, code, message, data) {
  return { jsonrpc: '2.0', id: id ?? null, error: { code, message, ...(data ? { data } : {}) } }
}

router.post('/mcp/:sessionId', async (req, res) => {
  const { sessionId } = req.params
  const { id, method, params } = req.body ?? {}

  // --- Validate JSON-RPC envelope -------------------------------------------
  if (req.body?.jsonrpc !== '2.0') {
    return res.status(400).json(rpcErr(id, -32600, 'Invalid Request: jsonrpc must be "2.0"'))
  }

  // --- Resolve session → OIDC token -----------------------------------------
  const session = getSession(sessionId)
  if (!session) {
    return res.status(401).json(rpcErr(id, -32600, 'Session not found or expired'))
  }
  const { token } = session

  // --- Route by method -------------------------------------------------------
  if (method !== 'tools/call') {
    return res.status(200).json(rpcErr(id, -32601, `Method not found: "${method}"`))
  }

  const toolName = params?.name
  const toolArgs = params?.arguments ?? {}

  if (!toolName) {
    return res.status(200).json(rpcErr(id, -32602, 'Invalid params: "name" is required'))
  }

  // --- Execute tool ----------------------------------------------------------
  try {
    const result = await callConsentTool(toolName, toolArgs, token)
    return res.json(rpcOk(id, result))
  } catch (err) {
    console.error(`[mcp] Tool "${toolName}" error:`, err.message)
    return res.json(rpcErr(id, -32603, err.message))
  }
})

module.exports = router
