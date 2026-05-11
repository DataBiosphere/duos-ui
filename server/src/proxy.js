'use strict'

const express = require('express')
const { VertexAI } = require('@google-cloud/vertexai')
const { get: getConfigValue } = require('./config')
const { createSession } = require('./sessionStore')
const { callTool } = require('./mcpClient')

const router = express.Router()
router.use(express.json())

// ---------------------------------------------------------------------------
// System prompt
// ---------------------------------------------------------------------------

const SYSTEM_PROMPT = `You are a helpful assistant embedded in DUOS (Data Use
Oversight System), a platform that manages controlled-access genomic datasets 
and data access requests on behalf of the NIH and its research partners.

Help researchers with questions such as:
- What datasets are available and what use restrictions apply
- How to submit or check the status of a Data Access Request (DAR)
- What consent codes mean and how they affect data use

Always use the available tools to look up current information rather than
relying on prior knowledge, since dataset availability and DAR statuses change
frequently.  When a tool returns an error, acknowledge it and answer from
general knowledge where possible.`

// ---------------------------------------------------------------------------
// Tool declarations (Gemini function-calling schema)
// These mirror the tools the MCP server exposes in Step 3.
// ---------------------------------------------------------------------------

const TOOL_DECLARATIONS = [
  {
    name: 'list_datasets',
    description:
      'List genomic datasets registered in DUOS that the current user may be '
      + 'able to request access to.  Returns dataset names, IDs, data use codes, '
      + 'and custodian DAC information.',
    parameters: {
      type: 'OBJECT',
      properties: {
        query: {
          type: 'STRING',
          description: 'Optional free-text filter applied to dataset name and description.',
        },
      },
    },
  },
  {
    name: 'get_dataset',
    description:
      'Return detailed information about a single DUOS dataset, including its '
      + 'full data use restrictions, associated DAC, and available files.',
    parameters: {
      type: 'OBJECT',
      properties: {
        datasetId: {
          type: 'INTEGER',
          description: 'Numeric DUOS dataset ID.',
        },
      },
      required: ['datasetId'],
    },
  },
  {
    name: 'list_dar_collections',
    description:
      'List the current user\'s Data Access Request (DAR) collections.  '
      + 'Returns each collection with its constituent DARs and their current '
      + 'approval status (e.g. Pending, Approved, Denied).',
    parameters: {
      type: 'OBJECT',
      properties: {},
    },
  },
]

// ---------------------------------------------------------------------------
// SSE helpers
// ---------------------------------------------------------------------------

/**
 * Write a single Server-Sent Event to the response.
 *
 * Payload shape understood by the chat UI (Step 4):
 *   { type: 'token',  content: string }  — streamed text fragment
 *   { type: 'status', content: string }  — progress note (tool call in flight)
 *   { type: 'done' }                     — stream complete
 *   { type: 'error',  content: string }  — terminal error
 */
function sse(res, data) {
  res.write(`data: ${JSON.stringify(data)}\n\n`)
}

// ---------------------------------------------------------------------------
// Agentic loop
// ---------------------------------------------------------------------------

const MAX_LOOP_ITERATIONS = 8

/**
 * Drive a multi-turn Gemini conversation to completion, forwarding any tool
 * calls to the embedded MCP server and streaming the final text answer back
 * over SSE.
 *
 * @param {import('@google-cloud/vertexai').ChatSession} chat
 * @param {string} userMessage
 * @param {string} sessionId
 * @param {import('express').Response} res
 */
async function runAgenticLoop(chat, userMessage, sessionId, res) {
  // Turn 1: send the user's message
  let result = await chat.sendMessage([{ text: userMessage }])

  for (let i = 0; i < MAX_LOOP_ITERATIONS; i++) {
    const candidate = result.response.candidates?.[0]
    if (!candidate) {
      sse(res, { type: 'error', content: 'Model returned no candidates.' })
      return
    }

    const parts = candidate.content?.parts ?? []
    const funcCallParts = parts.filter(p => p.functionCall)
    const textParts = parts.filter(p => p.text)

    // No function calls → this is the final answer; stream text to browser.
    if (funcCallParts.length === 0) {
      const text = textParts.map(p => p.text).join('')
      sse(res, { type: 'token', content: text })
      return
    }

    // One or more function calls → execute via MCP server and feed results back.
    const functionResponses = []

    for (const part of funcCallParts) {
      const { name, args } = part.functionCall
      const label = name.replace(/_/g, ' ')
      sse(res, { type: 'status', content: `Looking up ${label}…` })

      const toolResult = await callTool(sessionId, name, args ?? {})
      functionResponses.push({
        functionResponse: { name, response: toolResult },
      })
    }

    // Continue the conversation with the tool results.
    result = await chat.sendMessage(functionResponses)
  }

  // Exceeded iteration cap — return whatever text we have.
  const finalParts = result.response.candidates?.[0]?.content?.parts ?? []
  const finalText = finalParts.filter(p => p.text).map(p => p.text).join('')
  sse(res, {
    type: 'token',
    content: finalText || 'I was unable to complete the request within the allowed steps.',
  })
}

// ---------------------------------------------------------------------------
// Route
// ---------------------------------------------------------------------------

/**
 * POST /api/chat
 *
 * Body:    { "message": "What datasets can I access?" }
 * Headers: Authorization: Bearer <oidc-access-token>
 *
 * Response: text/event-stream (SSE)
 *   X-Session-Id response header carries the server-side session ID.
 */
router.post('/api/chat', async (req, res) => {
  // --- Validate auth header ---------------------------------------------------
  const authHeader = req.headers['authorization'] ?? ''
  if (!authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header.' })
  }
  const oidcToken = authHeader.slice('Bearer '.length).trim()
  if (!oidcToken) {
    return res.status(401).json({ error: 'Empty bearer token.' })
  }

  // --- Validate body ----------------------------------------------------------
  const message = (req.body?.message ?? '').trim()
  if (!message) {
    return res.status(400).json({ error: '"message" is required.' })
  }

  // --- Create session ---------------------------------------------------------
  const sessionId = createSession(oidcToken)

  // --- Open SSE stream --------------------------------------------------------
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.setHeader('X-Session-Id', sessionId)
  res.flushHeaders()

  try {
    // --- Resolve Vertex config -------------------------------------------------
    const project = getConfigValue('projectId', 'VERTEX_PROJECT_ID')
    const location = getConfigValue('region', 'VERTEX_LOCATION', 'us-central1')
    const model = getConfigValue('modelVersion', 'VERTEX_MODEL', 'gemini-2.0-flash-001')

    if (!project) {
      sse(res, { type: 'error', content: 'Vertex AI project ID is not configured.' })
      return res.end()
    }

    // --- Build Vertex client ---------------------------------------------------
    // Authentication uses Application Default Credentials.  In GKE this is
    // Workload Identity; locally it is gcloud ADC or GOOGLE_APPLICATION_CREDENTIALS.
    const vertexAI = new VertexAI({ project, location })
    const generativeModel = vertexAI.getGenerativeModel({
      model,
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
    })

    const chat = generativeModel.startChat({
      tools: [{ functionDeclarations: TOOL_DECLARATIONS }],
    })

    // --- Run the agentic loop --------------------------------------------------
    await runAgenticLoop(chat, message, sessionId, res)
  }
  catch (err) {
    console.error('[proxy] Unhandled error:', err)
    sse(res, { type: 'error', content: 'An unexpected error occurred. Please try again.' })
  }

  sse(res, { type: 'done' })
  res.end()
})

module.exports = router
