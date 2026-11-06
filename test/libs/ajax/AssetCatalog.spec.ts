import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Config } from 'src/libs/config'
import { fetchGet } from 'src/libs/ajax/fetchAdapter'
import { AssetCatalog } from 'src/libs/ajax/AssetCatalog'
import { AssetLookup } from 'src/types/library'

vi.mock('src/libs/config', () => ({
  Config: {
    getApiUrl: vi.fn(),
    authOpts: vi.fn(),
  },
}))

vi.mock('src/libs/ajax/fetchAdapter', () => ({
  fetchGet: vi.fn(),
}))

const headers = {
  headers: {
    'Authorization': 'Bearer token',
    'Accept': 'application/json',
    'X-App-ID': 'DUOS',
  },
}

describe('AssetCatalog.lookup', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(Config.getApiUrl).mockResolvedValue('https://duos.example.org')
    vi.mocked(Config.authOpts).mockReturnValue(headers)
  })

  it('asks the asset catalog, signed in, and returns what it names', async () => {
    const found: AssetLookup = { identifier: 'DUOS-M-000045', type: 'MODEL', status: 'LIVE', listed: true, assetId: 45, studyId: 7 }
    vi.mocked(fetchGet).mockResolvedValue({ data: found })

    await expect(AssetCatalog.lookup('DUOS-M-000045')).resolves.toEqual(found)
    expect(fetchGet).toHaveBeenCalledWith('https://duos.example.org/api/asset-catalog/DUOS-M-000045', headers)
  })

  it('encodes the identifier in the path', async () => {
    vi.mocked(fetchGet).mockResolvedValue({ data: {} })

    await AssetCatalog.lookup('DUOS-M-1/../x?y')

    expect(fetchGet).toHaveBeenCalledWith('https://duos.example.org/api/asset-catalog/DUOS-M-1%2F..%2Fx%3Fy', headers)
  })

  it('rejects as the request does, so a 404 reaches the caller', async () => {
    const notFound = Object.assign(new Error('Request failed with status 404'), { response: { status: 404, data: {} } })
    vi.mocked(fetchGet).mockRejectedValue(notFound)

    await expect(AssetCatalog.lookup('DUOS-M-999999')).rejects.toBe(notFound)
  })
})
