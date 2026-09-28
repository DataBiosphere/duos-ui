import fs from 'node:fs'
import http from 'node:http'
import https from 'node:https'
import path from 'node:path'
import { createSigningKey } from './jwt'
import { createOidcProvider } from './oidcProvider'
import { createConsentUpstream } from './consentUpstream'
import { ScenarioStore } from './scenarios'
import {
  MOCK_CLIENT_ID,
  MOCK_CLIENT_SECRET,
  MOCK_CONSENT_PORT,
  MOCK_CONSENT_URL,
  MOCK_OIDC_ORIGIN,
  MOCK_OIDC_PORT,
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
  store,
  signingKey: createSigningKey(),
})
const consent = createConsentUpstream({ origin: MOCK_CONSENT_URL, store })

const oidcServer = https.createServer({
  key: fs.readFileSync(path.join(PROJECT_ROOT, 'server.key')),
  cert: fs.readFileSync(path.join(PROJECT_ROOT, 'server.crt')),
}, (request, response) => {
  provider(request, response).catch((err: unknown) => {
    console.error('[mock oidc] request failed', err)
    if (!response.headersSent) response.writeHead(500).end()
  })
})
const consentServer = http.createServer(consent)

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
