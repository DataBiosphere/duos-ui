import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import Status from 'src/pages/Status'
import { ConsentStatus, ServiceStatus } from 'src/libs/ajax/ServiceStatus'

vi.mock('src/libs/ajax/ServiceStatus', () => ({
  ServiceStatus: {
    getConsentStatus: vi.fn(),
  },
}))

const healthyConsentStatus = {
  ok: true,
  degraded: false,
  systems: {
    ecm: {
      healthy: true,
      time: 1,
      duration: 1,
      details: {
        ok: true,
        systems: {
          postgres: true,
        },
      },
    },
    sam: {
      healthy: true,
      time: 1,
      duration: 1,
      details: {
        ok: true,
        systems: {
          GoogleGroups: { ok: true },
          GooglePubSub: { ok: true },
          GoogleIam: { ok: true },
          Database: { ok: true },
        },
      },
    },
  },
} as ConsentStatus

describe('Status', () => {
  beforeEach(() => {
    vi.mocked(ServiceStatus.getConsentStatus).mockResolvedValue(healthyConsentStatus)
  })

  it('renders Consent, ECM, and Sam as healthy', async () => {
    render(<Status />)

    await waitFor(() => expect(ServiceStatus.getConsentStatus).toHaveBeenCalledOnce())
    for (const service of ['Consent', 'ECM', 'Sam']) {
      const link = screen.getByRole('link', { name: service })
      expect(link.parentElement).toHaveTextContent(service)
      expect(link.parentElement?.querySelector('[data-testid="status-healthy"]')).toBeInTheDocument()
    }
    expect(screen.getByRole('heading', { name: 'ECM Status' })).toBeInTheDocument()
  })

  it('renders Consent, ECM, and Sam as unhealthy', async () => {
    vi.mocked(ServiceStatus.getConsentStatus).mockResolvedValue({
      ...healthyConsentStatus,
      ok: false,
      degraded: true,
      systems: {
        ...healthyConsentStatus.systems,
        ecm: {
          ...healthyConsentStatus.systems.ecm,
          healthy: false,
          details: {
            ...healthyConsentStatus.systems.ecm.details,
            ok: false,
          },
        },
        sam: {
          ...healthyConsentStatus.systems.sam,
          healthy: false,
          details: {
            ...healthyConsentStatus.systems.sam.details,
            ok: false,
          },
        },
      },
    })

    render(<Status />)

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'ECM Status' }).nextElementSibling).toHaveTextContent('"ok": false')
    })
    for (const service of ['Consent', 'ECM', 'Sam']) {
      const link = screen.getByRole('link', { name: service })
      expect(link.parentElement?.querySelector('[data-testid="status-unhealthy"]')).toBeInTheDocument()
    }
  })
})
