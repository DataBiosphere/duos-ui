import fs from 'node:fs'
import http, { type IncomingMessage, type ServerResponse } from 'node:http'
import https from 'node:https'
import path from 'node:path'
import { HttpError, sendJson } from './http'
import { createSigningKey } from './jwt'
import { createOidcProvider } from './oidcProvider'
import { createConsentUpstream } from './consentUpstream'
import { ScenarioStore } from './scenarios'
import {
  callbackUri,
  MOCK_CLIENT_ID,
  MOCK_CLIENT_SECRET,
  MOCK_CONSENT_PORT,
  MOCK_CONSENT_URL,
  MOCK_OIDC_ORIGIN,
  MOCK_OIDC_PORT,
  MOCK_SERVER_BASE_URLS,
  postLogoutUri,
} from './settings'

/**
 * Starts the mock OIDC provider and the mock Consent upstream in one process,
 * so they share one scenario store. Playwright's `webServer` runs this; see
 * playwright.config.ts.
 */

const PROJECT_ROOT = path.join(import.meta.dirname, '..', '..', '..')

const store = new ScenarioStore()

const provider = createOidcProvider({
  origin: MOCK_OIDC_ORIGIN,
  clientId: MOCK_CLIENT_ID,
  clientSecret: MOCK_CLIENT_SECRET,
  redirectUris: MOCK_SERVER_BASE_URLS.map(callbackUri),
  postLogoutRedirectUris: MOCK_SERVER_BASE_URLS.map(postLogoutUri),
  store,
  signingKey: createSigningKey(),
})
const consent = createConsentUpstream({ origin: MOCK_CONSENT_URL, store })

type Handler = (request: IncomingMessage, response: ServerResponse) => void | Promise<void>

/**
 * Answers every failure instead of letting it escape. One process serves every
 * parallel worker, so an uncaught throw from a single bad request (a target of
 * `//`, say) would take both servers down and fail the whole run.
 */
const guarded = (name: string, handler: Handler) => (request: IncomingMessage, response: ServerResponse): void => {
  Promise.resolve()
    .then(() => handler(request, response))
    .catch((err: unknown) => {
      if (!(err instanceof HttpError)) console.error(`[mock ${name}] request failed`, err)
      if (response.headersSent) return
      if (err instanceof HttpError) sendJson(response, err.status, { error: err.message })
      else sendJson(response, 500, { error: `the mock ${name} failed; see its log` })
    })
}

const oidcServer = https.createServer({
  key: fs.readFileSync(path.join(PROJECT_ROOT, 'server.key')),
  cert: fs.readFileSync(path.join(PROJECT_ROOT, 'server.crt')),
}, guarded('oidc', provider))
const consentServer = http.createServer(guarded('consent', consent))

oidcServer.listen(MOCK_OIDC_PORT, '127.0.0.1', () => console.log(`[mock oidc] listening on ${MOCK_OIDC_ORIGIN}`))
consentServer.listen(MOCK_CONSENT_PORT, '127.0.0.1', () => console.log(`[mock consent] listening on ${MOCK_CONSENT_URL}`))

// A `hang` scenario holds a response open, so close sockets rather than wait for them.
const shutdown = (): void => {
  oidcServer.closeAllConnections()
  consentServer.closeAllConnections()
  oidcServer.close()
  consentServer.close()
}
process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)
