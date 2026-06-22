import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Config } from 'src/libs/config'
import { fetchGet } from 'src/libs/ajax/fetchAdapter'
import { TerraDataRepo } from 'src/libs/ajax/TerraDataRepo'
import { extractConsentError, extractError } from 'src/utils/ErrorUtils'
import type { EnumerateSnapshotModel, SnapshotSummaryModel } from 'src/types/tdrModel'

vi.mock('src/libs/config', () => ({
  Config: {
    getTdrApiUrl: vi.fn(),
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

const buildSnapshot = (id: string, name: string): SnapshotSummaryModel => ({
  id,
  name,
  cloudPlatform: 'gcp',
  resourceLocks: {},
  duosId: `DUOS-${id}`,
})

const buildEnumerateSnapshotModel = (overrides: Partial<EnumerateSnapshotModel> = {}): EnumerateSnapshotModel => ({
  total: 0,
  filteredTotal: 0,
  items: [],
  roleMap: {},
  errors: [],
  ...overrides,
})

describe('TerraDataRepo', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(Config.getTdrApiUrl).mockResolvedValue('https://tdr.example.org')
    vi.mocked(Config.authOpts).mockReturnValue(headers)
    vi.mocked(fetchGet).mockResolvedValue({ data: buildEnumerateSnapshotModel() })
  })

  describe('listSnapshotsByDatasetIds', () => {
    it('fetches snapshots and returns the merged EnumerateSnapshotModel', async () => {
      const snapshot = buildSnapshot('snap-1', 'Snapshot One')
      vi.mocked(fetchGet).mockResolvedValue({
        data: buildEnumerateSnapshotModel({ total: 1, filteredTotal: 1, items: [snapshot] }),
      })

      const result = await TerraDataRepo.listSnapshotsByDatasetIds(['DUOS-000001'])

      expect(Config.getTdrApiUrl).toHaveBeenCalledOnce()
      expect(Config.authOpts).toHaveBeenCalledOnce()
      expect(fetchGet).toHaveBeenCalledWith(
        'https://tdr.example.org/api/repository/v1/snapshots?limit=1000&duosDatasetIds=DUOS-000001',
        headers,
      )
      expect(result.items).toEqual([snapshot])
      expect(result.filteredTotal).toBe(1)
      expect(result.total).toBe(1)
    })

    it('merges results across multiple batch requests', async () => {
      const snapshotA = buildSnapshot('snap-a', 'Snapshot A')
      const snapshotB = buildSnapshot('snap-b', 'Snapshot B')

      vi.mocked(fetchGet)
        .mockResolvedValueOnce({
          data: buildEnumerateSnapshotModel({
            total: 5,
            filteredTotal: 3,
            items: [snapshotA],
            roleMap: { 'snap-a': ['reader'] },
          }),
        })
        .mockResolvedValueOnce({
          data: buildEnumerateSnapshotModel({
            total: 2,
            filteredTotal: 2,
            items: [snapshotB],
            roleMap: { 'snap-b': ['steward'] },
          }),
        })

      // Build 71 identifiers to force two batches (partition size = 70)
      const identifiers = Array.from({ length: 71 }, (_, i) => `DUOS-${String(i).padStart(6, '0')}`)
      const result = await TerraDataRepo.listSnapshotsByDatasetIds(identifiers)

      expect(fetchGet).toHaveBeenCalledTimes(2)
      // total is set (not accumulated) per response — the last write wins
      expect(result.total).toBe(2)
      expect(result.filteredTotal).toBe(5) // 3 + 2
      expect(result.items).toEqual([snapshotA, snapshotB])
      expect(result.roleMap).toEqual({ 'snap-a': ['reader'], 'snap-b': ['steward'] })
    })

    it('returns an empty model when given no identifiers', async () => {
      const result = await TerraDataRepo.listSnapshotsByDatasetIds([])

      expect(fetchGet).not.toHaveBeenCalled()
      expect(result).toEqual({ total: 0, filteredTotal: 0, items: [], roleMap: {}, errors: [] })
    })

    it('propagates fetch failures from the API call', async () => {
      vi.mocked(fetchGet).mockRejectedValueOnce(new Error('network failure'))

      await expect(TerraDataRepo.listSnapshotsByDatasetIds(['DUOS-000001'])).rejects.toThrow('network failure')
    })

    it('propagates ConsentError rejections so callers can extract a useful error', async () => {
      const consentError = { message: 'Snapshot not found for DUOS-000001', code: 404 }
      vi.mocked(fetchGet).mockRejectedValueOnce(consentError)

      const error = await TerraDataRepo.listSnapshotsByDatasetIds(['DUOS-000001']).then(
        () => {
          throw new Error('expected listSnapshotsByDatasetIds to reject')
        },
        e => e,
      )

      expect(extractConsentError(error)).toEqual(consentError)
      expect(extractError(error)).toBe('Snapshot not found for DUOS-000001')
    })
  })
})
