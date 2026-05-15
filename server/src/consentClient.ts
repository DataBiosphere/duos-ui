import { getConfig } from './config.js'

const CONSENT_TIMEOUT_MS = 20_000

function getApiUrl(): string {
  const url = getConfig()['apiUrl']
  if (typeof url !== 'string' || !url) throw new Error('apiUrl is not set in config.json')
  return url
}

async function consentFetch(url: string, token: string, options: RequestInit = {}): Promise<unknown> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), CONSENT_TIMEOUT_MS)
  try {
    const res = await fetch(url, {
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
  }
  finally {
    clearTimeout(timer)
  }
}

export async function listDatasets(token: string, args: { query?: string } = {}): Promise<unknown> {
  const url = `${getApiUrl()}/api/dataset/search/index/v2`
  const must: unknown[] = [{ exists: { field: 'study' } }]
  if (args.query?.trim()) {
    must.push({
      multi_match: {
        query: args.query.trim(),
        type: 'phrase_prefix',
        fields: ['study.studyName', 'datasetName', 'study.description', 'study.phenotype', 'study.species'],
      },
    })
  }
  const raw = await consentFetch(url, token, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: { bool: { must } },
      size: 25,
      _source: ['datasetId', 'datasetName', 'study.studyName', 'study.description', 'dataUse.primary', 'dataUse.secondary', 'dacId'],
    }),
  }) as { hits?: { hits?: { _source?: Record<string, unknown> }[], total?: { value?: number } } }
  const hits = raw.hits?.hits ?? []
  const datasets = hits.map((h) => {
    const s = h._source ?? {}
    const study = s['study'] as Record<string, unknown> | undefined
    const dataUse = s['dataUse'] as { primary?: string[], secondary?: string[] } | undefined
    return {
      datasetId: s['datasetId'],
      datasetName: s['datasetName'],
      studyName: study?.['studyName'],
      description: study?.['description'],
      dataUse: formatDataUse(dataUse),
      dacId: s['dacId'],
    }
  })
  return { total: raw.hits?.total?.value ?? datasets.length, datasets }
}

export async function getDataset(token: string, args: { datasetId?: number }): Promise<unknown> {
  if (!args.datasetId) throw new Error('"datasetId" argument is required')
  const raw = await consentFetch(`${getApiUrl()}/api/dataset/v2/${args.datasetId}`, token) as Record<string, unknown>
  return summariseDataset(raw)
}

export async function listDarCollections(token: string): Promise<unknown> {
  const raw = await consentFetch(`${getApiUrl()}/api/collections/role/Researcher/summary`, token)
  const items = Array.isArray(raw) ? raw as Record<string, unknown>[] : []
  return {
    total: items.length,
    collections: items.map(c => ({
      darCollectionId: c['darCollectionId'],
      darCode: c['darCode'],
      projectTitle: c['projectTitle'],
      datasetCount: c['datasetCount'],
      status: c['status'],
      createDate: c['createDate'],
    })),
  }
}

function formatDataUse(dataUse: { primary?: string[], secondary?: string[] } | undefined): string | null {
  if (!dataUse) return null
  const parts = [...(dataUse.primary ?? []), ...(dataUse.secondary ?? [])]
  return parts.length ? parts.join(', ') : null
}

function summariseDataset(d: Record<string, unknown>): unknown {
  if (!d) return null
  const study = d['study'] as Record<string, unknown> | undefined
  const dataUse = d['dataUse'] as { primary?: string[], secondary?: string[] } | undefined
  return {
    datasetId: d['datasetId'],
    datasetName: d['datasetName'],
    studyName: study?.['studyName'],
    description: study?.['description'],
    phenotype: study?.['phenotype'],
    species: study?.['species'],
    dataUse: formatDataUse(dataUse),
    participantCount: d['participantCount'],
    accessManagement: d['accessManagement'],
    dacId: d['dacId'],
  }
}

const TOOLS: Record<string, (token: string, args: Record<string, unknown>) => Promise<unknown>> = {
  list_datasets: (token, args) => listDatasets(token, args as { query?: string }),
  get_dataset: (token, args) => getDataset(token, args as { datasetId?: number }),
  list_dar_collections: token => listDarCollections(token),
}

export async function callConsentTool(toolName: string, args: Record<string, unknown>, token: string): Promise<unknown> {
  const handler = TOOLS[toolName]
  if (!handler) throw new Error(`Unknown tool: "${toolName}"`)
  return handler(token, args)
}
