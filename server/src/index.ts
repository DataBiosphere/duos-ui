import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import http from 'node:http'
import https from 'node:https'
import open from 'open'
import Fastify, { FastifyError, FastifyInstance } from 'fastify'
import fastifyPostgres from '@fastify/postgres'
import fastifyCookie from '@fastify/cookie'
import fastifySession from '@fastify/session'
import fastifyCsrf from '@fastify/csrf-protection'
import fastifyHelmet from '@fastify/helmet'
import fastifyRateLimit from '@fastify/rate-limit'
import { createPgSessionStore } from './session/pgStore.js'
import { sessionPluginOptions } from './session/sessionOptions.js'
import { helmetOptions } from './security/csp.js'
import { REPORTING_ENDPOINTS_HEADER, cspReportRoute } from './security/cspReport.js'
import { csrfPluginOptions, handleCsrfToken } from './auth/csrf.js'
import { fetchMetadataGuard } from './security/fetchMetadata.js'
import { getOidcConfig } from './auth/oidcClient.js'
import { handleLogin } from './auth/login.js'
import { handleCallback } from './auth/callback.js'
import { handleLogout } from './auth/logout.js'
import { getMe } from './auth/me.js'
import { apiProxy } from './proxy/apiProxy.js'
import { ECM_PROXY_PREFIX, ecmProxy } from './proxy/ecmProxy.js'
import { TDR_PROXY_PREFIX, tdrProxy } from './proxy/tdrProxy.js'
import { BARD_PROXY_PREFIX, bardProxy } from './proxy/bardProxy.js'
import { TRUST_PROXY, configPath, readConfig } from './config.js'
import './types/session.js'
import FastifyVite from '@fastify/vite'

const PROJECT_ROOT = path.join(import.meta.dirname, '..', '..')
const isDev = process.env.NODE_ENV !== 'production'
const isCI = Boolean(process.env.CI)
const useHttps = isDev && !isCI

type AppInstance = FastifyInstance<http.Server | https.Server>

// Boolean env vars are coerced through one helper so a typo or unexpected
// casing can't silently pick the insecure branch: only an explicit, recognized
// "off" value returns false — anything unrecognized keeps the default.
export function envBool(value: string | undefined, defaultValue: boolean): boolean {
  const v = value?.trim().toLowerCase()
  if (!v) return defaultValue
  if (['true', '1', 'yes', 'on'].includes(v)) return true
  if (['false', '0', 'no', 'off'].includes(v)) return false
  return defaultValue
}

