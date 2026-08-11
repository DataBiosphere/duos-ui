import { beforeEach, describe, expect, it, vi } from 'vitest'
import { SigningOfficial, SigningOfficialDashboardSummary } from 'src/libs/ajax/SigningOfficial'
import { Config } from 'src/libs/config'
import { fetchGet } from 'src/libs/ajax/fetchAdapter'

vi.mock('src/libs/ajax/fetchAdapter', () => ({ fetchGet: vi.fn() }))

describe('SigningOfficial ajax', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(Config, 'getApiUrl').mockResolvedValue('https://api.example.test')
  })

  it('gets and returns the dashboard summary', async () => {
    const summary: SigningOfficialDashboardSummary = {
      researcherStatus: { active: 1, inactive: 2 },
      darRequests: { total: 3, approved: 1, canceled: 1, inProcess: 1 },
      darApprovals: { total: 2, awaitingSoAction: 1 },
      dataSubmitters: { approved: 4 },
      institutionLibrary: { datasets: 5, studies: 6 },
      daaAssociations: { agreements: 7, researchersApproved: 8 },
    }
    vi.mocked(fetchGet).mockResolvedValue({ data: summary })

    await expect(SigningOfficial.getDashboardSummary()).resolves.toEqual(summary)
    expect(fetchGet).toHaveBeenCalledWith(
      'https://api.example.test/api/signing-official/dashboard-summary',
    )
  })
})
