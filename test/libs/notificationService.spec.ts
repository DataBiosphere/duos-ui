import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { dismissBanner, isBannerDismissed, isBannerVisible, NotificationService, onBannerDismissed, visibleBanner } from 'src/libs/notificationService'
import { Config } from 'src/libs/config'
import { fetchGet } from 'src/libs/ajax/fetchAdapter'
import { Storage } from 'src/libs/storage'

vi.mock('src/libs/config', () => ({
  Config: {
    getBannersUrl: vi.fn(),
  },
}))

const bannersUrl = 'https://storage.googleapis.com/duos-banners-dev/dev_notifications.json'

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

  afterEach(() => {
    vi.restoreAllMocks()
  })

  // ── getBanners ─────────────────────────────────────────────────────────────

  describe('getBanners', () => {
    it('fetches the feed config.json names for this environment', async () => {
      vi.mocked(Config.getBannersUrl).mockResolvedValue(bannersUrl)
      vi.mocked(fetchGet).mockResolvedValue({ data: banners })

      await NotificationService.getBanners()

      expect(fetchGet).toHaveBeenCalledExactlyOnceWith(bannersUrl)
    })

    it('has no banners, and fetches nothing, when no feed is configured', async () => {
      vi.mocked(Config.getBannersUrl).mockResolvedValue('')

      expect(await NotificationService.getBanners()).toEqual([])
      expect(fetchGet).not.toHaveBeenCalled()
    })

    it('returns the data array from the response', async () => {
      vi.mocked(Config.getBannersUrl).mockResolvedValue(bannersUrl)
      vi.mocked(fetchGet).mockResolvedValue({ data: banners })

      const result = await NotificationService.getBanners()

      expect(result).toBe(banners)
    })
  })

  // ── getActiveBanners ───────────────────────────────────────────────────────

  describe('getActiveBanners', () => {
    it('returns only banners where active is true', async () => {
      vi.mocked(Config.getBannersUrl).mockResolvedValue(bannersUrl)
      vi.mocked(fetchGet).mockResolvedValue({ data: banners })

      const result = await NotificationService.getActiveBanners()

      expect(result).toHaveLength(2)
      expect(result.every(b => b.active)).toBe(true)
    })

    it('returns an empty array when the fetch throws', async () => {
      vi.mocked(Config.getBannersUrl).mockResolvedValue(bannersUrl)
      vi.mocked(fetchGet).mockRejectedValue(new Error('network error'))

      const result = await NotificationService.getActiveBanners()

      expect(result).toEqual([])
    })

    it('returns an empty array when no banners are active', async () => {
      vi.mocked(Config.getBannersUrl).mockResolvedValue(bannersUrl)
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
      vi.mocked(Config.getBannersUrl).mockResolvedValue(bannersUrl)
      vi.mocked(fetchGet).mockResolvedValue({ data: banners })

      const result = await NotificationService.getBannerObjectById('banner-1')

      expect(result).toEqual({ id: 'banner-1', active: true, message: 'Hello' })
    })

    it('returns undefined when the id matches an inactive banner', async () => {
      vi.mocked(Config.getBannersUrl).mockResolvedValue(bannersUrl)
      vi.mocked(fetchGet).mockResolvedValue({ data: banners })

      const result = await NotificationService.getBannerObjectById('banner-2')

      expect(result).toBeUndefined()
    })

    it('returns undefined when no banner matches the id', async () => {
      vi.mocked(Config.getBannersUrl).mockResolvedValue(bannersUrl)
      vi.mocked(fetchGet).mockResolvedValue({ data: banners })

      const result = await NotificationService.getBannerObjectById('nonexistent')

      expect(result).toBeUndefined()
    })

    it('returns null when the fetch throws', async () => {
      vi.mocked(Config.getBannersUrl).mockResolvedValue(bannersUrl)
      vi.mocked(fetchGet).mockRejectedValue(new Error('network error'))

      const result = await NotificationService.getBannerObjectById('banner-1')

      expect(result).toBeNull()
    })

    it('returns undefined early when banners list is empty', async () => {
      vi.mocked(Config.getBannersUrl).mockResolvedValue(bannersUrl)
      vi.mocked(fetchGet).mockResolvedValue({ data: [] })

      const result = await NotificationService.getBannerObjectById('banner-1')

      expect(result).toBeUndefined()
    })
  })

  // ── isBannerDismissed / dismissBanner ──────────────────────────────────────

  const banner = { id: 'banner-1', active: true, message: 'Hello', level: 'info' } as const

  describe('isBannerDismissed', () => {
    it('returns false when the banner has not been dismissed', () => {
      vi.spyOn(Storage, 'getCurrentUserSettings').mockReturnValue(undefined)

      expect(isBannerDismissed('banner-1')).toBe(false)
    })

    it('returns true when the banner has been dismissed', () => {
      vi.spyOn(Storage, 'getCurrentUserSettings').mockImplementation(
        (key: string) => key === 'dismissedBanner_banner-1',
      )

      expect(isBannerDismissed('banner-1')).toBe(true)
    })
  })

  describe('dismissBanner', () => {
    it('persists the dismissal under a banner-specific key', () => {
      const setCurrentUserSettings = vi.spyOn(Storage, 'setCurrentUserSettings').mockReturnValue(undefined)

      dismissBanner('banner-1')

      expect(setCurrentUserSettings).toHaveBeenCalledWith('dismissedBanner_banner-1', true)
    })
  })

  describe('isBannerVisible', () => {
    it('shows a banner the user has not dismissed', () => {
      vi.spyOn(Storage, 'getCurrentUserSettings').mockReturnValue(undefined)

      expect(isBannerVisible(banner)).toBe(true)
    })

    it('hides a banner the user has dismissed', () => {
      vi.spyOn(Storage, 'getCurrentUserSettings').mockReturnValue(true)

      expect(isBannerVisible(banner)).toBe(false)
    })

    // The feed is ops-authored JSON, so an entry can arrive without the id a dismissal is keyed on.
    it('hides an entry with no id, and a missing one', () => {
      vi.spyOn(Storage, 'getCurrentUserSettings').mockReturnValue(undefined)

      expect(isBannerVisible({ active: true, message: 'No id' } as unknown as typeof banner)).toBe(false)
      expect(isBannerVisible(null)).toBe(false)
      expect(isBannerVisible(undefined)).toBe(false)
    })
  })

  describe('visibleBanner', () => {
    it('reads back a banner the user can still see', () => {
      vi.spyOn(Storage, 'getCurrentUserSettings').mockReturnValue(undefined)

      expect(visibleBanner(banner)).toBe(banner)
    })

    it('reads null for a dismissed banner', () => {
      vi.spyOn(Storage, 'getCurrentUserSettings').mockReturnValue(true)

      expect(visibleBanner(banner)).toBeNull()
    })
  })

  describe('onBannerDismissed', () => {
    beforeEach(() => {
      vi.spyOn(Storage, 'setCurrentUserSettings').mockReturnValue(undefined)
    })

    it('tells subscribers which banner went, so every copy on screen can drop it', () => {
      const listener = vi.fn()
      const unsubscribe = onBannerDismissed(listener)

      dismissBanner('banner-1')

      expect(listener).toHaveBeenCalledExactlyOnceWith('banner-1')
      unsubscribe()
    })

    it('reaches every subscriber', () => {
      const header = vi.fn()
      const page = vi.fn()
      const unsubscribes = [onBannerDismissed(header), onBannerDismissed(page)]

      dismissBanner('banner-2')

      expect(header).toHaveBeenCalledWith('banner-2')
      expect(page).toHaveBeenCalledWith('banner-2')
      unsubscribes.forEach(unsubscribe => unsubscribe())
    })

    it('stops telling a subscriber once it unsubscribes', () => {
      const listener = vi.fn()
      onBannerDismissed(listener)()

      dismissBanner('banner-3')

      expect(listener).not.toHaveBeenCalled()
    })
  })
})
