import * as fp from 'lodash/fp';
import { filter } from 'lodash';
import {Config} from './config';
import axios from 'axios';

// https://storage.googleapis.com/broad-duos-banners/{{env}}_notifications.json
const gcs = 'https://storage.googleapis.com/broad-duos-banners';
const bannerFileName = 'notifications.json';

export const NotificationService = {

  /**
   * Get the raw banner content from GCS
   * @returns {Promise<JSON>}
   */
  getBanners: async () => {
    const env = await Config.getEnv();
    const hash = await Config.getHash();
    const url =
      env === 'local'
        ? `/broad-duos-banner/${hash}_${bannerFileName}`
        : gcs + '/' + env + '_' + bannerFileName;
    const res = await axios.get(url, Config.authOpts());
    return res.data;
  },

  /**
   * Get the raw banner content from GCS
   * @returns {Promise<JSON>}
   */
  getActiveBanners: async () => {
    try {
      const banners = await NotificationService.getBanners();
      return filter(banners, {active: true});
    } catch (error) {
      return [];
    }
  },

  /**
   * Get an individual banner by its id, and active status == true
   * @param id
   * @returns {Promise<JSON>}
   */
  getBannerObjectById: async (id) => {
    const banners = await NotificationService.getBanners();
    if (!fp.isEmpty(banners)) {
      return fp.find({active: true, id: id})(banners);
    }
    return undefined;
  },

};
