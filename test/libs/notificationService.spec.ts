import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { dismissBanner, isBannerDismissed, isBannerVisible, NotificationService, onBannerDismissed, visibleBanner } from 'src/libs/notificationService'
import { Config } from 'src/libs/config'
import { fetchGet } from 'src/libs/ajax/fetchAdapter'
import { Storage } from 'src/libs/storage'

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

  afterEach(() => {
    vi.restoreAllMocks()
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

  // ── dismissals ─────────────────────────────────────────────────────────────

  const banner = { id: 'banner-1', active: true, message: 'Hello', level: 'info' } as const
  const SIGNED_IN = true
  const SIGNED_OUT = false

  describe('isBannerDismissed', () => {
    it('reads false when this user has not dismissed the banner', () => {
      vi.spyOn(Storage, 'getDismissedBanners').mockReturnValue([])

      expect(isBannerDismissed('banner-1', SIGNED_IN)).toBe(false)
    })

    it('reads true when this user has dismissed it', () => {
      vi.spyOn(Storage, 'getDismissedBanners').mockReturnValue(['banner-1'])

      expect(isBannerDismissed('banner-1', SIGNED_IN)).toBe(true)
    })

    // A BFF session expiry leaves CurrentUser in place, so the bucket has to follow live auth state.
    it('reads the anonymous bucket when signed out, not the stored profile', () => {
      vi.spyOn(Storage, 'getCurrentUser').mockReturnValue({ userId: 42 } as ReturnType<typeof Storage.getCurrentUser>)
      const getDismissedBanners = vi.spyOn(Storage, 'getDismissedBanners').mockReturnValue([])

      isBannerDismissed('banner-1', SIGNED_OUT)

      expect(getDismissedBanners).toHaveBeenCalledWith('anonymous')
    })

    it('reads the signed-in user\'s own bucket', () => {
      vi.spyOn(Storage, 'getCurrentUser').mockReturnValue({ userId: 42 } as ReturnType<typeof Storage.getCurrentUser>)
      const getDismissedBanners = vi.spyOn(Storage, 'getDismissedBanners').mockReturnValue([])

      isBannerDismissed('banner-1', SIGNED_IN)

      expect(getDismissedBanners).toHaveBeenCalledWith('42')
    })
  })

  describe('dismissBanner', () => {
    it('records the dismissal against this user', () => {
      vi.spyOn(Storage, 'getCurrentUser').mockReturnValue({ userId: 42 } as ReturnType<typeof Storage.getCurrentUser>)
      const addDismissedBanner = vi.spyOn(Storage, 'addDismissedBanner').mockReturnValue(undefined)

      dismissBanner('banner-1', SIGNED_IN)

      expect(addDismissedBanner).toHaveBeenCalledWith('42', 'banner-1')
    })

    it('records an anonymous dismissal separately', () => {
      vi.spyOn(Storage, 'getCurrentUser').mockReturnValue({ userId: 42 } as ReturnType<typeof Storage.getCurrentUser>)
      const addDismissedBanner = vi.spyOn(Storage, 'addDismissedBanner').mockReturnValue(undefined)

      dismissBanner('banner-1', SIGNED_OUT)

      expect(addDismissedBanner).toHaveBeenCalledWith('anonymous', 'banner-1')
    })
  })

  describe('isBannerVisible', () => {
    it('shows a banner the user has not dismissed', () => {
      vi.spyOn(Storage, 'getDismissedBanners').mockReturnValue([])

      expect(isBannerVisible(banner, SIGNED_IN)).toBe(true)
    })

    it('hides a banner the user has dismissed', () => {
      vi.spyOn(Storage, 'getDismissedBanners').mockReturnValue(['banner-1'])

      expect(isBannerVisible(banner, SIGNED_IN)).toBe(false)
    })

    // The feed is ops-authored JSON, so an entry can arrive without the id a dismissal is keyed on.
    it('hides an entry with no id, and a missing one', () => {
      vi.spyOn(Storage, 'getDismissedBanners').mockReturnValue([])

      expect(isBannerVisible({ active: true, message: 'No id' } as unknown as typeof banner, SIGNED_IN)).toBe(false)
      expect(isBannerVisible(null, SIGNED_IN)).toBe(false)
      expect(isBannerVisible(undefined, SIGNED_IN)).toBe(false)
    })
  })

  describe('visibleBanner', () => {
    it('reads back a banner the user can still see', () => {
      vi.spyOn(Storage, 'getDismissedBanners').mockReturnValue([])

      expect(visibleBanner(banner, SIGNED_IN)).toBe(banner)
    })

    it('reads null for a dismissed banner', () => {
      vi.spyOn(Storage, 'getDismissedBanners').mockReturnValue(['banner-1'])

      expect(visibleBanner(banner, SIGNED_IN)).toBeNull()
    })
  })

  describe('onBannerDismissed', () => {
    beforeEach(() => {
      vi.spyOn(Storage, 'addDismissedBanner').mockReturnValue(undefined)
    })

    it('tells subscribers which banner went, so every copy on screen can drop it', () => {
      const listener = vi.fn()
      const unsubscribe = onBannerDismissed(listener)

      dismissBanner('banner-1', true)

      expect(listener).toHaveBeenCalledExactlyOnceWith('banner-1')
      unsubscribe()
    })

    it('reaches every subscriber', () => {
      const header = vi.fn()
      const page = vi.fn()
      const unsubscribes = [onBannerDismissed(header), onBannerDismissed(page)]

      dismissBanner('banner-2', true)

      expect(header).toHaveBeenCalledWith('banner-2')
      expect(page).toHaveBeenCalledWith('banner-2')
      unsubscribes.forEach(unsubscribe => unsubscribe())
    })

    it('stops telling a subscriber once it unsubscribes', () => {
      const listener = vi.fn()
      onBannerDismissed(listener)()

      dismissBanner('banner-3', true)

      expect(listener).not.toHaveBeenCalled()
    })
  })
})
