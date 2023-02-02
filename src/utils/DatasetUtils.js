import {find, getOr, isEmpty, isNil, map} from 'lodash/fp';
import {DataUseTranslation} from '../libs/dataUseTranslation';

export const findDatasetPropertyValue = (dataset, propName, defaultVal) => {
  const defaultValue = isNil(defaultVal) ? '' : defaultVal;
  return getOr(defaultValue)('propertyValue')(find({propertyName: propName})(dataset.properties));
};

export const findDatasetPropertyValueList = (dataset, propName, defaultVal) => {
  const defaultValue = isNil(defaultVal) ? [] : defaultVal;
  return getOr(defaultValue)('propertyValue')(find({propertyName: propName})(dataset.properties));
};

// TODO: Get rid of this, it mutates the dataset
export const getDataUseCodes = async (dataset) => {
  if (isNil(dataset.codeList)) {
    if (!dataset.dataUse || isEmpty(dataset.dataUse)) {
      dataset.codeList = 'None';
    } else {
      const translations = await DataUseTranslation.translateDataUseRestrictions(dataset.dataUse);
      const codes = [];
      translations.map((restriction) => {
        codes.push(restriction.alternateLabel || restriction.code);
      });
      dataset.codeList = codes.join(', ');
    }
  }
};

export const getDataUseTranslations = async (dataset) => {
  if (!dataset.dataUse || isEmpty(dataset.dataUse)) {
    return {
      codeList: '- -',
      translations: []
    };
  } else {
    const translations = await DataUseTranslation.translateDataUseRestrictions(dataset.dataUse);
    const codes = map( t => t.alternateLabel || t.code)(translations);
    return {
      codeList: codes.join(', '),
      translations: translations
    };
  }
};

