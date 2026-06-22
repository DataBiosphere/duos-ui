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
   * @returns {Promise<JSON>}
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
   * Get the raw banner content from GCS
   * @returns {Promise<JSON>}
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
   * Get an individual banner by its id, and active status == true
   * @param id
   * @returns {Promise<JSON>}
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
