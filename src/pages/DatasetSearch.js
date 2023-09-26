import React from 'react';
import { useEffect, useState } from 'react';
import { Notifications } from '../libs/utils';
import { DataSet } from '../libs/ajax';
import DatasetSearchTable from '../components/data_search/DatasetSearchTable';
import broadIcon from '../logo.svg';
import duosIcon from '../images/duos-network-logo.svg';

export const DatasetSearch = (props) => {
  const { location } = props;
  const [datasets, setDatasets] = useState([]);

  // branded study table versions
  const versions = {
    '/datalibrary': {
      query: null,
      icon: duosIcon,
      title: 'DUOS Data Library',
    },
    '/datalibrary_broad': {
      query: {
        'match': {
          'submitter.institution.id': '150' // Broad Institute of MIT and Harvard
        }
      },
      icon: broadIcon,
      title: 'Broad Data Library',
    },
  }

  const version = versions[location.pathname];

  useEffect(() => {
    const init = async () => {
      const query = {
        'from': 0,
        'size': 10000,
        'query': {
          'bool': {
            'must': [
              {
                'match': {
                  '_type': 'dataset'
                }
              },
              version.query,
              {
                'exists': {
                  'field': 'study'
                }
              }
            ]
          }
        }
      };
      try {
        await DataSet.searchDatasetIndex(query).then((datasets) => {
          setDatasets(datasets);
        });
      } catch (error) {
        Notifications.showError({ text: 'Failed to load Elasticsearch index' });
      }
    };
    init();
  }, []);

  return (
    <DatasetSearchTable {...props} datasets={datasets} icon={version.icon} title={version.title} />
  );
};

export default DatasetSearch;
