import find from 'lodash/find';
import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';
import { Component } from 'react';
import { a, div, hh, span, table, tbody, td, th, thead, tr } from 'react-hyperscript-helpers';
import { BaseModal } from '../BaseModal';
import { ReadMore } from '../ReadMore';
import { DataUseTranslation } from '../../libs/dataUseTranslation';

export const DacDatasetsModal = hh(class DacDatasetsModal extends Component {

  constructor() {
    super();
    this.state = {
      translatedDatasetRestrictions: [],
      getStructuredUseRestrictionLink: this.getStructuredUseRestrictionLink.bind(this)
    };
  }

  async componentDidMount() {
    let translationPromises = this.props.datasets.map((dataset) =>
      DataUseTranslation.translateDataUseRestrictions(dataset.dataUse));
    const datasetTranslations = await Promise.all(translationPromises);
    this.setState(prev => {
      prev.translatedDatasetRestrictions = datasetTranslations;
      return prev;
    });
  }

  getProperty = (properties, propName) => {
    return find(properties, p => { return p.propertyName.toLowerCase() === propName.toLowerCase(); });
  };

  getPropertyValue = (properties, propName, defaultValue) => {
    const prop = this.getProperty(properties, propName);
    const val = get(prop, 'propertyValue', '');
    return isEmpty(val) ? span({ className: 'disabled' }, [defaultValue]) : val;
  };

  getDbGapLinkValue = (properties) => {
    const href = this.getPropertyValue(properties, 'dbGAP', '');
    return href.length > 0 ?
      a({ name: 'link_dbGap', href: href, target: '_blank', className: 'enabled' }, ['Link']) :
      span({ name: 'link_dbGap', className: 'disabled' }, ['---']);
  };

  getStructuredUseRestrictionLink = (index) => {
    if(this.state.translatedDatasetRestrictions && this.state.translatedDatasetRestrictions[index]) {
      const translatedUseRestrictions = this.state.translatedDatasetRestrictions[index]
        .filter((value) => !isEmpty(value))
        .map((translations) => translations.description)
        .join('\n');
      if (isEmpty(translatedUseRestrictions)) {
        return span({ className: 'disabled' }, ['---']);
      }
      return ReadMore({
        content: translatedUseRestrictions,
        className: 'row no-margin',
        style: { whiteSpace: 'pre-line' },
        charLimit: 30,
        inline: true
      });
    }
  };

  render() {
    return (BaseModal({
      id: 'dacDatasetsModal',
      showModal: this.props.showModal,
      onRequestClose: this.props.onCloseRequest,
      color: 'common',
      type: 'informative',
      iconSize: 'none',
      customStyles: { width: '80%' },
      title: 'DAC Datasets associated with DAC: ' + this.props.dac.name,
      action: { label: 'Close', handler: this.props.onCloseRequest }
    },
    [
      div({ className: 'table-scroll', style: { margin: 0 } }, [
        table({ className: 'table' }, [
          thead({}, [
            tr({}, [
              th({ className: 'table-titles dataset-color cell-size' }, ['Dataset Id']),
              th({ className: 'table-titles dataset-color cell-size' }, ['Dataset Name']),
              th({ className: 'table-titles dataset-color cell-size' }, ['dbGap']),
              th({ className: 'table-titles dataset-color cell-size' }, ['Structured Data Use Limitations']),
              th({ className: 'table-titles dataset-color cell-size' }, ['Data Type']),
              th({ className: 'table-titles dataset-color cell-size' }, ['Phenotype/Indication']),
              th({ className: 'table-titles dataset-color cell-size' }, ['Principal Investigator(PI)']),
              th({ className: 'table-titles dataset-color cell-size' }, ['# of participants']),
              th({ className: 'table-titles dataset-color cell-size' }, ['Description']),
              th({ className: 'table-titles dataset-color cell-size' }, ['Species']),
              th({ className: 'table-titles dataset-color cell-size' }, ['Data Depositor']),
              th({ className: 'table-titles dataset-color cell-size' }, ['Consent ID']),
              th({ className: 'table-titles dataset-color cell-size' }, ['SC-ID'])
            ])
          ]),
          tbody({}, [
            this.props.datasets.map((dataset, index) => {
              return tr({ key: dataset.alias }, [
                td({ className: 'table-items cell-size', style: { position: 'relative' } }, [dataset.alias]),
                td({ className: 'table-items cell-size' }, [this.getPropertyValue(dataset.properties, 'Dataset Name', '---')]),
                td({ className: 'table-items cell-size' }, [this.getDbGapLinkValue(dataset.properties)]),
                td({ className: 'table-items cell-size' }, [this.getStructuredUseRestrictionLink(index)]),
                td({ className: 'table-items cell-size' }, [this.getPropertyValue(dataset.properties, 'Data Type', '---')]),
                td({ className: 'table-items cell-size' }, [this.getPropertyValue(dataset.properties, 'Phenotype/Indication', '---')]),
                td({ className: 'table-items cell-size' }, [this.getPropertyValue(dataset.properties, 'Principal Investigator(PI)', '---')]),
                td({ className: 'table-items cell-size' }, [this.getPropertyValue(dataset.properties, '# of participants', '---')]),
                td({ className: 'table-items cell-size' }, [this.getPropertyValue(dataset.properties, 'Description', '---')]),
                td({ className: 'table-items cell-size' }, [this.getPropertyValue(dataset.properties, 'Species', '---')]),
                td({ className: 'table-items cell-size' }, [this.getPropertyValue(dataset.properties, 'Data Depositor', '---')]),
                td({ className: 'table-items cell-size' }, [dataset.consentId]),
                td({ className: 'table-items cell-size' }, [this.getPropertyValue(dataset.properties, 'Sample Collection ID', '---')])
              ]);
            })
          ])
        ])
      ])
    ]));
  }
});
