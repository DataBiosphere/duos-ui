import {filter, find, flow, getOr, isEmpty, isNil, map} from 'lodash/fp';
import {DataUseTranslation} from '../libs/dataUseTranslation';
import {Storage} from '../libs/storage';
import {USER_ROLES} from '../libs/utils';
import {DAC} from '../libs/ajax';

export const DatasetService = {

  /**
   * Async utility to find all datasets a DAC Chairperson
   * has access to and populate their data use codes and translations
   * @returns {Promise<Awaited<dataset>[]>}
   */
  populateDacDatasets: async () => {
    // Find all Chairperson DAC Ids for the user
    const user = Storage.getCurrentUser();
    const dacIds = flow(
      filter(r => r.name === USER_ROLES.chairperson),
      map('dacId'),
      filter(id => !isNil(id))
    )(user.roles);
    // find all datasets for all DACs the user has access to.
    const dacDatasets = (await Promise.all(dacIds.map(id => DAC.datasets(id)))).flat();
    // Enrich datasets with data use translations
    return await Promise.all(map(async (d) => {
      const {codeList, translations} = await DatasetService.getDataUseTranslations(d);
      return Object.assign({}, d, {codeList: codeList, translations: translations});
    })(dacDatasets));
  },

  findDatasetPropertyValue: (dataset, propName, defaultVal) => {
    const defaultValue = isNil(defaultVal) ? '' : defaultVal;
    return getOr(defaultValue)('propertyValue')(find({propertyName: propName})(dataset.properties));
  },

  findDatasetPropertyValueList: (dataset, propName, defaultVal) => {
    const defaultValue = isNil(defaultVal) ? [] : defaultVal;
    return getOr(defaultValue)('propertyValue')(find({propertyName: propName})(dataset.properties));
  },

  getDataUseTranslations: async (dataset) => {
    if (!dataset.dataUse || isEmpty(dataset.dataUse)) {
      return {
        codeList: '- -',
        translations: []
      };
    } else {
      const translations = await DataUseTranslation.translateDataUseRestrictions(dataset.dataUse);
      const codes = map(t => t.alternateLabel || t.code)(translations);
      return {
        codeList: codes.join(', '),
        translations: translations
      };
    }
  }

};
