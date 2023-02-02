import {find, getOr, isNil} from 'lodash/fp';
import {isEmpty} from 'lodash/fp';
import {DataUseTranslation} from '../libs/dataUseTranslation';

export const findDatasetPropertyValue = (dataset, propName, defaultVal) => {
  const defaultValue = isNil(defaultVal) ? '' : defaultVal;
  return getOr(defaultValue)('propertyValue')(find({ propertyName: propName })(dataset.properties));
};

export const findDatasetPropertyValueList = (dataset, propName, defaultVal) => {
  const defaultValue = isNil(defaultVal) ? [] : defaultVal;
  return getOr(defaultValue)('propertyValue')(find({ propertyName: propName })(dataset.properties));
};

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
