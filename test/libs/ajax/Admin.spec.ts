import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Admin, AdminDashboardSummary } from 'src/libs/ajax/Admin'
import { Config } from 'src/libs/config'
import { fetchGet } from 'src/libs/ajax/fetchAdapter'

vi.mock('src/libs/ajax/fetchAdapter', () => ({ fetchGet: vi.fn() }))

describe('Admin ajax', () => {
  const authOptions = {
    headers: {
      'Authorization': 'Bearer token',
      'Accept': 'application/json',
      'X-App-ID': 'DUOS',
    },
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(Config, 'getApiUrl').mockResolvedValue('https://api.example.test')
    vi.spyOn(Config, 'authOpts').mockReturnValue(authOptions)
  })

  it('gets and returns the dashboard summary', async () => {
    const summary = { darRequests: { total: 3, approved: 1, canceled: 1, inProcess: 1 } } as AdminDashboardSummary
    vi.mocked(fetchGet).mockResolvedValue({ data: summary })

    await expect(Admin.getDashboardSummary()).resolves.toEqual(summary)
    expect(fetchGet).toHaveBeenCalledWith('https://api.example.test/api/admin/dashboard-summary', authOptions)
  })
})
