import { filter, find, isEmpty } from 'src/utils/NodashUtil'
import { Config } from './config'
import { fetchGet } from 'src/libs/ajax/fetchAdapter'
import { Storage } from 'src/libs/storage'

// https://storage.googleapis.com/broad-duos-banners/{{env}}_notifications.json
const gcs = 'https://storage.googleapis.com/broad-duos-banners'
const bannerFileName = 'notifications.json'

export interface Banner {
  id: string
  active: boolean
  message: string
  level: 'info' | 'warning' | 'danger' | 'success'
}

/**
 * Which set of dismissals applies. Keyed off live auth state rather than the stored profile: a BFF
 * session expiry leaves CurrentUser in place, and an anonymous browser must not inherit the
 * previous user's dismissals.
 */
const ANONYMOUS_BUCKET = 'anonymous'

const dismissalBucket = (isLogged: boolean): string =>
  isLogged ? String(Storage.getCurrentUser().userId) : ANONYMOUS_BUCKET

export const isBannerDismissed = (id: string, isLogged: boolean): boolean =>
  Storage.getDismissedBanners(dismissalBucket(isLogged)).includes(id)

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

/** Record that this user (or the anonymous browser) has dismissed this banner. */
export const dismissBanner = (id: string, isLogged: boolean): void => {
  Storage.addDismissedBanner(dismissalBucket(isLogged), id)
  dismissalListeners.forEach(listener => listener(id))
}

/** Shown only when the banner can be identified and this user has not dismissed it. */
export const isBannerVisible = (banner: Banner | null | undefined, isLogged: boolean): banner is Banner =>
  !!banner?.id && !isBannerDismissed(banner.id, isLogged)

export const visibleBanner = (banner: Banner | null | undefined, isLogged: boolean): Banner | null =>
  isBannerVisible(banner, isLogged) ? banner : null

export const NotificationService = {

  /**
   * Get the raw banner content from GCS
   * @returns {Promise<Banner[]>}
   */
  getBanners: async (): Promise<Banner[]> => {
    const env = await Config.getEnv()
    const url = env === 'local'
      ? `${gcs}/dev_${bannerFileName}`
      : `${gcs}/${env}_${bannerFileName}`
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
