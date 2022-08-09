import * as fp from 'lodash/fp';
import { filter } from 'lodash';
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
    const hash = await Config.getHash();
    const url =
      env === 'local'
        ? `/broad-duos-banner/${hash}_${bannerFileName}`
        : gcs + '/' + env + '_' + bannerFileName;
    return $.getJSON(url, (data) => {
      return data;
    });
  },

  /**
   * Get the raw banner content from GCS
   * @returns {Promise<JSON>}
   */
  getActiveBanners: async () => {
    const banners = await NotificationService.getBanners();
    return filter(banners, {active: true});
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
