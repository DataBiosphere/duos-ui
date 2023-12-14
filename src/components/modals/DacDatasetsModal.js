import find from 'lodash/find';
import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';
import React, {useEffect, useState} from 'react';
import {BaseModal} from '../BaseModal';
import {DataUseTranslation} from '../../libs/dataUseTranslation';

const DacDatasetsModal = (props) => {

  const {showModal, onCloseRequest, datasets, dac} = props;
  const [translatedDatasetRestrictions, setTranslatedDatasetRestrictions] = useState([]);

  useEffect(() => {
    const init = async () => {
      let translationPromises = datasets.map((dataset) =>
        DataUseTranslation.translateDataUseRestrictions(dataset.dataUse));
      const datasetTranslations = await Promise.all(translationPromises);
      setTranslatedDatasetRestrictions(datasetTranslations);
    };

    init();
  }, [datasets]);

  const getProperty = (properties, propName) => {
    return find(properties, p => {
      return p.propertyName.toLowerCase() === propName.toLowerCase();
    });
  };

  const getPropertyValue = (properties, propName, defaultValue) => {
    const prop = getProperty(properties, propName);
    const val = get(prop, 'propertyValue', '');
    return isEmpty(val) ? <span className={'disabled'}>{defaultValue}</span> : val;
  };

  const getDbGapLinkValue = (properties) => {
    const href = getPropertyValue(properties, 'dbGAP', '');
    return href.length > 0 ?
      <a href={href} target={'_blank'} className={'enabled'} rel="noreferrer">Link</a> :
      <span className={'disabled'}>---</span>;
  };

  const getStructuredUseRestrictionLink = (index) => {
    if (translatedDatasetRestrictions[index]) {
      const translatedDataUse = translatedDatasetRestrictions[index]
        .map((translations) => translations.description)
        .join('\n');
      const shortenedDataUse = translatedDataUse.length >= 75 ?
        translatedDataUse.slice(0, 75) + '...' :
        translatedDataUse;
      if (isEmpty(translatedDataUse)) {
        return <span className={'disabled'}>---</span>;
      }
      return <span title={translatedDataUse}>{shortenedDataUse}</span>;
    }
  };

  return <BaseModal
    key={'dac_datasets_modal'}
    id={'dacDatasetsModal'}
    showModal={showModal}
    onRequestClose={onCloseRequest}
    color={'common'}
    type={'informative'}
    iconSize={'none'}
    customStyles={{width: '80%'}}
    title={'DAC Datasets associated with DAC: ' + dac.name}
    action={{label: 'Close', handler: onCloseRequest}}>
    <div key={'dac_datasets'} className={'table-scroll'} style={{margin: 0}}>
      <table key={'dac_datasets_table'} className={'table'}>
        <thead key={'dac_datasets_table_head'}>
          <tr key={'dac_datasets_table_head_row'}>
            <th key={'1'} className={'table-titles dataset-color cell-size'}>Dataset Id</th>
            <th key={'2'} className={'table-titles dataset-color cell-size'}>Dataset Name</th>
            <th key={'3'} className={'table-titles dataset-color cell-size'}>dbGap</th>
            <th key={'4'} className={'table-titles dataset-color cell-size'}>Structured Data Use Limitations</th>
            <th key={'5'} className={'table-titles dataset-color cell-size'}>Data Type</th>
            <th key={'6'} className={'table-titles dataset-color cell-size'}>Phenotype/Indication</th>
            <th key={'7'} className={'table-titles dataset-color cell-size'}>Principal Investigator(PI)</th>
            <th key={'8'} className={'table-titles dataset-color cell-size'}># of participants</th>
            <th key={'9'} className={'table-titles dataset-color cell-size'}>Description</th>
            <th key={'10'} className={'table-titles dataset-color cell-size'}>Species</th>
            <th key={'11'} className={'table-titles dataset-color cell-size'}>Data Depositor</th>
          </tr>
        </thead>
        <tbody key={'dac_datasets_table_body'}>
          {
            datasets.map((dataset, index) => {
              return <tr key={'dac_datasets_table_row_' + index + '_' + dataset.datasetIdentifier}>
                <td key={'1_' + dataset.datasetIdentifier} className={'table-items cell-size'}
                  style={{position: 'relative'}}>{dataset.datasetIdentifier}</td>
                <td key={'2_' + dataset.datasetIdentifier} className={'table-items cell-size'}>{dataset.name}</td>
                <td key={'3_' + dataset.datasetIdentifier}
                  className={'table-items cell-size'}>{getDbGapLinkValue(dataset.properties)}</td>
                <td key={'4_' + dataset.datasetIdentifier}
                  className={'table-items cell-size'}>{getStructuredUseRestrictionLink(index)}</td>
                <td key={'5_' + dataset.datasetIdentifier}
                  className={'table-items cell-size'}>{getPropertyValue(dataset.properties, 'Data Type', '---')}</td>
                <td key={'6_' + dataset.datasetIdentifier}
                  className={'table-items cell-size'}>{getPropertyValue(dataset.properties, 'Phenotype/Indication', '---')}</td>
                <td key={'7_' + dataset.datasetIdentifier}
                  className={'table-items cell-size'}>{getPropertyValue(dataset.properties, 'Principal Investigator(PI)', '---')}</td>
                <td key={'8_' + dataset.datasetIdentifier}
                  className={'table-items cell-size'}>{getPropertyValue(dataset.properties, '# of participants', '---')}</td>
                <td key={'9_' + dataset.datasetIdentifier}
                  className={'table-items cell-size'}>{getPropertyValue(dataset.properties, 'Description', '---')}</td>
                <td key={'10_' + dataset.datasetIdentifier}
                  className={'table-items cell-size'}>{getPropertyValue(dataset.properties, 'Species', '---')}</td>
                <td key={'11_' + dataset.datasetIdentifier}
                  className={'table-items cell-size'}>{getPropertyValue(dataset.properties, 'Data Depositor', '---')}</td>
              </tr>;
            })
          }
        </tbody>
      </table>
    </div>
  </BaseModal>;
};

export default DacDatasetsModal;