export async function buildApp(): Promise<AppInstance> {
  // The app always sits behind exactly one reverse-proxy hop (the
  // httpd-terra-proxy sidecar in k8s, or the `proxy` container in
  // docker-compose) that terminates TLS and forwards plain HTTP. TRUST_PROXY
  // makes `request.protocol` honor that proxy's X-Forwarded-Proto header
  // instead of falling back to the raw (unencrypted) socket — without it,
  // @fastify/session silently refuses to persist sessions once cookie.secure
  // is true, since it never sees `request.protocol === 'https'`. See its
  // definition in config.ts for why it names peers instead of counting hops.
  const fastify = (useHttps
    ? Fastify<https.Server>({
        https: {
          key: fs.readFileSync(path.join(PROJECT_ROOT, 'server.key')),
          cert: fs.readFileSync(path.join(PROJECT_ROOT, 'server.crt')),
        },
        logger: { level: process.env.FASTIFY_LOG_LEVEL ?? 'info' },
        trustProxy: TRUST_PROXY,
      })
    : Fastify({ logger: { level: process.env.FASTIFY_LOG_LEVEL ?? 'info' }, trustProxy: TRUST_PROXY })
  ) as AppInstance

  // Path to the static client config.json — computed once so both the
  // /config.json route below and the bffEnabled startup check read the same
  // (memoized) config.
  const configJsonPath = configPath(PROJECT_ROOT, isDev)

  // Read once, here. Two things need it: the CSP below, whose `connect-src`
  // allowlist is derived from the configured upstream origins and differs by
  // mode, and the `bffEnabled` cutover check further down. readConfig memoises
  // for the life of the process, so a second call would return this same
  // object — binding it makes that explicit and keeps the two in step.
  const clientConfig = await readConfig(configJsonPath, fastify.log)

  // 1. Security headers, including the Content Security Policy (Phase 5, 5-F).
  // Registered first so its onRequest hook runs ahead of every route, and
  // outside both switches below: the legacy client needs the same headers.
  //
  // Report-only until a deployment says otherwise. A strict policy is the kind
  // of change that breaks a page nobody tested, so each environment collects
  // violations at /csp-report first and flips DUOS_CSP_REPORT_ONLY=false once
  // the report run is clean. See docs/plans/bff_adrs/ADR-013-content-security-policy.md.
  const cspReportOnly = envBool(process.env.DUOS_CSP_REPORT_ONLY, true)
  fastify.log.info(`[server] Content Security Policy is ${cspReportOnly ? 'report-only (set DUOS_CSP_REPORT_ONLY=false to enforce)' : 'enforced'}`)
  await fastify.register(fastifyHelmet, helmetOptions(clientConfig, { isDev, reportOnly: cspReportOnly }))

  // Gives the policy's `report-to` group an address. The `report-uri` fallback
  // in the same policy needs no header, but Chrome prefers `report-to`.
  fastify.addHook('onRequest', async (_request, reply) => {
    reply.header('reporting-endpoints', REPORTING_ENDPOINTS_HEADER)
  })

  // `global: false` — this same instance serves every SPA asset through
  // @fastify/vite, and one page load fetches many of them, so a low global cap
  // would block page loads outright. Limits are attached per route instead.
  // Story 5-G registers the auth-route limits on this same plugin.
  //
  // The default store is per process, so a deployment's real ceiling is this
  // number times the replica count, and it resets on every restart. That is
  // why the epic puts flood protection at the ingress; this is the backstop
  // beneath it, not the control.
  await fastify.register(fastifyRateLimit, { global: false })

  await fastify.register(cspReportRoute)

  // 2. DB pool + session — registered only when the deployment provides the
  // BFF database configuration. Session infrastructure is deployment config
  // (env vars via helmfile/compose), not a runtime flag: every pod of a given
  // deployment behaves identically, with no network dependency at boot.
  // Directing users to the BFF sign-in flow is a separate switch — the
  // boolean `bffEnabled` in config.json, checked at startup — see
  // docs/plans/BFF_Overview.md.
  if (process.env.DUOS_DB_HOST) {
    fastify.log.info('[server] DUOS_DB_HOST is set — enabling BFF session infrastructure')

    // Validated up front so a half-configured deployment fails at startup with
    // an error naming the env var. pg.Pool connects lazily — without this, a
    // pod missing one of these would boot, pass health checks, and only fail
    // at the first session read/write.
    for (const name of ['DUOS_DB_NAME', 'DUOS_DB_USER', 'DUOS_DB_PASSWORD'] as const) {
      if (!process.env[name]) {
        throw new Error(`BFF session infrastructure is enabled (DUOS_DB_HOST is set) but ${name} is unset — set it in .env.local locally, or the deployment env in k8s`)
      }
    }
    // `||` not `??`: a blank DUOS_DB_PORT= line in .env.local must mean
    // "default", not a NaN startup failure.
    const dbPort = Number.parseInt(process.env.DUOS_DB_PORT?.trim() || '5432', 10)
    if (Number.isNaN(dbPort)) {
      throw new Error(`DUOS_DB_PORT is set to '${process.env.DUOS_DB_PORT}', which is not a number — unset it to use the default 5432, or set a valid port`)
    }

    // App-level TLS to Postgres is on unless explicitly disabled. The only
    // deployments that should disable it are those where the transport is
    // already plaintext-on-loopback (a Cloud SQL Proxy sidecar in k8s, or the
    // bundled `db` container in docker-compose) — there the Postgres end
    // doesn't speak TLS and the connection would be rejected.
    const dbSsl = envBool(process.env.DUOS_DB_SSL, true)
    if (!dbSsl) {
      fastify.log.warn('[server] DUOS_DB_SSL=false — connecting to Postgres without TLS; only safe when the transport is loopback (Cloud SQL Proxy sidecar or local docker network)')
    }

    // Register before sessions; the default pool of 10 is sufficient at measured load.
    await fastify.register(fastifyPostgres, {
      host: process.env.DUOS_DB_HOST,
      database: process.env.DUOS_DB_NAME,
      port: dbPort,
      user: process.env.DUOS_DB_USER,
      password: process.env.DUOS_DB_PASSWORD,
      ssl: dbSsl ? { rejectUnauthorized: true } : false,
    })

    // Validated here so a misconfigured environment fails with an error naming
    // the env var, instead of @fastify/session's generic "secret is required".
    const sessionSecret = process.env.DUOS_SESSION_SECRET
    if (!sessionSecret || sessionSecret.length < 32) {
      throw new Error('BFF is enabled but DUOS_SESSION_SECRET is unset or shorter than 32 characters — set it in .env.local locally, or the deployment env in k8s')
    }

    // Cookie + session — the store reads fastify.pg registered above
    await fastify.register(fastifyCookie)
    await fastify.register(fastifySession, sessionPluginOptions({
      secret: sessionSecret,
      store: createPgSessionStore(fastify.pg),
    }))

    // CSRF protection for cookie-authenticated, state-changing auth routes
    // (currently POST /auth/logout). SameSite=Lax withholds the session cookie
    // from cross-site POSTs, but is not sufficient alone here: dev/staging live
    // under *.broadinstitute.org, where SameSite treats every sibling subdomain
    // as same-site — a compromised sibling could still forge cookie-bearing
    // POSTs. CSRF tokens don't depend on the registrable domain. The secret is
    // stored in the session, so it must be registered after @fastify/session.
    //
    // The options — including the header-only `getToken` narrowing — live in
    // auth/csrf.ts so the test harnesses register the plugin exactly as this
    // does. Inline, they drifted: see that file.
    await fastify.register(fastifyCsrf, csrfPluginOptions)

    // Warm the B2C OIDC discovery cache so the first login doesn't pay the
    // discovery round-trip. Gated on the Azure env vars being present: DB/
    // session infra (this block) can be enabled ahead of B2C being configured
    // during the phased rollout, and warming up against unset vars would log
    // an error on every single startup for no benefit. Not awaited and never
    // fatal either way — on failure the error is logged and getOidcConfig()
    // retries lazily on first use.
    if (process.env.DUOS_AZURE_ISSUER_URL && process.env.DUOS_AZURE_CLIENT_ID && process.env.DUOS_AZURE_CLIENT_SECRET) {
      getOidcConfig().catch((err: unknown) => {
        fastify.log.error({ err }, '[auth] B2C OIDC discovery warm-up failed')
      })
    }
  }
  else {
    fastify.log.info('[server] DUOS_DB_HOST is not set — starting without DB/session infrastructure (legacy client-side auth)')
  }

  // 3. BFF auth routes — the cutover switch. Read at startup from the same
  // config object the /config.json route below serves, so the server and
  // client agree on bffEnabled by construction. A missing key defaults to
  // false and the routes stay dark — the fail-safe is the legacy
  // client-side flow. See docs/plans/BFF_Overview.md § Rollout strategy.
  const { bffEnabled } = clientConfig
  if (bffEnabled === true) {
    // The two switches are meant to be independent (session infra can be on
    // ahead of cutover), but not in this direction: routing users into the
    // BFF flow without the session infrastructure configured would register
    // routes that 500 on first use instead of failing loudly at startup.
    if (!process.env.DUOS_DB_HOST) {
      throw new Error('bffEnabled is true in config.json but DUOS_DB_HOST is not set — the BFF auth routes require the session infrastructure to be configured')
    }
    // Both /auth/me and the API proxy forward to this upstream, so a cutover
    // without it is a deployment that boots, passes health checks, and then
    // fails on the first user request. Checked here rather than left to the
    // proxy's own requireEnv so the error arrives at startup, next to the
    // switch that made it mandatory.
    if (!process.env.DUOS_API_URL) {
      throw new Error('bffEnabled is true in config.json but DUOS_API_URL is not set — /auth/me and the API proxy both forward to it')
    }
    fastify.log.info('[server] bffEnabled is true — registering BFF auth routes and the API proxy')
    fastify.post('/auth/login', handleLogin)
    fastify.get('/auth/callback', handleCallback)
    // The client fetches this after sign-in and echoes the token in an
    // X-CSRF-Token header on unsafe auth requests. Gated on an authenticated
    // session (story 5-B): an anonymous request gets 401 and mints no session
    // row — see the handler in auth/csrf.ts. After session rotation (Phase 5,
    // 5-C) the pre-auth secret is discarded, so the client must (re)fetch this
    // once login completes.
    fastify.get('/auth/csrf-token', handleCsrfToken)
    // /auth/login is deliberately exempt from CSRF: it is pre-authentication
    // (no token to have fetched yet), and login CSRF is neutralized by the
    // PKCE state binding the flow to the session. Only logout is guarded.
    fastify.post('/auth/logout', { onRequest: fastify.csrfProtection }, handleLogout)
    // /auth/me is a safe GET here, but it calls Consent's state-changing
    // GET /api/user/me server-side, so it carries the Fetch Metadata guard the
    // proxies get from their shared machinery (story 5-B; see
    // security/fetchMetadata.ts). /auth/login and /auth/callback must NOT get
    // it — the callback is a legitimate cross-site navigation from B2C.
    fastify.get('/auth/me', { onRequest: fetchMetadataGuard }, getMe)

    // The API proxy (Phase 3). Registered here, inside both switches, rather
    // than alongside /health: it depends on @fastify/cookie, @fastify/session
    // and @fastify/csrf-protection, all of which are registered above only when
    // DUOS_DB_HOST is set. Gating it on bffEnabled too keeps it dark until
    // cutover — the client does not call /duos-api until Phase 4 points
    // getApiUrl() at it — so a deployment running the legacy client-side flow
    // exposes no proxy route at all.
    await fastify.register(apiProxy)

    // The single-feature upstream proxies. Same gates as the DUOS API proxy,
    // plus one more each: their own env var. Conditional rather than required,
    // unlike DUOS_API_URL above, because each serves exactly one feature.
    const optionalProxies = [
      { envVar: 'DUOS_ECM_URL', prefix: ECM_PROXY_PREFIX, register: ecmProxy, feature: 'RAS/eRA Commons account linking' },
      { envVar: 'DUOS_TDR_URL', prefix: TDR_PROXY_PREFIX, register: tdrProxy, feature: 'TDR snapshot enumeration on dataset pages' },
      { envVar: 'DUOS_BARD_URL', prefix: BARD_PROXY_PREFIX, register: bardProxy, feature: 'identified usage metrics (signed-in Bard events fall back to anonymous)' },
    ] as const
    for (const { envVar, prefix, register, feature } of optionalProxies) {
      if (process.env[envVar]) {
        fastify.log.info(`[server] ${envVar} is set — registering the ${prefix} proxy`)
        await fastify.register(register)
      }
      else {
        fastify.log.warn(`[server] ${envVar} is not set — the ${prefix} proxy is disabled, so ${feature} will fail in this BFF environment`)
      }
    }
  }
  else {
    fastify.log.info('[server] bffEnabled is not true — BFF auth routes disabled (legacy client-side auth)')
  }

  // Health check — registered before Vite middleware so it always resolves
  fastify.get('/health', async () => ({ status: 'ok' }))

  // Client config — intercepted via onRequest rather than a route, because
  // @fastify/vite's production static plugin (wildcard: false) walks build/
  // and registers its own explicit GET/HEAD route for every file it finds
  // there, including config.json. A competing `fastify.get('/config.json', ...)`
  // collides with that at startup (FST_ERR_DUPLICATED_ROUTE); onRequest fires
  // before that nested route's handler regardless of which scope declared it,
  // so this lets DUOS_API_URL override the static file's `apiUrl` without
  // fighting Vite for the route — see config.ts for why.
  // HEAD must be intercepted along with GET: the static plugin registers both,
  // so a HEAD that fell through would describe the raw un-overridden file and
  // disagree with GET's body (mismatched Content-Length for caches/validators).
  // Node itself omits the body for HEAD responses; sending the same payload
  // yields matching headers.
  fastify.addHook('onRequest', async (request, reply) => {
    if ((request.method === 'GET' || request.method === 'HEAD')
      && (request.url === '/config.json' || request.url.startsWith('/config.json?'))) {
      reply.send(await readConfig(configJsonPath, request.log))
    }
  })

  // Vite: dev → HMR middleware; prod → serves static build + SPA fallback
  await fastify.register(FastifyVite, {
    root: PROJECT_ROOT,
    dev: isDev,
    spa: true,
  })

  await fastify.vite.ready()

  // SPA fallback — @fastify/vite sets up the Vite middleware and reply.html decorator
  // but does not register routes; we wire the catch-all ourselves.
  fastify.setNotFoundHandler((_req, reply) => reply.html())

  // The encapsulated proxy declares its own error handler (ADR-010).
  fastify.setErrorHandler((err: FastifyError, request, reply) => {
    request.log.error({ err }, '[server] Unhandled error:')
    return reply.status(err.statusCode ?? 500).send({ error: 'An unexpected error occurred.' })
  })

  return fastify
}

// Only start the server when this file is the direct entry point, not when imported by tests
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const PORT = Number(process.env.PORT) || (isDev ? 3000 : 8080)
  const HOST = '0.0.0.0'
  try {
    const fastify = await buildApp()
    await fastify.listen({ port: PORT, host: HOST })
    if (isDev && !isCI) {
      const protocol = useHttps ? 'https' : 'http'
      await open(`${protocol}://local.dsde-dev.broadinstitute.org:${PORT}`)
    }
  }
  catch (err: unknown) {
    console.error(err)
    process.exit(1)
  }
}
