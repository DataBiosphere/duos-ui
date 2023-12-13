import find from 'lodash/find';
import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';
import React, {useEffect, useState} from 'react';
import {a, div, span, table, tbody, td, th, thead, tr} from 'react-hyperscript-helpers';
import {BaseModal} from '../BaseModal';
import {DataUseTranslation} from '../../libs/dataUseTranslation';

// @ts-ignore
const DacDatasetsModal = (props) => {

  const {showModal, onCloseRequest, datasets, dac} = props;
  const [translatedDatasetRestrictions, setTranslatedDatasetRestrictions] = useState([]);

  useEffect(() => {
    const init = async () => {
      // @ts-ignore
      let translationPromises = datasets.map((dataset) =>
        DataUseTranslation.translateDataUseRestrictions(dataset.dataUse));
      const datasetTranslations = await Promise.all(translationPromises);
      // @ts-ignore
      setTranslatedDatasetRestrictions(datasetTranslations);
    };

    init();
  }, [datasets]);

  // @ts-ignore
  const getProperty = (properties, propName) => {
    return find(properties, p => {
      return p.propertyName.toLowerCase() === propName.toLowerCase();
    });
  };

  // @ts-ignore
  const getPropertyValue = (properties, propName, defaultValue) => {
    const prop = getProperty(properties, propName);
    const val = get(prop, 'propertyValue', '');
    return isEmpty(val) ? span({className: 'disabled'}, [defaultValue]) : val;
  };

  // @ts-ignore
  const getDbGapLinkValue = (properties) => {
    const href = getPropertyValue(properties, 'dbGAP', '');
    return href.length > 0 ?
      a({name: 'link_dbGap', href: href, target: '_blank', className: 'enabled'}, ['Link']) :
      span({name: 'link_dbGap', className: 'disabled'}, ['---']);
  };

  // @ts-ignore
  const getStructuredUseRestrictionLink = (index) => {
    if (translatedDatasetRestrictions[index]) {
      // @ts-ignore
      const translatedDataUse = translatedDatasetRestrictions[index]
        // @ts-ignore
        .map((translations) => translations.description)
        .join('\n');
      const shortenedDataUse = translatedDataUse.length >= 75 ?
        translatedDataUse.slice(0, 75) + '...' :
        translatedDataUse.slice(0, 75);
      if (isEmpty(translatedDataUse)) {
        return span({className: 'disabled'}, ['---']);
      }
      return <span title={translatedDataUse}>{shortenedDataUse}</span>;
    }
  };

  return (BaseModal({
    id: 'dacDatasetsModal',
    showModal: showModal,
    onRequestClose: onCloseRequest,
    color: 'common',
    type: 'informative',
    iconSize: 'none',
    customStyles: {width: '80%'},
    title: 'DAC Datasets associated with DAC: ' + dac.name,
    action: {label: 'Close', handler: onCloseRequest}
  },
  [
    div({className: 'table-scroll', style: {margin: 0}}, [
      table({className: 'table'}, [
        thead({}, [
          tr({}, [
            th({className: 'table-titles dataset-color cell-size'}, ['Dataset Id']),
            th({className: 'table-titles dataset-color cell-size'}, ['Dataset Name']),
            th({className: 'table-titles dataset-color cell-size'}, ['dbGap']),
            th({className: 'table-titles dataset-color cell-size'}, ['Structured Data Use Limitations']),
            th({className: 'table-titles dataset-color cell-size'}, ['Data Type']),
            th({className: 'table-titles dataset-color cell-size'}, ['Phenotype/Indication']),
            th({className: 'table-titles dataset-color cell-size'}, ['Principal Investigator(PI)']),
            th({className: 'table-titles dataset-color cell-size'}, ['# of participants']),
            th({className: 'table-titles dataset-color cell-size'}, ['Description']),
            th({className: 'table-titles dataset-color cell-size'}, ['Species']),
            th({className: 'table-titles dataset-color cell-size'}, ['Data Depositor']),
            th({className: 'table-titles dataset-color cell-size'}, ['Consent ID']),
            th({className: 'table-titles dataset-color cell-size'}, ['SC-ID'])
          ])
        ]),
        tbody({}, [
          // @ts-ignore
          datasets.map((dataset, index) => {
            return tr({key: dataset.datasetIdentifier}, [
              td({className: 'table-items cell-size', style: {position: 'relative'}}, [dataset.datasetIdentifier]),
              td({className: 'table-items cell-size'}, [dataset.name]),
              td({className: 'table-items cell-size'}, [getDbGapLinkValue(dataset.properties)]),
              td({className: 'table-items cell-size'}, [getStructuredUseRestrictionLink(index)]),
              td({className: 'table-items cell-size'}, [getPropertyValue(dataset.properties, 'Data Type', '---')]),
              td({className: 'table-items cell-size'}, [getPropertyValue(dataset.properties, 'Phenotype/Indication', '---')]),
              td({className: 'table-items cell-size'}, [getPropertyValue(dataset.properties, 'Principal Investigator(PI)', '---')]),
              td({className: 'table-items cell-size'}, [getPropertyValue(dataset.properties, '# of participants', '---')]),
              td({className: 'table-items cell-size'}, [getPropertyValue(dataset.properties, 'Description', '---')]),
              td({className: 'table-items cell-size'}, [getPropertyValue(dataset.properties, 'Species', '---')]),
              td({className: 'table-items cell-size'}, [getPropertyValue(dataset.properties, 'Data Depositor', '---')]),
              td({className: 'table-items cell-size'}, [dataset.consentId]),
              td({className: 'table-items cell-size'}, [getPropertyValue(dataset.properties, 'Sample Collection ID', '---')])
            ]);
          })
        ])
      ])
    ])
  ]));

};

export default DacDatasetsModal;
