import type { FastifyInstance } from 'fastify'
import { get as getConfigValue } from './config.js'
import { createSession } from './sessionStore.js'
import { callTool } from './mcpClient.js'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type SseEvent
  = | { type: 'token', content: string }
    | { type: 'status', content: string }
    | { type: 'done' }
    | { type: 'error', content: string }

interface OllamaMessage {
  role: string
  content?: string
  tool_calls?: { function: { name: string, arguments: Record<string, unknown> } }[]
}

interface OllamaResponse {
  message?: OllamaMessage
}

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
frequently. When a tool returns an error, acknowledge it and answer from
general knowledge where possible.`

// ---------------------------------------------------------------------------
// Tool declarations (OpenAI function-calling schema used by Ollama)
// ---------------------------------------------------------------------------

const TOOLS = [
  {
    type: 'function',
    function: {
      name: 'list_datasets',
      description:
        'List genomic datasets registered in DUOS that the current user may be able to request access to. '
        + 'Returns dataset names, IDs, data use codes, and custodian DAC information.',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Optional free-text filter applied to dataset name and description.' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_dataset',
      description:
        'Return detailed information about a single DUOS dataset, including its full data use restrictions, '
        + 'associated DAC, and available files.',
      parameters: {
        type: 'object',
        properties: {
          datasetId: { type: 'integer', description: 'Numeric DUOS dataset ID.' },
        },
        required: ['datasetId'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_dar_collections',
      description:
        `List the current user's Data Access Request (DAR) collections. `
        + 'Returns each collection with its constituent DARs and their current approval status.',
      parameters: { type: 'object', properties: {} },
    },
  },
]

const MAX_LOOP_ITERATIONS = 8

// ---------------------------------------------------------------------------
// Ollama agentic loop
// ---------------------------------------------------------------------------

async function runOllamaLoop(
  ollamaUrl: string,
  model: string,
  userMessage: string,
  sessionId: string,
  sse: (event: SseEvent) => void,
): Promise<void> {
  const messages: OllamaMessage[] = [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: userMessage },
  ]

  for (let i = 0; i < MAX_LOOP_ITERATIONS; i++) {
    const res = await fetch(`${ollamaUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, messages, tools: TOOLS, stream: false }),
    })

    if (!res.ok) {
      const text = await res.text()
      sse({ type: 'error', content: `Ollama error ${res.status}: ${text}` })
      return
    }

    const data = await res.json() as OllamaResponse
    const msg = data.message

    if (!msg?.tool_calls || msg.tool_calls.length === 0) {
      sse({ type: 'token', content: msg?.content ?? '' })
      return
    }

    messages.push(msg)
    for (const tc of msg.tool_calls) {
      const { name, arguments: args } = tc.function
      sse({ type: 'status', content: `Looking up ${name.replace(/_/g, ' ')}…` })
      const result = await callTool(sessionId, name, (args as Record<string, unknown>) ?? {})
      messages.push({ role: 'tool', content: JSON.stringify(result) })
    }
  }

  sse({ type: 'token', content: 'I was unable to complete the request within the allowed steps.' })
}

// ---------------------------------------------------------------------------
// Fastify plugin
// ---------------------------------------------------------------------------

export async function proxyPlugin(fastify: FastifyInstance): Promise<void> {
  fastify.post<{ Body: { message?: string } }>('/api/chat', async (request, reply) => {
    const authHeader = request.headers.authorization ?? ''
    if (!authHeader.startsWith('Bearer ')) {
      return reply.code(401).send({ error: 'Missing or invalid Authorization header.' })
    }
    const oidcToken = authHeader.slice('Bearer '.length).trim()
    if (!oidcToken) {
      return reply.code(401).send({ error: 'Empty bearer token.' })
    }

    const message = (request.body?.message ?? '').trim()
    if (!message) {
      return reply.code(400).send({ error: '"message" is required.' })
    }

    const ollamaUrl = process.env.OLLAMA_URL
    if (!ollamaUrl) {
      return reply.code(503).send({ error: 'No AI backend is configured. Set OLLAMA_URL or configure Vertex AI.' })
    }

    const sessionId = createSession(oidcToken)

    reply.hijack()
    reply.raw.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Session-Id': sessionId,
    })

    const sse = (event: SseEvent) => reply.raw.write(`data: ${JSON.stringify(event)}\n\n`)

    try {
      const model = String(getConfigValue('modelVersion', 'VERTEX_MODEL', 'llama3.2:3b') ?? 'llama3.2:3b')
      await runOllamaLoop(ollamaUrl, model, message, sessionId, sse)
    }
    catch (err: unknown) {
      fastify.log.error({ err }, '[proxy] Unhandled error:')
      sse({ type: 'error', content: 'An unexpected error occurred. Please try again.' })
    }

    sse({ type: 'done' })
    reply.raw.end()
  })
}
