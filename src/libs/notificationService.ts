import { filter, find, isEmpty } from 'src/utils/NodashUtil'
import { Config } from './config'
import { fetchGet } from 'src/libs/ajax/fetchAdapter'

// https://storage.googleapis.com/broad-duos-banners/{{env}}_notifications.json
const gcs = 'https://storage.googleapis.com/broad-duos-banners'
const bannerFileName = 'notifications.json'

export interface Banner {
  id: string
  active: boolean
  message: string
  level: 'info' | 'warning' | 'danger' | 'success'
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
