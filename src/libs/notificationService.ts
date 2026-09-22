import { filter, find, isEmpty } from 'src/utils/NodashUtil'
import { Config } from './config'
import { fetchGet } from 'src/libs/ajax/fetchAdapter'
import { Storage } from 'src/libs/storage'

export interface Banner {
  id: string
  active: boolean
  message: string
  level: 'info' | 'warning' | 'danger' | 'success'
}

// Keyed by id alone: new banner text needs a new id. See docs/notification-banners.md.
const dismissedBannerKey = (id: string): string => `dismissedBanner_${id}`

/**
 * Has the current user (or anonymous browser) dismissed this banner?
 * @param {string} id - the banner id to check
 * @returns {boolean}
 */
export const isBannerDismissed = (id: string): boolean => {
  return Storage.getCurrentUserSettings<boolean>(dismissedBannerKey(id)) ?? false
}

/**
 * The same banner can render in the header and inline on a page at once, so a dismissal has to
 * reach every copy - localStorage alone only takes effect on the next mount.
 */
const dismissalListeners = new Set<(id: string) => void>()

export const onBannerDismissed = (listener: (id: string) => void): (() => void) => {
  dismissalListeners.add(listener)
  return () => {
    dismissalListeners.delete(listener)
  }
}

/** Record that the current user (or anonymous browser) has dismissed this banner. */
export const dismissBanner = (id: string): void => {
  Storage.setCurrentUserSettings<boolean>(dismissedBannerKey(id), true)
  dismissalListeners.forEach(listener => listener(id))
}

/** Shown only when the banner can be identified and this user has not dismissed it. */
export const isBannerVisible = (banner: Banner | null | undefined): banner is Banner =>
  !!banner?.id && !isBannerDismissed(banner.id)

export const visibleBanner = (banner: Banner | null | undefined): Banner | null =>
  isBannerVisible(banner) ? banner : null

export const NotificationService = {

  /**
   * Get the raw banner content from the environment's public GCS object, `bannersUrl` in
   * config.json. An environment with no feed configured has no banners.
   * @returns {Promise<Banner[]>}
   */
  getBanners: async (): Promise<Banner[]> => {
    const url = await Config.getBannersUrl()
    if (!url) return []
    const res = await fetchGet<Banner[]>(url)
    return res.data
  },

  /**
   * Get only the active banners from GCS
   * @returns {Promise<Banner[]>}
   */
  getActiveBanners: async (): Promise<Banner[]> => {
    try {
      const banners = await NotificationService.getBanners()
      return filter(banners, { active: true })
    }
    catch {
      return []
    }
  },

  /**
   * Get an individual active banner by its id
   * @param {string} id - the banner id to look up
   * @returns {Promise<Banner | undefined | null>}
   */
  getBannerObjectById: async (id: string): Promise<Banner | undefined | null> => {
    try {
      const banners = await NotificationService.getBanners()
      if (!isEmpty(banners)) {
        return find(banners, { active: true, id })
      }
    }
    catch {
      return null
    }
  },

}
