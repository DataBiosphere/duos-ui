import { getApiUrl, getOntologyUrl } from '../ajax'
import { fetchGet } from 'src/libs/ajax/fetchAdapter'

interface SystemHealth {
  healthy: boolean
  message?: string
  error?: string | null
  details?: unknown
  time: number
  duration: number
  timestamp?: string
}

interface BaseStatus {
  ok: boolean
  degraded: boolean
  systems: Record<string, SystemHealth>
}

interface SendGridPage {
  id: string
  name: string
  url: string
  time_zone: string
  updated_at: string
}

interface SendGridStatus {
  indicator: string
  description: string
}

interface SendGridDetails {
  page: SendGridPage
  status: SendGridStatus
}

interface SamSystemStatus {
  ok: boolean
}

export interface SamDetails {
  ok: boolean
  systems: {
    GoogleGroups: SamSystemStatus
    GooglePubSub: SamSystemStatus
    GoogleIam: SamSystemStatus
    Database: SamSystemStatus
  }
}

export interface OntologyStatus extends BaseStatus {
  systems: {
    'deadlocks': SystemHealth
    'elastic-search': SystemHealth
    'google-cloud-storage': SystemHealth
  }
}

export interface ConsentStatus extends BaseStatus {
  systems: {
    'deadlocks': SystemHealth
    'elastic-search': SystemHealth
    'google-cloud-storage': SystemHealth
    'ontology': SystemHealth & { details: { ok: boolean, systems: OntologyStatus } }
    'postgresql': SystemHealth
    'sam': SystemHealth & { details: SamDetails }
    'sendgrid': SystemHealth & { details: SendGridDetails }
  }
}

export const ServiceStatus = {
  getConsentStatus: async (): Promise<ConsentStatus> => {
    const url = `${await getApiUrl()}/status`
    const result = await fetchGet(url)
    return result.data
  },

  getOntologyStatus: async (): Promise<OntologyStatus> => {
    const url = `${await getOntologyUrl()}/status`
    const result = await fetchGet(url)
    return result.data
  },

  isConsentHealthy: async (): Promise<boolean> => {
    const status = await ServiceStatus.getConsentStatus()
    return status.ok || false
  },

  isSamHealthy: async (): Promise<boolean> => {
    const status = await ServiceStatus.getConsentStatus()
    return status.systems.sam.details.ok || false
  },
}
