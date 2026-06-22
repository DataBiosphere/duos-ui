import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NotificationService } from 'src/libs/notificationService'
import { Config } from 'src/libs/config'
import { fetchGet } from 'src/libs/ajax/fetchAdapter'

vi.mock('src/libs/config', () => ({
  Config: {
    getEnv: vi.fn(),
  },
}))

vi.mock('src/libs/ajax/fetchAdapter', () => ({
  fetchGet: vi.fn(),
}))

const banners = [
  { id: 'banner-1', active: true, message: 'Hello' },
  { id: 'banner-2', active: false, message: 'Hidden' },
  { id: 'banner-3', active: true, message: 'World' },
]

describe('NotificationService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ── getBanners ─────────────────────────────────────────────────────────────

  describe('getBanners', () => {
    it('fetches from the dev bucket when env is local', async () => {
      vi.mocked(Config.getEnv).mockResolvedValue('local')
      vi.mocked(fetchGet).mockResolvedValue({ data: banners })

      await NotificationService.getBanners()

      expect(fetchGet).toHaveBeenCalledWith(
        'https://storage.googleapis.com/broad-duos-banners/dev_notifications.json',
      )
    })

    it('fetches from the env-prefixed bucket for non-local envs', async () => {
      vi.mocked(Config.getEnv).mockResolvedValue('prod')
      vi.mocked(fetchGet).mockResolvedValue({ data: banners })

      await NotificationService.getBanners()

      expect(fetchGet).toHaveBeenCalledWith(
        'https://storage.googleapis.com/broad-duos-banners/prod_notifications.json',
      )
    })

    it('returns the data array from the response', async () => {
      vi.mocked(Config.getEnv).mockResolvedValue('dev')
      vi.mocked(fetchGet).mockResolvedValue({ data: banners })

      const result = await NotificationService.getBanners()

      expect(result).toBe(banners)
    })
  })

  // ── getActiveBanners ───────────────────────────────────────────────────────

  describe('getActiveBanners', () => {
    it('returns only banners where active is true', async () => {
      vi.mocked(Config.getEnv).mockResolvedValue('dev')
      vi.mocked(fetchGet).mockResolvedValue({ data: banners })

      const result = await NotificationService.getActiveBanners()

      expect(result).toHaveLength(2)
      expect(result.every(b => b.active)).toBe(true)
    })

    it('returns an empty array when the fetch throws', async () => {
      vi.mocked(Config.getEnv).mockResolvedValue('dev')
      vi.mocked(fetchGet).mockRejectedValue(new Error('network error'))

      const result = await NotificationService.getActiveBanners()

      expect(result).toEqual([])
    })

    it('returns an empty array when no banners are active', async () => {
      vi.mocked(Config.getEnv).mockResolvedValue('dev')
      vi.mocked(fetchGet).mockResolvedValue({
        data: [{ id: 'x', active: false }],
      })

      const result = await NotificationService.getActiveBanners()

      expect(result).toHaveLength(0)
    })
  })

  // ── getBannerObjectById ────────────────────────────────────────────────────

  describe('getBannerObjectById', () => {
    it('returns the matching active banner by id', async () => {
      vi.mocked(Config.getEnv).mockResolvedValue('dev')
      vi.mocked(fetchGet).mockResolvedValue({ data: banners })

      const result = await NotificationService.getBannerObjectById('banner-1')

      expect(result).toEqual({ id: 'banner-1', active: true, message: 'Hello' })
    })

    it('returns undefined when the id matches an inactive banner', async () => {
      vi.mocked(Config.getEnv).mockResolvedValue('dev')
      vi.mocked(fetchGet).mockResolvedValue({ data: banners })

      const result = await NotificationService.getBannerObjectById('banner-2')

      expect(result).toBeUndefined()
    })

    it('returns undefined when no banner matches the id', async () => {
      vi.mocked(Config.getEnv).mockResolvedValue('dev')
      vi.mocked(fetchGet).mockResolvedValue({ data: banners })

      const result = await NotificationService.getBannerObjectById('nonexistent')

      expect(result).toBeUndefined()
    })

    it('returns null when the fetch throws', async () => {
      vi.mocked(Config.getEnv).mockResolvedValue('dev')
      vi.mocked(fetchGet).mockRejectedValue(new Error('network error'))

      const result = await NotificationService.getBannerObjectById('banner-1')

      expect(result).toBeNull()
    })

    it('returns undefined early when banners list is empty', async () => {
      vi.mocked(Config.getEnv).mockResolvedValue('dev')
      vi.mocked(fetchGet).mockResolvedValue({ data: [] })

      const result = await NotificationService.getBannerObjectById('banner-1')

      expect(result).toBeUndefined()
    })
  })
})
