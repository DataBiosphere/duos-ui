import * as fp from 'lodash/fp';
import {Config} from './config';
import $ from 'jquery';

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
    return $.getJSON(gcs + '/' + env + '_' + bannerFileName, (data) => {
      return data;
    });
  },

  /**
   * Get the raw banner content from GCS
   * @returns {Promise<JSON>}
   */
  getActiveBanners: async () => {
    const banners = await NotificationService.getBanners();
    if (!fp.isEmpty(banners)) {
      return fp.find({active: true})(banners);
    }
    return undefined;
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
