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
 * Record that the current user (or anonymous browser) has dismissed this banner
 * @param {string} id - the banner id to dismiss
 * @returns {void}
 */
export const dismissBanner = (id: string): void => {
  Storage.setCurrentUserSettings<boolean>(dismissedBannerKey(id), true)
}

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
