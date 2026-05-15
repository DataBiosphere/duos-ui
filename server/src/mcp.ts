import type { FastifyInstance } from 'fastify'
import { getSession } from './sessionStore.js'
import { callConsentTool } from './consentClient.js'

interface RpcRequest {
  jsonrpc?: string
  id?: number | string | null
  method?: string
  params?: {
    name?: string
    arguments?: Record<string, unknown>
  }
}

function rpcOk(id: number | string | null | undefined, result: unknown) {
  return { jsonrpc: '2.0', id: id ?? null, result }
}

function rpcErr(id: number | string | null | undefined, code: number, message: string, data?: unknown) {
  return { jsonrpc: '2.0', id: id ?? null, error: { code, message, ...(data !== undefined ? { data } : {}) } }
}

export async function mcpPlugin(fastify: FastifyInstance): Promise<void> {
  fastify.post<{ Params: { sessionId: string }, Body: RpcRequest }>(
    '/mcp/:sessionId',
    async (request, reply) => {
      const { sessionId } = request.params
      const { id, method, params } = request.body ?? {}

      if (request.body?.jsonrpc !== '2.0') {
        return reply.code(400).send(rpcErr(id, -32600, 'Invalid Request: jsonrpc must be "2.0"'))
      }

      const session = getSession(sessionId)
      if (!session) {
        return reply.code(401).send(rpcErr(id, -32600, 'Session not found or expired'))
      }

      if (method !== 'tools/call') {
        return reply.send(rpcErr(id, -32601, `Method not found: "${method}"`))
      }

      const toolName = params?.name
      const toolArgs = params?.arguments ?? {}

      if (!toolName) {
        return reply.send(rpcErr(id, -32602, 'Invalid params: "name" is required'))
      }

      try {
        const result = await callConsentTool(toolName, toolArgs, session.token)
        return reply.send(rpcOk(id, result))
      }
      catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err)
        fastify.log.error({ err }, `[mcp] Tool "${toolName}" error:`)
        return reply.send(rpcErr(id, -32603, msg))
      }
    },
  )
}
