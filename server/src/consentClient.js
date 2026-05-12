'use strict'

/**
 * Thin authenticated client for the DUOS Consent API.
 *
 * Every function accepts an OIDC access token and forwards it as a Bearer
 * credential so the Consent API sees the request as the originating user.
 * The base URL is read from the runtime config.json (apiUrl field) so it
 * follows the same environment pointer the frontend uses.
 */

const { getConfig } = require('./config')

const nodeFetch = globalThis.fetch ?? require('node-fetch')

const CONSENT_TIMEOUT_MS = 20_000

/**
 * Return the Consent API base URL from the runtime config.
 * Throws if it is not configured so callers get a clear error.
 */
function getApiUrl() {
  const url = getConfig().apiUrl
  if (!url) throw new Error('apiUrl is not set in config.json')
  return url
}

/**
 * Shared fetch helper — attaches auth, enforces timeout, throws on HTTP errors.
 *
 * @param {string} url
 * @param {string} token - OIDC access token
 * @param {RequestInit} [options]
 * @returns {Promise<unknown>} Parsed JSON body
 */
async function consentFetch(url, token, options = {}) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), CONSENT_TIMEOUT_MS)

  try {
    const res = await nodeFetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'X-App-ID': 'DUOS',
        ...(options.headers ?? {}),
      },
      signal: controller.signal,
    })

    if (!res.ok) {
      const body = await res.text().catch(() => '')
      throw new Error(`Consent API ${res.status} ${res.statusText}: ${body}`)
    }

    return res.json()
  } finally {
    clearTimeout(timer)
  }
}

// ---------------------------------------------------------------------------
// Tool implementations
// ---------------------------------------------------------------------------

/**
 * list_datasets — search the dataset index.
 *
 * Calls POST /api/dataset/search/index/v2 with an Elasticsearch query.
 * Returns a trimmed list suitable for the LLM to reason about.
 *
 * @param {string} token
 * @param {{ query?: string }} args
 */
async function listDatasets(token, args = {}) {
  const url = `${getApiUrl()}/api/dataset/search/index/v2`

  const must = [{ exists: { field: 'study' } }]

  if (args.query && args.query.trim()) {
    must.push({
      multi_match: {
        query: args.query.trim(),
        type: 'phrase_prefix',
        fields: [
          'study.studyName',
          'datasetName',
          'study.description',
          'study.phenotype',
          'study.species',
        ],
      },
    })
  }

  const body = {
    query: { bool: { must } },
    size: 25,
    _source: [
      'datasetId',
      'datasetName',
      'study.studyName',
      'study.description',
      'dataUse.primary',
      'dataUse.secondary',
      'dacId',
    ],
  }

  const raw = await consentFetch(url, token, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  // Elasticsearch wraps results in hits.hits
  const hits = raw?.hits?.hits ?? []
  const datasets = hits.map((h) => {
    const s = h._source ?? {}
    return {
      datasetId:   s.datasetId,
      datasetName: s.datasetName,
      studyName:   s.study?.studyName,
      description: s.study?.description,
      dataUse:     formatDataUse(s.dataUse),
      dacId:       s.dacId,
    }
  })

  return { total: raw?.hits?.total?.value ?? datasets.length, datasets }
}

/**
 * get_dataset — fetch a single dataset by ID.
 *
 * Calls GET /api/dataset/v2/:datasetId.
 *
 * @param {string} token
 * @param {{ datasetId: number }} args
 */
async function getDataset(token, args) {
  if (!args.datasetId) throw new Error('"datasetId" argument is required')
  const url = `${getApiUrl()}/api/dataset/v2/${args.datasetId}`
  const raw = await consentFetch(url, token)
  return summariseDataset(raw)
}

/**
 * list_dar_collections — fetch the current user's DAR collections.
 *
 * Calls GET /api/collections/role/Researcher/summary.
 *
 * @param {string} token
 */
async function listDarCollections(token) {
  const url = `${getApiUrl()}/api/collections/role/Researcher/summary`
  const raw = await consentFetch(url, token)
  const items = Array.isArray(raw) ? raw : []
  return {
    total: items.length,
    collections: items.map((c) => ({
      darCollectionId: c.darCollectionId,
      darCode:         c.darCode,
      projectTitle:    c.projectTitle,
      datasetCount:    c.datasetCount,
      status:          c.status,
      createDate:      c.createDate,
    })),
  }
}

// ---------------------------------------------------------------------------
// Private helpers
// ---------------------------------------------------------------------------

function formatDataUse(dataUse) {
  if (!dataUse) return null
  const parts = []
  if (dataUse.primary?.length)   parts.push(...dataUse.primary)
  if (dataUse.secondary?.length) parts.push(...dataUse.secondary)
  return parts.length ? parts.join(', ') : null
}

function summariseDataset(d) {
  if (!d) return null
  return {
    datasetId:          d.datasetId,
    datasetName:        d.datasetName,
    studyName:          d.study?.studyName,
    description:        d.study?.description,
    phenotype:          d.study?.phenotype,
    species:            d.study?.species,
    dataUse:            formatDataUse(d.dataUse),
    participantCount:   d.participantCount,
    accessManagement:   d.accessManagement,
    dacId:              d.dacId,
  }
}

// ---------------------------------------------------------------------------
// Dispatch table  (tool name → handler)
// ---------------------------------------------------------------------------

const TOOLS = {
  list_datasets:      (token, args) => listDatasets(token, args),
  get_dataset:        (token, args) => getDataset(token, args),
  list_dar_collections: (token)     => listDarCollections(token),
}

/**
 * Call the named tool and return its result.
 *
 * @param {string} toolName
 * @param {object} args
 * @param {string} token - OIDC access token from the session store
 * @returns {Promise<object>}
 */
async function callConsentTool(toolName, args, token) {
  const handler = TOOLS[toolName]
  if (!handler) throw new Error(`Unknown tool: "${toolName}"`)
  return handler(token, args)
}

module.exports = { callConsentTool }
