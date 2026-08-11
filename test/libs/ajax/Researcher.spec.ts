import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Researcher, ResearcherDashboardSummary } from 'src/libs/ajax/Researcher'
import { Config } from 'src/libs/config'
import { fetchGet } from 'src/libs/ajax/fetchAdapter'

vi.mock('src/libs/ajax/fetchAdapter', () => ({ fetchGet: vi.fn() }))

describe('Researcher ajax', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(Config, 'getApiUrl').mockResolvedValue('https://api.example.test')
  })

  it('gets and returns the dashboard summary', async () => {
    const summary: ResearcherDashboardSummary = {
      dataLibrary: { studies: 1, datasets: 2, models: 3, workspaces: 4 },
      darRequests: { total: 5, approved: 2, canceled: 1, inProcess: 2 },
      datasetApprovals: { active: 6, expiringSoon: 2, expired: 3 },
      dataSubmissions: { total: 7 },
    }
    vi.mocked(fetchGet).mockResolvedValue({ data: summary })

    await expect(Researcher.getDashboardSummary()).resolves.toEqual(summary)
    expect(fetchGet).toHaveBeenCalledWith(
      'https://api.example.test/api/researcher/dashboard-summary',
    )
  })
})
